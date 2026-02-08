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
// Gemini AI Enhancement
// ============================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

interface NewsletterSection {
  category: Category;
  items: Array<{
    title: string;
    summary: string;
    url: string;
    source?: string;
  }>;
}

interface NewsletterContent {
  intro: string;
  sections: NewsletterSection[];
  closing: string;
}

async function writeNewsletterWithGemini(items: NewsItem[]): Promise<NewsletterContent | null> {
  if (!GEMINI_API_KEY) {
    console.log('   ⚠️ No Gemini API key, skipping newsletter generation');
    return null;
  }

  console.log('🤖 Writing newsletter with Gemini...');
  
  // Group items by category for the writer
  const byCategory: Record<Category, NewsItem[]> = {
    model_release: [],
    developer_platform: [],
    official_blog: [],
    product_ecosystem: [],
  };
  
  for (const item of items.slice(0, 30)) {
    byCategory[item.category].push(item);
  }
  
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  
  const prompt = `You are the editor of "Hot2Content Daily", an AI newsletter like Superhuman AI.

Today is ${date}. Write a professional newsletter based on these news items.

## Style Guide:
- Write like Superhuman AI: concise, professional, insightful
- Each item needs 1-2 sentences explaining WHAT happened and WHY it matters
- Use engaging but not hype language
- Be specific with facts, not vague

## Categories (use exactly these):
1. 🧠 MODEL RELEASE - New AI model announcements (Claude, GPT, Gemini, etc.)
2. 🔧 DEVELOPER PLATFORM - SDKs, APIs, tools, developer integrations
3. 📝 OFFICIAL BLOG - Research papers, engineering deep-dives
4. 📱 PRODUCT ECOSYSTEM - Product features, partnerships, business news

## Raw News Data:

### Model Release candidates:
${byCategory.model_release.slice(0, 5).map(i => `- ${i.title}\n  Source: ${i.source}\n  Raw: ${i.summary.slice(0, 150)}\n  URL: ${i.url}`).join('\n\n')}

### Developer Platform candidates:
${byCategory.developer_platform.slice(0, 5).map(i => `- ${i.title}\n  Source: ${i.source}\n  Raw: ${i.summary.slice(0, 150)}\n  URL: ${i.url}`).join('\n\n')}

### Official Blog candidates:
${byCategory.official_blog.slice(0, 5).map(i => `- ${i.title}\n  Source: ${i.source}\n  Raw: ${i.summary.slice(0, 150)}\n  URL: ${i.url}`).join('\n\n')}

### Product Ecosystem candidates:
${byCategory.product_ecosystem.slice(0, 5).map(i => `- ${i.title}\n  Source: ${i.source}\n  Raw: ${i.summary.slice(0, 150)}\n  URL: ${i.url}`).join('\n\n')}

## Output Format (JSON):
{
  "intro": "One engaging sentence about today's AI news",
  "sections": [
    {
      "category": "model_release",
      "items": [
        {
          "title": "Clean title (no truncation)",
          "summary": "1-2 sentences: What happened + Why it matters",
          "url": "original URL",
          "source": "@handle or Source Name (optional)"
        }
      ]
    }
  ],
  "closing": "Brief sign-off"
}

Pick the 2-3 most important items per category. Skip categories with nothing newsworthy.
Return ONLY valid JSON, no markdown code blocks.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 3000,
          }
        })
      }
    );

    if (!response.ok) {
      console.log(`   ⚠️ Gemini API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('   ⚠️ Could not parse Gemini response');
      console.log('   Raw response:', text.slice(0, 500));
      return null;
    }

    const newsletter: NewsletterContent = JSON.parse(jsonMatch[0]);
    console.log(`   ✅ Newsletter written with ${newsletter.sections.length} sections`);
    return newsletter;
    
  } catch (e) {
    console.log(`   ⚠️ Gemini newsletter error: ${e}`);
    return null;
  }
}

// Keep old function for fallback
async function enhanceWithGemini(items: NewsItem[]): Promise<NewsItem[]> {
  return items; // Now handled by writeNewsletterWithGemini
}

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
// Tier 1: Official Blogs (RSS + Web Scraping)
// ============================================

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
}

