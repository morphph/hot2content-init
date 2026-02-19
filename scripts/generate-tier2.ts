#!/usr/bin/env npx tsx
/**
 * Generate Tier 2/3 SEO articles from keywords table
 * Uses Gemini Flash for cost-effective content generation (~$0.02/article)
 * Reuses research report as context
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { callGemini, GEMINI_API_KEY } from '../src/lib/gemini.js';
import { getDb, initSchema, insertContent, closeDb } from '../src/lib/db.js';

dotenv.config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const PROJECT_ROOT = process.cwd();
const IS_TIER3 = process.argv.includes('--tier3');

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not set');
  process.exit(1);
}

if (!IS_TIER3 && !ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY not set (required for Tier 2 generation)');
  console.error('   Use --tier3 flag to generate Tier 3 articles with Gemini Flash instead');
  process.exit(1);
}

interface KeywordRow {
  id: number;
  keyword: string;
  language: string;
  search_intent: string;
  parent_research_id: number | null;
}

async function callClaude(prompt: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set — required for Tier 2 generation');
  }
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = message.content[0];
  return block.type === 'text' ? block.text : '';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

async function generateArticle(kw: KeywordRow, researchContext: string): Promise<void> {
  const db = getDb();
  const lang = kw.language || 'en';
  const isZh = lang === 'zh';

  console.log(`\n📝 Generating article for: "${kw.keyword}" [${lang}/${kw.search_intent}]`);

  // Dedup: check if a similar article already exists
  const blogDir = path.join(PROJECT_ROOT, 'content', 'blogs', lang);
  if (fs.existsSync(blogDir)) {
    const existingFiles = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));
    const existingTitles: string[] = [];
    for (const file of existingFiles) {
      const content = fs.readFileSync(path.join(blogDir, file), 'utf-8');
      const titleMatch = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
      if (titleMatch) existingTitles.push(titleMatch[1].toLowerCase());
    }
    // Check keyword overlap with existing titles (>60% word overlap = too similar)
    const kwWords = new Set(kw.keyword.toLowerCase().split(/\s+/));
    for (const existing of existingTitles) {
      const existWords = new Set(existing.split(/\s+/));
      const overlap = [...kwWords].filter(w => existWords.has(w)).length;
      const similarity = overlap / Math.max(kwWords.size, 1);
      if (similarity > 0.6) {
        console.log(`   ⏭️ Skipping: too similar to existing article "${existing}"`);
        db.prepare('UPDATE keywords SET status = ? WHERE id = ?').run('skipped_duplicate', kw.id);
        return;
      }
    }
  }

  // Update status to writing
  db.prepare('UPDATE keywords SET status = ? WHERE id = ?').run('writing', kw.id);

  let prompt: string;

  if (IS_TIER3) {
    // Tier 3: Quick Read (300-500 words)
    prompt = isZh
      ? `你是 loreai.dev 的技术作者。写一篇快速阅读文章（300-500 字）。

主题/关键词：${kw.keyword}
参考资料：${researchContext.substring(0, 2000)}

格式要求：
- 标题要吸引点击，面向搜索优化
- 2-3 个小节，用 ## 标题
- 关键要点用列表呈现
- 包含 1-2 个具体数据
- 结尾一句话引导读者查看 LoreAI 的更深入内容
- 必须全中文输出，不要出现英文段落

Frontmatter 格式：
---
title: "..."
date: ${new Date().toISOString().split('T')[0]}
lang: zh
tier: 3
tags: []
description: "..."
keywords: ["${kw.keyword}"]
---

直接输出 Markdown，不要代码块包裹。`
      : `You are a technical writer for loreai.dev. Write a quick-read article (300-500 words) about the topic.

Topic/Keyword: ${kw.keyword}
Research context: ${researchContext.substring(0, 2000)}

Format:
- Title: action-oriented or question-based (SEO friendly)
- 2-3 short sections with H2 headers
- Key takeaways as bullet points
- Include 1-2 specific data points if available
- End with a one-liner linking to deeper LoreAI content
- Output ONLY in English. Do not use any Chinese characters.

Frontmatter:
---
title: "..."
date: ${new Date().toISOString().split('T')[0]}
lang: en
tier: 3
tags: []
description: "..."
keywords: ["${kw.keyword}"]
---

Output raw Markdown directly, no code block wrapping.`;
  } else {
    // Tier 2: Full article (1500-2500 words)
    prompt = isZh
      ? `你是 loreai.dev 的中文技术博客作者。

目标关键词: ${kw.keyword}
搜索意图: ${kw.search_intent}
目标读者: AI 开发者、产品经理、技术管理者

参考调研资料:
${researchContext.substring(0, 4000)}

要求:
- 2000-2500 字的中文博客文章
- Markdown 格式，以 # 标题 开头
- 在 frontmatter 中包含: title, description, keywords, date
- 自然融入目标关键词（3-5次）
- 包含具体数据、对比、实例
- FAQ 部分（2-3个问题）
- 专业术语首次出现标注英文
- 语气像懂技术的朋友在科普
- 不要: "让我们开始", "本文将", "总而言之"

直接输出 Markdown，不要代码块包裹。`
      : `You are a technical blog writer for loreai.dev.

Target keyword: ${kw.keyword}
Search intent: ${kw.search_intent}
Target audience: AI developers, product managers, tech leaders

Research context:
${researchContext.substring(0, 4000)}

Requirements:
- 1500-2000 word blog article in English
- Markdown format, starting with # title
- Include frontmatter: title, description, keywords, date
- Naturally incorporate the target keyword (3-5 times)
- Include specific data, comparisons, examples
- FAQ section (2-3 questions)
- Professional but readable tone
- Don't use: "In this article", "Let's dive in", "Game-changing", "revolutionary"

Output raw Markdown directly, no code block wrapping.`;
  }

  const article = IS_TIER3 ? await callGemini(prompt) : await callClaude(prompt);

  const minLen = IS_TIER3 ? 200 : 500;
  if (!article || article.length < minLen) {
    console.error(`   ❌ Article too short (${article.length} chars), skipping`);
    db.prepare('UPDATE keywords SET status = ? WHERE id = ?').run('error', kw.id);
    return;
  }

  // Extract title from article
  const titleMatch = article.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : kw.keyword;
  const slug = slugify(kw.keyword);
  const date = new Date().toISOString().split('T')[0];

  // Ensure frontmatter
  let finalArticle = article;
  if (!article.startsWith('---')) {
    finalArticle = `---
title: "${title.replace(/"/g, '\\"')}"
description: "${kw.keyword}"
keywords: ["${kw.keyword}"]
date: ${date}
lang: ${lang}
tier: ${IS_TIER3 ? 3 : 2}
---

${article}`;
  }

  // Save to content/blogs/{lang}/
  const outputDir = path.join(PROJECT_ROOT, 'content', 'blogs', lang);
  fs.mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, `${slug}.md`);
  fs.writeFileSync(filePath, finalArticle);
  console.log(`   💾 Saved: content/blogs/${lang}/${slug}.md (${(finalArticle.length / 1024).toFixed(1)} KB)`);

  // Insert into content table
  const contentId = insertContent(db, {
    type: `blog_${lang}`,
    title,
    slug: `${slug}-${lang}`,
    body_markdown: finalArticle,
    language: lang,
    status: 'published',
    source_type: IS_TIER3 ? 'tier3_auto' : 'tier2_auto',
  });

  // Update keyword status
  db.prepare('UPDATE keywords SET status = ?, content_id = ? WHERE id = ?').run('published', contentId, kw.id);
  console.log(`   ✅ Published (content_id=${contentId})`);
}

async function main() {
  const db = getDb();
  initSchema(db);

  const batchSize = IS_TIER3 ? 5 : 1;
  const targetKeyword = process.argv.filter(a => !a.startsWith('--'))[2];

  let keywords: KeywordRow[] = [];

  if (targetKeyword) {
    const kw = db.prepare(
      `SELECT id, keyword, language, search_intent, parent_research_id FROM keywords WHERE keyword LIKE ? LIMIT 1`
    ).get(`%${targetKeyword}%`) as KeywordRow | undefined;
    if (kw) keywords = [kw];
  } else {
    keywords = db.prepare(
      `SELECT id, keyword, language, search_intent, parent_research_id FROM keywords WHERE status = 'backlog' ORDER BY id LIMIT ?`
    ).all(batchSize) as KeywordRow[];
  }

  if (keywords.length === 0) {
    console.log('📭 No backlog keywords found. Run extract-keywords.ts first.');
    closeDb();
    return;
  }

  console.log(`🚀 Generating ${IS_TIER3 ? 'Tier 3 (Quick Read)' : 'Tier 2'} articles for ${keywords.length} keyword(s)\n`);

  for (const kw of keywords) {
    // Load research context
    let researchContext = '';
    if (kw.parent_research_id) {
      const research = db.prepare(
        `SELECT research_report FROM research WHERE id = ?`
      ).get(kw.parent_research_id) as { research_report: string } | undefined;
      if (research?.research_report) {
        researchContext = research.research_report;
      }
    }

    // Fallback to file
    if (!researchContext) {
      const reportPath = path.join(PROJECT_ROOT, 'output', 'research-report.md');
      if (fs.existsSync(reportPath)) {
        researchContext = fs.readFileSync(reportPath, 'utf-8');
      }
    }

    await generateArticle(kw, researchContext);
    await new Promise(r => setTimeout(r, 1000));
  }

  closeDb();
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
