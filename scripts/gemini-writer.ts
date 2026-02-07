#!/usr/bin/env tsx
import 'dotenv/config';

/**
 * Gemini 2.5 Pro Chinese Blog Writer
 *
 * Reads Core Narrative and Research Report, generates native Chinese blog.
 * Alternative to kimi-writer.ts when Kimi API is unavailable.
 */

import * as fs from 'fs';
import * as path from 'path';

interface CoreNarrative {
  topic_id: string;
  title: string;
  one_liner: string;
  key_points: string[];
  story_spine: {
    background: string;
    breakthrough: string;
    mechanism: string;
    significance: string;
    risks: string;
  };
  faq: Array<{ question: string; answer: string }>;
  references: Array<{ title: string; url: string; source: string; date: string }>;
  seo: {
    slug: string;
    meta_title_en: string;
    meta_description_en: string;
    keywords_en: string[];
    keywords_zh: string[];
  };
  china_angle: string | null;
}

async function main() {
  console.log('✍️  Gemini 2.5 Pro 中文博客生成器\n');
  console.log('='.repeat(60) + '\n');

  // Check API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: GEMINI_API_KEY not found in environment');
    process.exit(1);
  }

  // Read core narrative
  const narrativePath = path.join(process.cwd(), 'output', 'core-narrative.json');
  if (!fs.existsSync(narrativePath)) {
    console.error('❌ Error: core-narrative.json not found');
    process.exit(1);
  }
  const narrative: CoreNarrative = JSON.parse(fs.readFileSync(narrativePath, 'utf-8'));

  // Read research report
  const reportPath = path.join(process.cwd(), 'output', 'research-report.md');
  const researchReport = fs.existsSync(reportPath) 
    ? fs.readFileSync(reportPath, 'utf-8') 
    : '';

  console.log(`📝 Topic: ${narrative.title}`);
  console.log(`📄 Research Report: ${(researchReport.length / 1024).toFixed(2)} KB`);

  // Build prompt
  const prompt = `你是一位资深的中文科技博客作者。请基于以下英文叙事框架和调研报告，创作一篇高质量的中文博客。

## 重要原则
- 你不是在翻译！你基于同一个话题独立创作中文内容
- 用中文读者熟悉的比喻和类比
- 如果有中国市场角度，务必融入文章
- 专业术语首次出现标注英文：大语言模型（LLM）
- 语气像懂技术的朋友在科普，不是论文也不是新闻稿

## 文章结构
---
slug: ${narrative.seo?.slug || narrative.topic_id}
title: [中文标题，25-30字]
description: [中文摘要，70-80字]
keywords: ${JSON.stringify(narrative.seo?.keywords_zh || [])}
date: ${new Date().toISOString().split('T')[0]}
lang: zh
---

# [中文H1标题]

**一句话总结：** [核心信息，可被AI搜索引擎引用]

## 背景：为什么现在要关注这件事
## 核心事件：到底发生了什么
## 技术解读：怎么做到的
## 影响分析：对我们意味着什么
## 风险与局限
## 常见问题（至少3个FAQ）
## 参考来源

## 字数要求：2000-3000字

---
## Core Narrative（英文叙事框架）

**Title:** ${narrative.title}
**One-liner:** ${narrative.one_liner}

**Key Points:**
${narrative.key_points.map((p, i) => `${i + 1}. ${p}`).join('\n')}

**Story Spine:**
- Background: ${narrative.story_spine.background}
- Breakthrough: ${narrative.story_spine.breakthrough}
- Mechanism: ${narrative.story_spine.mechanism}
- Significance: ${narrative.story_spine.significance}
- Risks: ${narrative.story_spine.risks}

**China Angle:** ${narrative.china_angle || '无特定中国视角'}

---
## Research Report（调研报告摘要，前5000字）

${researchReport.substring(0, 5000)}

---

请创作中文博客，直接输出Markdown格式。`;

  console.log('\n📡 Calling Gemini 2.5 Pro API...');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No content in API response');
    }

    // Save output
    const outputPath = path.join(process.cwd(), 'output', 'blog-zh.md');
    fs.writeFileSync(outputPath, content, 'utf-8');

    console.log(`\n✅ Chinese blog saved to: ${outputPath}`);
    console.log(`📊 Size: ${(content.length / 1024).toFixed(2)} KB`);
    console.log(`📊 Characters: ${content.length}`);

  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();
