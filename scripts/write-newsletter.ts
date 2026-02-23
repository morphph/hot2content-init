#!/usr/bin/env npx tsx
/**
 * LoreAI Newsletter Writer
 * 
 * Reads items from DB (72h window) → agent-filter (Claude CLI) → write EN + ZH newsletters → git push.
 * Split from daily-scout.ts + agent-filter.ts per Issue #38.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import { getDb, initSchema, getRecentItemsFull, insertContent, linkContentSources, closeDb } from '../src/lib/db.js';
import { callSonnet } from '../src/lib/claude-cli.js';

dotenv.config();

const OUTPUT_DIR = path.join(process.cwd(), 'output');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ============================================
// Types
// ============================================

interface RawItem {
  id: string;
  title: string;
  url: string;
  source: string;
  source_tier: number;
  category: string;
  score: number;
  raw_summary: string;
  detected_at: string;
}

interface FilteredItem extends RawItem {
  agent_category: string;
  agent_score: number;
  why_it_matters: string;
  action: string;
}

// ============================================
// Cross-day dedup: extract bold titles from recent newsletters
// ============================================

function getRecentTitles(days: number = 3): string[] {
  const titles: string[] = [];
  const dir = path.join(process.cwd(), 'content', 'newsletters', 'en');
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort().slice(-days);
    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), 'utf-8');
      const titleMatches = content.matchAll(/\*\*([^*]+)\*\*/g);
      for (const m of titleMatches) {
        if (m[1].length > 15) titles.push(m[1]);
      }
    }
    console.log(`   📂 Loaded ${titles.length} recent titles from ${files.length} newsletters for dedup`);
  } catch {
    console.log('   ⚠️ Could not read recent newsletters for title dedup');
  }
  return titles;
}

// ============================================
// Agent Filter via Claude CLI
// ============================================