async function parseRSS(url: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Hot2Content/2.0' }
    });
    if (!response.ok) return [];
    
    const xml = await response.text();
    const items: RSSItem[] = [];
    
    // Simple XML parsing with regex (works for RSS)
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
    
    return items.slice(0, 10); // Last 10 items
  } catch (e) {
    console.log(`   ⚠️ RSS parse error: ${e}`);
    return [];
  }
}

async function fetchArticleSummary(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    });
    if (!response.ok) return '';
    
    const html = await response.text();
    
    // 1. Try to find article summary in Hero section (most specific)
    const heroMatch = html.match(/<p[^>]*class="[^"]*summary[^"]*"[^>]*>([^<]+)/);
    if (heroMatch && heroMatch[1].length > 30) {
      return heroMatch[1].slice(0, 280).trim().replace(/&#x27;/g, "'");
    }
    
    // 2. Try meta description (skip if it's the generic Anthropic description)
    const metaMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/);
    if (metaMatch && metaMatch[1].length > 50 && !metaMatch[1].includes('AI safety and research company')) {
      return metaMatch[1].slice(0, 280).replace(/&#x27;/g, "'");
    }
    
    // 3. Fallback: find first paragraph with substantial article content
    const pMatch = html.match(/<p[^>]*post-text[^>]*>([^<]{50,})/);
    if (pMatch) {
      return pMatch[1].slice(0, 280).trim().replace(/&#x27;/g, "'");
    }
    
    return '';
  } catch {
    return '';
  }
}

