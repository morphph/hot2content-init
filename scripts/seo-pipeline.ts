#!/usr/bin/env npx tsx
/**
 * Track B: SEO Auto-Pipeline
 * 
 * Extracts trending keywords from daily news data (news_items table)
 * and auto-generates long-tail content (T2/T3/FAQ/Glossary/Compare).
 * 
 * Usage: npx tsx scripts/seo-pipeline.ts [--dry-run] [--date YYYY-MM-DD] [--limit N]
 * 
 * Requires: ANTHROPIC_API_KEY or claude CLI available
 * Optional: BRAVE_API_KEY for search demand validation
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawn } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

// ─── Config ──────────────────────────────────────────────

const PROJECT_ROOT = process.cwd();
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'output', 'seo-pipeline');
const CONTENT_DIRS = {
  glossary: path.join(PROJECT_ROOT, 'content', 'glossary'),
  faq: path.join(PROJECT_ROOT, 'content', 'faq'),
  compare: path.join(PROJECT_ROOT, 'content', 'compare'),
  tier2: path.join(PROJECT_ROOT, 'content', 'blogs'),
  tier3: path.join(PROJECT_ROOT, 'content', 'blogs'),
};
const DB_PATH = path.join(PROJECT_ROOT, 'data', 'loreai.db');
const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

// ─── CLI Args ────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const dateIdx = args.indexOf('--date');
const TARGET_DATE = dateIdx >= 0 ? args[dateIdx + 1] : new Date().toISOString().split('T')[0];
const limitIdx = args.indexOf('--limit');
const MAX_ITEMS = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : 10;

// ─── Types ───────────────────────────────────────────────

interface NewsItem {
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

interface ExtractedKeyword {
  keyword: string;
  keyword_zh: string;
  type: 'glossary' | 'compare' | 'faq' | 'tier2' | 'tier3';
  relevance: number;  // 1-10
  newness: number;     // 1-10
  context: string;     // brief explanation
  news_ids: string[];  // related news_items
}

interface GeneratedContent {
  keyword: ExtractedKeyword;
  slug: string;
  en_path: string;
  zh_path: string;
  status: 'success' | 'error';
  error?: string;
}

// ─── Logging ─────────────────────────────────────────────

function log(step: string, msg: string) {
  const ts = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${ts}] [${step}] ${msg}`);
}

// ─── Database ────────────────────────────────────────────

function getNewsItems(): NewsItem[] {
  try {
    // Use better-sqlite3 via dynamic import workaround
    const result = execSync(
      `npx tsx -e "
        import Database from 'better-sqlite3';
        const db = new Database('${DB_PATH}');
        const rows = db.prepare(\\"SELECT * FROM news_items WHERE detected_at > datetime('now', '-48 hours') ORDER BY score DESC, detected_at DESC LIMIT 100\\").all();
        console.log(JSON.stringify(rows));
        db.close();
      "`,
      { cwd: PROJECT_ROOT, timeout: 30000, encoding: 'utf-8' }
    );
    return JSON.parse(result.trim());
  } catch (e) {
    log('DB', `Error reading news_items: ${(e as Error).message}`);
    return [];
  }
}

// ─── Existing Content Check ──────────────────────────────

function getExistingSlugs(): Set<string> {
  const slugs = new Set<string>();
  const dirs = [
    'content/glossary', 'content/faq', 'content/compare',
    'content/blogs/en', 'content/blogs/zh'
  ];
  for (const dir of dirs) {
    const fullPath = path.join(PROJECT_ROOT, dir);
    if (!fs.existsSync(fullPath)) continue;
    for (const file of fs.readdirSync(fullPath)) {
      if (file.endsWith('.md')) {
        slugs.add(file.replace(/-(en|zh)\.md$/, '').replace(/\.md$/, ''));
      }
    }
  }
  return slugs;
}

function getExistingTitles(): Set<string> {
  const titles = new Set<string>();
  const dirs = [
    'content/glossary', 'content/faq', 'content/compare',
    'content/blogs/en', 'content/blogs/zh'
  ];
  for (const dir of dirs) {
    const fullPath = path.join(PROJECT_ROOT, dir);
    if (!fs.existsSync(fullPath)) continue;
    for (const file of fs.readdirSync(fullPath)) {
      if (!file.endsWith('.md')) continue;
      try {
        const content = fs.readFileSync(path.join(fullPath, file), 'utf-8');
        const titleMatch = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
        if (titleMatch) titles.add(titleMatch[1].toLowerCase());
      } catch {}
    }
  }
  return titles;
}

// ─── Claude CLI Helper ───────────────────────────────────

function runClaudePipe(prompt: string, timeoutMs = 5 * 60 * 1000): string {
  const tmpFile = path.join('/tmp', `seo-pipeline-${Date.now()}.txt`);
  fs.writeFileSync(tmpFile, prompt);
  try {
    const output = execSync(
      `cat "${tmpFile}" | claude -p --allowedTools "" 2>/dev/null`,
      { cwd: PROJECT_ROOT, timeout: timeoutMs, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    return output.trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

// ─── Step 1: Keyword Extraction ──────────────────────────

async function extractKeywords(newsItems: NewsItem[], existingSlugs: Set<string>, existingTitles: Set<string>): Promise<ExtractedKeyword[]> {
  log('KEYWORDS', `Extracting from ${newsItems.length} news items...`);

  const newsContext = newsItems.map((n, i) => 
    `[${i + 1}] ${n.title} (${n.source}, score: ${n.score})\n    ${n.raw_summary || ''}\n    ID: ${n.id}`
  ).join('\n\n');

  const existingList = [...existingSlugs].slice(0, 100).join(', ');

  const prompt = `You are an SEO keyword extraction specialist for LoreAI (loreai.dev), an AI industry news and analysis site targeting AI developers, engineers, and product managers.

Given these recent AI news items (last 48 hours), extract 10-15 trending keywords/topics that would make good long-tail SEO content.

## News Items

${newsContext}

## Already Existing Content (DO NOT duplicate these)

${existingList}

## Output Requirements

Return ONLY a valid JSON array. Each item:
{
  "keyword": "English keyword/phrase",
  "keyword_zh": "中文关键词",
  "type": "glossary|compare|faq|tier2|tier3",
  "relevance": 1-10,
  "newness": 1-10,
  "context": "Brief explanation of why this keyword matters now",
  "news_ids": ["id1", "id2"],
  "category": "models|tools|infra|safety|opensource|applications"
}

## MANDATORY: Diversity Requirements

You MUST cover at least 4 different categories and at least 3 different companies/organizations. Do NOT focus on a single vendor.

### Category Quotas (minimum):
- **models** (2-3): New model releases, benchmarks, architecture innovations (from ANY vendor: OpenAI, Google, Meta, Mistral, Chinese labs, startups)
- **tools** (2-3): Developer tools, APIs, SDKs, frameworks, IDE integrations
- **infra** (1-2): Infrastructure, deployment, cost optimization, MLOps
- **opensource** (1-2): Open-source models, datasets, community projects on HuggingFace etc.
- **applications** (1-2): Real-world AI use cases, industry adoption, practical implementations
- **safety** (0-1): AI safety, alignment, policy, responsible AI

### Type Assignment Rules
- New concept/term that needs definition → "glossary"
- X vs Y natural comparison → "compare"  
- Common questions people would search → "faq"
- Trend analysis requiring depth → "tier2"
- Practical how-to or quick explainer → "tier3"

## Scoring
- relevance: How relevant to AI developers/PMs (our audience)
- newness: How new/trending (10 = breaking, 1 = well-known)

## Rules
- CRITICAL: Do NOT make more than 5 keywords about the same company/product
- Skip keywords that match existing content slugs
- Each keyword should have real news data backing it
- Prefer actionable, searchable phrases over vague topics
- Mix of types (don't make all glossary or all FAQ)
- Include both technical and practical angles
- Think about what an AI engineer would actually Google right now

Return ONLY the JSON array, no markdown fences, no explanation.`;

  const output = runClaudePipe(prompt);
  
  try {
    // Extract JSON from output (handle markdown fences if present)
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array found in output');
    const keywords: ExtractedKeyword[] = JSON.parse(jsonMatch[0]);
    
    // Filter out duplicates
    const filtered = keywords.filter(k => {
      const slug = k.keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (existingSlugs.has(slug)) {
        log('KEYWORDS', `  Skipping duplicate: ${k.keyword}`);
        return false;
      }
      if (existingTitles.has(k.keyword.toLowerCase())) {
        log('KEYWORDS', `  Skipping duplicate title: ${k.keyword}`);
        return false;
      }
      return true;
    });

    // Sort by combined score
    filtered.sort((a, b) => (b.relevance * b.newness) - (a.relevance * a.newness));

    log('KEYWORDS', `Extracted ${filtered.length} keywords (filtered from ${keywords.length})`);
    return filtered.slice(0, MAX_ITEMS);
  } catch (e) {
    log('KEYWORDS', `Parse error: ${(e as Error).message}`);
    log('KEYWORDS', `Raw output: ${output.slice(0, 500)}`);
    return [];
  }
}

// ─── Step 2: Brave Search Validation (Optional) ──────────

async function validateWithBrave(keywords: ExtractedKeyword[]): Promise<ExtractedKeyword[]> {
  if (!BRAVE_API_KEY) {
    log('BRAVE', 'No BRAVE_API_KEY set, skipping search validation');
    return keywords;
  }

  log('BRAVE', `Validating ${keywords.length} keywords against Brave Search...`);
  const validated: ExtractedKeyword[] = [];

  for (const kw of keywords) {
    try {
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(kw.keyword)}&count=5`;
      const resp = await fetch(url, {
        headers: { 'X-Subscription-Token': BRAVE_API_KEY, 'Accept': 'application/json' }
      });
      if (!resp.ok) {
        log('BRAVE', `  API error for "${kw.keyword}": ${resp.status}`);
        validated.push(kw); // Pass through on error
        continue;
      }
      const data = await resp.json() as any;
      const resultCount = data?.web?.results?.length || 0;
      if (resultCount > 0) {
        log('BRAVE', `  ✅ "${kw.keyword}" — ${resultCount} results`);
        validated.push(kw);
      } else {
        log('BRAVE', `  ❌ "${kw.keyword}" — no results, skipping`);
      }
      // Rate limit
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      log('BRAVE', `  Error checking "${kw.keyword}": ${(e as Error).message}`);
      validated.push(kw); // Pass through on error
    }
  }

  log('BRAVE', `${validated.length}/${keywords.length} keywords validated`);
  return validated;
}

// ─── Step 3: Content Generation ──────────────────────────

function generateContent(keyword: ExtractedKeyword, newsItems: NewsItem[]): GeneratedContent {
  const slug = keyword.keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const date = TARGET_DATE;
  const relatedNews = newsItems
    .filter(n => keyword.news_ids.includes(n.id))
    .map(n => `- ${n.title} (${n.source})\n  ${n.raw_summary || ''}`)
    .join('\n');

  const result: GeneratedContent = {
    keyword,
    slug,
    en_path: '',
    zh_path: '',
    status: 'success',
  };

  try {
    switch (keyword.type) {
      case 'glossary':
        generateGlossary(keyword, slug, date, relatedNews, result);
        break;
      case 'faq':
        generateFAQ(keyword, slug, date, relatedNews, result);
        break;
      case 'compare':
        generateCompare(keyword, slug, date, relatedNews, result);
        break;
      case 'tier2':
        generateTier2(keyword, slug, date, relatedNews, result);
        break;
      case 'tier3':
        generateTier3(keyword, slug, date, relatedNews, result);
        break;
    }
  } catch (e) {
    result.status = 'error';
    result.error = (e as Error).message;
    log('GENERATE', `❌ Error generating ${keyword.type} for "${keyword.keyword}": ${result.error}`);
  }

  return result;
}

function generateGlossary(kw: ExtractedKeyword, slug: string, date: string, news: string, result: GeneratedContent) {
  log('GENERATE', `📖 Glossary: ${kw.keyword}`);
  
  const enPrompt = `Write a glossary entry for the AI term "${kw.keyword}" for loreai.dev.

## Context from recent news
${news || 'No specific news context available.'}

## Format
Output ONLY the complete markdown file with frontmatter. No explanations before or after.

---
slug: ${slug}
title: "${kw.keyword} — What It Is and Why It Matters"
description: "Learn what ${kw.keyword} means in AI, how it works, and why it matters for developers and businesses."
keywords: ["${kw.keyword}", "AI glossary", "AI terminology"]
date: ${date}
tier: 3
lang: en
type: glossary
tags: ["glossary", "AI"]
---

# ${kw.keyword}

## Definition
(Clear 2-3 sentence definition)

## Why It Matters
(2-3 paragraphs on relevance, especially given recent developments)

## How It Works
(Technical explanation, accessible to developers)

## Related Terms
(List 3-5 related terms with brief definitions)

## Further Reading
(Reference the news sources if relevant)

Requirements:
- 300-500 words total
- Professional but accessible tone
- Include recent context from the news items
- No fluff phrases like "Let's dive in" or "In this article"`;

  const zhPrompt = `为 loreai.dev 撰写 AI 术语"${kw.keyword_zh}"（${kw.keyword}）的术语表条目。

## 最近相关新闻
${news || '暂无具体新闻上下文。'}

## 格式要求
只输出完整的 markdown 文件（含 frontmatter），前后不要任何解释。

---
slug: ${slug}
title: "${kw.keyword_zh}（${kw.keyword}）— 定义、原理与应用"
description: "了解${kw.keyword_zh}的含义、工作原理以及对开发者和企业的重要性。"
keywords: ["${kw.keyword_zh}", "${kw.keyword}", "AI术语"]
date: ${date}
tier: 3
lang: zh
type: glossary
tags: ["术语表", "AI"]
---

# ${kw.keyword_zh}（${kw.keyword}）

## 定义
（清晰的2-3句定义）

## 为什么重要
（2-3段，结合最新动态说明重要性）

## 工作原理
（技术解释，开发者可理解的深度）

## 相关术语
（列出3-5个相关术语及简要定义）

## 延伸阅读
（引用新闻来源）

要求：
- 300-500字
- 专业但易懂的语气
- 专业术语首次出现标注英文：大语言模型（LLM）
- 不要翻译腔（"值得注意的是"、"让我们来看看"）`;

  const enContent = runClaudePipe(enPrompt);
  const zhContent = runClaudePipe(zhPrompt);

  const enPath = DRY_RUN 
    ? path.join(OUTPUT_DIR, `glossary-${slug}-en.md`)
    : path.join(CONTENT_DIRS.glossary, `${slug}-en.md`);
  const zhPath = DRY_RUN
    ? path.join(OUTPUT_DIR, `glossary-${slug}-zh.md`)
    : path.join(CONTENT_DIRS.glossary, `${slug}-zh.md`);

  fs.writeFileSync(enPath, extractMarkdown(enContent));
  fs.writeFileSync(zhPath, extractMarkdown(zhContent));
  result.en_path = enPath;
  result.zh_path = zhPath;
}

function generateFAQ(kw: ExtractedKeyword, slug: string, date: string, news: string, result: GeneratedContent) {
  log('GENERATE', `❓ FAQ: ${kw.keyword}`);

  const enPrompt = `Write a FAQ page about "${kw.keyword}" for loreai.dev (AI industry site).

## Context from recent news
${news || 'No specific news context.'}

## Format
Output ONLY the complete markdown file with frontmatter.

---
slug: ${slug}
title: "${kw.keyword} — Frequently Asked Questions"
description: "Answers to the most common questions about ${kw.keyword} in AI."
keywords: ["${kw.keyword}", "${kw.keyword} FAQ", "AI FAQ"]
date: ${date}
tier: 3
lang: en
type: faq
tags: ["faq", "AI"]
---

# ${kw.keyword}: Frequently Asked Questions

Generate 10 Q&A pairs. Requirements:
- Questions should be scenario-based (what real users would search)
- Answers: 100-300 words each
- Use H3 (###) for each question
- Include practical examples where relevant
- Reference recent news developments
- No fluff phrases`;

  const zhPrompt = `为 loreai.dev 撰写关于"${kw.keyword_zh}"（${kw.keyword}）的常见问题页面。

## 最近相关新闻
${news || '暂无具体新闻上下文。'}

## 格式要求
只输出完整的 markdown 文件（含 frontmatter）。

---
slug: ${slug}
title: "${kw.keyword_zh} — 常见问题解答"
description: "关于${kw.keyword_zh}的常见问题与详细解答。"
keywords: ["${kw.keyword_zh}", "${kw.keyword}", "AI常见问题"]
date: ${date}
tier: 3
lang: zh
type: faq
tags: ["常见问题", "AI"]
---

# ${kw.keyword_zh}：常见问题解答

生成10个问答对。要求：
- 问题要场景化（真实用户会搜索的问题）
- 每个答案100-300字
- 用 H3 (###) 标记每个问题
- 包含实际案例
- 结合最新新闻动态
- 专业术语首次出现标注英文
- 不要翻译腔`;

  const enContent = runClaudePipe(enPrompt);
  const zhContent = runClaudePipe(zhPrompt);

  const enPath = DRY_RUN
    ? path.join(OUTPUT_DIR, `faq-${slug}-en.md`)
    : path.join(CONTENT_DIRS.faq, `${slug}-en.md`);
  const zhPath = DRY_RUN
    ? path.join(OUTPUT_DIR, `faq-${slug}-zh.md`)
    : path.join(CONTENT_DIRS.faq, `${slug}-zh.md`);

  fs.writeFileSync(enPath, extractMarkdown(enContent));
  fs.writeFileSync(zhPath, extractMarkdown(zhContent));
  result.en_path = enPath;
  result.zh_path = zhPath;
}

function generateCompare(kw: ExtractedKeyword, slug: string, date: string, news: string, result: GeneratedContent) {
  log('GENERATE', `⚖️ Compare: ${kw.keyword}`);

  const enPrompt = `Write a comparison article about "${kw.keyword}" for loreai.dev.

## Context from recent news
${news || 'No specific news context.'}

## Format
Output ONLY the complete markdown file with frontmatter.

---
slug: ${slug}
title: "${kw.keyword} — Detailed Comparison"
description: "A comprehensive comparison of ${kw.keyword} with benchmarks, features, pricing, and recommendations."
keywords: ["${kw.keyword}", "AI comparison", "AI tools comparison"]
date: ${date}
tier: 2
lang: en
type: compare
tags: ["compare", "AI"]
---

# ${kw.keyword}

Requirements:
- Include a comparison table (markdown table) with key dimensions
- Cover: features, performance, pricing, use cases, limitations
- 800-1500 words
- End with "Who Should Choose What" recommendations
- Reference recent news/benchmarks
- No fluff phrases`;

  const zhPrompt = `为 loreai.dev 撰写"${kw.keyword_zh}"（${kw.keyword}）的对比文章。

## 最近相关新闻
${news || '暂无具体新闻上下文。'}

## 格式要求
只输出完整的 markdown 文件（含 frontmatter）。

---
slug: ${slug}
title: "${kw.keyword_zh} — 详细对比分析"
description: "${kw.keyword_zh}的全面对比：性能、功能、定价与推荐。"
keywords: ["${kw.keyword_zh}", "${kw.keyword}", "AI对比"]
date: ${date}
tier: 2
lang: zh
type: compare
tags: ["对比", "AI"]
---

# ${kw.keyword_zh}

要求：
- 包含对比表格（markdown 表格）
- 覆盖：功能、性能、定价、使用场景、局限性
- 800-1500字
- 以"如何选择"推荐结尾
- 引用最新新闻/基准测试
- 专业术语首次出现标注英文`;

  const enContent = runClaudePipe(enPrompt);
  const zhContent = runClaudePipe(zhPrompt);

  const enPath = DRY_RUN
    ? path.join(OUTPUT_DIR, `compare-${slug}-en.md`)
    : path.join(CONTENT_DIRS.compare, `${slug}-en.md`);
  const zhPath = DRY_RUN
    ? path.join(OUTPUT_DIR, `compare-${slug}-zh.md`)
    : path.join(CONTENT_DIRS.compare, `${slug}-zh.md`);

  fs.writeFileSync(enPath, extractMarkdown(enContent));
  fs.writeFileSync(zhPath, extractMarkdown(zhContent));
  result.en_path = enPath;
  result.zh_path = zhPath;
}

function generateTier2(kw: ExtractedKeyword, slug: string, date: string, news: string, result: GeneratedContent) {
  log('GENERATE', `📊 Tier 2 Analysis: ${kw.keyword}`);

  const enPrompt = `Write a Tier 2 analysis article about "${kw.keyword}" for loreai.dev.

## Context from recent news
${news || 'No specific news context.'}

## Format
Output ONLY the complete markdown file with frontmatter.

---
slug: ${slug}
title: "${kw.keyword} — Analysis and Industry Impact"
description: "In-depth analysis of ${kw.keyword}: what happened, why it matters, and what comes next."
keywords: ["${kw.keyword}", "AI analysis", "AI trends"]
date: ${date}
tier: 2
lang: en
type: blog
tags: ["analysis", "AI trends"]
---

# ${kw.keyword}

**TL;DR:** (One sentence summary)

Requirements:
- 1500-2500 words
- Structure: Background → What Happened → Analysis → Impact → What's Next
- Include data points and specific examples
- Reference the news sources
- Professional but accessible tone
- No fluff phrases like "Let's dive in" or "In this article we will explore"`;

  const zhPrompt = `为 loreai.dev 撰写关于"${kw.keyword_zh}"（${kw.keyword}）的 Tier 2 分析文章。

## 最近相关新闻
${news || '暂无具体新闻上下文。'}

## 格式要求
只输出完整的 markdown 文件（含 frontmatter）。

---
slug: ${slug}
title: "${kw.keyword_zh} — 深度分析与行业影响"
description: "深入分析${kw.keyword_zh}：发生了什么、为什么重要、接下来会怎样。"
keywords: ["${kw.keyword_zh}", "${kw.keyword}", "AI分析"]
date: ${date}
tier: 2
lang: zh
type: blog
tags: ["深度分析", "AI趋势"]
---

# ${kw.keyword_zh}

**一句话总结：**（核心结论）

要求：
- 1500-2500字
- 结构：背景 → 发生了什么 → 分析 → 影响 → 展望
- 包含数据和具体案例
- 引用新闻来源
- 语气像懂技术的朋友在科普
- 专业术语首次出现标注英文
- 不要翻译腔`;

  const enContent = runClaudePipe(enPrompt);
  const zhContent = runClaudePipe(zhPrompt);

  const enPath = DRY_RUN
    ? path.join(OUTPUT_DIR, `tier2-${slug}-en.md`)
    : path.join(CONTENT_DIRS.tier2, `en/${slug}.md`);
  const zhPath = DRY_RUN
    ? path.join(OUTPUT_DIR, `tier2-${slug}-zh.md`)
    : path.join(CONTENT_DIRS.tier3, `zh/${slug}.md`);

  fs.writeFileSync(enPath, extractMarkdown(enContent));
  fs.writeFileSync(zhPath, extractMarkdown(zhContent));
  result.en_path = enPath;
  result.zh_path = zhPath;
}

function generateTier3(kw: ExtractedKeyword, slug: string, date: string, news: string, result: GeneratedContent) {
  log('GENERATE', `⚡ Tier 3 Quick Read: ${kw.keyword}`);

  const enPrompt = `Write a Tier 3 quick read article about "${kw.keyword}" for loreai.dev.

## Context from recent news
${news || 'No specific news context.'}

## Format
Output ONLY the complete markdown file with frontmatter.

---
slug: ${slug}
title: "${kw.keyword} — Quick Guide"
description: "A practical quick guide to ${kw.keyword} for AI developers and teams."
keywords: ["${kw.keyword}", "AI guide", "how to"]
date: ${date}
tier: 3
lang: en
type: blog
tags: ["quick-read", "practical"]
---

# ${kw.keyword}

**TL;DR:** (One sentence)

Requirements:
- 800-1200 words
- Practical and actionable
- Include code examples or step-by-step instructions where relevant
- Reference the news sources
- No fluff`;

  const zhPrompt = `为 loreai.dev 撰写关于"${kw.keyword_zh}"（${kw.keyword}）的 Tier 3 快速阅读文章。

## 最近相关新闻
${news || '暂无具体新闻上下文。'}

## 格式要求
只输出完整的 markdown 文件（含 frontmatter）。

---
slug: ${slug}
title: "${kw.keyword_zh} — 快速指南"
description: "${kw.keyword_zh}实用快速指南，面向AI开发者和团队。"
keywords: ["${kw.keyword_zh}", "${kw.keyword}", "AI指南"]
date: ${date}
tier: 3
lang: zh
type: blog
tags: ["快速阅读", "实用"]
---

# ${kw.keyword_zh}

**一句话总结：**（核心要点）

要求：
- 800-1200字
- 实用导向，可操作
- 包含代码示例或操作步骤
- 引用新闻来源
- 专业术语首次出现标注英文
- 不要翻译腔`;

  const enContent = runClaudePipe(enPrompt);
  const zhContent = runClaudePipe(zhPrompt);

  const enPath = DRY_RUN
    ? path.join(OUTPUT_DIR, `tier3-${slug}-en.md`)
    : path.join(CONTENT_DIRS.tier3, `en/${slug}.md`);
  const zhPath = DRY_RUN
    ? path.join(OUTPUT_DIR, `tier3-${slug}-zh.md`)
    : path.join(CONTENT_DIRS.tier3, `zh/${slug}.md`);

  fs.writeFileSync(enPath, extractMarkdown(enContent));
  fs.writeFileSync(zhPath, extractMarkdown(zhContent));
  result.en_path = enPath;
  result.zh_path = zhPath;
}

// ─── Helpers ─────────────────────────────────────────────

function extractMarkdown(raw: string): string {
  // If output has markdown fences, extract content
  const fenceMatch = raw.match(/```(?:markdown|md)?\n([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  
  // If output starts with ---, it's already a markdown file
  if (raw.trim().startsWith('---')) return raw.trim();
  
  // Otherwise return as-is
  return raw.trim();
}

function validateFrontmatter(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    return { valid: false, errors: ['No frontmatter found'] };
  }

  const fm = fmMatch[1];
  const required = ['slug', 'title', 'description', 'date', 'lang'];
  for (const field of required) {
    if (!new RegExp(`^${field}:`, 'm').test(fm)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  🚀 Track B: SEO Auto-Pipeline');
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'PRODUCTION'}`);
  console.log(`  Date: ${TARGET_DATE}`);
  console.log(`  Max items: ${MAX_ITEMS}`);
  console.log('═══════════════════════════════════════════════════\n');

  // Ensure output directory
  if (DRY_RUN) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Step 0: Get news items
  log('NEWS', 'Reading news_items from database...');
  const newsItems = getNewsItems();
  if (newsItems.length === 0) {
    log('NEWS', '⚠️ No news items found in last 48h. Exiting.');
    process.exit(0);
  }
  log('NEWS', `Found ${newsItems.length} news items`);

  // Step 1: Extract keywords
  const existingSlugs = getExistingSlugs();
  const existingTitles = getExistingTitles();
  log('DEDUP', `Existing content: ${existingSlugs.size} slugs, ${existingTitles.size} titles`);

  const keywords = await extractKeywords(newsItems, existingSlugs, existingTitles);
  if (keywords.length === 0) {
    log('KEYWORDS', '⚠️ No keywords extracted. Exiting.');
    process.exit(0);
  }

  // Save extracted keywords
  const kwPath = path.join(OUTPUT_DIR, 'extracted-keywords.json');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(kwPath, JSON.stringify(keywords, null, 2));
  log('KEYWORDS', `Saved to ${kwPath}`);

  // Step 2: Brave Search validation (optional)
  const validatedKeywords = await validateWithBrave(keywords);

  // Step 3: Generate content
  log('GENERATE', `Generating content for ${validatedKeywords.length} keywords...`);
  const results: GeneratedContent[] = [];

  for (const kw of validatedKeywords) {
    const result = generateContent(kw, newsItems);
    results.push(result);

    // Validate frontmatter
    if (result.status === 'success') {
      for (const p of [result.en_path, result.zh_path]) {
        if (p && fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf-8');
          const validation = validateFrontmatter(content);
          if (!validation.valid) {
            log('VALIDATE', `⚠️ ${path.basename(p)}: ${validation.errors.join(', ')}`);
          }
        }
      }
    }
  }

  // Step 4: Summary report
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'error');

  const report = `# SEO Pipeline Report — ${TARGET_DATE}

## Summary
- **Mode:** ${DRY_RUN ? 'Dry Run' : 'Production'}
- **News items processed:** ${newsItems.length}
- **Keywords extracted:** ${keywords.length}
- **Content generated:** ${successful.length} ✅ / ${failed.length} ❌

## Generated Content

${successful.map(r => `### ${r.keyword.keyword} (${r.keyword.type})
- **Slug:** ${r.slug}
- **EN:** ${r.en_path}
- **ZH:** ${r.zh_path}
- **Relevance:** ${r.keyword.relevance}/10 | **Newness:** ${r.keyword.newness}/10
- **Context:** ${r.keyword.context}
`).join('\n')}

${failed.length > 0 ? `## Errors\n\n${failed.map(r => `- **${r.keyword.keyword}:** ${r.error}`).join('\n')}` : ''}

## Keywords Considered

${keywords.map(k => `- [${k.type}] ${k.keyword} (${k.keyword_zh}) — rel:${k.relevance} new:${k.newness}`).join('\n')}
`;

  const reportPath = path.join(OUTPUT_DIR, `report-${TARGET_DATE}.md`);
  fs.writeFileSync(reportPath, report);

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  ✅ SEO Pipeline Complete`);
  console.log(`  Generated: ${successful.length} content pieces`);
  console.log(`  Errors: ${failed.length}`);
  console.log(`  Report: ${reportPath}`);
  console.log('═══════════════════════════════════════════════════');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
