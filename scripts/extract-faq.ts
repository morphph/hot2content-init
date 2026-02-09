#!/usr/bin/env npx tsx
/**
 * Extract FAQ questions from multiple sources and generate A/B test samples
 * Sources: Brave Search, Research Report (Gemini), Existing Blog FAQs
 * Models: Gemini Flash (A) vs Claude Sonnet (B)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not set');
  process.exit(1);
}

const PROJECT_ROOT = process.cwd();
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'output');

interface FAQQuestion {
  question_en: string;
  question_zh: string;
  intent: 'comparison' | 'informational' | 'tutorial' | 'pricing';
  source: string;
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
        generationConfig: { temperature: 0.4, maxOutputTokens: 4000 },
      }),
    }
  );
  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json() as any;
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── Claude API ───
async function callClaude(prompt: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) throw new Error('No Anthropic API key');
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
  const data = await response.json() as any;
  return data.content?.[0]?.text || '';
}

// ─── Step 1a: Brave Search PAA ───
async function extractFromBraveSearch(keywords: string[]): Promise<FAQQuestion[]> {
  if (!BRAVE_API_KEY) {
    console.log('⏭️  No BRAVE_API_KEY, skipping Brave Search');
    return [];
  }
  const questions: FAQQuestion[] = [];
  for (const kw of keywords.slice(0, 3)) {
    try {
      const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(kw)}&count=10`, {
        headers: { 'X-Subscription-Token': BRAVE_API_KEY, Accept: 'application/json' },
      });
      if (!res.ok) continue;
      const data = await res.json() as any;
      const results = data.web?.results || [];
      for (const r of results) {
        const title: string = r.title || '';
        if (/\?|how|what|vs|which|can|does|is it/i.test(title)) {
          questions.push({
            question_en: title.replace(/ - .*$/, '').trim(),
            question_zh: '',
            intent: /vs|compar/i.test(title) ? 'comparison' : 'informational',
            source: 'brave',
          });
        }
      }
    } catch (e) {
      console.log(`⚠️  Brave search failed for "${kw}"`);
    }
  }
  return questions;
}

// ─── Step 1b: Research Report extraction ───
async function extractFromResearchReport(): Promise<FAQQuestion[]> {
  const reportPath = path.join(OUTPUT_DIR, 'research-report.md');
  if (!fs.existsSync(reportPath)) {
    console.log('⚠️  No research report found');
    return [];
  }
  const report = fs.readFileSync(reportPath, 'utf-8');
  const snippet = report.slice(0, 4000);

  const prompt = `你是 SEO 专家。分析以下调研报告，提取用户最可能在 Google/Perplexity 搜索的问题。

调研报告：
${snippet}

要求：
1. 提取 8-10 个问题
2. 每个问题必须是真实用户会搜索的自然语言
3. 覆盖这些搜索意图：
   - What is / 是什么
   - X vs Y / 哪个更好
   - How to / 怎么用
   - Pricing / 多少钱
4. 英文和中文各出一套
5. 问题要具体（不要太泛），包含产品名、版本号

只输出 JSON 数组，不要其他文字：
[{"question_en": "...", "question_zh": "...", "intent": "comparison|informational|tutorial|pricing"}]`;

  console.log('🔍 Extracting questions from research report via Gemini...');
  const result = await callGemini(prompt);
  try {
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]) as FAQQuestion[];
    return parsed.map(q => ({ ...q, source: 'research' }));
  } catch {
    console.error('⚠️  Failed to parse Gemini FAQ extraction response');
    return [];
  }
}

// ─── Step 1c: Extract from existing blogs ───
function extractFromBlogs(): FAQQuestion[] {
  const questions: FAQQuestion[] = [];
  const dirs = ['content/blogs/en', 'content/blogs/zh'];
  for (const dir of dirs) {
    const fullDir = path.join(PROJECT_ROOT, dir);
    if (!fs.existsSync(fullDir)) continue;
    const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(fullDir, file), 'utf-8');
      // Extract H3 questions from FAQ sections
      const faqSection = content.match(/## (?:FAQ|常见问题)[\s\S]*?(?=\n## |$)/i);
      if (!faqSection) continue;
      const h3s = faqSection[0].match(/### (.+)/g) || [];
      for (const h3 of h3s) {
        const q = h3.replace(/^### /, '').trim();
        if (q.length > 10) {
          const lang = dir.includes('/en') ? 'en' : 'zh';
          questions.push({
            question_en: lang === 'en' ? q : '',
            question_zh: lang === 'zh' ? q : '',
            intent: 'informational',
            source: 'blog',
          });
        }
      }
    }
  }
  return questions;
}

// ─── Step 2: Deduplicate ───
function deduplicateQuestions(all: FAQQuestion[]): FAQQuestion[] {
  const seen = new Set<string>();
  const result: FAQQuestion[] = [];
  for (const q of all) {
    const key = (q.question_en || q.question_zh).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '');
    if (key.length < 5 || seen.has(key)) continue;
    seen.add(key);
    result.push(q);
  }
  return result;
}

// ─── Step 3: Generate answers ───
function getAnswerPrompt(question: string, lang: string, research: string): string {
  if (lang === 'en') {
    return `You are a technical writer for loreai.dev. Answer the question using the research data below.

Question: ${question}
Research: ${research.slice(0, 4000)}

Rules:
- 100-300 words, direct answer
- First sentence must answer the core question (no "Great question!" or "Let me explain")
- Include specific data/numbers, bold key stats with **
- Use bullet points for key info (no wall of text)
- For comparison questions: use "Choose X when... / Choose Y when..." format
- For pricing questions: list exact prices + cost-saving tips
- End with a natural mention of LoreAI's related content
- Output ONLY in English. Do not use any Chinese characters.

Output the answer directly, no extra explanation.`;
  }

  return `你是 loreai.dev 的技术作者。用以下调研资料回答问题。

问题：${question}
调研资料：${research.slice(0, 4000)}

规则：
- 100-300 字直接回答
- 第一句话就要回答问题核心（不要"这是个好问题"、"让我来解释"）
- 包含具体数据/数字，关键数据用 **加粗**
- 用分点列表呈现关键信息（不要纯段落叙述）
- 如果是对比类问题，用"选 A 的情况 / 选 B 的情况"分场景回答
- 如果是定价类问题，列出具体价格 + 省钱技巧
- 末尾自然提到 LoreAI 的相关内容（不要生硬的"请访问 LoreAI"）
- 必须用中文回答，不要出现英文段落
- 中文要有独立视角，不是英文翻译

直接输出答案，不要额外解释。`;
}

async function generateAnswers(
  questions: FAQQuestion[],
  research: string,
  model: 'gemini' | 'claude'
): Promise<{ question: string; answer_en: string; answer_zh: string }[]> {
  const callModel = model === 'gemini' ? callGemini : callClaude;
  const results: { question: string; answer_en: string; answer_zh: string }[] = [];

  for (const q of questions) {
    const qEn = q.question_en || q.question_zh;
    const qZh = q.question_zh || q.question_en;
    console.log(`  📝 [${model}] ${qEn.slice(0, 60)}...`);

    try {
      const answerEn = await callModel(getAnswerPrompt(qEn, 'en', research));
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 1000));
      const answerZh = await callModel(getAnswerPrompt(qZh, 'zh', research));
      await new Promise(r => setTimeout(r, 1000));
      results.push({ question: qEn, answer_en: answerEn.trim(), answer_zh: answerZh.trim() });
    } catch (e: any) {
      console.error(`  ⚠️  Failed: ${e.message}`);
      results.push({ question: qEn, answer_en: `[Error: ${e.message}]`, answer_zh: `[Error: ${e.message}]` });
    }
  }
  return results;
}

// ─── Step 4: Output ───
function writeFAQSample(
  answers: { question: string; answer_en: string; answer_zh: string }[],
  modelName: string,
  topic: string,
  outputFile: string
) {
  let md = `# FAQ Sample — ${modelName}\n\n## Topic: ${topic}\n\n`;
  answers.forEach((a, i) => {
    md += `### Q${i + 1}: ${a.question}\n\n`;
    md += `**English:**\n${a.answer_en}\n\n`;
    md += `**中文:**\n${a.answer_zh}\n\n---\n\n`;
  });
  fs.writeFileSync(path.join(OUTPUT_DIR, outputFile), md, 'utf-8');
  console.log(`✅ Written ${outputFile}`);
}

// ─── Main ───
async function main() {
  console.log('🚀 FAQ Extraction + A/B Test Sample Generation\n');

  // Read research report
  const reportPath = path.join(OUTPUT_DIR, 'research-report.md');
  const research = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, 'utf-8') : '';

  // Extract topic from report title
  const topicMatch = research.match(/^# .+?: (.+)/m);
  const topic = topicMatch ? topicMatch[1].trim() : 'AI Model Comparison';

  // Extract keywords for Brave search
  const keywords = ['GPT-5.3 Codex', 'Claude Opus 4.6', 'GPT-5.3 vs Claude Opus'];

  // Step 1: Collect questions from all sources
  console.log('📋 Step 1: Collecting questions...');
  const [braveQs, researchQs, blogQs] = await Promise.all([
    extractFromBraveSearch(keywords),
    extractFromResearchReport(),
    Promise.resolve(extractFromBlogs()),
  ]);
  console.log(`  Brave: ${braveQs.length}, Research: ${researchQs.length}, Blog: ${blogQs.length}`);

  // Step 2: Deduplicate
  const allQuestions = deduplicateQuestions([...researchQs, ...braveQs, ...blogQs]);
  const selected = allQuestions.slice(0, 10);
  console.log(`\n📋 Step 2: ${selected.length} unique questions selected\n`);

  // Save questions
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'faq-questions.json'),
    JSON.stringify(selected, null, 2),
    'utf-8'
  );
  console.log('✅ Written faq-questions.json\n');

  // Step 3: Generate answers
  console.log('🤖 Step 3a: Generating answers with Gemini Flash...');
  const flashAnswers = await generateAnswers(selected, research, 'gemini');
  writeFAQSample(flashAnswers, 'Gemini Flash', topic, 'faq-sample-flash.md');

  if (ANTHROPIC_API_KEY) {
    console.log('\n🤖 Step 3b: Generating answers with Claude Sonnet...');
    const sonnetAnswers = await generateAnswers(selected, research, 'claude');
    writeFAQSample(sonnetAnswers, 'Claude Sonnet', topic, 'faq-sample-sonnet.md');
  } else {
    console.log('\n⏭️  No ANTHROPIC_API_KEY found. Skipping Claude Sonnet.');
    console.log('   Bella needs to add ANTHROPIC_API_KEY to .env for A/B testing.');
  }

  console.log('\n✅ FAQ extraction complete!');
}

main().catch((e) => {
  console.error('❌ Fatal error:', e);
  process.exit(1);
});
