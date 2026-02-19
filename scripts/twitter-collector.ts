#!/usr/bin/env tsx
/**
 * Twitter Collector — twitterapi.io Integration
 *
 * Collects tweets from AI thought leaders using twitterapi.io API.
 * Outputs results to input/raw-sources.json in tier_2_twitter field.
 *
 * Usage:
 *   npx tsx scripts/twitter-collector.ts
 *   npx tsx scripts/twitter-collector.ts --accounts AnthropicAI,OpenAI --hours 48
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

// AI thought leaders to track (from PRD §11, matches daily-scout.ts)
const TWITTER_ACCOUNTS = [
  // Tier 1 - Official (model releases)
  { handle: 'AnthropicAI', tier: 1, category: 'model_release' as const },
  { handle: 'OpenAI', tier: 1, category: 'model_release' as const },
  { handle: 'GoogleAI', tier: 1, category: 'model_release' as const },
  { handle: 'GoogleDeepMind', tier: 1, category: 'official_blog' as const },
  { handle: 'MistralAI', tier: 1, category: 'model_release' as const },
  { handle: 'AIatMeta', tier: 1, category: 'model_release' as const },
  // Tier 1 - Developer Platform
  { handle: 'OpenAIDevs', tier: 1, category: 'developer_platform' as const },
  { handle: 'LangChainAI', tier: 1, category: 'developer_platform' as const },
  // Tier 1 - Product
  { handle: 'claudeai', tier: 1, category: 'product_ecosystem' as const },
  { handle: 'ChatGPTapp', tier: 1, category: 'product_ecosystem' as const },
  // Tier 1 - Anthropic Team
  { handle: 'bcherny', tier: 1, category: 'developer_platform' as const },
  { handle: 'trq212', tier: 1, category: 'developer_platform' as const },
  { handle: 'alexalbert__', tier: 1, category: 'product_ecosystem' as const },
  { handle: 'ErikSchluntz', tier: 1, category: 'developer_platform' as const },
  { handle: 'mikeyk', tier: 1, category: 'product_ecosystem' as const },
  { handle: 'felixrieseberg', tier: 1, category: 'developer_platform' as const },
  { handle: 'adocomplete', tier: 1, category: 'developer_platform' as const },
  // Tier 2 - AI Engineering
  { handle: 'simonw', tier: 2, category: 'developer_platform' as const },
  { handle: 'chipro', tier: 2, category: 'developer_platform' as const },
  // Tier 2 - KOLs
  { handle: 'sama', tier: 2, category: 'product_ecosystem' as const },
  { handle: 'karpathy', tier: 2, category: 'official_blog' as const },
  { handle: 'ylecun', tier: 2, category: 'official_blog' as const },
  { handle: 'EMostaque', tier: 2, category: 'model_release' as const },
  { handle: 'DrJimFan', tier: 2, category: 'official_blog' as const },
];

interface Tweet {
  id: string;
  text: string;
  author: string;
  created_at: string;
  url: string;
  metrics?: {
    likes?: number;
    retweets?: number;
    replies?: number;
  };
  is_thread?: boolean;
}

interface RawSources {
  tier_1_news?: any[];
  tier_2_twitter?: Tweet[];
  tier_3_reddit?: any[];
  tier_4_github?: any[];
  tier_5_arxiv?: any[];
  collected_at?: string;
}

// ============================================
// CLI Args
// ============================================

function parseArgs(): { accounts: string[] | null; hours: number } {
  const args = process.argv.slice(2);
  let accounts: string[] | null = null;
  let hours = 24;

  const accountsIdx = args.indexOf('--accounts');
  if (accountsIdx >= 0 && args[accountsIdx + 1]) {
    accounts = args[accountsIdx + 1].split(',').map(a => a.replace(/^@/, '').trim());
  }

  const hoursIdx = args.indexOf('--hours');
  if (hoursIdx >= 0 && args[hoursIdx + 1]) {
    hours = parseInt(args[hoursIdx + 1]) || 24;
  }

  return { accounts, hours };
}

// ============================================
// Rate Limiting & Retry
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 1): Promise<Response> {
  const response = await fetch(url, options);
  if (response.status === 429 && retries > 0) {
    console.log('      Rate limited (429), sleeping 30s before retry...');
    await sleep(30000);
    return fetchWithRetry(url, options, retries - 1);
  }
  return response;
}

// ============================================
// Twitter API (twitterapi.io)
// ============================================

class TwitterCollector {
  private apiKey: string;
  private baseUrl = 'https://api.twitterapi.io';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Collect recent tweets from a specific user via twitterapi.io
   */
  async collectUserTweets(handle: string, maxTweets: number = 20, lookbackHours: number = 24): Promise<Tweet[]> {
    console.log(`   - @${handle}...`);

    try {
      const response = await fetchWithRetry(
        `${this.baseUrl}/twitter/user/last_tweets?userName=${handle}&count=${maxTweets}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.warn(`      Warning: Could not fetch tweets for @${handle} (${response.status})`);
        return [];
      }

      const data = await response.json() as any;
      const rawTweets = data.data?.tweets || data.tweets || [];

      const cutoff = Date.now() - lookbackHours * 60 * 60 * 1000;

      // Transform to our Tweet format
      const tweets: Tweet[] = [];
      for (const tweet of rawTweets) {
        const text = tweet.text || tweet.full_text || '';
        const tweetId = tweet.id || tweet.id_str;

        // Skip retweets and direct replies
        if (text.startsWith('RT @') || text.startsWith('@')) continue;

        // Check freshness
        const createdAt = tweet.created_at || tweet.date;
        if (createdAt) {
          const tweetDate = new Date(createdAt);
          if (!isNaN(tweetDate.getTime()) && tweetDate.getTime() < cutoff) continue;
        }

        const likes = tweet.favorite_count || tweet.public_metrics?.like_count || 0;
        const retweets = tweet.retweet_count || tweet.public_metrics?.retweet_count || 0;
        const replies = tweet.reply_count || tweet.public_metrics?.reply_count || 0;

        // Thread detection: check if tweet references another tweet from same author
        const isThread = !!(
          tweet.referenced_tweets?.some((ref: any) => ref.type === 'replied_to') ||
          tweet.in_reply_to_user_id === tweet.author_id ||
          tweet.conversation_id
        );

        tweets.push({
          id: tweetId,
          text,
          author: `@${handle}`,
          created_at: createdAt || new Date().toISOString(),
          url: `https://x.com/${handle}/status/${tweetId}`,
          metrics: { likes, retweets, replies },
          is_thread: isThread,
        });
      }

      console.log(`      Collected ${tweets.length} tweets`);
      return tweets;
    } catch (error) {
      console.error(`      Error collecting from @${handle}: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Collect tweets from all tracked accounts with engagement filtering
   */
  async collectAll(
    accounts: typeof TWITTER_ACCOUNTS,
    tweetsPerAccount: number = 20,
    lookbackHours: number = 24,
  ): Promise<Tweet[]> {
    console.log(`\nStarting Twitter collection from ${accounts.length} accounts\n`);

    const allTweets: Tweet[] = [];

    for (const account of accounts) {
      const tweets = await this.collectUserTweets(account.handle, tweetsPerAccount, lookbackHours);

      // Engagement filtering: Tier 1 keeps all tweets, Tier 2+ require 100+ likes
      const filtered = tweets.filter(tweet => {
        if (account.tier === 1) return true;
        const likes = tweet.metrics?.likes || 0;
        return likes >= 100;
      });

      if (filtered.length < tweets.length) {
        console.log(`      Filtered ${tweets.length - filtered.length} low-engagement tweets (tier ${account.tier})`);
      }

      allTweets.push(...filtered);

      // Rate limiting: 1s delay between requests
      await sleep(1000);
    }

    return allTweets;
  }
}

/**
 * Load or initialize raw-sources.json
 */
function loadRawSources(): RawSources {
  const sourcesPath = path.join(process.cwd(), 'input', 'raw-sources.json');

  if (fs.existsSync(sourcesPath)) {
    try {
      const content = fs.readFileSync(sourcesPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('Warning: Could not parse existing raw-sources.json, creating new file');
      return {};
    }
  }

  return {};
}

/**
 * Save raw sources to file
 */
function saveRawSources(sources: RawSources): void {
  const sourcesPath = path.join(process.cwd(), 'input', 'raw-sources.json');

  // Ensure input directory exists
  const inputDir = path.join(process.cwd(), 'input');
  if (!fs.existsSync(inputDir)) {
    fs.mkdirSync(inputDir, { recursive: true });
  }

  fs.writeFileSync(sourcesPath, JSON.stringify(sources, null, 2), 'utf-8');
}

/**
 * Main execution function
 */
async function main() {
  console.log('\nTwitter Collector — twitterapi.io Integration\n');
  console.log('='.repeat(60) + '\n');

  // Parse CLI args
  const { accounts: cliAccounts, hours } = parseArgs();

  // Load API key from environment (dotenv/config loaded at top)
  const apiKey = process.env.TWITTER_API_KEY;

  if (!apiKey) {
    console.error('Error: TWITTER_API_KEY not found in .env file or environment');
    console.error('   Please add TWITTER_API_KEY=your_api_key to .env file\n');
    process.exit(1);
  }

  // Determine which accounts to scan
  let accountsToScan = TWITTER_ACCOUNTS;
  if (cliAccounts) {
    accountsToScan = cliAccounts.map(handle => {
      const existing = TWITTER_ACCOUNTS.find(a => a.handle.toLowerCase() === handle.toLowerCase());
      return existing || { handle, tier: 2, category: 'developer_platform' as const };
    });
  }

  console.log(`Tracking ${accountsToScan.length} AI thought leaders (lookback: ${hours}h):`);
  accountsToScan.forEach(account => console.log(`   - @${account.handle} (tier ${account.tier})`));
  console.log('');

  // Collect tweets
  const collector = new TwitterCollector(apiKey);

  let tweets: Tweet[];
  try {
    tweets = await collector.collectAll(accountsToScan, 20, hours);
  } catch (error) {
    console.error(`Collection failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }

  console.log(`\nTotal tweets collected: ${tweets.length}`);

  // Sort by engagement (likes + retweets)
  tweets.sort((a, b) => {
    const engagementA = (a.metrics?.likes || 0) + (a.metrics?.retweets || 0);
    const engagementB = (b.metrics?.likes || 0) + (b.metrics?.retweets || 0);
    return engagementB - engagementA;
  });

  // Load existing raw sources
  const rawSources = loadRawSources();

  // Update tier_2_twitter field
  rawSources.tier_2_twitter = tweets;
  rawSources.collected_at = new Date().toISOString();

  // Save to file
  saveRawSources(rawSources);

  console.log(`\nSaved to: input/raw-sources.json`);
  console.log(`Top tweets by engagement:`);

  tweets.slice(0, 5).forEach((tweet, i) => {
    const engagement = (tweet.metrics?.likes || 0) + (tweet.metrics?.retweets || 0);
    const preview = tweet.text.substring(0, 80).replace(/\n/g, ' ');
    const threadLabel = tweet.is_thread ? ' [THREAD]' : '';
    console.log(`   ${i + 1}. ${tweet.author} (${engagement} engagement${threadLabel}): ${preview}...`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('Twitter collection completed successfully!\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(`\nFatal error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}

export { TwitterCollector, Tweet, RawSources, TWITTER_ACCOUNTS };
