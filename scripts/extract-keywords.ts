#!/usr/bin/env npx tsx
/**
 * Extract long-tail keywords from research report using Claude Sonnet CLI
 * Inserts into keywords table with status='backlog'
 */

import * as fs from 'fs';
import * as path from 'path';
import { getDb, initSchema, closeDb } from '../src/lib/db.js';
import { callSonnet } from '../src/lib/claude-cli.js';

async function extractKeywords() {
  const PROJECT_ROOT = process.cwd();
  const reportPath = path.join(PROJECT_ROOT, 'output', 'research-report.md');

  if (!fs.existsSync(reportPath)) {
    console.error('❌ No research report found at output/research-report.md');
    process.exit(1);
  }

  const report = fs.readFileSync(reportPath, 'utf-8');
  // Extract title from first heading
  const titleMatch = report.match(/^#\s+(.+)$/m);
  const topic = titleMatch ? titleMatch[1].replace(/^Research Report:\s*/i, '') : 'AI Technology';

  console.log(`📝 Extracting keywords for topic: ${topic}`);

  // Find parent research ID from DB
  const db = getDb();
  initSchema(db);

  const latestResearch = db.prepare(
    `SELECT id FROM research ORDER BY created_at DESC LIMIT 1`
  ).get() as { id: number } | undefined;

  const parentResearchId = latestResearch?.id ?? null;
  console.log(`🔗 Parent research ID: ${parentResearchId}`);

  const prompt = `You are an SEO keyword strategist for loreai.dev, a tech blog targeting AI developers, product managers, and tech leaders.

Topic: ${topic}

Research report excerpt:
${report.substring(0, 3000)}

Generate keywords in this exact JSON format (no markdown, no code blocks):
{
  "en": [
    {"keyword": "example long-tail keyword", "search_intent": "comparison"}
  ],
  "zh": [
    {"keyword": "示例长尾关键词", "search_intent": "informational"}
  ]
}

Requirements:
1. 5-10 English long-tail keywords
2. 5-10 Chinese long-tail keywords
3. Each with search_intent: "informational" | "comparison" | "tutorial"
4. Prioritize:
   - Comparison: "X vs Y"
   - Tutorial: "how to use X"
   - Question: "what is X"
   - Year-based: "best X 2026"
5. Keywords should be specific, searchable, and relevant to the topic
6. Return ONLY valid JSON`;

  let text = await callSonnet(prompt);
  // Strip markdown code blocks if present
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let keywords: { en: Array<{keyword: string; search_intent: string}>; zh: Array<{keyword: string; search_intent: string}> };
  try {
    keywords = JSON.parse(text);
  } catch (e) {
    console.error('❌ Failed to parse Sonnet CLI response:', text.substring(0, 500));
    process.exit(1);
  }

  console.log(`✅ Extracted ${keywords.en.length} EN + ${keywords.zh.length} ZH keywords`);

  // Insert into DB
  const insertStmt = db.prepare(`
    INSERT INTO keywords (keyword, language, type, search_intent, status, parent_research_id)
    VALUES (?, ?, 'longtail', ?, 'backlog', ?)
  `);

  const tx = db.transaction(() => {
    for (const kw of keywords.en) {
      insertStmt.run(kw.keyword, 'en', kw.search_intent, parentResearchId);
      console.log(`   🔑 [EN] ${kw.keyword} (${kw.search_intent})`);
    }
    for (const kw of keywords.zh) {
      insertStmt.run(kw.keyword, 'zh', kw.search_intent, parentResearchId);
      console.log(`   🔑 [ZH] ${kw.keyword} (${kw.search_intent})`);
    }
  });
  tx();

  const total = (db.prepare('SELECT COUNT(*) as c FROM keywords').get() as {c: number}).c;
  console.log(`\n✅ Keywords table now has ${total} entries`);

  closeDb();
}

extractKeywords().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
