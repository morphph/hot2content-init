#!/usr/bin/env tsx
/**
 * Twitter Collector — twitterapi.io Integration
 *
 * Collects tweets from AI thought leaders using twitterapi.io API.
 * Outputs results to input/raw-sources.json in tier_2_twitter field.
 *
 * Usage: npx tsx scripts/twitter-collector.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// AI thought leaders to track
const TWITTER_ACCOUNTS = [
  '@OpenAI',
  '@AnthropicAI',
  '@GoogleAI',
  '@sama',
  '@karpathy'
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
}

interface RawSources {
  tier_1_news?: any[];
  tier_2_twitter?: Tweet[];
  tier_3_reddit?: any[];
  tier_4_github?: any[];
  tier_5_arxiv?: any[];
  collected_at?: string;
}

interface TwitterAPIResponse {
  data?: any[];
  meta?: {
    result_count?: number;
    next_token?: string;
  };
  errors?: Array<{
    message: string;
    code?: number;
  }>;
}

class TwitterCollector {
  private apiKey: string;
  private baseUrl = 'https://api.twitterapi.io/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Collect recent tweets from a specific user
   */
  async collectUserTweets(username: string, maxTweets: number = 10): Promise<Tweet[]> {
    console.log(`📱 Collecting tweets from ${username}...`);

    try {
      // Remove @ symbol if present
      const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

      // First, get user ID by username
      const userId = await this.getUserId(cleanUsername);
      if (!userId) {
        console.warn(`   ⚠️  Could not find user ID for ${username}`);
        return [];
      }

      // Then fetch user's tweets
      const tweets = await this.fetchUserTweets(userId, cleanUsername, maxTweets);
      console.log(`   ✅ Collected ${tweets.length} tweets from ${username}`);

      return tweets;
    } catch (error) {
      console.error(`   ❌ Error collecting from ${username}: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Get user ID by username
   */
  private async getUserId(username: string): Promise<string | null> {
    const url = `${this.baseUrl}/users/by/username/${username}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user ID (${response.status}): ${await response.text()}`);
    }

    const data: any = await response.json();
    return data.data?.id || null;
  }

  /**
   * Fetch tweets from a user
   */
  private async fetchUserTweets(userId: string, username: string, maxTweets: number): Promise<Tweet[]> {
    const url = `${this.baseUrl}/users/${userId}/tweets`;

    // Query parameters for tweet fields
    const params = new URLSearchParams({
      'max_results': Math.min(maxTweets, 100).toString(),
      'tweet.fields': 'created_at,public_metrics,referenced_tweets',
      'exclude': 'retweets,replies' // Only get original tweets
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tweets (${response.status}): ${await response.text()}`);
    }

    const data: TwitterAPIResponse = await response.json();

    if (data.errors && data.errors.length > 0) {
      throw new Error(`Twitter API error: ${data.errors[0].message}`);
    }

    if (!data.data || data.data.length === 0) {
      return [];
    }

    // Transform to our Tweet format
    return data.data.map((tweet: any) => ({
      id: tweet.id,
      text: tweet.text,
      author: `@${username}`,
      created_at: tweet.created_at,
      url: `https://twitter.com/${username}/status/${tweet.id}`,
      metrics: {
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        replies: tweet.public_metrics?.reply_count || 0
      }
    }));
  }

  /**
   * Collect tweets from all tracked accounts
   */
  async collectAll(accounts: string[], tweetsPerAccount: number = 10): Promise<Tweet[]> {
    console.log(`\n🐦 Starting Twitter collection from ${accounts.length} accounts\n`);

    const allTweets: Tweet[] = [];

    for (const account of accounts) {
      const tweets = await this.collectUserTweets(account, tweetsPerAccount);
      allTweets.push(...tweets);

      // Small delay to avoid rate limiting
      await this.sleep(500);
    }

    return allTweets;
  }

  /**
   * Sleep utility for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Load environment variables from .env file
 */
function loadEnv(): Map<string, string> {
  const envPath = path.join(process.cwd(), '.env');
  const envVars = new Map<string, string>();

  if (!fs.existsSync(envPath)) {
    console.warn('⚠️  Warning: .env file not found');
    return envVars;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars.set(key.trim(), valueParts.join('=').trim());
      }
    }
  }

  return envVars;
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
      console.warn('⚠️  Warning: Could not parse existing raw-sources.json, creating new file');
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
  console.log('\n🐦 Twitter Collector — twitterapi.io Integration\n');
  console.log('='.repeat(60) + '\n');

  // Load environment variables
  const env = loadEnv();
  const apiKey = env.get('TWITTER_API_KEY') || process.env.TWITTER_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: TWITTER_API_KEY not found in .env file or environment');
    console.error('   Please add TWITTER_API_KEY=your_api_key to .env file\n');
    process.exit(1);
  }

  console.log(`📋 Tracking ${TWITTER_ACCOUNTS.length} AI thought leaders:`);
  TWITTER_ACCOUNTS.forEach(account => console.log(`   - ${account}`));
  console.log('');

  // Collect tweets
  const collector = new TwitterCollector(apiKey);

  let tweets: Tweet[];
  try {
    tweets = await collector.collectAll(TWITTER_ACCOUNTS, 10);
  } catch (error) {
    console.error(`❌ Collection failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }

  console.log(`\n✅ Total tweets collected: ${tweets.length}`);

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

  console.log(`\n📁 Saved to: input/raw-sources.json`);
  console.log(`📊 Top tweets by engagement:`);

  tweets.slice(0, 5).forEach((tweet, i) => {
    const engagement = (tweet.metrics?.likes || 0) + (tweet.metrics?.retweets || 0);
    const preview = tweet.text.substring(0, 80).replace(/\n/g, ' ');
    console.log(`   ${i + 1}. ${tweet.author} (${engagement} engagement): ${preview}...`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ Twitter collection completed successfully!\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(`\n❌ Fatal error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}

export { TwitterCollector, Tweet, RawSources, TWITTER_ACCOUNTS };
