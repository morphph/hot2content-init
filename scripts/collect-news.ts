#!/usr/bin/env npx tsx
/**
 * LoreAI News Collector
 * 
 * Collects news from all sources → deduplicates → inserts into DB.
 * No Claude CLI calls or newsletter writing logic.
 * 
 * Split from daily-scout.ts per Issue #38.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { getDb, initSchema, insertNewsItems, getRecentUrls, closeDb } from '../src/lib/db.js';

dotenv.config();

// ============================================
// Types
// ============================================

type Category = 'model_release' | 'developer_platform' | 'official_blog' | 'product_ecosystem';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  action?: string;
  url: string;
  twitter_url?: string;
  source: string;
  source_tier: number;
  category: Category;
  score: number;
  engagement?: number;
  detected_at: string;
  full_text?: string;
}

// ============================================
// Config
// ============================================

const TWITTER_API_KEY = process.env.TWITTER_API_KEY || '';
const TWITTER_API_BASE = 'https://api.twitterapi.io';
const FRESHNESS_HOURS = 72;

const OFFICIAL_BLOGS = [
  { name: 'Anthropic', url: 'https://www.anthropic.com/news', twitter: '@AnthropicAI', category: 'model_release' as Category },
  { name: 'OpenAI', url: 'https://openai.com/blog', twitter: '@OpenAI', category: 'model_release' as Category },
  { name: 'Google AI', url: 'https://blog.google/technology/ai/', twitter: '@GoogleAI', category: 'model_release' as Category },
  { name: 'DeepMind', url: 'https://deepmind.google/blog/', twitter: '@DeepMind', category: 'official_blog' as Category },
  { name: 'Meta AI', url: 'https://ai.meta.com/blog/', twitter: '@AIatMeta', category: 'model_release' as Category },
  { name: 'Mistral', url: 'https://mistral.ai/news/', twitter: '@MistralAI', category: 'model_release' as Category },
  { name: 'xAI', url: 'https://x.ai/blog', twitter: '@xaborevsky', category: 'model_release' as Category },
  { name: 'Cohere', url: 'https://cohere.com/blog', twitter: '@coaborevsky', category: 'model_release' as Category },
  { name: 'HuggingFace', url: 'https://huggingface.co/blog', twitter: '@huggingface', category: 'developer_platform' as Category },
];

const TWITTER_ACCOUNTS = [
  { handle: 'AnthropicAI', tier: 1, category: 'model_release' as Category },
  { handle: 'OpenAI', tier: 1, category: 'model_release' as Category },
  { handle: 'GoogleAI', tier: 1, category: 'model_release' as Category },
  { handle: 'GoogleDeepMind', tier: 1, category: 'official_blog' as Category },
  { handle: 'MistralAI', tier: 1, category: 'model_release' as Category },
  { handle: 'AIatMeta', tier: 1, category: 'model_release' as Category },
  { handle: 'OpenAIDevs', tier: 1, category: 'developer_platform' as Category },
  { handle: 'LangChainAI', tier: 1, category: 'developer_platform' as Category },
  { handle: 'claudeai', tier: 1, category: 'product_ecosystem' as Category },
  { handle: 'ChatGPTapp', tier: 1, category: 'product_ecosystem' as Category },
  { handle: 'bcherny', tier: 1, category: 'developer_platform' as Category },
  { handle: 'alexalbert__', tier: 1, category: 'product_ecosystem' as Category },
  { handle: 'ErikSchluntz', tier: 1, category: 'developer_platform' as Category },
  { handle: 'mikeyk', tier: 1, category: 'product_ecosystem' as Category },
  { handle: 'felixrieseberg', tier: 1, category: 'developer_platform' as Category },
  { handle: 'adocomplete', tier: 1, category: 'developer_platform' as Category },
  { handle: 'simonw', tier: 2, category: 'developer_platform' as Category },
  { handle: 'chipro', tier: 2, category: 'developer_platform' as Category },
  { handle: 'sama', tier: 2, category: 'product_ecosystem' as Category },
  { handle: 'karpathy', tier: 2, category: 'official_blog' as Category },
  { handle: 'ylecun', tier: 2, category: 'official_blog' as Category },
  { handle: 'EMostaque', tier: 2, category: 'model_release' as Category },
  { handle: 'DrJimFan', tier: 2, category: 'official_blog' as Category },
];

const SEARCH_QUERIES = [
  'Claude Code', 'AI agent', 'AI agent framework', 'MCP server',
  'Claude Code skills', 'vibe coding', 'AI devtools', 'LLM tools',
  'AI engineering', 'open source LLM', 'AI startup funding',
  'OpenAI Responses API', 'Claude API', 'OpenAI skills',
];

const REDDIT_SUBREDDITS = ['LocalLLaMA', 'ClaudeAI', 'MachineLearning', 'artificial'];
const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID || '';
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || '';

// ============================================
// Utility Functions
// ============================================

function isFreshItem(dateInput: string | number | Date, maxAgeHours: number = FRESHNESS_HOURS): boolean {
  if (!dateInput) return true;
  const d = typeof dateInput === 'number'
    ? new Date(dateInput * 1000)
    : new Date(dateInput);
  if (isNaN(d.getTime())) return true;
  return Date.now() - d.getTime() < maxAgeHours * 60 * 60 * 1000;
}

function isFreshTweet(tweet: any, maxAgeHours: number = 72): boolean {
  const dateStr = tweet.created_at || tweet.date;
  if (!dateStr) return true;
  const tweetDate = new Date(dateStr);
  if (isNaN(tweetDate.getTime())) return true;
  return Date.now() - tweetDate.getTime() < maxAgeHours * 60 * 60 * 1000;
}

function isLowQualityTweet(text: string): boolean {
  const noUrls = text.replace(/https?:\/\/\S+/g, '').trim();
  const noEmoji = noUrls.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '').trim();
  if (noEmoji.length < 20) return true;
  const hashtagCount = (text.match(/#\w+/g) || []).length;
  const words = noEmoji.split(/\s+/).filter(w => w.length > 0);
  if (hashtagCount > words.length * 0.6) return true;
  if (/^(merry|happy|good\s*(morning|night|bot)|thank|congratulations?)/i.test(noEmoji)) return true;
  return false;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

// ============================================
// RSS Parser
// ============================================

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
}

async function parseRSS(url: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Hot2Content/2.0' } });
    if (!response.ok) return [];
    const xml = await response.text();
    const items: RSSItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];
      const title = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || '';
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      const description = itemXml.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/)?.[1] || '';
      if (title && link) {
        items.push({ title: title.trim(), link: link.trim(), pubDate, description: description.slice(0, 300) });
      }
    }
    return items.slice(0, 10);
  } catch (e) {
    console.log(`   ⚠️ RSS parse error: ${e}`);
    return [];
  }
}

// ============================================
// Article Summary Fetcher
// ============================================

async function fetchArticleSummary(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    });
    if (!response.ok) return '';
    const html = await response.text();
    const heroMatch = html.match(/<p[^>]*class="[^"]*summary[^"]*"[^>]*>([^<]+)/);
    if (heroMatch && heroMatch[1].length > 30) return heroMatch[1].slice(0, 280).trim().replace(/&#x27;/g, "'");
    const metaMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/);
    if (metaMatch && metaMatch[1].length > 50 && !metaMatch[1].includes('AI safety and research company'))
      return metaMatch[1].slice(0, 280).replace(/&#x27;/g, "'");
    const pMatch = html.match(/<p[^>]*post-text[^>]*>([^<]{50,})/);
    if (pMatch) return pMatch[1].slice(0, 280).trim().replace(/&#x27;/g, "'");
    return '';
  } catch { return ''; }
}

// ============================================
// Tier 1: Official Blogs
// ============================================

async function fetchAnthropicEngineering(): Promise<NewsItem[]> {
  const items: NewsItem[] = [];
  try {
    const response = await fetch('https://www.anthropic.com/engineering', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    });
    if (!response.ok) return items;
    const html = await response.text();
    const seen = new Set<string>();
    const articlesToFetch: { slug: string; title: string }[] = [];

    const featuredPattern = /href="\/engineering\/([^"]+)"[\s\S]*?<img[^>]*alt="([^"]+)"/g;
    let match = featuredPattern.exec(html);
    if (match) {
      const slug = match[1]; const title = match[2].trim();
      if (title.length > 10 && !seen.has(slug)) { seen.add(slug); articlesToFetch.push({ slug, title }); }
    }
    const listPattern = /href="\/engineering\/([^"]+)"[\s\S]*?<h3[^>]*headline[^>]*>([^<]+)<\/h3>/g;
    while ((match = listPattern.exec(html)) !== null && articlesToFetch.length < 5) {
      const slug = match[1]; const title = match[2].trim();
      if (seen.has(slug) || !title || title.length < 10) continue;
      seen.add(slug); articlesToFetch.push({ slug, title });
    }
    const summaries = await Promise.all(
      articlesToFetch.map(a => fetchArticleSummary(`https://www.anthropic.com/engineering/${a.slug}`))
    );
    for (let i = 0; i < articlesToFetch.length; i++) {
      const { slug, title } = articlesToFetch[i];
      items.push({
        id: `anthropic-eng-${slug}`, title,
        summary: summaries[i] || 'Anthropic Engineering - developer-focused technical guide',
        url: `https://www.anthropic.com/engineering/${slug}`,
        source: 'Anthropic Engineering', source_tier: 1, category: 'official_blog', score: 92,
        detected_at: new Date().toISOString(),
      });
    }
  } catch (e) { console.log(`   ⚠️ Anthropic Engineering fetch error: ${e}`); }
  return items;
}

async function fetchAnthropicNews(): Promise<NewsItem[]> {
  const items: NewsItem[] = [];
  try {
    const response = await fetch('https://www.anthropic.com/news', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'Accept': 'text/html,application/xhtml+xml' }
    });
    if (!response.ok) return items;
    const html = await response.text();
    const seen = new Set<string>();
    const listPattern = /<a[^>]*href="\/news\/([^"]+)"[^>]*PublicationList[^>]*>[\s\S]*?<time[^>]*>([^<]+)<\/time>[\s\S]*?<span[^>]*title[^>]*>([^<]+)<\/span>[\s\S]*?<\/a>/g;
    let match;
    while ((match = listPattern.exec(html)) !== null && items.length < 5) {
      const slug = match[1]; const date = match[2].trim(); const title = match[3].trim();
      if (seen.has(slug) || !title || title.length < 5) continue;
      if (date && !isFreshItem(date)) continue;
      seen.add(slug);
      let category: Category = 'official_blog';
      if (/introducing|claude|opus|sonnet|haiku|model/i.test(title) && !/research|paper|study|blog/i.test(title))
        category = 'model_release';
      items.push({
        id: `anthropic-news-${slug}`, title,
        summary: `Anthropic announcement (${date})`,
        url: `https://www.anthropic.com/news/${slug}`,
        source: 'Anthropic Blog', source_tier: 1, category,
        score: category === 'model_release' ? 95 : 90,
        detected_at: new Date().toISOString(),
      });
    }
  } catch (e) { console.log(`   ⚠️ Anthropic News fetch error: ${e}`); }
  return items;
}

async function fetchOpenAIChangelog(): Promise<NewsItem[]> {
  const items: NewsItem[] = [];
  try {
    const response = await fetch('https://developers.openai.com/api/docs/changelog', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'Accept': 'text/html,application/xhtml+xml' }
    });
    if (!response.ok) return items;
    const html = await response.text();
    const months: Record<string, number> = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                     .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                     .replace(/<[^>]+>/g, '\n').replace(/\n{3,}/g, '\n\n');
    const entryPattern = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s*\n\s*\n?\s*(Feature|Update|Fix|Announcement)\s*\n([\s\S]*?)(?=(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s*\n|###\s|$)/g;
    let match;
    const currentYear = new Date().getFullYear();
    const seen = new Set<string>();
    while ((match = entryPattern.exec(text)) !== null && items.length < 8) {
      const monthStr = match[1]; const day = parseInt(match[2]);
      const entryType = match[3]; const body = match[4].trim();
      const monthNum = months[monthStr]; if (monthNum === undefined) continue;
      const entryDate = new Date(currentYear, monthNum, day);
      if (!isFreshItem(entryDate)) continue;
      const lines = body.split('\n').map(l => l.trim()).filter(l => l.length > 10);
      if (lines.length === 0) continue;
      let title = ''; let summary = '';
      for (const line of lines) {
        if (/^(gpt-|v1\/|chatgpt-|sora-|dall-e|o[0-9]|claude)/i.test(line) && line.length < 40) continue;
        if (!title) title = line.slice(0, 120);
        else if (!summary) summary = line.slice(0, 300);
      }
      if (!title) continue;
      const slug = `openai-changelog-${monthStr.toLowerCase()}${day}-${title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}`;
      if (seen.has(slug)) continue; seen.add(slug);
      items.push({
        id: slug, title: `[OpenAI ${entryType}] ${title}`, summary: summary || title,
        full_text: body.slice(0, 500),
        url: 'https://developers.openai.com/api/docs/changelog',
        source: 'OpenAI Changelog', source_tier: 1,
        category: entryType === 'Feature' ? 'developer_platform' as Category : 'product_ecosystem' as Category,
        score: entryType === 'Feature' ? 92 : 85, engagement: 0,
        detected_at: entryDate.toISOString(),
      });
    }
  } catch (e) { console.log(`   ⚠️ OpenAI Changelog fetch error: ${e}`); }
  return items;
}

async function scanOfficialBlogs(): Promise<NewsItem[]> {
  console.log('📡 Tier 1: Scanning Official Blogs...');
  const items: NewsItem[] = [];

  // Google AI Blog (RSS)
  console.log('   - Google AI Blog (RSS)...');
  const googleItems = await parseRSS('https://blog.google/technology/ai/rss/');
  for (const item of googleItems.slice(0, 5)) {
    if (!/ai|gemini|model|deepmind|machine learning|neural/i.test(item.title + item.description)) continue;
    if (item.pubDate && !isFreshItem(item.pubDate)) continue;
    items.push({
      id: `google-${Buffer.from(item.link).toString('base64').slice(0, 20)}`,
      title: item.title,
      summary: item.description?.replace(/<[^>]+>/g, '').slice(0, 280) || 'Google AI official blog post',
      url: item.link, source: 'Google AI Blog', source_tier: 1, category: 'official_blog', score: 88,
      detected_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    });
  }
  console.log(`   ✅ Google AI: ${items.length} items`);

  console.log('   - Anthropic Engineering...');
  const anthropicEng = await fetchAnthropicEngineering();
  items.push(...anthropicEng);
  console.log(`   ✅ Anthropic Engineering: ${anthropicEng.length} items`);

  console.log('   - Anthropic News...');
  const anthropicNews = await fetchAnthropicNews();
  items.push(...anthropicNews);
  console.log(`   ✅ Anthropic News: ${anthropicNews.length} items`);

  console.log('   - HuggingFace Blog (RSS)... ⏭️ Disabled');

  console.log('   - OpenAI Platform Changelog...');
  const changelogItems = await fetchOpenAIChangelog();
  items.push(...changelogItems);
  console.log(`   ✅ OpenAI Changelog: ${changelogItems.length} items`);

  console.log(`   ✅ Total official blog items: ${items.length}`);
  return items;
}

// ============================================
// Tier 2: Twitter/X
// ============================================

async function fetchTwitter(handle: string): Promise<any[]> {
  if (!TWITTER_API_KEY) return [];
  try {
    const response = await fetch(
      `${TWITTER_API_BASE}/twitter/user/last_tweets?userName=${handle}&count=20`,
      { headers: { 'X-API-Key': TWITTER_API_KEY, 'Content-Type': 'application/json' } }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.data?.tweets || data.tweets || [];
  } catch { return []; }
}

async function scanTwitter(): Promise<NewsItem[]> {
  console.log('📡 Tier 2: Scanning Twitter/X...');
  const items: NewsItem[] = [];
  if (!TWITTER_API_KEY) { console.log('   ⚠️ No API key, skipping'); return items; }

  for (const account of TWITTER_ACCOUNTS) {
    try {
      console.log(`   - @${account.handle}...`);
      const tweets = await fetchTwitter(account.handle);
      for (const tweet of tweets) {
        const text = tweet.text || tweet.full_text || '';
        const tweetId = tweet.id || tweet.id_str;
        if (text.startsWith('RT @') || text.startsWith('@')) continue;
        if (!isFreshTweet(tweet)) continue;
        if (isLowQualityTweet(text)) continue;
        const isRelevant = /ai|llm|gpt|claude|model|agent|training|inference|benchmark/i.test(text);
        if (!isRelevant && account.tier > 1) continue;
        const likes = tweet.favorite_count || tweet.public_metrics?.like_count || 0;
        const retweets = tweet.retweet_count || tweet.public_metrics?.retweet_count || 0;
        const engagement = likes + retweets * 2;
        if (account.tier === 2 && engagement < 100) continue;
        const title = text.split('\n')[0].slice(0, 100).trim() || text.slice(0, 100).trim();
        let action: string | undefined;
        if (/available|released|launched|try|check out/i.test(text)) action = 'Check it out';
        else if (/update|upgrade|new version/i.test(text)) action = 'Review changes';
        const score = account.tier === 1 ? 80 : Math.min(70, 50 + Math.floor(engagement / 100));
        let category = account.category;
        if (/introducing|announcing|released?|launching|new model|opus|sonnet|gpt-?\d|gemini|mistral|llama/i.test(text) &&
            !/blog|research|paper|study/i.test(text)) category = 'model_release';
        else if (/engineering blog|research|paper|study|findings|analysis/i.test(text)) category = 'official_blog';
        else if (/sdk|api|developer|integration|platform|tools|library/i.test(text)) category = 'developer_platform';
        items.push({
          id: `twitter-${tweetId}`, title, summary: text.slice(0, 280), action,
          url: `https://x.com/${account.handle}/status/${tweetId}`,
          twitter_url: `https://x.com/${account.handle}/status/${tweetId}`,
          source: `@${account.handle}`, source_tier: account.tier, category, score, engagement,
          detected_at: tweet.created_at || new Date().toISOString(),
        });
      }
    } catch (e) { console.log(`   ❌ @${account.handle}: ${e}`); }
  }
  console.log(`   ✅ Found ${items.length} tweets from accounts`);

  // Twitter Search
  const seenSearchIds = new Set(items.map(i => i.id));
  for (const query of SEARCH_QUERIES) {
    try {
      console.log(`   - Search: "${query}"...`);
      const response = await fetch(
        `${TWITTER_API_BASE}/twitter/tweet/advanced_search?query=${encodeURIComponent(query)}&queryType=Top&count=5`,
        { headers: { 'X-API-Key': TWITTER_API_KEY!, 'Content-Type': 'application/json' } }
      );
      if (!response.ok) continue;
      const data = await response.json();
      const tweets = data.data?.tweets || data.tweets || [];
      for (const tweet of tweets) {
        const text = tweet.text || tweet.full_text || '';
        const tweetId = tweet.id || tweet.id_str;
        const itemId = `twitter-search-${tweetId}`;
        if (seenSearchIds.has(itemId) || seenSearchIds.has(`twitter-${tweetId}`)) continue;
        seenSearchIds.add(itemId);
        if (text.startsWith('RT @')) continue;
        if (!isFreshTweet(tweet)) continue;
        const likes = tweet.favorite_count || tweet.public_metrics?.like_count || tweet.likeCount || 0;
        const retweets = tweet.retweet_count || tweet.public_metrics?.retweet_count || tweet.retweetCount || 0;
        const engagement = likes + retweets * 2;
        if (engagement < 1000) continue;
        const author = tweet.author?.userName || tweet.user?.screen_name || '?';
        const title = text.split('\n')[0].slice(0, 100).trim();
        items.push({
          id: itemId, title, summary: text.slice(0, 500),
          url: `https://x.com/${author}/status/${tweetId}`,
          twitter_url: `https://x.com/${author}/status/${tweetId}`,
          source: `@${author}`, source_tier: 2, category: 'developer_platform' as Category,
          score: Math.min(90, 70 + Math.floor(engagement / 5000)), engagement,
          detected_at: tweet.created_at || tweet.date || new Date().toISOString(),
        });
      }
    } catch (e) { console.log(`   ❌ Search "${query}": ${e}`); }
  }
  console.log(`   ✅ Total after search: ${items.length} tweets`);
  return items;
}

// ============================================
// Tier 4: Hacker News
// ============================================

async function scanHackerNews(): Promise<NewsItem[]> {
  console.log('📡 Tier 4: Scanning Hacker News...');
  const items: NewsItem[] = [];
  try {
    const topStoriesRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const topStoryIds: number[] = await topStoriesRes.json();
    for (const id of topStoryIds.slice(0, 30)) {
      try {
        const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        const story = await storyRes.json();
        if (!story?.title) continue;
        const titleLower = story.title.toLowerCase();
        if (!/ai|llm|gpt|claude|anthropic|openai|machine learning|neural|transformer|model|agent/i.test(titleLower)) continue;
        if (story.score < 50) continue;
        if (story.time && !isFreshItem(story.time)) continue;
        let category: Category = 'official_blog';
        if (/sdk|api|framework|library|developer|code/i.test(titleLower)) category = 'developer_platform';
        else if (/model|gpt|claude|llama|release|benchmark/i.test(titleLower)) category = 'model_release';
        else if (/app|product|launch|chatgpt|consumer/i.test(titleLower)) category = 'product_ecosystem';
        const articleUrl = story.url || `https://news.ycombinator.com/item?id=${id}`;
        let articleSummary = '';
        if (story.url) { try { articleSummary = await fetchArticleSummary(story.url); } catch {} }
        if (!articleSummary) articleSummary = `[No summary available] HN discussion: ${story.score} points, ${story.descendants || 0} comments`;
        else articleSummary = articleSummary.slice(0, 500) + ` (HN: ${story.score} pts, ${story.descendants || 0} comments)`;
        items.push({
          id: `hn-${id}`, title: story.title, summary: articleSummary, url: articleUrl,
          source: 'Hacker News', source_tier: 4, category,
          score: Math.min(75, 50 + Math.floor(story.score / 50)), engagement: story.score,
          detected_at: new Date(story.time * 1000).toISOString(),
        });
      } catch {}
    }
  } catch (e) { console.log(`   ❌ Error: ${e}`); }
  console.log(`   ✅ Found ${items.length} AI stories`);
  return items;
}

// ============================================
// Tier 5: GitHub Trending
// ============================================

const GH_SEARCH_HEADERS = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'Hot2Content/2.0' };

interface GHSearchRepo {
  full_name: string; description: string | null; stargazers_count: number;
  html_url: string; created_at: string; language: string | null; topics?: string[];
}

async function ghSearchQuery(q: string, perPage: number = 30): Promise<GHSearchRepo[]> {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${perPage}`;
  const response = await fetch(url, { headers: GH_SEARCH_HEADERS });
  if (!response.ok) { console.log(`   ⚠️ GitHub Search API returned ${response.status}`); return []; }
  const data = await response.json();
  return data.items || [];
}

async function scanGitHub(): Promise<NewsItem[]> {
  console.log('📡 Tier 5: Scanning GitHub Trending (Search API)...');
  const allRepos: GHSearchRepo[] = [];
  const now = Date.now();
  const date7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const date3d = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const date90d = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  try {
    console.log('   🔍 Q1: New repos (7d, 50+ stars)...');
    const q1 = await ghSearchQuery(`created:>${date7d} stars:>50`);
    console.log(`      Found ${q1.length} repos`); allRepos.push(...q1);
    await new Promise(r => setTimeout(r, 2000));
    console.log('   🔍 Q2: Rising repos (8-90d, 100+ stars)...');
    const q2 = await ghSearchQuery(`stars:>100 created:${date90d}..${date7d} pushed:>${date3d}`);
    console.log(`      Found ${q2.length} repos`); allRepos.push(...q2);
    await new Promise(r => setTimeout(r, 2000));
    console.log('   🔍 Q3: Resurgent repos (hot topics, 200+ stars)...');
    for (const kw of ['mcp', 'agent', 'skill', 'plugin', 'memory', 'rag', 'claude code']) {
      const batch = await ghSearchQuery(`"${kw}" stars:>200 pushed:>${date3d}`, 15);
      console.log(`      "${kw}": ${batch.length} repos`); allRepos.push(...batch);
      await new Promise(r => setTimeout(r, 2000));
    }
  } catch (e) { console.log(`   ❌ Error: ${e}`); }

  const seen = new Set<string>();
  const deduped = allRepos.filter(r => { if (seen.has(r.full_name)) return false; seen.add(r.full_name); return true; });
  const items: NewsItem[] = deduped.map(r => ({
    id: `gh-${r.full_name.replace('/', '-')}`, title: r.full_name,
    summary: (r.description || '').slice(0, 200),
    action: `Star the repo (⭐${r.stargazers_count})`,
    url: r.html_url, source: 'GitHub Trending', source_tier: 5,
    category: 'developer_platform' as const,
    score: Math.min(90, 50 + Math.floor(r.stargazers_count / 100)),
    detected_at: new Date().toISOString(),
  }));
  console.log(`   ✅ Found ${items.length} unique repos from GitHub`);
  return items;
}

// ============================================
// Tier 6: Reddit
// ============================================

let redditAccessToken: string | null = null;

async function getRedditToken(): Promise<string | null> {
  if (redditAccessToken) return redditAccessToken;
  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) return null;
  try {
    const auth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');
    const resp = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'LoreAI/1.0 (by /u/morphph)' },
      body: 'grant_type=client_credentials',
    });
    if (!resp.ok) return null;
    const data = await resp.json() as any;
    redditAccessToken = data.access_token;
    return redditAccessToken;
  } catch { return null; }
}

async function scanReddit(): Promise<NewsItem[]> {
  console.log('📡 Tier 6: Scanning Reddit...');
  const items: NewsItem[] = [];
  const token = await getRedditToken();
  for (const subreddit of REDDIT_SUBREDDITS) {
    try {
      const url = token
        ? `https://oauth.reddit.com/r/${subreddit}/hot?limit=10`
        : `https://old.reddit.com/r/${subreddit}/hot/.json?limit=10`;
      const headers: Record<string, string> = { 'User-Agent': 'LoreAI/1.0 (by /u/morphph)', 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(url, { headers });
      if (!response.ok) { console.log(`   ⚠️ r/${subreddit} returned ${response.status}`); continue; }
      const data = await response.json() as any;
      const posts = data?.data?.children || [];
      for (const post of posts) {
        const item = post.data; if (!item) continue;
        if (item.score <= 50) continue;
        if (!isFreshItem(item.created_utc * 1000, FRESHNESS_HOURS)) continue;
        const title = item.title || '';
        const isRedditUrl = !item.url || /reddit\.com|redd\.it/i.test(item.url);
        let summary = '';
        if (isRedditUrl && item.selftext) summary = item.selftext.slice(0, 500);
        else if (!isRedditUrl && item.url) { try { summary = await fetchArticleSummary(item.url); } catch { summary = item.selftext?.slice(0, 500) || title; } }
        else summary = title;
        let category: Category;
        if (/model|release|benchmark|weights/i.test(title)) category = 'model_release';
        else if (/tool|sdk|api|library|framework/i.test(title)) category = 'developer_platform';
        else if (/paper|research|arxiv/i.test(title)) category = 'official_blog';
        else category = 'product_ecosystem';
        const postUrl = isRedditUrl ? `https://www.reddit.com${item.permalink}` : item.url;
        items.push({
          id: `reddit-${item.id}`, title, summary, url: postUrl,
          source: `Reddit r/${subreddit}`, source_tier: 3, category,
          score: Math.min(85, 50 + Math.floor(item.score / 100)), engagement: item.score,
          detected_at: new Date(item.created_utc * 1000).toISOString(),
        });
      }
      console.log(`   ✅ r/${subreddit}: ${posts.length} posts checked`);
    } catch (e) { console.log(`   ❌ r/${subreddit} error: ${e}`); }
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log(`   📊 Reddit total: ${items.length} items`);
  return items;
}

// ============================================
// Deduplication
// ============================================

function deduplicate(items: NewsItem[]): NewsItem[] {
  const sorted = [...items].sort((a, b) => {
    if (a.source_tier !== b.source_tier) return a.source_tier - b.source_tier;
    return b.score - a.score;
  });
  const kept: NewsItem[] = [];
  const keptTokens: Set<string>[] = [];
  for (const item of sorted) {
    const tokens = tokenize(item.title);
    let isDuplicate = false;
    for (let i = 0; i < kept.length; i++) {
      if (jaccardSimilarity(tokens, keptTokens[i]) > 0.5) { isDuplicate = true; break; }
    }
    if (!isDuplicate) { kept.push(item); keptTokens.push(tokens); }
  }
  return kept.sort((a, b) => b.score - a.score);
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  📡 LoreAI News Collector');
  console.log('═'.repeat(60));
  console.log('');

  const OUTPUT_DIR = path.join(process.cwd(), 'output');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const date = new Date().toISOString().split('T')[0];

  // Scan all tiers
  const officialItems = await scanOfficialBlogs();
  const twitterItems = await scanTwitter();
  const hnItems = await scanHackerNews();
  const ghItems = await scanGitHub();
  const redditItems = await scanReddit();

  const allItems = [...officialItems, ...twitterItems, ...hnItems, ...ghItems, ...redditItems];
  console.log(`\n🔄 Deduplicating ${allItems.length} items...`);
  const deduped = deduplicate(allItems);
  console.log(`   ✅ ${deduped.length} unique items`);

  // Insert into DB
  try {
    const db = getDb();
    initSchema(db);
    insertNewsItems(db, deduped.map(item => ({
      id: item.id, title: item.title, url: item.url, source: item.source,
      source_tier: item.source_tier, category: item.category, score: item.score,
      raw_summary: item.summary, detected_at: item.detected_at,
    })));
    console.log(`🗄️  Inserted ${deduped.length} news items into DB`);
    closeDb();
  } catch (e) {
    console.log(`⚠️ DB write error: ${e}`);
  }

  // Also save raw items JSON for compatibility
  const rawItems = deduped.map(item => ({
    id: item.id, title: item.title, summary: item.summary,
    full_text: item.summary, url: item.url, twitter_url: item.twitter_url || null,
    source: item.source, source_tier: item.source_tier, category: item.category,
    score: item.score, engagement: item.engagement || 0, detected_at: item.detected_at,
  }));
  const rawItemsPath = path.join(OUTPUT_DIR, `raw-items-${date}.json`);
  fs.writeFileSync(rawItemsPath, JSON.stringify({ date, count: rawItems.length, items: rawItems }, null, 2));

  // Stats
  console.log('\n📊 Collection Stats:');
  console.log(`   Official blogs: ${officialItems.length}`);
  console.log(`   Twitter: ${twitterItems.length}`);
  console.log(`   Hacker News: ${hnItems.length}`);
  console.log(`   GitHub: ${ghItems.length}`);
  console.log(`   Reddit: ${redditItems.length}`);
  console.log(`   Total raw: ${allItems.length}`);
  console.log(`   After dedup: ${deduped.length}`);
  console.log(`\n✅ Collection complete → ${rawItemsPath}`);
}

main().catch(console.error);
