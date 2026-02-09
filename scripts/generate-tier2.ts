#!/usr/bin/env npx tsx
/**
 * Generate Tier 2/3 SEO articles from keywords table
 * Uses Gemini Flash for cost-effective content generation (~$0.02/article)
 * Reuses research report as context
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { getDb, initSchema, insertContent, closeDb } from '../src/lib/db.js';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not set');
  process.exit(1);
}

const PROJECT_ROOT = process.cwd();

interface KeywordRow {
  id: number;
  keyword: string;
  language: string;
  search_intent: string;
  parent_research_id: number | null;
}

async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 8000 },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json() as any;
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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

  // Update status to writing
  db.prepare('UPDATE keywords SET status = ? WHERE id = ?').run('writing', kw.id);

  const prompt = isZh
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

  const article = await callGemini(prompt);

  if (!article || article.length < 500) {
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
tier: 2
---

${article}`;
  }

  // Save to content/blogs/{lang}/
  const blogDir = path.join(PROJECT_ROOT, 'content', 'blogs', lang);
  fs.mkdirSync(blogDir, { recursive: true });
  const filePath = path.join(blogDir, `${slug}.md`);
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
    source_type: 'tier2_auto',
  });

  // Update keyword status
  db.prepare('UPDATE keywords SET status = ?, content_id = ? WHERE id = ?').run('published', contentId, kw.id);
  console.log(`   ✅ Published (content_id=${contentId})`);
}

async function main() {
  const db = getDb();
  initSchema(db);

  // Get one backlog keyword (or specific one from CLI)
  const targetKeyword = process.argv[2];
  let kw: KeywordRow | undefined;

  if (targetKeyword) {
    kw = db.prepare(
      `SELECT id, keyword, language, search_intent, parent_research_id FROM keywords WHERE keyword LIKE ? LIMIT 1`
    ).get(`%${targetKeyword}%`) as KeywordRow | undefined;
  } else {
    kw = db.prepare(
      `SELECT id, keyword, language, search_intent, parent_research_id FROM keywords WHERE status = 'backlog' ORDER BY id LIMIT 1`
    ).get() as KeywordRow | undefined;
  }

  if (!kw) {
    console.log('📭 No backlog keywords found. Run extract-keywords.ts first.');
    closeDb();
    return;
  }

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
  closeDb();
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
