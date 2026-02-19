#!/usr/bin/env npx tsx
/**
 * PAA → FAQ Consumer
 *
 * Reads 'discovered' PAA questions from the paa_questions table
 * (populated by paa-miner.ts) and generates bilingual FAQ pages.
 *
 * Slot: Step 4 in daily-seo.sh (after paa-miner, before content-updater)
 *
 * Usage: npx tsx scripts/generate-paa-faq.ts [--dry-run] [--limit N]
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import { getDb, initSchema, getDiscoveredPAAQuestions } from '../src/lib/db.js';

dotenv.config();

// ─── Config ──────────────────────────────────────────────

const PROJECT_ROOT = process.cwd();
const FAQ_DIR = path.join(PROJECT_ROOT, 'content', 'faq');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'output', 'seo-pipeline');
const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

// ─── CLI Args ────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const BATCH_SIZE = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : 5;
const TODAY = new Date().toISOString().split('T')[0];

// ─── Logging ─────────────────────────────────────────────

function log(step: string, msg: string) {
  const ts = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${ts}] [${step}] ${msg}`);
}

// ─── Claude CLI Helper (same as seo-pipeline.ts) ─────────

function runClaudePipe(prompt: string, timeoutMs = 5 * 60 * 1000): string {
  const tmpFile = path.join('/tmp', `paa-faq-${Date.now()}.txt`);
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

// ─── Helpers ─────────────────────────────────────────────

function extractMarkdown(raw: string): string {
  const fenceMatch = raw.match(/```(?:markdown|md)?\n([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  if (raw.trim().startsWith('---')) return raw.trim();
  return raw.trim();
}

function getExistingFaqSlugs(): Set<string> {
  const slugs = new Set<string>();
  if (!fs.existsSync(FAQ_DIR)) return slugs;
  for (const file of fs.readdirSync(FAQ_DIR)) {
    if (file.endsWith('.md')) {
      slugs.add(file.replace(/-(en|zh)\.md$/, ''));
    }
  }
  return slugs;
}

function questionToSlug(question: string): string {
  return question
    .toLowerCase()
    .replace(/[?''""]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

// ─── Brave Search Grounding ──────────────────────────────

interface BraveSnippet {
  title: string;
  url: string;
  description: string;
}

async function fetchBraveSnippets(query: string): Promise<BraveSnippet[]> {
  if (!BRAVE_API_KEY) return [];

  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`;
    const resp = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': BRAVE_API_KEY,
      },
    });
    if (!resp.ok) {
      log('BRAVE', `API error for "${query}": ${resp.status}`);
      return [];
    }
    const data = await resp.json() as any;
    const results = data?.web?.results || [];
    return results.map((r: any) => ({
      title: (r.title || '').replace(/<\/?[^>]+(>|$)/g, ''),
      url: r.url || '',
      description: (r.description || '').replace(/<\/?[^>]+(>|$)/g, ''),
    }));
  } catch (e) {
    log('BRAVE', `Fetch error: ${(e as Error).message}`);
    return [];
  }
}

function formatGroundingContext(snippets: BraveSnippet[]): string {
  if (snippets.length === 0) return 'No search context available — use only facts you are confident about.';
  return snippets
    .map((s, i) => `[${i + 1}] ${s.title}\n    ${s.description}\n    Source: ${s.url}`)
    .join('\n\n');
}

// ─── FAQ Generation ──────────────────────────────────────

async function generateFaqFromPAA(
  question: string,
  questionZh: string | null,
  sourceKeyword: string,
  slug: string,
): Promise<{ enPath: string; zhPath: string }> {
  // Pre-fetch grounding context from Brave Search
  const snippets = await fetchBraveSnippets(question);
  if (snippets.length > 0) {
    log('BRAVE', `Fetched ${snippets.length} snippets for "${question}"`);
  } else {
    log('BRAVE', `No snippets for "${question}" — proceeding with model knowledge only`);
  }
  const groundingContext = formatGroundingContext(snippets);
  // Rate-limit Brave calls
  await new Promise(r => setTimeout(r, 500));
  const displayZh = questionZh || question;

  const enPrompt = `Write a FAQ page for loreai.dev (AI industry site for developers and PMs).

The lead question comes from a real "People Also Ask" result on search engines:

**Lead question:** ${question}
**Source keyword:** ${sourceKeyword}

## Grounding Sources (from Brave Search — base your answers on these)

${groundingContext}

## CRITICAL: Accuracy Rules
- ONLY state facts that are supported by the grounding sources above or that you are highly confident about
- Include specific numbers, dates, and version names from the sources
- If a source contradicts your knowledge, prefer the source (it's more recent)
- If you're unsure about a claim, qualify it ("as of early 2026" or "according to [source]")
- Do NOT fabricate benchmark scores, pricing, release dates, or feature claims

## Format
Output ONLY the complete markdown file with frontmatter. No explanations before or after.

---
slug: ${slug}
title: "${question}"
description: "Expert answers to ${question} and related questions about ${sourceKeyword}."
keywords: ["${sourceKeyword}", "${question}", "AI FAQ"]
date: ${TODAY}
tier: 3
lang: en
type: faq
tags: ["faq", "AI"]
---

# ${question}

Generate the lead answer (200-400 words), then 4-5 closely related follow-up questions with answers (100-200 words each).

Requirements:
- Use H2 (##) for the lead answer section
- Use H3 (###) for each follow-up question
- Answers should be practical, specific, and grounded in the search sources above
- Include concrete examples, numbers, or comparisons where possible
- No fluff phrases like "Let's dive in" or "In this article"
- Total page: 600-1200 words`;

  const zhPrompt = `为 loreai.dev 撰写常见问题页面（面向 AI 开发者和产品经理）。

主要问题来自搜索引擎"大家还在问"：

**主要问题：** ${displayZh}
**来源关键词：** ${sourceKeyword}

## 参考资料（来自 Brave 搜索——请基于这些来源撰写）

${groundingContext}

## 重要：准确性要求
- 只陈述上面参考资料支持的事实，或你高度确信的内容
- 引用来源中的具体数据、日期和版本号
- 如果来源与你的知识冲突，以来源为准（更新）
- 如果不确定某个说法，加限定词（"截至2026年初"、"据[来源]报道"）
- 严禁编造基准测试分数、定价、发布日期或功能声明

## 格式要求
只输出完整的 markdown 文件（含 frontmatter），前后不要任何解释。

---
slug: ${slug}
title: "${displayZh}"
description: "关于${displayZh}及${sourceKeyword}相关问题的专业解答。"
keywords: ["${sourceKeyword}", "${displayZh}", "AI常见问题"]
date: ${TODAY}
tier: 3
lang: zh
type: faq
tags: ["常见问题", "AI"]
---

# ${displayZh}

生成主要答案（200-400字），然后生成4-5个紧密相关的追问及答案（每个100-200字）。

要求：
- 主要回答用 H2 (##)
- 追问用 H3 (###)
- 答案要实用、具体，基于上面的搜索来源
- 包含具体例子、数据或对比
- 专业术语首次出现标注英文：大语言模型（LLM）
- 不要翻译腔（"值得注意的是"、"让我们来看看"）
- 全文600-1200字`;

  const enContent = runClaudePipe(enPrompt);
  const zhContent = runClaudePipe(zhPrompt);

  const enPath = DRY_RUN
    ? path.join(OUTPUT_DIR, `paa-faq-${slug}-en.md`)
    : path.join(FAQ_DIR, `${slug}-en.md`);
  const zhPath = DRY_RUN
    ? path.join(OUTPUT_DIR, `paa-faq-${slug}-zh.md`)
    : path.join(FAQ_DIR, `${slug}-zh.md`);

  fs.writeFileSync(enPath, extractMarkdown(enContent));
  fs.writeFileSync(zhPath, extractMarkdown(zhContent));

  return { enPath, zhPath };
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  📋 PAA → FAQ Consumer');
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'PRODUCTION'}`);
  console.log(`  Batch size: ${BATCH_SIZE}`);
  console.log('═══════════════════════════════════════════════════\n');

  if (DRY_RUN) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  } else {
    fs.mkdirSync(FAQ_DIR, { recursive: true });
  }

  // Init DB
  const db = getDb();
  initSchema(db);

  // Fetch discovered PAA questions
  const questions = getDiscoveredPAAQuestions(db, BATCH_SIZE);
  if (questions.length === 0) {
    log('PAA', 'No discovered PAA questions to process. Exiting.');
    return;
  }
  log('PAA', `Found ${questions.length} PAA questions to process`);

  // Get existing FAQ slugs for dedup
  const existingSlugs = getExistingFaqSlugs();
  log('DEDUP', `Existing FAQ slugs: ${existingSlugs.size}`);

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const q of questions) {
    const slug = questionToSlug(q.question);

    // Dedup against existing FAQ files
    if (existingSlugs.has(slug)) {
      log('DEDUP', `Skipping duplicate: "${q.question}" (slug: ${slug})`);
      db.prepare(`UPDATE paa_questions SET status = 'duplicate' WHERE id = ?`).run(q.id);
      skipped++;
      continue;
    }

    log('GENERATE', `FAQ #${q.id}: "${q.question}"`);

    if (DRY_RUN) {
      log('DRY-RUN', `Would generate: ${slug}-en.md + ${slug}-zh.md`);
      skipped++;
      continue;
    }

    try {
      const { enPath, zhPath } = await generateFaqFromPAA(
        q.question,
        q.question_zh,
        q.source_keyword,
        slug,
      );

      // Mark as published in DB
      db.prepare(`UPDATE paa_questions SET status = 'published' WHERE id = ?`).run(q.id);
      existingSlugs.add(slug); // prevent within-batch duplicates

      log('GENERATE', `  ✅ ${path.basename(enPath)} + ${path.basename(zhPath)}`);
      generated++;
    } catch (e) {
      const errMsg = (e as Error).message;
      log('GENERATE', `  ❌ Error: ${errMsg}`);
      db.prepare(`UPDATE paa_questions SET status = 'error' WHERE id = ?`).run(q.id);
      errors++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  ✅ PAA → FAQ Complete`);
  console.log(`  Generated: ${generated} FAQ pages (${generated * 2} files)`);
  console.log(`  Skipped: ${skipped} | Errors: ${errors}`);
  console.log('═══════════════════════════════════════════════════');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