async function agentFilter(items: RawItem[]): Promise<FilteredItem[]> {
  console.log(`🤖 Calling Claude Opus via CLI to filter ${items.length} items...`);

  const rawData = JSON.stringify(items.map((item, i) => ({
    index: i,
    title: item.title,
    summary: item.raw_summary?.slice(0, 400),
    source: item.source,
    url: item.url,
    source_tier: item.source_tier,
    detected_at: item.detected_at,
  })), null, 2);

  const recentTitles = getRecentTitles(3);
  const dedupSection = recentTitles.length > 0
    ? `\n## CRITICAL: Cross-day Dedup\nThese are titles from the last 3 days' newsletters. DO NOT select items covering the same topic as these recent titles:\n${recentTitles.map(t => `- ${t}`).join('\n')}\n`
    : '';

  const prompt = `You are the editor-in-chief of an AI industry newsletter. From the following ${items.length} raw news items from the past 72 hours, select the 20-25 most important ones for today's newsletter.

When items from different days cover the same event, prefer the one with the most complete information or highest engagement. Do NOT select the same story twice just because it appeared on multiple days.

## Source Quotas (STRICT)
- **Reddit** (all subreddits combined): MAX 2 items. Only select Reddit posts that contain genuinely unique, high-quality information not available from any other source.
- **GitHub Trending**: MAX 3-4 items. Prioritize repos with high stars AND clear relevance to AI practitioners. Include the repo description and star count in your assessment.
- **Twitter/Official blogs/Hacker News**: No hard cap, but ensure diversity across these sources. Do not let any single Twitter account dominate more than 3 items.
${dedupSection}
## Selection Criteria
1. **Signal vs Noise** — Real news vs daily chatter. Product launches, model releases, major updates = signal. Generic tips, self-promotion, vague opinions = noise.
2. **Impact** — How much does this affect AI developers, product builders, or the industry? Prioritize items with concrete implications.
3. **Freshness** — Prefer items from the last 72 hours. Deprioritize old content that's been recycled.
4. **Semantic Dedup** — Multiple items about the same event should be merged into one. Pick the best source.
5. **Trend Detection** — If multiple sources discuss the same topic, that's a strong signal. Note it.

## Categories (assign exactly one per item)
- LAUNCH — New model or product launches
- TOOL — Developer tools, SDKs, frameworks, APIs
- TECHNIQUE — Practical techniques, best practices, coding tips
- RESEARCH — Papers, benchmarks, technical deep-dives
- INSIGHT — Industry analysis, opinions from key figures, trend pieces
- BUILD — Open-source projects, community builds, tutorials

## Output Format
Return a JSON array. Each item:
{
  "index": <original index from input>,
  "agent_category": "LAUNCH|TOOL|TECHNIQUE|RESEARCH|INSIGHT|BUILD",
  "agent_score": <1-100, your importance rating>,
  "why_it_matters": "<1 sentence: why this matters to AI practitioners>",
  "action": "<1 short phrase: what the reader should do>"
}

Sort by agent_score descending. Pick 20-25 items. Return ONLY the JSON array, no markdown fences.

## Raw Items
${rawData}`;

  try {
    const tmpPrompt = path.join(OUTPUT_DIR, `.agent-filter-prompt-${Date.now()}.txt`);
    fs.writeFileSync(tmpPrompt, prompt);
    console.log(`   📝 Wrote prompt (${prompt.length} chars)`);

    const result = execSync(
      `cat '${tmpPrompt}' | claude --model claude-opus-4-6 --output-format text --max-turns 1 --print`,
      {
        encoding: 'utf-8', timeout: 180000,
        env: { ...process.env, HOME: process.env.HOME || '/home/ubuntu' },
        maxBuffer: 10 * 1024 * 1024, cwd: process.cwd(),
      }
    );
    try { fs.unlinkSync(tmpPrompt); } catch {}

    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('⚠️ Could not parse Claude response, falling back to rule-based');
      return ruleBasedFilter(items);
    }

    const selections: Array<{
      index: number; agent_category: string; agent_score: number;
      why_it_matters: string; action: string;
    }> = JSON.parse(jsonMatch[0]);

    console.log(`   ✅ Claude selected ${selections.length} items`);

    return selections
      .filter(s => s.index >= 0 && s.index < items.length)
      .map(s => ({
        ...items[s.index],
        agent_category: s.agent_category,
        agent_score: s.agent_score,
        why_it_matters: s.why_it_matters,
        action: s.action,
      }))
      .sort((a, b) => b.agent_score - a.agent_score);
  } catch (e) {
    console.log(`⚠️ Claude CLI error: ${e}`);
    return ruleBasedFilter(items);
  }
}

function ruleBasedFilter(items: RawItem[]): FilteredItem[] {
  console.log('📋 Using rule-based filter as fallback...');
  const catMap: Record<string, string> = {
    model_release: 'LAUNCH', developer_platform: 'TOOL',
    official_blog: 'RESEARCH', product_ecosystem: 'INSIGHT',
  };
  return items
    .sort((a, b) => {
      if (a.source_tier !== b.source_tier) return a.source_tier - b.source_tier;
      return b.score - a.score;
    })
    .slice(0, 25)
    .map(item => ({
      ...item,
      agent_category: catMap[item.category] || 'INSIGHT',
      agent_score: item.score,
      why_it_matters: (item.raw_summary || '').slice(0, 100),
      action: 'Check it out',
    }));
}

// ============================================
// Newsletter Writing (Claude Opus via CLI)
// ============================================

