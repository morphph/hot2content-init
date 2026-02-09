#!/usr/bin/env npx tsx
/**
 * Extract glossary terms from research reports and generate bilingual glossary entries
 * Uses Gemini Flash for content generation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not set');
  process.exit(1);
}

const PROJECT_ROOT = process.cwd();
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'output');
const GLOSSARY_DIR = path.join(PROJECT_ROOT, 'content', 'glossary');

// Ensure glossary directory exists
if (!fs.existsSync(GLOSSARY_DIR)) fs.mkdirSync(GLOSSARY_DIR, { recursive: true });

interface GlossaryTerm {
  term: string;
  slug: string;
  category: string;
  definition: string;
  related: string[];
}

// ─── Gemini API ───
async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 8000 },
      }),
    }
  );
  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json() as any;
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── Step 1: Extract terms from research report ───
async function extractTerms(): Promise<GlossaryTerm[]> {
  const reportPath = path.join(OUTPUT_DIR, 'research-report.md');
  if (!fs.existsSync(reportPath)) {
    console.error('❌ No research report found at output/research-report.md');
    process.exit(1);
  }
  const report = fs.readFileSync(reportPath, 'utf-8').slice(0, 6000);

  const prompt = `Analyze this research report and extract 5-10 technical AI terms/concepts that would make good glossary entries for an AI news site.

Research report:
${report}

For each term, provide:
- term: The display name
- slug: URL-friendly lowercase with hyphens
- category: One of (LLM Fundamentals, AI Architecture, Benchmarks, Developer Tools, AI Safety, AI Reasoning)
- definition: One clear sentence definition
- related: 2-3 related term slugs from the list

Output ONLY a JSON array:
[{"term": "...", "slug": "...", "category": "...", "definition": "...", "related": ["...", "..."]}]`;

  console.log('🔍 Extracting terms from research report...');
  const result = await callGemini(prompt);
  const jsonMatch = result.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Failed to parse Gemini response');
  return JSON.parse(jsonMatch[0]);
}

// ─── Step 2: Generate glossary entry content ───
async function generateEntry(term: GlossaryTerm, lang: string, report: string): Promise<string> {
  const prompt = lang === 'en'
    ? `Write a glossary entry for the AI term "${term.term}" for loreai.dev.

Context from research: ${report.slice(0, 3000)}

Format (300-500 words total):
## What is ${term.term}?
[2-3 paragraphs explaining the concept clearly]

## How It Works
[Technical explanation with bullet points]

## Why It Matters
[Practical significance, benchmarks, real-world impact]

## Related Terms
[Brief mention of related concepts: ${term.related.join(', ')}]

Rules:
- Be specific with numbers and benchmarks from the research
- Write for a technical but accessible audience
- Bold key terms and numbers
- No fluff or filler sentences`
    : `为 loreai.dev 撰写 AI 术语"${term.term}"的词条。

调研资料：${report.slice(0, 3000)}

格式（300-500 字）：
## 什么是 ${term.term}？
[2-3 段清晰解释概念]

## 工作原理
[技术解释，使用要点列表]

## 为什么重要
[实际意义、基准测试、现实影响]

## 相关术语
[简要提及相关概念：${term.related.join(', ')}]

规则：
- 使用调研中的具体数字和基准
- 面向技术但可读的受众
- 关键术语和数字用 **加粗**
- 不要废话或填充句
- 中文要有独立视角，不是英文翻译`;

  return await callGemini(prompt);
}

function buildFrontmatter(term: GlossaryTerm, lang: string): string {
  const termName = lang === 'zh' ? `${term.term}` : term.term;
  return `---
term: "${termName}"
slug: ${term.slug}
lang: ${lang}
category: ${term.category}
definition: "${term.definition}"
related: [${term.related.join(', ')}]
date: ${new Date().toISOString().split('T')[0]}
source_topic: research-report
---`;
}

// ─── Main ───
async function main() {
  console.log('🚀 Glossary Extraction\n');

  const reportPath = path.join(OUTPUT_DIR, 'research-report.md');
  const report = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, 'utf-8') : '';

  // Extract terms
  const terms = await extractTerms();
  console.log(`📋 Found ${terms.length} terms\n`);

  // Check which already exist
  const existing = fs.readdirSync(GLOSSARY_DIR).map(f => f.replace(/-(?:en|zh)\.md$/, ''));

  for (const term of terms) {
    if (existing.includes(term.slug)) {
      console.log(`⏭️  Skipping ${term.term} (already exists)`);
      continue;
    }

    for (const lang of ['en', 'zh']) {
      console.log(`📝 Generating ${term.term} (${lang})...`);
      try {
        const content = await generateEntry(term, lang, report);
        const frontmatter = buildFrontmatter(term, lang);
        const fullContent = `${frontmatter}\n\n${content.trim()}\n`;
        const filename = `${term.slug}-${lang}.md`;
        fs.writeFileSync(path.join(GLOSSARY_DIR, filename), fullContent, 'utf-8');
        console.log(`  ✅ Written ${filename}`);
        await new Promise(r => setTimeout(r, 1000)); // Rate limit
      } catch (e: any) {
        console.error(`  ⚠️  Failed: ${e.message}`);
      }
    }
  }

  console.log('\n✅ Glossary extraction complete!');
  console.log(`📁 Entries in ${GLOSSARY_DIR}`);
}

main().catch((e) => {
  console.error('❌ Fatal error:', e);
  process.exit(1);
});
