#!/usr/bin/env npx tsx
/**
 * Hot2Content Daily Scout
 * 
 * 每日热点扫描 - T1 官方博客, T2 Twitter, T3 GitHub Trending, T4 Hacker News
 * 输出 10 个话题 + 评分，用于 Telegram 推送和 Newsletter 页面
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// Types
// ============================================

interface Topic {
  id: string;
  rank: number;
  title: string;
  title_zh?: string;
  summary: string;
  score: number;
  score_breakdown: {
    impact: number;
    novelty: number;
    depth: number;
    urgency: number;
  };
  sources: Array<{
    tier: number;
    name: string;
    url: string;
    type: string;
  }>;
  category: 'model' | 'product' | 'research' | 'dev' | 'tool' | 'funding';
  urgency: 'high' | 'medium' | 'low';
  detected_at: string;
}

interface DailyDigest {
  date: string;
  generated_at: string;
  topics: Topic[];
  sources_scanned: {
    tier_1_official: number;
    tier_2_twitter: number;
    tier_3_github: number;
    tier_4_hackernews: number;
  };
}

// ============================================
// Official Blogs (Tier 1)
// ============================================

const OFFICIAL_BLOGS = [
  { name: 'Anthropic', url: 'https://www.anthropic.com/news', region: 'US' },
  { name: 'OpenAI', url: 'https://openai.com/blog', region: 'US' },
  { name: 'Google AI', url: 'https://blog.google/technology/ai/', region: 'US' },
  { name: 'DeepMind', url: 'https://deepmind.google/blog/', region: 'US' },
  { name: 'Meta AI', url: 'https://ai.meta.com/blog/', region: 'US' },
  { name: 'Mistral', url: 'https://mistral.ai/news/', region: 'EU' },
  { name: 'xAI', url: 'https://x.ai/blog', region: 'US' },
  { name: 'Cohere', url: 'https://cohere.com/blog', region: 'US' },
  { name: 'HuggingFace', url: 'https://huggingface.co/blog', region: 'US' },
];

// ============================================
// Scoring
// ============================================

function calculateScore(signals: {
  isOfficial: boolean;
  hoursAgo: number;
  crossSourceCount: number;
  engagement?: number;
  hasCode?: boolean;
}): { total: number; breakdown: Topic['score_breakdown'] } {
  const breakdown = {
    impact: 0,
    novelty: 0,
    depth: 0,
    urgency: 0,
  };

  // Impact (30%) - based on source tier and engagement
  if (signals.isOfficial) breakdown.impact = 25;
  else if (signals.engagement && signals.engagement > 500) breakdown.impact = 20;
  else if (signals.engagement && signals.engagement > 100) breakdown.impact = 15;
  else breakdown.impact = 10;

  // Novelty (25%) - based on recency
  if (signals.hoursAgo < 12) breakdown.novelty = 25;
  else if (signals.hoursAgo < 24) breakdown.novelty = 20;
  else if (signals.hoursAgo < 48) breakdown.novelty = 15;
  else if (signals.hoursAgo < 72) breakdown.novelty = 10;
  else breakdown.novelty = 5;

  // Depth (25%) - based on content potential
  if (signals.hasCode) breakdown.depth = 20;
  if (signals.crossSourceCount >= 3) breakdown.depth = 25;
  else if (signals.crossSourceCount >= 2) breakdown.depth = 20;
  else breakdown.depth = Math.max(breakdown.depth, 15);

  // Urgency (20%) - based on cross-source validation
  if (signals.crossSourceCount >= 3) breakdown.urgency = 20;
  else if (signals.crossSourceCount >= 2) breakdown.urgency = 15;
  else if (signals.hoursAgo < 24) breakdown.urgency = 15;
  else breakdown.urgency = 10;

  // Bonus for official source
  const bonus = signals.isOfficial ? 5 : 0;

  const total = breakdown.impact + breakdown.novelty + breakdown.depth + breakdown.urgency + bonus;

  return { total: Math.min(total, 100), breakdown };
}

// ============================================
// Tier 1: Official Blogs Scraper
// ============================================

async function scrapeTier1(): Promise<Partial<Topic>[]> {
  console.log('📡 Tier 1: Scanning official blogs...');
  const topics: Partial<Topic>[] = [];

  for (const blog of OFFICIAL_BLOGS) {
    try {
      console.log(`   - ${blog.name}...`);
      const response = await fetch(blog.url, {
        headers: { 'User-Agent': 'Hot2Content/1.0' }
      });
      
      if (!response.ok) {
        console.log(`     ⚠️ ${response.status}`);
        continue;
      }

      const html = await response.text();
      
      // Simple extraction - look for article titles in common patterns
      const titleMatches = html.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi) || [];
      const linkMatches = html.match(/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi) || [];

      // Extract recent articles (simplified)
      for (const match of titleMatches.slice(0, 3)) {
        const title = match.replace(/<[^>]+>/g, '').trim();
        if (title.length > 20 && title.length < 200) {
          const { total, breakdown } = calculateScore({
            isOfficial: true,
            hoursAgo: 24, // Assume recent
            crossSourceCount: 1,
          });

          topics.push({
            title,
            summary: `Official announcement from ${blog.name}`,
            score: total,
            score_breakdown: breakdown,
            sources: [{
              tier: 1,
              name: blog.name,
              url: blog.url,
              type: 'official_blog'
            }],
            category: 'model',
            urgency: 'high',
            detected_at: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.log(`     ❌ Error: ${error}`);
    }
  }

  console.log(`   ✅ Found ${topics.length} items from official blogs`);
  return topics;
}

// ============================================
// Tier 3: GitHub Trending Scraper
// ============================================

async function scrapeTier3(): Promise<Partial<Topic>[]> {
  console.log('📡 Tier 3: Scanning GitHub Trending...');
  const topics: Partial<Topic>[] = [];

  try {
    const response = await fetch('https://github.com/trending?since=daily', {
      headers: { 'User-Agent': 'Hot2Content/1.0' }
    });

    if (!response.ok) {
      console.log(`   ⚠️ GitHub returned ${response.status}`);
      return topics;
    }

    const html = await response.text();
    
    // Extract repo names and descriptions
    const repoMatches = html.match(/href="\/([^"]+)"[^>]*class="[^"]*text-bold[^"]*"/gi) || [];
    const descMatches = html.match(/<p class="col-[^"]*text-gray[^"]*">([^<]+)<\/p>/gi) || [];

    for (let i = 0; i < Math.min(repoMatches.length, 10); i++) {
      const repoPath = repoMatches[i]?.match(/href="\/([^"]+)"/)?.[1];
      const desc = descMatches[i]?.replace(/<[^>]+>/g, '').trim() || '';

      if (repoPath && (
        desc.toLowerCase().includes('ai') ||
        desc.toLowerCase().includes('llm') ||
        desc.toLowerCase().includes('machine learning') ||
        desc.toLowerCase().includes('gpt') ||
        desc.toLowerCase().includes('claude') ||
        desc.toLowerCase().includes('model')
      )) {
        const { total, breakdown } = calculateScore({
          isOfficial: false,
          hoursAgo: 12,
          crossSourceCount: 1,
          hasCode: true,
        });

        topics.push({
          title: `${repoPath}: ${desc.slice(0, 100)}`,
          summary: desc,
          score: total,
          score_breakdown: breakdown,
          sources: [{
            tier: 3,
            name: 'GitHub Trending',
            url: `https://github.com/${repoPath}`,
            type: 'github_trending'
          }],
          category: 'tool',
          urgency: 'medium',
          detected_at: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }

  console.log(`   ✅ Found ${topics.length} AI/ML repos trending`);
  return topics;
}

// ============================================
// Tier 4: Hacker News Scraper
// ============================================

async function scrapeTier4(): Promise<Partial<Topic>[]> {
  console.log('📡 Tier 4: Scanning Hacker News...');
  const topics: Partial<Topic>[] = [];

  try {
    // Use HN API for top stories
    const topStoriesResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const topStoryIds: number[] = await topStoriesResponse.json();

    // Get top 30 stories
    for (const id of topStoryIds.slice(0, 30)) {
      try {
        const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        const story = await storyResponse.json();

        if (!story || !story.title) continue;

        const title = story.title.toLowerCase();
        const isAI = title.includes('ai') || title.includes('llm') || 
                     title.includes('gpt') || title.includes('claude') ||
                     title.includes('anthropic') || title.includes('openai') ||
                     title.includes('machine learning') || title.includes('neural') ||
                     title.includes('transformer') || title.includes('model');

        if (isAI && story.score > 50) {
          const { total, breakdown } = calculateScore({
            isOfficial: false,
            hoursAgo: (Date.now() / 1000 - story.time) / 3600,
            crossSourceCount: 1,
            engagement: story.score,
          });

          topics.push({
            title: story.title,
            summary: `HN discussion with ${story.descendants || 0} comments`,
            score: total,
            score_breakdown: breakdown,
            sources: [{
              tier: 4,
              name: 'Hacker News',
              url: story.url || `https://news.ycombinator.com/item?id=${id}`,
              type: 'hackernews'
            }],
            category: 'research',
            urgency: story.score > 200 ? 'high' : 'medium',
            detected_at: new Date().toISOString(),
          });
        }
      } catch (e) {
        // Skip individual story errors
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }

  console.log(`   ✅ Found ${topics.length} AI-related HN stories`);
  return topics;
}

// ============================================
// Deduplication & Merging
// ============================================

function deduplicateAndMerge(allTopics: Partial<Topic>[]): Topic[] {
  const merged = new Map<string, Topic>();

  for (const topic of allTopics) {
    if (!topic.title) continue;

    // Create a simple key for matching
    const key = topic.title.toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '')
      .slice(0, 50);

    if (merged.has(key)) {
      // Merge: combine sources, boost score
      const existing = merged.get(key)!;
      existing.sources.push(...(topic.sources || []));
      
      // Recalculate with cross-source bonus
      const { total, breakdown } = calculateScore({
        isOfficial: existing.sources.some(s => s.tier === 1),
        hoursAgo: 24,
        crossSourceCount: existing.sources.length,
        engagement: 100,
      });
      existing.score = total;
      existing.score_breakdown = breakdown;
    } else {
      merged.set(key, {
        id: `topic-${Date.now()}-${merged.size}`,
        rank: 0,
        title: topic.title,
        summary: topic.summary || '',
        score: topic.score || 50,
        score_breakdown: topic.score_breakdown || { impact: 0, novelty: 0, depth: 0, urgency: 0 },
        sources: topic.sources || [],
        category: topic.category || 'model',
        urgency: topic.urgency || 'medium',
        detected_at: topic.detected_at || new Date().toISOString(),
      });
    }
  }

  // Sort by score and assign ranks
  const sorted = Array.from(merged.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  sorted.forEach((topic, i) => {
    topic.rank = i + 1;
  });

  return sorted;
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  🔥 Hot2Content Daily Scout');
  console.log('  AI/Tech热点每日扫描');
  console.log('═'.repeat(60));
  console.log('\n');

  const allTopics: Partial<Topic>[] = [];

  // Scan all tiers
  const tier1Topics = await scrapeTier1();
  allTopics.push(...tier1Topics);

  // Note: Tier 2 (Twitter) requires API key - skip for now if not available
  console.log('📡 Tier 2: Twitter (skipped - requires API key)');

  const tier3Topics = await scrapeTier3();
  allTopics.push(...tier3Topics);

  const tier4Topics = await scrapeTier4();
  allTopics.push(...tier4Topics);

  // Deduplicate and merge
  console.log('\n🔄 Deduplicating and ranking...');
  const finalTopics = deduplicateAndMerge(allTopics);

  // Create digest
  const digest: DailyDigest = {
    date: new Date().toISOString().split('T')[0],
    generated_at: new Date().toISOString(),
    topics: finalTopics,
    sources_scanned: {
      tier_1_official: OFFICIAL_BLOGS.length,
      tier_2_twitter: 0,
      tier_3_github: 1,
      tier_4_hackernews: 30,
    },
  };

  // Save to output
  const outputDir = path.join(process.cwd(), 'output');
  fs.mkdirSync(outputDir, { recursive: true });
  
  const outputPath = path.join(outputDir, 'daily-digest.json');
  fs.writeFileSync(outputPath, JSON.stringify(digest, null, 2));

  // Also save to newsletter data
  const newsletterDir = path.join(process.cwd(), 'src', 'data');
  fs.mkdirSync(newsletterDir, { recursive: true });
  fs.writeFileSync(
    path.join(newsletterDir, 'newsletter.json'),
    JSON.stringify(digest, null, 2)
  );

  // Print results
  console.log('\n📊 Top 10 AI/Tech Topics:\n');
  for (const topic of finalTopics) {
    const tierEmoji = topic.sources[0]?.tier === 1 ? '🏢' : 
                      topic.sources[0]?.tier === 3 ? '💻' : '📰';
    console.log(`${topic.rank}. [${topic.score}] ${tierEmoji} ${topic.title.slice(0, 60)}...`);
    console.log(`   ${topic.summary.slice(0, 80)}`);
    console.log('');
  }

  console.log(`\n✅ Saved to ${outputPath}`);
  console.log(`✅ Newsletter data updated`);

  return digest;
}

main().catch(console.error);

export { Topic, DailyDigest, main as runDailyScout };