async function generateNewsletterWithOpus(items: FilteredItem[], date: string): Promise<string | null> {
  console.log('   ✍️ Generating EN newsletter with Claude Opus...');

  const rawData = JSON.stringify(items.slice(0, 50).map(i => ({
    title: i.title, summary: (i.raw_summary || '').slice(0, 300),
    source: i.source, url: i.url, category: i.agent_category,
    score: i.agent_score, why_it_matters: i.why_it_matters,
  })), null, 2);

  const prompt = `You are the editor-in-chief of LoreAI Daily. Write today's AI digest based on the raw news data below. Date: ${date}

## Title Rule (CRITICAL)
Generate a compelling news-style headline as the H1 title. DO NOT use date-based titles.
Good: "Anthropic Speeds Up Opus While OpenAI Turns On the Ads"
Bad: "🌅 AI Daily Digest — ${date}"

## Opening (CRITICAL)
After the title, write 1-2 sentences with attitude that set the scene. Name the biggest story. End with a "Today:" line previewing 2-3 key topics.

## Categories (use exactly these 6 + 2 special sections)
🧠 MODEL — New model releases & trends
📱 APP — Consumer products & platform updates
🔧 DEV — Developer tools, SDKs, APIs
📝 TECHNIQUE — Practical tips, best practices, viral dev tips
🚀 PRODUCT — New products, research, open-source projects
🎓 MODEL LITERACY — Pick one technical concept worth explaining today, 3-4 sentences for non-technical readers.
🎯 PICK OF THE DAY — The single most impactful item today, 2-3 sentences on why it matters + link.

## Writing rules
1. Each item: bullet point (•), **bold title**, followed by source (— @handle or — Source Name)
2. Each item: what happened + why it matters, 1-2 sentences
3. Include engagement data in parentheses (likes, RTs, downloads — show them separately, not combined)
4. 3-5 most important items per category, skip empty categories
5. Tone: professional, concise, opinionated — you're an editor curating, not a bot summarizing
6. Forbidden phrases: "In this article", "Stay tuned", "Exciting times", "Let's dive in", "Game-changing", "In today's issue"
7. Output pure markdown. The H1 title must be a news-style headline.
8. Write entirely in English
9. Every item MUST include a source link at the end: [Read more →](url)
10. For items from OpenAI Changelog or similar platform changelogs, cite as '— OpenAI Changelog (Feb 10)' and link to the changelog page.

CRITICAL RULE — NO FABRICATION:
You ONLY have the information provided below. If an item's summary is empty or says "[No summary available]":
- Write ONLY the title + source + engagement stats + link
- DO NOT describe, interpret, or infer what the article is about

## Raw data (${items.length} items)
${rawData}`;

  try {
    const tmpPrompt = path.join('/tmp', `opus-prompt-${Date.now()}.txt`);
    fs.writeFileSync(tmpPrompt, prompt);
    const result = execSync(
      `cat "${tmpPrompt}" | claude -p --output-format text --max-turns 1 --print`,
      { timeout: 5 * 60 * 1000, maxBuffer: 1024 * 1024, env: { ...process.env }, shell: '/bin/bash' }
    ).toString().trim();
    try { fs.unlinkSync(tmpPrompt); } catch {}
    const cleaned = result.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').trim();
    if (cleaned && cleaned.length > 200) {
      console.log(`   ✅ EN newsletter: ${cleaned.length} chars`);
      return cleaned;
    }
    return null;
  } catch (e) {
    console.log(`   ⚠️ Opus EN failed: ${e}`);
    return null;
  }
}

