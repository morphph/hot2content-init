#!/usr/bin/env tsx
/**
 * Hot2Content Trend Scout
 *
 * Reads recent news items from the SQLite database (news_items table)
 * and scores/ranks them for content pipeline input.
 *
 * Data source: loreai.db news_items (last 72h)
 * Output: scored and ranked trending topics
 */

import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';
import { getDb, initSchema, closeDb } from '../src/lib/db.js';

interface Topic {
  title: string;
  source: string;
  url?: string;
  score: number;
  category: 'model' | 'product' | 'research' | 'dev' | 'technique';
  detected_at: string;
}

interface TrendScoutConfig {
  minScore: number;
  maxTopics: number;
  sources: {
    twitter: boolean;
    huggingface: boolean;
    officialBlogs: boolean;
  };
}

const DEFAULT_CONFIG: TrendScoutConfig = {
  minScore: 60,
  maxTopics: 10,
  sources: {
    twitter: true,
    huggingface: true,
    officialBlogs: true
  }
};

/**
 * Scoring algorithm
 *
 * Base score:
 * - Official source: 80
 * - Twitter Tier 1: 70
 * - Twitter Tier 2: 60
 * - HuggingFace Trending: 65
 *
 * Bonuses:
 * - Within 24h: +15
 * - Cross-source verification: +10
 * - High engagement: +5-15
 */
function calculateScore(topic: Partial<Topic>, signals: {
  isOfficial: boolean;
  hoursAgo: number;
  crossSourceCount: number;
  engagement?: number;
}): number {
  let score = 50; // base score

  // Source bonus
  if (signals.isOfficial) score += 30;

  // Recency bonus
  if (signals.hoursAgo < 24) score += 15;
  else if (signals.hoursAgo < 48) score += 10;
  else if (signals.hoursAgo < 72) score += 5;

  // Cross-source bonus
  if (signals.crossSourceCount >= 3) score += 10;
  else if (signals.crossSourceCount >= 2) score += 5;

  // Engagement bonus
  if (signals.engagement) {
    if (signals.engagement > 1000) score += 15;
    else if (signals.engagement > 500) score += 10;
    else if (signals.engagement > 100) score += 5;
  }

  return Math.min(score, 100);
}

/**
 * Read recent news items from the SQLite database
 */
function readFromDatabase(): Topic[] {
  const topics: Topic[] = [];

  try {
    const db = getDb();
    initSchema(db);

    // Query news_items from last 72 hours
    const rows = db.prepare(
      `SELECT id, title, url, source, source_tier, category, score, raw_summary, detected_at
       FROM news_items
       WHERE detected_at > datetime('now', '-72 hours')
       ORDER BY score DESC, detected_at DESC
       LIMIT 200`
    ).all() as Array<{
      id: string;
      title: string;
      url: string;
      source: string;
      source_tier: number;
      category: string;
      score: number;
      raw_summary: string;
      detected_at: string;
    }>;

    console.log(`   Found ${rows.length} items from database (last 72h)`);

    for (const row of rows) {
      const detectedAt = new Date(row.detected_at);
      const hoursAgo = isNaN(detectedAt.getTime())
        ? 48
        : (Date.now() - detectedAt.getTime()) / (1000 * 60 * 60);

      // Map DB category to Topic category
      let topicCategory: Topic['category'] = 'research';
      if (row.category === 'model_release') topicCategory = 'model';
      else if (row.category === 'developer_platform') topicCategory = 'dev';
      else if (row.category === 'product_ecosystem') topicCategory = 'product';
      else if (row.category === 'official_blog') topicCategory = 'research';

      const isOfficial = row.source_tier === 1;

      const calculatedScore = calculateScore(
        { title: row.title, source: row.source, category: topicCategory },
        {
          isOfficial,
          hoursAgo,
          crossSourceCount: 1, // DB items are already deduped, default to 1
          engagement: row.score, // Use the stored score as a proxy for engagement
        }
      );

      topics.push({
        title: row.title,
        source: row.source,
        url: row.url,
        score: calculatedScore,
        category: topicCategory,
        detected_at: row.detected_at,
      });
    }

    closeDb();
  } catch (e) {
    console.log(`   Warning: Could not read from database: ${(e as Error).message}`);
  }

  return topics;
}

/**
 * Dedup + merge same topic
 */
function deduplicateTopics(topics: Topic[]): Topic[] {
  const seen = new Map<string, Topic>();

  for (const topic of topics) {
    const key = topic.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);

    if (seen.has(key)) {
      // Merge: keep higher score
      const existing = seen.get(key)!;
      if (topic.score > existing.score) {
        seen.set(key, { ...topic, score: Math.min(topic.score + 10, 100) }); // cross-verification bonus
      }
    } else {
      seen.set(key, topic);
    }
  }

  return Array.from(seen.values());
}

/**
 * Main function
 */
async function main() {
  console.log('\n');
  console.log('='.repeat(60));
  console.log('  Hot2Content Trend Scout');
  console.log('  Database-driven topic detection');
  console.log('='.repeat(60));
  console.log('\n');

  const config = DEFAULT_CONFIG;
  let allTopics: Topic[] = [];

  // 1. Read from SQLite database
  console.log('Reading news items from database...');
  const dbTopics = readFromDatabase();
  console.log(`   Found ${dbTopics.length} topics from database`);
  allTopics.push(...dbTopics);

  // 2. Dedup + sort
  console.log('\nDeduplicating and scoring...');
  const uniqueTopics = deduplicateTopics(allTopics);
  const sortedTopics = uniqueTopics
    .sort((a, b) => b.score - a.score)
    .filter(t => t.score >= config.minScore)
    .slice(0, config.maxTopics);

  // 3. Output results
  console.log('\nTop Topics:\n');
  sortedTopics.forEach((topic, i) => {
    console.log(`${i + 1}. [${topic.score}] ${topic.title}`);
    console.log(`   Source: ${topic.source} | Category: ${topic.category}`);
    if (topic.url) console.log(`   URL: ${topic.url}`);
    console.log('');
  });

  // 4. Save to file
  const outputPath = path.join(process.cwd(), 'content', 'trending-topics.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify({
    generated_at: new Date().toISOString(),
    topics: sortedTopics
  }, null, 2));

  console.log(`\nSaved to ${outputPath}`);
  console.log(`   Total: ${sortedTopics.length} topics above score ${config.minScore}`);

  // 5. Return top topic for pipeline
  if (sortedTopics.length > 0) {
    console.log(`\nTop pick: "${sortedTopics[0].title}" (score: ${sortedTopics[0].score})`);
    return sortedTopics[0];
  }

  return null;
}

main().catch(console.error);

export { Topic, TrendScoutConfig, calculateScore };
