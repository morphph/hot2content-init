#!/usr/bin/env npx tsx
/**
 * Convert FAQ sample output into publishable content/faq/ markdown files
 * Reads from output/faq-sample-flash.md and output/faq-questions.json
 */

import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = process.cwd();
const FAQ_DIR = path.join(PROJECT_ROOT, 'content', 'faq');

interface Question {
  question_en: string;
  question_zh: string;
  intent: string;
  source: string;
}

function detectChineseRatio(text: string): number {
  const chinese = text.match(/[\u4e00-\u9fff]/g) || [];
  const total = text.replace(/\s/g, '').length;
  return total > 0 ? chinese.length / total : 0;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function main() {
  // Read the Flash sample
  const samplePath = path.join(PROJECT_ROOT, 'output', 'faq-sample-flash.md');
  if (!fs.existsSync(samplePath)) {
    console.error('❌ Run extract-faq.ts first');
    process.exit(1);
  }

  const sample = fs.readFileSync(samplePath, 'utf-8');
  const questionsPath = path.join(PROJECT_ROOT, 'output', 'faq-questions.json');
  const questions: Question[] = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

  // Extract topic from the sample
  const topicMatch = sample.match(/## Topic: (.+)/);
  const topic = topicMatch ? topicMatch[1].trim() : 'AI FAQ';
  const slug = slugify(topic);
  const date = new Date().toISOString().split('T')[0];

  // Parse Q&A blocks from sample
  const blocks = sample.split(/(?=### Q\d+)/).filter(b => b.startsWith('### Q'));

  // Generate EN FAQ
  const enQuestions: string[] = [];
  const zhQuestions: string[] = [];

  for (const block of blocks) {
    const qMatch = block.match(/### Q\d+: (.+)/);
    if (!qMatch) continue;

    const questionTitle = qMatch[1].trim();

    // Extract English answer
    const enMatch = block.match(/\*\*English:\*\*\n([\s\S]*?)(?=\*\*中文:\*\*|\n---)/);
    const enAnswer = enMatch ? enMatch[1].trim() : '';

    // Extract Chinese answer  
    const zhMatch = block.match(/\*\*中文:\*\*\n([\s\S]*?)(?=\n---|\n### Q|$)/);
    const zhAnswer = zhMatch ? zhMatch[1].trim() : '';

    // Find matching Chinese question
    const matchQ = questions.find(q => 
      questionTitle.toLowerCase().includes(q.question_en.toLowerCase().slice(0, 20)) ||
      q.question_en.toLowerCase().includes(questionTitle.toLowerCase().slice(0, 20))
    );
    const zhQuestion = matchQ?.question_zh || questionTitle;

    if (enAnswer) enQuestions.push(`### ${questionTitle}\n\n${enAnswer}`);
    if (zhAnswer) zhQuestions.push(`### ${zhQuestion}\n\n${zhAnswer}`);
  }

  fs.mkdirSync(FAQ_DIR, { recursive: true });

  // Write EN FAQ
  const enContent = `---
title: "${topic} — FAQ"
description: "Frequently asked questions about ${topic}"
date: ${date}
lang: en
---

${enQuestions.join('\n\n---\n\n')}
`;

  const enPath = path.join(FAQ_DIR, `${slug}-en.md`);
  const enRatio = detectChineseRatio(enQuestions.join('\n'));
  if (enRatio > 0.3) {
    console.error(`⚠️  EN FAQ has ${(enRatio * 100).toFixed(0)}% Chinese content — likely language error. Skipping.`);
  } else {
    fs.writeFileSync(enPath, enContent);
    console.log(`✅ EN FAQ: content/faq/${slug}-en.md (${enQuestions.length} questions)`);
  }

  // Write ZH FAQ
  const zhContent = `---
title: "${topic} — 常见问题"
description: "关于 ${topic} 的常见问题解答"
date: ${date}
lang: zh
---

${zhQuestions.join('\n\n---\n\n')}
`;

  const zhPath = path.join(FAQ_DIR, `${slug}-zh.md`);
  const zhRatio = detectChineseRatio(zhQuestions.join('\n'));
  if (zhRatio < 0.2) {
    console.error(`⚠️  ZH FAQ has only ${(zhRatio * 100).toFixed(0)}% Chinese content — likely language error. Skipping.`);
  } else {
    fs.writeFileSync(zhPath, zhContent);
    console.log(`✅ ZH FAQ: content/faq/${slug}-zh.md (${zhQuestions.length} questions)`);
  }
}

main();