async function generateNewsletterWithOpusZH(items: FilteredItem[], date: string): Promise<string | null> {
  console.log('   ✍️ Generating ZH newsletter with Claude Opus...');

  const rawData = JSON.stringify(items.slice(0, 50).map(i => ({
    title: i.title, summary: (i.raw_summary || '').slice(0, 300),
    source: i.source, url: i.url, category: i.agent_category,
    score: i.agent_score, why_it_matters: i.why_it_matters,
  })), null, 2);

  const prompt = `你是 LoreAI 每日简报的中文主编。基于以下原始新闻数据，撰写今日 AI 简报。日期：${date}

重要：请直接输出完整的 Markdown newsletter 正文。不要输出任何前言、解释、确认或思考过程。第一行必须是 # 开头的中文标题。

## 覆盖率（强制）
你必须覆盖所有提供的 filtered items，每条至少在正文或快讯中出现一次，不得遗漏任何条目。如果某个栏目条目较多，超出 3-5 条的可以放到末尾的 ⚡ 快讯 栏目。

## 标题规则（重要）
生成一个新闻式中文标题作为 H1。不要用日期标题。
✅ 好："Anthropic 加速 Opus，OpenAI 开始卖广告"
❌ 差："🌅 AI 每日简报 — ${date}"

## 开场白（重要）
标题后写 1-2 句有态度的叙事开场，点出今天最大的故事。然后用一行 "今天：" 预览 2-3 个关键话题。

## 栏目（使用以下 6 个固定栏目 + 2 个特别栏目）
🧠 模型动态 — 新模型发布与趋势
📱 产品应用 — 消费级产品与平台更新
🔧 开发工具 — 开发者工具、SDK、API
📝 技术实践 — 实用技巧、最佳实践、热门开发技巧
🚀 产品动态 — 新产品、研究成果、开源项目、企业合作
🎓 概念科普 — 挑选一个值得今天科普的技术概念，用 3-4 句话向非技术读者解释。
🎯 今日精选 — 今天最有影响力的一条新闻，2-3 句话说明为什么重要 + 链接。

如果某个栏目条目较多，超出 3-5 条的放到末尾的 ⚡ 快讯 栏目（一句话 + 链接）。

## 中文写作约束
- 语气：像一个消息灵通的科技圈朋友在微信群里分享，专业、简洁、有态度
- 用短句、主动句式："发布了"、"上线了"、"跑分碾压"、"直接开源"
- 中文标点：，。！？""''（）
- 英文与中文之间加空格：使用 Claude 进行开发
- 技术术语首次出现标注英文：大语言模型（LLM）
- 没有公认中文译名的术语直接用英文：Transformer、Token、Prompt
- 数字用阿拉伯数字，大数用万/亿
- 涉及国产模型时自然融入对比视角（不要强行加）
- 这不是英文版的翻译，是基于同一批数据的独立中文创作

## 写作规范
1. 每条：bullet point（•），**加粗标题**，来源（— @handle 或 — 来源名称）
2. 每条：发生了什么 + 为什么重要，1-2 句话
3. 括号内标注互动数据（点赞、转发、下载量分开写）
4. 每个栏目 3-5 条最重要的内容，空栏目跳过
5. 输出纯 markdown，H1 标题必须是新闻式标题
6. 全文使用中文撰写
7. 每条必须在末尾包含来源链接：[查看详情 →](url)
8. 对于来自 OpenAI Changelog 或类似平台更新日志的条目，引用格式为 '— OpenAI Changelog (Feb 10)' 并链接到更新日志页面。

## 禁用词
❌ "值得注意的是"、"让我们来看看"、"总结来看"、"在这一领域"、"众所周知"、"不容忽视"、"In this article"、"Stay tuned"、"Exciting times"、"Let's dive in"、"Game-changing"

严格规则 — 禁止编造：
你只能使用下方提供的信息。如果某条的摘要为空或显示"[No summary available]"：
- 只写标题 + 来源 + 互动数据 + 链接
- 不要描述、推测或补充内容

## 原始数据（${items.length} 条）
${rawData}`;

  try {
    const tmpPrompt = path.join('/tmp', `opus-prompt-zh-${Date.now()}.txt`);
    fs.writeFileSync(tmpPrompt, prompt);
    const result = execSync(
      `cat "${tmpPrompt}" | claude -p --output-format text --max-turns 1 --print`,
      { timeout: 5 * 60 * 1000, maxBuffer: 1024 * 1024, env: { ...process.env }, shell: '/bin/bash' }
    ).toString().trim();
    try { fs.unlinkSync(tmpPrompt); } catch {}
    const cleaned = result.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').trim();
    if (cleaned && cleaned.length > 200) {
      console.log(`   ✅ ZH newsletter: ${cleaned.length} chars`);
      return cleaned;
    }
    console.log(`   ⚠️ ZH output too short (${cleaned.length} chars), may be meta-summary`);
    return null;
  } catch (e) {
    console.log(`   ⚠️ Opus ZH failed: ${e}`);
    return null;
  }
}

// ============================================
// Newsletter Writing (Kimi K2.5 Fallback for ZH)
// ============================================