async function fetchAnthropicEngineering(): Promise<NewsItem[]> {
  const items: NewsItem[] = [];
  try {
    // Anthropic Engineering blog - developer-focused technical content
    const response = await fetch('https://www.anthropic.com/engineering', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
    });
    if (!response.ok) return items;
    
    const html = await response.text();
    const seen = new Set<string>();
    const articlesToFetch: { slug: string; title: string }[] = [];
    
    // 1. Featured article: title in img alt attribute
    const featuredPattern = /href="\/engineering\/([^"]+)"[\s\S]*?<img[^>]*alt="([^"]+)"/g;
    let match = featuredPattern.exec(html);
    if (match) {
      const slug = match[1];
      const title = match[2].trim();
      if (title.length > 10 && !seen.has(slug)) {
        seen.add(slug);
        articlesToFetch.push({ slug, title });
      }
    }
    
    // 2. List articles: title in h3 tag
    const listPattern = /href="\/engineering\/([^"]+)"[\s\S]*?<h3[^>]*headline[^>]*>([^<]+)<\/h3>/g;
    while ((match = listPattern.exec(html)) !== null && articlesToFetch.length < 5) {
      const slug = match[1];
      const title = match[2].trim();
      
      if (seen.has(slug) || !title || title.length < 10) continue;
      seen.add(slug);
      articlesToFetch.push({ slug, title });
    }
    
    // 3. Fetch real summaries for each article (parallel)
    console.log(`      Fetching summaries for ${articlesToFetch.length} articles...`);
    const summaries = await Promise.all(
      articlesToFetch.map(a => fetchArticleSummary(`https://www.anthropic.com/engineering/${a.slug}`))
    );
    
    // 4. Build items with real summaries
    for (let i = 0; i < articlesToFetch.length; i++) {
      const { slug, title } = articlesToFetch[i];
      const summary = summaries[i] || 'Anthropic Engineering - developer-focused technical guide';
      
      items.push({
        id: `anthropic-eng-${slug}`,
        title: title,
        summary: summary,
        url: `https://www.anthropic.com/engineering/${slug}`,
        source: 'Anthropic Engineering',
        source_tier: 1,
        category: 'official_blog',
        score: 92,
        detected_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.log(`   ⚠️ Anthropic Engineering fetch error: ${e}`);
  }
  return items;
}

async function fetchAnthropicNews(): Promise<NewsItem[]> {
  const items: NewsItem[] = [];
  try {
    const response = await fetch('https://www.anthropic.com/news', {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });
    if (!response.ok) return items;
    
    const html = await response.text();
    const seen = new Set<string>();
    
    // Use PublicationList (chronological order) instead of FeaturedGrid
    // Pattern: href="/news/SLUG"...<time>DATE</time>...<span class="...title...">TITLE</span>
    const listPattern = /<a[^>]*href="\/news\/([^"]+)"[^>]*PublicationList[^>]*>[\s\S]*?<time[^>]*>([^<]+)<\/time>[\s\S]*?<span[^>]*title[^>]*>([^<]+)<\/span>[\s\S]*?<\/a>/g;
    let match;
    
    while ((match = listPattern.exec(html)) !== null && items.length < 5) {
      const slug = match[1];
      const date = match[2].trim();
      const title = match[3].trim();
      
      if (seen.has(slug) || !title || title.length < 5) continue;
      seen.add(slug);
      
      // Smart category detection: model releases vs general announcements
      let category: Category = 'official_blog';
      if (/introducing|claude|opus|sonnet|haiku|model/i.test(title) && 
          !/research|paper|study|blog/i.test(title)) {
        category = 'model_release';
      }
      
      items.push({
        id: `anthropic-news-${slug}`,
        title: title,
        summary: `Anthropic announcement (${date})`,
        url: `https://www.anthropic.com/news/${slug}`,
        source: 'Anthropic Blog',
        source_tier: 1,
        category,
        score: category === 'model_release' ? 95 : 90, // Boost model releases
        detected_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.log(`   ⚠️ Anthropic News fetch error: ${e}`);
  }
  return items;
}

async function scanOfficialBlogs(): Promise<NewsItem[]> {
  console.log('📡 Tier 1: Scanning Official Blogs...');
  const items: NewsItem[] = [];
  
  // 1. Google AI Blog (RSS)
  console.log('   - Google AI Blog (RSS)...');
  const googleItems = await parseRSS('https://blog.google/technology/ai/rss/');
  for (const item of googleItems.slice(0, 5)) {
    // Check if it's AI-related (filter out general Google news)
    const isAI = /ai|gemini|model|deepmind|machine learning|neural/i.test(item.title + item.description);
    if (!isAI) continue;
    
    items.push({
      id: `google-${Buffer.from(item.link).toString('base64').slice(0, 20)}`,
      title: item.title,
      summary: item.description?.replace(/<[^>]+>/g, '').slice(0, 280) || 'Google AI official blog post',
      url: item.link,
      source: 'Google AI Blog',
      source_tier: 1,
      category: 'official_blog',
      score: 88,
      detected_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    });
  }
  console.log(`   ✅ Google AI: ${items.length} items`);
  
  // 2. Anthropic Engineering (Developer-focused technical content)
  console.log('   - Anthropic Engineering...');
  const anthropicEngineering = await fetchAnthropicEngineering();
  items.push(...anthropicEngineering);
  console.log(`   ✅ Anthropic Engineering: ${anthropicEngineering.length} items`);
  
  // 3. Anthropic News (Announcements)
  console.log('   - Anthropic News...');
  const anthropicNews = await fetchAnthropicNews();
  items.push(...anthropicNews);
  console.log(`   ✅ Anthropic News: ${anthropicNews.length} items`);
  
  // 4. HuggingFace Blog (RSS)
  console.log('   - HuggingFace Blog (RSS)...');
  const hfBlogItems = await parseRSS('https://huggingface.co/blog/feed.xml');
  for (const item of hfBlogItems.slice(0, 5)) {
    // Try description, fallback to "New post: [title]"
    let summary = item.description?.replace(/<[^>]+>/g, '').trim().slice(0, 280);
    if (!summary || summary.length < 20) {
      summary = `New from Hugging Face: ${item.title}`;
    }
    items.push({
      id: `hf-blog-${Buffer.from(item.link).toString('base64').slice(0, 20)}`,
      title: item.title,
      summary,
      url: item.link,
      source: 'HuggingFace Blog',
      source_tier: 1,
      category: 'official_blog',
      score: 85,
      detected_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    });
  }
  console.log(`   ✅ HuggingFace Blog: ${hfBlogItems.length} items`);
  
  console.log(`   ✅ Total official blog items: ${items.length}`);
  return items;
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
        
        // Filter low-quality tweets (only emoji/links)
        if (isLowQualityTweet(text)) {
          console.log(`      ⏭️ Filtered low-quality: "${text.slice(0, 50)}..."`);
          continue;
        }
        
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
        
        // Smart category detection based on content
        let category = account.category;
        const textLower = text.toLowerCase();
        
        // Model Release: new model announcements
        if (/introducing|announcing|released?|launching|new model|opus|sonnet|gpt-?\d|gemini|mistral|llama/i.test(text) &&
            !/blog|research|paper|study/i.test(text)) {
          category = 'model_release';
        }
        // Official Blog: engineering/research content
        else if (/engineering blog|research|paper|study|findings|analysis/i.test(text)) {
          category = 'official_blog';
        }
        // Developer Platform: SDK, API, tools
        else if (/sdk|api|developer|integration|platform|tools|library/i.test(text)) {
          category = 'developer_platform';
        }
        
        items.push({
          id: `twitter-${tweetId}`,
          title,
          summary: text.slice(0, 280),
          action,
          url: `https://x.com/${account.handle}/status/${tweetId}`,
          twitter_url: `https://x.com/${account.handle}/status/${tweetId}`,
          source: `@${account.handle}`,
          source_tier: account.tier,
          category,
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
// Low-Quality Tweet Filter
// ============================================

function isLowQualityTweet(text: string): boolean {
  // Remove URLs
  const noUrls = text.replace(/https?:\/\/\S+/g, '').trim();
  
  // Remove emojis
  const noEmoji = noUrls.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu, '').trim();
  
  // Check if remaining content is too short (relaxed threshold)
  if (noEmoji.length < 20) return true;
  
  // Check if it's mostly hashtags
  const hashtagCount = (text.match(/#\w+/g) || []).length;
  const words = noEmoji.split(/\s+/).filter(w => w.length > 0);
  if (hashtagCount > words.length * 0.6) return true;
  
  // Holiday/greeting patterns
  if (/^(merry|happy|good\s*(morning|night|bot)|thank|congratulations?)/i.test(noEmoji)) return true;
  
  return false;
}

// ============================================
// Fuzzy Title Similarity (Jaccard)
// ============================================

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
// Enhanced Deduplication
// ============================================

function deduplicate(items: NewsItem[]): NewsItem[] {
  // Sort by tier (lower tier = higher priority) then by score
  const sorted = [...items].sort((a, b) => {
    if (a.source_tier !== b.source_tier) return a.source_tier - b.source_tier;
    return b.score - a.score;
  });
  
  const kept: NewsItem[] = [];
  const keptTokens: Set<string>[] = [];
  
  for (const item of sorted) {
    const tokens = tokenize(item.title);
    
    // Check similarity with all kept items
    let isDuplicate = false;
    for (let i = 0; i < kept.length; i++) {
      const similarity = jaccardSimilarity(tokens, keptTokens[i]);
      if (similarity > 0.5) {
        // Duplicate found - keep the one with lower tier (higher priority)
        // Since we sorted by tier first, current item would be same or worse
        isDuplicate = true;
        console.log(`   🔄 Dedup: "${item.title.slice(0, 40)}..." ≈ "${kept[i].title.slice(0, 40)}..."`);
        break;
      }
    }
    
    if (!isDuplicate) {
      kept.push(item);
      keptTokens.push(tokens);
    }
  }
  
  // Re-sort by score for final output
  return kept.sort((a, b) => b.score - a.score);
}

// ============================================
// Generate Markdown from Newsletter Content (Gemini output)
// ============================================

function generateMarkdownFromNewsletter(newsletter: NewsletterContent): string {
  const lines: string[] = [];
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  
  // Header
  lines.push(`# 🔥 Hot2Content Daily — ${date}`);
  lines.push('');
  lines.push(`> ${newsletter.intro}`);
  lines.push('');
  
  // Sections
  for (const section of newsletter.sections) {
    const cat = section.category as Category;
    const emoji = CATEGORY_EMOJI[cat] || '';
    const label = CATEGORY_LABEL[cat] || section.category.replace(/_/g, ' ').toUpperCase();
    
    lines.push(`## ${emoji} ${label}`);
    lines.push('');
    
    for (const item of section.items) {
      const sourceTag = item.source ? ` — ${item.source}` : '';
      lines.push(`**${item.title}**${sourceTag}`);
      lines.push(item.summary);
      lines.push(`[Read more →](${item.url})`);
      lines.push('');
    }
    
    lines.push('---');
    lines.push('');
  }
  
  // Footer
  lines.push(`*${newsletter.closing}*`);
  lines.push('');
  
  return lines.join('\n');
}

// ============================================
// Generate Markdown (Fallback - PRD Categories)
// ============================================

function generateMarkdown(digest: DailyDigest, allItems: NewsItem[]): string {
  const lines: string[] = [];
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  
  // ===== HEADER =====
  lines.push(`# 🔥 Hot2Content Daily — ${date}`);
  lines.push('');
  lines.push('> Get smarter about AI in 3 minutes.');
  lines.push('');
  
  // ===== PRD CATEGORIES (each as a "box") =====
  for (const category of CATEGORY_ORDER) {
    const items = digest.by_category[category];
    if (!items || items.length === 0) continue;
    
    const emoji = CATEGORY_EMOJI[category];
    const label = CATEGORY_LABEL[category];
    
    lines.push(`## ${emoji} ${label}`);
    lines.push('');
    
    // Show top 2 items per category with quality content
    const maxItems = category === 'official_blog' ? 2 : 3;
    for (const item of items.slice(0, maxItems)) {
      // Clean up title
      const title = item.title.replace(/https?:\/\/\S+/g, '').trim().slice(0, 80);
      
      // Format summary - make it readable
      let summary = item.summary
        .replace(/https?:\/\/\S+/g, '')  // remove URLs
        .replace(/&apos;/g, "'")          // fix HTML entities
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .trim()
        .slice(0, 200);
      
      // Add source attribution for Twitter
      const sourceTag = item.source.startsWith('@') ? ` — ${item.source}` : '';
      
      lines.push(`**${title}**${sourceTag}`);
      lines.push(`${summary}`);
      
      // Action + Link
      if (item.action) {
        lines.push(`⚡ ${item.action} → [Link](${item.url})`);
      } else {
        lines.push(`[Read more →](${item.url})`);
      }
      lines.push('');
    }
    
    lines.push('---');
    lines.push('');
  }
  
  // ===== FOOTER =====
  lines.push('*Stay ahead. Build smarter. — Hot2Content*');
  lines.push('');
  
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
  const officialItems = await scanOfficialBlogs();  // Tier 1: Official blogs
  const twitterItems = await scanTwitter();         // Tier 2: Twitter
  const hfItems = await scanHuggingFace();          // Tier 3: HuggingFace trending
  const hnItems = await scanHackerNews();           // Tier 4: Hacker News
  const ghItems = await scanGitHub();               // Tier 5: GitHub

  // Combine and deduplicate
  const allItems = [...officialItems, ...twitterItems, ...hfItems, ...hnItems, ...ghItems];
  console.log(`\n🔄 Deduplicating ${allItems.length} items...`);
  
  const deduped = deduplicate(allItems);
  console.log(`   ✅ ${deduped.length} unique items`);

  // Group by category first (for Gemini input)
  const byCategory: Record<Category, NewsItem[]> = {
    model_release: [],
    developer_platform: [],
    official_blog: [],
    product_ecosystem: [],
  };
  
  for (const item of deduped) {
    byCategory[item.category].push(item);
  }

  // Write newsletter with Gemini AI
  console.log('');
  const newsletterContent = await writeNewsletterWithGemini(deduped);

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
  
  // Generate markdown from newsletter content (or fallback)
  digest.markdown = newsletterContent 
    ? generateMarkdownFromNewsletter(newsletterContent)
    : generateMarkdown(digest, deduped);

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
