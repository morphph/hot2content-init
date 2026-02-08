#!/usr/bin/env npx tsx
/**
 * Hot2Content Daily Scout v2
 * 
 * 参考 AI Daily Digest 格式，生成带分类、Twitter链接、Action建议的热点报告
 * 
 * 数据源:
 * - T1: 官方博客 (Anthropic, OpenAI, Google AI, etc.)
 * - T2: Twitter/X (官方账号 + KOL)
 * - T3: HuggingFace Trending
 * - T4: Hacker News
 * - T5: GitHub Trending
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env
dotenv.config();

// ============================================
// Types
// ============================================

// PRD 定义的四大分类
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
}

interface DailyDigest {
  date: string;
  generated_at: string;
  items: NewsItem[];
  by_category: Record<Category, NewsItem[]>;
  sources_scanned: {
    tier_1_official: number;
    tier_2_twitter: number;
    tier_3_huggingface: number;
    tier_4_hackernews: number;
    tier_5_github: number;
  };
  markdown: string;
}

// ============================================
// Config
// ============================================

const TWITTER_API_KEY = process.env.TWITTER_API_KEY || '';
const TWITTER_API_BASE = 'https://api.twitterapi.io';

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
  // Tier 1 - Official (模型发布)
  { handle: 'AnthropicAI', tier: 1, category: 'model_release' as Category },
  { handle: 'OpenAI', tier: 1, category: 'model_release' as Category },
  { handle: 'GoogleAI', tier: 1, category: 'model_release' as Category },
  { handle: 'DeepMind', tier: 1, category: 'official_blog' as Category },
  { handle: 'MistralAI', tier: 1, category: 'model_release' as Category },
  { handle: 'AIatMeta', tier: 1, category: 'model_release' as Category },
  // Tier 1 - Developer Platform (开发者平台/SDK)
  { handle: 'huggingface', tier: 1, category: 'developer_platform' as Category },
  { handle: 'OpenAIDevs', tier: 1, category: 'developer_platform' as Category },
  { handle: 'LangChainAI', tier: 1, category: 'developer_platform' as Category },
  // Tier 1 - Product (产品生态)
  { handle: 'claudeai', tier: 1, category: 'product_ecosystem' as Category },
  { handle: 'ChatGPTapp', tier: 1, category: 'product_ecosystem' as Category },
  // Tier 2 - KOLs
  { handle: 'sama', tier: 2, category: 'product_ecosystem' as Category },
  { handle: 'karpathy', tier: 2, category: 'official_blog' as Category },
  { handle: 'ylecun', tier: 2, category: 'official_blog' as Category },
  { handle: 'EMostaque', tier: 2, category: 'model_release' as Category },
  { handle: 'DrJimFan', tier: 2, category: 'official_blog' as Category },
];

// PRD 分类 - 按重要性排序：模型发布 > 开发者平台 > 技术博客 > 产品生态
const CATEGORY_EMOJI: Record<Category, string> = {
  model_release: '🧠',
  developer_platform: '🔧',
  official_blog: '📝',
  product_ecosystem: '📱',
};

const CATEGORY_LABEL: Record<Category, string> = {
  model_release: 'MODEL RELEASE',
  developer_platform: 'DEVELOPER PLATFORM',
  official_blog: 'OFFICIAL BLOG',
  product_ecosystem: 'PRODUCT ECOSYSTEM',
};

// 分类显示顺序
const CATEGORY_ORDER: Category[] = [
  'model_release',
  'developer_platform', 
  'official_blog',
  'product_ecosystem',
];

// ============================================
// Twitter API
// ============================================

async function fetchTwitter(handle: string): Promise<any[]> {
  if (!TWITTER_API_KEY) return [];
  
  try {
    const response = await fetch(
      `${TWITTER_API_BASE}/twitter/user/last_tweets?userName=${handle}&count=5`,
      {
        headers: {
          'X-API-Key': TWITTER_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.data?.tweets || data.tweets || [];
  } catch (e) {
    return [];
  }
}

// ============================================
// Tier 2: Twitter/X Scanner
// ============================================

async function scanTwitter(): Promise<NewsItem[]> {
  console.log('📡 Tier 2: Scanning Twitter/X...');
  const items: NewsItem[] = [];
  
  if (!TWITTER_API_KEY) {
    console.log('   ⚠️ No API key, skipping');
    return items;
  }

  for (const account of TWITTER_ACCOUNTS) {
    try {
      console.log(`   - @${account.handle}...`);
      const tweets = await fetchTwitter(account.handle);
      
      for (const tweet of tweets) {
        const text = tweet.text || tweet.full_text || '';
        const tweetId = tweet.id || tweet.id_str;
        
        // Skip retweets and replies
        if (text.startsWith('RT @') || text.startsWith('@')) continue;
        
        // Check if it's about AI/tech
        const isRelevant = /ai|llm|gpt|claude|model|agent|training|inference|benchmark/i.test(text);
        if (!isRelevant && account.tier > 1) continue;
        
        // Extract engagement
        const likes = tweet.favorite_count || tweet.public_metrics?.like_count || 0;
        const retweets = tweet.retweet_count || tweet.public_metrics?.retweet_count || 0;
        const engagement = likes + retweets * 2;
        
        // Skip low engagement for tier 2
        if (account.tier === 2 && engagement < 100) continue;
        
        // Generate title from first line or first 100 chars
        const title = text.split('\n')[0].slice(0, 100).trim() || text.slice(0, 100).trim();
        
        // Generate action if applicable
        let action: string | undefined;
        if (/available|released|launched|try|check out/i.test(text)) {
          action = 'Check it out';
        } else if (/update|upgrade|new version/i.test(text)) {
          action = 'Review changes';
        }
        
        const score = account.tier === 1 ? 80 : Math.min(70, 50 + Math.floor(engagement / 100));
        
        items.push({
          id: `twitter-${tweetId}`,
          title,
          summary: text.slice(0, 280),
          action,
          url: `https://x.com/${account.handle}/status/${tweetId}`,
          twitter_url: `https://x.com/${account.handle}/status/${tweetId}`,
          source: `@${account.handle}`,
          source_tier: account.tier,
          category: account.category,
          score,
          engagement,
          detected_at: tweet.created_at || new Date().toISOString(),
        });
      }
    } catch (e) {
      console.log(`   ❌ @${account.handle}: ${e}`);
    }
  }
  
  console.log(`   ✅ Found ${items.length} tweets`);
  return items;
}

// ============================================
// Tier 3: HuggingFace Trending
// ============================================

async function scanHuggingFace(): Promise<NewsItem[]> {
  console.log('📡 Tier 3: Scanning HuggingFace Trending...');
  const items: NewsItem[] = [];

  try {
    // Use the models API sorted by likes
    const response = await fetch('https://huggingface.co/api/models?sort=likes&direction=-1&limit=10');
    if (!response.ok) {
      console.log(`   ⚠️ HF returned ${response.status}`);
      return items;
    }

    const models: any[] = await response.json();
    
    for (const model of models.slice(0, 5)) {
      const modelId = model.id || model.modelId;
      const likes = model.likes || 0;
      const downloads = model.downloads || 0;
      
      items.push({
        id: `hf-${modelId.replace('/', '-')}`,
        title: `Trending: ${modelId}`,
        summary: `${likes.toLocaleString()}❤️, ${downloads.toLocaleString()} downloads. ${model.pipeline_tag || 'General model'}`,
        action: 'Try it on HuggingFace',
        url: `https://huggingface.co/${modelId}`,
        source: 'HuggingFace Trending',
        source_tier: 3,
        category: 'developer_platform',  // HF 属于开发者平台
        score: Math.min(75, 50 + Math.floor(likes / 100)),
        engagement: likes,
        detected_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e}`);
  }

  console.log(`   ✅ Found ${items.length} trending models`);
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
        const isAI = /ai|llm|gpt|claude|anthropic|openai|machine learning|neural|transformer|model|agent/i.test(titleLower);
        
        if (!isAI || story.score < 50) continue;
        
        // Determine category (PRD分类)
        let category: Category = 'official_blog';  // 默认归类为技术博客
        if (/sdk|api|framework|library|developer|code/i.test(titleLower)) category = 'developer_platform';
        else if (/model|gpt|claude|llama|release|benchmark/i.test(titleLower)) category = 'model_release';
        else if (/app|product|launch|chatgpt|consumer/i.test(titleLower)) category = 'product_ecosystem';
        
        items.push({
          id: `hn-${id}`,
          title: story.title,
          summary: `HN discussion: ${story.score} points, ${story.descendants || 0} comments`,
          url: story.url || `https://news.ycombinator.com/item?id=${id}`,
          source: 'Hacker News',
          source_tier: 4,
          category,
          score: Math.min(75, 50 + Math.floor(story.score / 50)),
          engagement: story.score,
          detected_at: new Date(story.time * 1000).toISOString(),
        });
      } catch (e) {
        // Skip individual errors
      }
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e}`);
  }

  console.log(`   ✅ Found ${items.length} AI stories`);
  return items;
}

// ============================================
// Tier 5: GitHub Trending
// ============================================

async function scanGitHub(): Promise<NewsItem[]> {
  console.log('📡 Tier 5: Scanning GitHub Trending...');
  const items: NewsItem[] = [];

  try {
    const response = await fetch('https://github.com/trending?since=daily', {
      headers: { 'User-Agent': 'Hot2Content/2.0' }
    });

    if (!response.ok) {
      console.log(`   ⚠️ GitHub returned ${response.status}`);
      return items;
    }

    const html = await response.text();
    
    // Extract repo info using regex
    const repoPattern = /<h2 class="h3[^"]*">\s*<a href="\/([^"]+)"[^>]*>/g;
    const descPattern = /<p class="col-[^"]*">([^<]+)<\/p>/g;
    
    const repos: string[] = [];
    const descs: string[] = [];
    
    let match;
    while ((match = repoPattern.exec(html)) !== null) {
      repos.push(match[1]);
    }
    while ((match = descPattern.exec(html)) !== null) {
      descs.push(match[1].trim());
    }

    for (let i = 0; i < Math.min(repos.length, 10); i++) {
      const repoPath = repos[i];
      const desc = descs[i] || '';
      
      const isAI = /ai|llm|gpt|claude|model|machine.?learning|neural|transformer|agent/i.test(desc);
      if (!isAI) continue;
      
      items.push({
        id: `gh-${repoPath.replace('/', '-')}`,
        title: repoPath,
        summary: desc.slice(0, 200),
        action: 'Star the repo',
        url: `https://github.com/${repoPath}`,
        source: 'GitHub Trending',
        source_tier: 5,
        category: 'developer_platform',  // GitHub 项目属于开发者平台
        score: 60,
        detected_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e}`);
  }

  console.log(`   ✅ Found ${items.length} AI repos`);
  return items;
}

// ============================================
// Deduplication
// ============================================

function deduplicate(items: NewsItem[]): NewsItem[] {
  const seen = new Map<string, NewsItem>();
  
  for (const item of items) {
    // Create key from normalized title
    const key = item.title.toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '')
      .slice(0, 50);
    
    if (!seen.has(key) || seen.get(key)!.score < item.score) {
      seen.set(key, item);
    }
  }
  
  return Array.from(seen.values())
    .sort((a, b) => b.score - a.score);
}

// ============================================
// Generate Markdown
// ============================================

function generateMarkdown(digest: DailyDigest): string {
  const lines: string[] = [];
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  lines.push(`# AI Daily Digest — ${date}`);
  lines.push('');
  
  // 按 PRD 定义的顺序显示：模型发布 > 开发者平台 > 技术博客 > 产品生态
  for (const category of CATEGORY_ORDER) {
    const items = digest.by_category[category];
    if (!items || items.length === 0) continue;
    
    lines.push(`## ${CATEGORY_EMOJI[category]} ${CATEGORY_LABEL[category]}`);
    lines.push('');
    
    for (const item of items.slice(0, 5)) {
      lines.push(`### ${item.title}`);
      lines.push(item.summary);
      if (item.action) {
        lines.push(`⚡ Action: ${item.action}`);
      }
      lines.push(`🔗 ${item.twitter_url || item.url}`);
      lines.push('');
    }
    
    lines.push('---');
    lines.push('');
  }
  
  return lines.join('\n');
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  🔥 Hot2Content Daily Scout v2');
  console.log('  AI Daily Digest 格式');
  console.log('═'.repeat(60));
  console.log('\n');

  // Scan all tiers
  const twitterItems = await scanTwitter();
  const hfItems = await scanHuggingFace();
  const hnItems = await scanHackerNews();
  const ghItems = await scanGitHub();

  // Combine and deduplicate
  const allItems = [...twitterItems, ...hfItems, ...hnItems, ...ghItems];
  console.log(`\n🔄 Deduplicating ${allItems.length} items...`);
  
  const deduped = deduplicate(allItems);
  console.log(`   ✅ ${deduped.length} unique items`);

  // Group by category (PRD 分类)
  const byCategory: Record<Category, NewsItem[]> = {
    model_release: [],
    developer_platform: [],
    official_blog: [],
    product_ecosystem: [],
  };
  
  for (const item of deduped) {
    byCategory[item.category].push(item);
  }

  // Create digest
  const digest: DailyDigest = {
    date: new Date().toISOString().split('T')[0],
    generated_at: new Date().toISOString(),
    items: deduped.slice(0, 20),
    by_category: byCategory,
    sources_scanned: {
      tier_1_official: OFFICIAL_BLOGS.length,
      tier_2_twitter: TWITTER_ACCOUNTS.length,
      tier_3_huggingface: 10,
      tier_4_hackernews: 30,
      tier_5_github: 10,
    },
    markdown: '',
  };
  
  digest.markdown = generateMarkdown(digest);

  // Save outputs
  const outputDir = path.join(process.cwd(), 'output');
  fs.mkdirSync(outputDir, { recursive: true });
  
  // JSON
  const jsonPath = path.join(outputDir, 'daily-digest.json');
  fs.writeFileSync(jsonPath, JSON.stringify(digest, null, 2));
  
  // Markdown
  const mdPath = path.join(outputDir, `digest-${digest.date}.md`);
  fs.writeFileSync(mdPath, digest.markdown);
  
  // Newsletter data
  const newsletterDir = path.join(process.cwd(), 'src', 'data');
  fs.mkdirSync(newsletterDir, { recursive: true });
  fs.writeFileSync(
    path.join(newsletterDir, 'newsletter.json'),
    JSON.stringify(digest, null, 2)
  );

  // Print summary
  console.log('\n📊 Digest Summary:\n');
  for (const [cat, items] of Object.entries(byCategory)) {
    if (items.length > 0) {
      console.log(`${CATEGORY_EMOJI[cat as Category]} ${CATEGORY_LABEL[cat as Category]}: ${items.length} items`);
    }
  }
  
  console.log('\n📝 Top 5 Items:\n');
  for (const item of deduped.slice(0, 5)) {
    console.log(`[${item.score}] ${CATEGORY_EMOJI[item.category]} ${item.title.slice(0, 60)}`);
    console.log(`    ${item.source} → ${item.url.slice(0, 50)}...`);
    console.log('');
  }

  console.log(`\n✅ Saved JSON: ${jsonPath}`);
  console.log(`✅ Saved Markdown: ${mdPath}`);
  console.log(`✅ Newsletter updated`);

  return digest;
}

main().catch(console.error);

export { NewsItem, DailyDigest, main as runDailyScout };