async function generateNewsletterWithKimiZH(items: FilteredItem[], date: string): Promise<string | null> {
  const apiKey = process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;
  if (!apiKey) {
    console.log('   ⚠️ No KIMI_API_KEY, skipping Kimi fallback');
    return null;
  }

  console.log('   🤖 Falling back to Kimi K2.5 for ZH newsletter...');

  const rawData = JSON.stringify(items.slice(0, 50).map(i => ({
    title: i.title, summary: (i.raw_summary || '').slice(0, 300),
    source: i.source, url: i.url, category: i.agent_category,
    score: i.agent_score, why_it_matters: i.why_it_matters,
  })), null, 2);

  const prompt = `你是 LoreAI 每日简报的中文主编。基于以下原始新闻数据，撰写今日 AI 简报。日期：${date}

重要：请直接输出完整的 Markdown newsletter 正文。不要输出任何前言、解释、确认或思考过程。第一行必须是 # 开头的中文标题。

## 覆盖率（强制）
你必须覆盖所有提供的 filtered items，每条至少在正文或快讯中出现一次，不得遗漏任何条目。如果某个栏目条目较多，超出 3-5 条的可以放到末尾的 ⚡ 快讯 栏目。

## 标题规则（重要）
生成一个新闻式中文标题作为 H1。不要用日期标题。
✅ 好："Anthropic 加速 Opus，OpenAI 开始卖广告"
❌ 差："🌅 AI 每日简报 — ${date}"

## 开场白（重要）
标题后写 1-2 句有态度的叙事开场，点出今天最大的故事。然后用一行 "今天：" 预览 2-3 个关键话题。

## 栏目（使用以下 6 个固定栏目 + 2 个特别栏目）
🧠 模型动态 — 新模型发布与趋势
📱 产品应用 — 消费级产品与平台更新
🔧 开发工具 — 开发者工具、SDK、API
📝 技术实践 — 实用技巧、最佳实践、热门开发技巧
🚀 产品动态 — 新产品、研究成果、开源项目、企业合作
🎓 概念科普 — 挑选一个值得今天科普的技术概念，用 3-4 句话向非技术读者解释。
🎯 今日精选 — 今天最有影响力的一条新闻，2-3 句话说明为什么重要 + 链接。

如果某个栏目条目较多，超出 3-5 条的放到末尾的 ⚡ 快讯 栏目（一句话 + 链接）。

## 中文写作约束
- 语气：像一个消息灵通的科技圈朋友在微信群里分享，专业、简洁、有态度
- 用短句、主动句式："发布了"、"上线了"、"跑分碾压"、"直接开源"
- 中文标点：，。！？""''（）
- 英文与中文之间加空格：使用 Claude 进行开发
- 技术术语首次出现标注英文：大语言模型（LLM）
- 没有公认中文译名的术语直接用英文：Transformer、Token、Prompt
- 数字用阿拉伯数字，大数用万/亿
- 涉及国产模型时自然融入对比视角（不要强行加）
- 这不是英文版的翻译，是基于同一批数据的独立中文创作

## 写作规范
1. 每条：bullet point（•），**加粗标题**，来源（— @handle 或 — 来源名称）
2. 每条：发生了什么 + 为什么重要，1-2 句话
3. 括号内标注互动数据（点赞、转发、下载量分开写）
4. 每个栏目 3-5 条最重要的内容，空栏目跳过
5. 输出纯 markdown，H1 标题必须是新闻式标题
6. 全文使用中文撰写
7. 每条必须在末尾包含来源链接：[查看详情 →](url)
8. 对于来自 OpenAI Changelog 或类似平台更新日志的条目，引用格式为 '— OpenAI Changelog (Feb 10)' 并链接到更新日志页面。

## 禁用词
❌ "值得注意的是"、"让我们来看看"、"总结来看"、"在这一领域"、"众所周知"、"不容忽视"、"In this article"、"Stay tuned"、"Exciting times"、"Let's dive in"、"Game-changing"

严格规则 — 禁止编造：
你只能使用下方提供的信息。如果某条的摘要为空或显示"[No summary available]"：
- 只写标题 + 来源 + 互动数据 + 链接
- 不要描述、推测或补充内容

## 原始数据（${items.length} 条）
${rawData}`;

  try {
    const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'moonshot-v1-128k',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      console.log(`   ⚠️ Kimi API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';

    if (text && text.length > 200) {
      console.log(`   ✅ Kimi ZH newsletter: ${text.length} chars`);
      return text;
    }
    console.log(`   ⚠️ Kimi ZH output too short (${text.length} chars)`);
    return null;
  } catch (e) {
    console.log(`   ⚠️ Kimi ZH error: ${e}`);
    return null;
  }
}

// ============================================
// Newsletter Writing (Sonnet CLI Fallback for ZH)
// ============================================

async function generateNewsletterWithSonnetZH(items: FilteredItem[], date: string): Promise<string | null> {
  console.log('   🤖 Falling back to Sonnet CLI for ZH newsletter...');

  const rawData = JSON.stringify(items.slice(0, 50).map(i => ({
    title: i.title, summary: (i.raw_summary || '').slice(0, 300),
    source: i.source, url: i.url, category: i.agent_category,
    score: i.agent_score, why_it_matters: i.why_it_matters,
  })), null, 2);

  const prompt = `你是 LoreAI 每日简报的中文主编。基于以下原始新闻数据，撰写今日 AI 简报。日期：${date}

重要：请直接输出完整的 Markdown newsletter 正文。不要输出任何前言、解释、确认或思考过程。第一行必须是 # 开头的中文标题。

## 覆盖率（强制）
你必须覆盖所有提供的 filtered items，每条至少在正文或快讯中出现一次，不得遗漏任何条目。如果某个栏目条目较多，超出 3-5 条的可以放到末尾的 ⚡ 快讯 栏目。

## 标题规则（重要）
生成一个新闻式中文标题作为 H1。不要用日期标题。
✅ 好："Anthropic 加速 Opus，OpenAI 开始卖广告"
❌ 差："🌅 AI 每日简报 — ${date}"

## 开场白（重要）
标题后写 1-2 句有态度的叙事开场，点出今天最大的故事。然后用一行 "今天：" 预览 2-3 个关键话题。

## 栏目（使用以下 6 个固定栏目 + 2 个特别栏目）
🧠 模型动态 — 新模型发布与趋势
📱 产品应用 — 消费级产品与平台更新
🔧 开发工具 — 开发者工具、SDK、API
📝 技术实践 — 实用技巧、最佳实践、热门开发技巧
🚀 产品动态 — 新产品、研究成果、开源项目、企业合作
🎓 概念科普 — 挑选一个值得今天科普的技术概念，用 3-4 句话向非技术读者解释。
🎯 今日精选 — 今天最有影响力的一条新闻，2-3 句话说明为什么重要 + 链接。

如果某个栏目条目较多，超出 3-5 条的放到末尾的 ⚡ 快讯 栏目（一句话 + 链接）。

## 中文写作约束
- 语气：像一个消息灵通的科技圈朋友在微信群里分享，专业、简洁、有态度
- 用短句、主动句式："发布了"、"上线了"、"跑分碾压"、"直接开源"
- 中文标点：，。！？""''（）
- 英文与中文之间加空格：使用 Claude 进行开发
- 技术术语首次出现标注英文：大语言模型（LLM）
- 没有公认中文译名的术语直接用英文：Transformer、Token、Prompt
- 数字用阿拉伯数字，大数用万/亿
- 涉及国产模型时自然融入对比视角（不要强行加）
- 这不是英文版的翻译，是基于同一批数据的独立中文创作

## 写作规范
1. 每条：bullet point（•），**加粗标题**，来源（— @handle 或 — 来源名称）
2. 每条：发生了什么 + 为什么重要，1-2 句话
3. 括号内标注互动数据（点赞、转发、下载量分开写）
4. 每个栏目 3-5 条最重要的内容，空栏目跳过
5. 输出纯 markdown，H1 标题必须是新闻式标题
6. 全文使用中文撰写
7. 每条必须在末尾包含来源链接：[查看详情 →](url)

## 禁用词
❌ "值得注意的是"、"让我们来看看"、"总结来看"、"在这一领域"、"众所周知"、"不容忽视"、"In this article"、"Stay tuned"、"Exciting times"、"Let's dive in"、"Game-changing"

严格规则 — 禁止编造：
你只能使用下方提供的信息。如果某条的摘要为空或显示"[No summary available]"：
- 只写标题 + 来源 + 互动数据 + 链接
- 不要描述、推测或补充内容

## 原始数据（${items.length} 条）
${rawData}`;

  try {
    const text = await callSonnet(prompt);
    if (text && text.length > 200) {
      console.log(`   ✅ Sonnet CLI ZH newsletter: ${text.length} chars`);
      return text;
    }
    console.log(`   ⚠️ Sonnet CLI ZH output too short (${text.length} chars)`);
    return null;
  } catch (e) {
    console.log(`   ⚠️ Sonnet CLI ZH error: ${e}`);
    return null;
  }
}

// ============================================
// Main
// ============================================

async function main() {
  const date = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });

  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  ✍️ LoreAI Newsletter Writer');
  console.log(`  Date: ${date}`);
  console.log('═'.repeat(60));
  console.log('');

  // Step 1: Read items from DB (72h window)
  console.log('📂 Reading items from DB (past 72 hours)...');
  const db = getDb();
  initSchema(db);
  const dbItems = getRecentItemsFull(db, 72);
  console.log(`   Found ${dbItems.length} items in DB`);

  if (dbItems.length === 0) {
    console.log('❌ No items found in DB. Run collect-news.ts first.');
    closeDb();
    process.exit(1);
  }

  // Pre-filter: hard caps on Reddit and GitHub before sending to agent
  const githubItems = dbItems.filter(i => i.source === 'GitHub Trending');
  const redditItems = dbItems.filter(i => i.source.startsWith('Reddit'));
  const otherItems = dbItems.filter(i => i.source !== 'GitHub Trending' && !i.source.startsWith('Reddit'));

  // GitHub: top 3 by score (score correlates with stars)
  const topGithub = githubItems.sort((a, b) => b.score - a.score).slice(0, 3);
  // Reddit: top 2 by score
  const topReddit = redditItems.sort((a, b) => b.score - a.score).slice(0, 2);

  const curatedItems = [...otherItems, ...topGithub, ...topReddit];
  console.log(`   Pre-filter: GitHub ${githubItems.length} → ${topGithub.length}, Reddit ${redditItems.length} → ${topReddit.length}`);
  console.log(`   Sending ${curatedItems.length} items to agent filter`);

  // Step 2: Agent filter
  const filtered = await agentFilter(curatedItems);
  console.log(`\n✅ Filtered: ${dbItems.length} → ${filtered.length} items`);

  // Save filtered output (ephemeral copy in output/)
  const filteredPath = path.join(OUTPUT_DIR, `filtered-items-${date}.json`);
  const filteredPayload = JSON.stringify({
    date, generated_at: new Date().toISOString(),
    raw_count: dbItems.length, filtered_count: filtered.length, items: filtered,
  }, null, 2);
  fs.writeFileSync(filteredPath, filteredPayload);

  // Persist filtered items for local reproducibility (git-tracked)
  const dataDir = path.join(process.cwd(), 'data', 'filtered-items');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, `${date}.json`), filteredPayload);
  console.log(`   💾 Persisted filtered items to data/filtered-items/${date}.json`);

  // Step 3: Write EN newsletter (with retry)
  console.log('\n📝 Writing EN newsletter...');
  let enMarkdown = await generateNewsletterWithOpus(filtered, date);
  if (!enMarkdown) {
    console.log('   🔄 Retrying EN newsletter generation...');
    enMarkdown = await generateNewsletterWithOpus(filtered, date);
  }
  if (enMarkdown) {
    const enPath = path.join(OUTPUT_DIR, `digest-${date}.md`);
    fs.writeFileSync(enPath, enMarkdown);
    console.log(`✅ Saved EN digest: ${enPath}`);

    // Copy to content dir
    const enContentDir = path.join(process.cwd(), 'content', 'newsletters', 'en');
    fs.mkdirSync(enContentDir, { recursive: true });
    fs.copyFileSync(enPath, path.join(enContentDir, `${date}.md`));
  } else {
    console.log('❌ EN newsletter generation failed');
  }

  // Step 4: Write ZH newsletter (Opus → Kimi K2.5 → Gemini Flash)
  console.log('\n🇨🇳 Writing ZH newsletter...');
  let zhMarkdown = await generateNewsletterWithOpusZH(filtered, date);
  if (!zhMarkdown) zhMarkdown = await generateNewsletterWithKimiZH(filtered, date);
  if (!zhMarkdown) zhMarkdown = await generateNewsletterWithSonnetZH(filtered, date);
  if (zhMarkdown) {
    const zhPath = path.join(OUTPUT_DIR, `digest-zh-${date}.md`);
    fs.writeFileSync(zhPath, zhMarkdown);
    console.log(`✅ Saved ZH digest: ${zhPath}`);

    const zhContentDir = path.join(process.cwd(), 'content', 'newsletters', 'zh');
    fs.mkdirSync(zhContentDir, { recursive: true });
    fs.copyFileSync(zhPath, path.join(zhContentDir, `${date}.md`));
  } else {
    console.log('❌ ZH newsletter generation failed (both Opus and Kimi)');
  }

  // Step 5: DB persist newsletter as content
  try {
    if (enMarkdown) {
      const headline = enMarkdown.split('\n')[0]?.replace(/^#\s*/, '') || `LoreAI Daily — ${date}`;
      const contentId = insertContent(db, {
        type: 'newsletter', title: headline, slug: `newsletter-${date}`,
        body_markdown: enMarkdown, language: 'en', status: 'published', source_type: 'auto',
      });
      linkContentSources(db, contentId, filtered.slice(0, 20).map(i => i.id));
      console.log(`🗄️  Newsletter saved to DB (content_id=${contentId})`);
    }
  } catch (e) { console.log(`⚠️ DB write error (non-fatal): ${e}`); }
  closeDb();

  // Step 6: Git commit + push
  console.log('\n📤 Git commit + push...');
  try {
    execSync('git add content/newsletters/ data/filtered-items/', { cwd: process.cwd(), encoding: 'utf-8' });
    const diffResult = execSync('git diff --staged --quiet 2>&1 || echo "changes"', {
      cwd: process.cwd(), encoding: 'utf-8',
    }).trim();
    if (diffResult === 'changes') {
      execSync(`git commit -m "📰 Auto newsletter ${date}"`, { cwd: process.cwd(), encoding: 'utf-8' });
      execSync('git push', { cwd: process.cwd(), encoding: 'utf-8', timeout: 30000 });
      console.log('✅ Pushed to remote');
    } else {
      console.log('ℹ️ No new content to push');
    }
  } catch (e) {
    console.log(`⚠️ Git push error: ${e}`);
  }

  // Step 7: Update status file
  const statusFile = path.join(process.cwd(), 'logs', 'last-run-status.json');
  fs.mkdirSync(path.dirname(statusFile), { recursive: true });
  const status = enMarkdown && zhMarkdown ? 'success' : enMarkdown ? 'partial' : 'failed';
  const message = status === 'success'
    ? `✅ Newsletter ${date} published (EN + ZH)`
    : status === 'partial'
    ? `⚠️ Newsletter ${date} partial (EN only, ZH failed)`
    : `❌ Newsletter ${date} generation failed`;
  fs.writeFileSync(statusFile, JSON.stringify({
    date, status, message, timestamp: new Date().toISOString(),
  }));
  console.log(`\n${message}`);
}

main().catch(console.error);
