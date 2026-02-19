#!/usr/bin/env npx tsx
/**
 * Extract structured comparison data from research reports
 * Uses Gemini Flash to generate comparison markdown files
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { callGemini, GEMINI_API_KEY } from '../src/lib/gemini.js';

dotenv.config();

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not set');
  process.exit(1);
}

const PROJECT_ROOT = process.cwd();
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'output');
const COMPARE_DIR = path.join(PROJECT_ROOT, 'content', 'compare');

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function detectChineseRatio(text: string): number {
  const chinese = text.match(/[\u4e00-\u9fff]/g) || [];
  const total = text.replace(/\s/g, '').length;
  return total > 0 ? chinese.length / total : 0;
}

interface ComparisonPair {
  model_a: string;
  model_b: string;
  slug: string;
}

function extractComparisonPairs(research: string): ComparisonPair[] {
  // Extract model names from research report
  const pairs: ComparisonPair[] = [];

  // Look for "X vs Y" patterns
  const vsMatches = research.match(/([A-Z][\w\s.-]+?\d[\w.]*)\s+vs\.?\s+([A-Z][\w\s.-]+?\d[\w.]*)/gi) || [];
  const seen = new Set<string>();

  for (const match of vsMatches) {
    const parts = match.split(/\s+vs\.?\s+/i);
    if (parts.length === 2) {
      const a = parts[0].trim();
      const b = parts[1].trim();
      const key = `${a}|${b}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        pairs.push({
          model_a: a,
          model_b: b,
          slug: `${slugify(a)}-vs-${slugify(b)}`,
        });
      }
    }
  }

  // No default pair — return empty if none detected
  if (pairs.length === 0) {
    console.log('No comparison pairs detected in research report');
    return [];
  }

  return pairs.slice(0, 3); // Max 3 pairs
}

async function generateComparison(pair: ComparisonPair, research: string, lang: 'en' | 'zh'): Promise<string> {
  const date = new Date().toISOString().split('T')[0];

  if (lang === 'en') {
    const prompt = `You are a technical analyst for loreai.dev. Create a structured comparison based on the research data.

Research: ${research.slice(0, 6000)}

Output a comparison in this exact markdown format:

---
title: "${pair.model_a} vs ${pair.model_b}: Complete Comparison 2026"
description: "Side-by-side comparison of ${pair.model_a} and ${pair.model_b} — benchmarks, pricing, features"
model_a: "${pair.model_a}"
model_b: "${pair.model_b}"
date: ${date}
lang: en
category: AI Model Comparison
---

## Quick Verdict
2-3 sentences: who should pick what.

## Benchmark Comparison
| Benchmark | ${pair.model_a} | ${pair.model_b} | Winner |
|-----------|-----------|-----------|--------|
(fill from research data, use real numbers)

## Feature Comparison
| Feature | ${pair.model_a} | ${pair.model_b} |
|---------|-----------|-----------|
(context window, max output, pricing, special features)

## Pricing
| | ${pair.model_a} | ${pair.model_b} |
(input/output token prices, cost-saving tips)

## Best For
### Choose ${pair.model_a} when:
- ...
### Choose ${pair.model_b} when:
- ...

## Bottom Line
2-3 sentences wrap-up with LoreAI mention.

Rules:
- Use ONLY real data from the research. Do not fabricate numbers.
- Output ONLY in English. Do not use any Chinese characters.
- Bold key stats with **
- Keep tables properly formatted with | alignment`;

    return await callGemini(prompt);
  }

  // ZH prompt
  const prompt = `你是 loreai.dev 的技术分析师。基于以下调研数据创建结构化对比文章。

调研数据：${research.slice(0, 6000)}

请按照以下 Markdown 格式输出：

---
title: "${pair.model_a} vs ${pair.model_b}：2026 全面对比"
description: "${pair.model_a} 与 ${pair.model_b} 的全方位对比 — 基准测试、定价、功能"
model_a: "${pair.model_a}"
model_b: "${pair.model_b}"
date: ${date}
lang: zh
category: AI 模型对比
---

## 快速结论
2-3 句话：谁适合什么场景。

## 基准测试对比
| 基准测试 | ${pair.model_a} | ${pair.model_b} | 胜出 |
|----------|-----------|-----------|------|
（用调研中的真实数据填写）

## 功能对比
| 功能 | ${pair.model_a} | ${pair.model_b} |
|------|-----------|-----------|
（上下文窗口、最大输出、定价、特殊功能）

## 定价
| | ${pair.model_a} | ${pair.model_b} |
（输入/输出 token 价格、省钱技巧）

## 最佳使用场景
### 选择 ${pair.model_a} 的情况：
- ...
### 选择 ${pair.model_b} 的情况：
- ...

## 总结
2-3 句话总结，自然提及 LoreAI。

规则：
- 只使用调研中的真实数据，不要编造数字
- 必须用中文输出，不要出现英文段落
- 关键数据用 **加粗**
- 表格格式要正确
- 中文要有独立视角，不是英文翻译`;

  return await callGemini(prompt);
}

async function main() {
  console.log('🔄 Compare Content Extraction\n');

  const reportPath = path.join(OUTPUT_DIR, 'research-report.md');
  if (!fs.existsSync(reportPath)) {
    console.error('❌ No research report found at output/research-report.md');
    process.exit(1);
  }
  const research = fs.readFileSync(reportPath, 'utf-8');

  const pairs = extractComparisonPairs(research);
  console.log(`📊 Found ${pairs.length} comparison pair(s):`);
  pairs.forEach(p => console.log(`   ${p.model_a} vs ${p.model_b}`));

  fs.mkdirSync(COMPARE_DIR, { recursive: true });

  for (const pair of pairs) {
    for (const lang of ['en', 'zh'] as const) {
      console.log(`\n📝 Generating ${lang.toUpperCase()} comparison: ${pair.model_a} vs ${pair.model_b}...`);
      const content = await generateComparison(pair, research, lang);

      // Language validation
      const chineseRatio = detectChineseRatio(content);
      if (lang === 'en' && chineseRatio > 0.3) {
        console.error(`⚠️  EN compare has ${(chineseRatio * 100).toFixed(0)}% Chinese — skipping.`);
        continue;
      }
      if (lang === 'zh' && chineseRatio < 0.2) {
        console.error(`⚠️  ZH compare has only ${(chineseRatio * 100).toFixed(0)}% Chinese — skipping.`);
        continue;
      }

      // Ensure frontmatter exists
      let finalContent = content;
      if (!content.trimStart().startsWith('---')) {
        const date = new Date().toISOString().split('T')[0];
        const title = lang === 'en'
          ? `${pair.model_a} vs ${pair.model_b}: Complete Comparison 2026`
          : `${pair.model_a} vs ${pair.model_b}：2026 全面对比`;
        finalContent = `---
title: "${title}"
description: "${lang === 'en' ? `Side-by-side comparison of ${pair.model_a} and ${pair.model_b}` : `${pair.model_a} 与 ${pair.model_b} 的全方位对比`}"
model_a: "${pair.model_a}"
model_b: "${pair.model_b}"
date: ${date}
lang: ${lang}
category: "${lang === 'en' ? 'AI Model Comparison' : 'AI 模型对比'}"
---

${content}`;
      }

      const filePath = path.join(COMPARE_DIR, `${pair.slug}-${lang}.md`);
      fs.writeFileSync(filePath, finalContent);
      console.log(`✅ Saved: content/compare/${pair.slug}-${lang}.md`);

      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log('\n✅ Compare extraction complete!');
}

main().catch(e => {
  console.error('❌ Fatal:', e);
  process.exit(1);
});
