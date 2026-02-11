#!/usr/bin/env npx tsx
/**
 * LoreAI Daily Scout v2
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
import { getDb, initSchema, insertNewsItems, getRecentUrls, insertContent, linkContentSources, closeDb } from '../src/lib/db.js';

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
  { handle: 'GoogleDeepMind', tier: 1, category: 'official_blog' as Category },
  { handle: 'MistralAI', tier: 1, category: 'model_release' as Category },
  { handle: 'AIatMeta', tier: 1, category: 'model_release' as Category },
  // Tier 1 - Developer Platform (开发者平台/SDK)
  // { handle: 'huggingface', tier: 1, category: 'developer_platform' as Category }, // Removed: low signal-to-noise
  { handle: 'OpenAIDevs', tier: 1, category: 'developer_platform' as Category },
  { handle: 'LangChainAI', tier: 1, category: 'developer_platform' as Category },
  // Tier 1 - Product (产品生态)
  { handle: 'claudeai', tier: 1, category: 'product_ecosystem' as Category },
  { handle: 'ChatGPTapp', tier: 1, category: 'product_ecosystem' as Category },
  // Tier 1 - Anthropic Team (内部人员，第一手动态)
  { handle: 'bcherny', tier: 1, category: 'developer_platform' as Category },
  { handle: 'alexalbert__', tier: 1, category: 'product_ecosystem' as Category },
  { handle: 'ErikSchluntz', tier: 1, category: 'developer_platform' as Category },
  { handle: 'mikeyk', tier: 1, category: 'product_ecosystem' as Category },
  { handle: 'felixrieseberg', tier: 1, category: 'developer_platform' as Category },
  { handle: 'adocomplete', tier: 1, category: 'developer_platform' as Category },
  // Tier 2 - AI Engineering
  { handle: 'simonw', tier: 2, category: 'developer_platform' as Category },
  { handle: 'chipro', tier: 2, category: 'developer_platform' as Category },
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
  headline: string;
  intro: string;
  sections: NewsletterSection[];
  closing: string;
}

async function loadNewsletterSkill(): Promise<string> {
  const skillPath = path.join(process.cwd(), 'skills', 'newsletter-en', 'SKILL.md');
  try {
    return fs.readFileSync(skillPath, 'utf-8');
  } catch {
    console.log('   ⚠️ Newsletter skill not found, using inline style guide');
    return '';
  }
}

async function writeNewsletterWithGemini(items: NewsItem[]): Promise<NewsletterContent | null> {
  if (!GEMINI_API_KEY) {
    console.log('   ⚠️ No Gemini API key, skipping newsletter generation');
    return null;
  }

  console.log('🤖 Writing newsletter with Gemini...');
  
  // Load writing skill
  const skill = await loadNewsletterSkill();
  
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
  
  // Extract just the voice/tone and per-item rules from skill (not the full markdown template)
  const extractSkillGuidance = (fullSkill: string): string => {
    const sections: string[] = [];
    // Extract Voice & Tone section
    const voiceMatch = fullSkill.match(/## Voice & Tone\n([\s\S]*?)(?=\n## (?!Voice))/);
    if (voiceMatch) sections.push('## Voice & Tone\n' + voiceMatch[1].trim());
    // Extract Per-Item Rules
    const itemRulesMatch = fullSkill.match(/## Per-Item Rules\n([\s\S]*?)(?=\n## )/);
    if (itemRulesMatch) sections.push('## Per-Item Rules\n' + itemRulesMatch[1].trim());
    // Extract Title Rules
    const titleMatch = fullSkill.match(/## Title Rules\n([\s\S]*?)(?=\n## )/);
    if (titleMatch) sections.push('## Title Rules\n' + titleMatch[1].trim());
    // Extract Intro Paragraph Rules
    const introMatch = fullSkill.match(/## Intro Paragraph Rules\n([\s\S]*?)(?=\n## )/);
    if (introMatch) sections.push('## Intro Paragraph Rules\n' + introMatch[1].trim());
    return sections.join('\n\n');
  };

  const skillSection = skill 
    ? `## Writing Style Guide (follow strictly):\n${extractSkillGuidance(skill)}\n\n`
    : `## Style Guide:
- Write like Superhuman AI: concise, professional, insightful
- Each item needs 1-2 sentences explaining WHAT happened and WHY it matters
- Use engaging but not hype language
- Be specific with facts, not vague

## Categories (use exactly these):
1. 🧠 MODEL RELEASE - New AI model announcements (Claude, GPT, Gemini, etc.)
2. 🔧 DEVELOPER PLATFORM - SDKs, APIs, tools, developer integrations
3. 📝 OFFICIAL BLOG - Research papers, engineering deep-dives
4. 📱 PRODUCT ECOSYSTEM - Product features, partnerships, business news\n\n`;

  const prompt = `You are the editor of "LoreAI Daily", an AI newsletter.

Today is ${date}. Write a professional newsletter based on these news items.

${skillSection}

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
  "headline": "A catchy, news-style headline — NOT a date label. Good: 'Anthropic and OpenAI Go Head-to-Head in 20-Minute Model Drop'. Bad: 'AI Newsletter — Feb 9, 2026'",
  "intro": "1-2 sentences setting the scene with attitude. Name the biggest story. End with 'Today: X, Y, and Z.'",
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
      `${TWITTER_API_BASE}/twitter/user/last_tweets?userName=${handle}&count=20`,
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
  
  // 4. HuggingFace Blog (RSS + like filtering)
  console.log('   - HuggingFace Blog (RSS)...');
  const HF_BLOG_MIN_LIKES = 30;
  const hfBlogItems = await parseRSS('https://huggingface.co/blog/feed.xml');
  // Fetch likes from blog page HTML
  let hfLikesMap: Record<string, number> = {};
  try {
    const hfPageResp = await fetch('https://huggingface.co/blog');
    const hfPageHtml = await hfPageResp.text();
    // Extract likes: pattern like "/blog/slug ... NN\n ... February" 
    const likeMatches = hfPageHtml.matchAll(/href="\/blog\/([^"]+)"[\s\S]*?(\d+)\s*\n\s*\n\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)/g);
    for (const m of likeMatches) {
      hfLikesMap[m[1]] = parseInt(m[2]);
    }
  } catch (e) {
    console.log('   ⚠️ Could not fetch HF blog likes, using all items');
  }
  let hfFiltered = 0;
  for (const item of hfBlogItems.slice(0, 10)) {
    // Extract slug from URL
    const slug = item.link.replace('https://huggingface.co/blog/', '');
    const likes = hfLikesMap[slug] ?? 999; // If we can't find likes, include it
    if (likes < HF_BLOG_MIN_LIKES) {
      console.log(`      ⏭️ HF Blog filtered (${likes} < ${HF_BLOG_MIN_LIKES} likes): ${item.title}`);
      hfFiltered++;
      continue;
    }
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
  console.log(`   ✅ HuggingFace Blog: ${items.length - (items.length - hfBlogItems.slice(0,10).length + hfFiltered)} items (filtered ${hfFiltered} with <${HF_BLOG_MIN_LIKES} likes)`);
  
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
        
        if (!isFreshTweet(tweet)) {
          console.log(`      ⏭️ Skipped old tweet: "${text.slice(0, 50)}..."`);
          continue;
        }
        
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
  
  console.log(`   ✅ Found ${items.length} tweets from accounts`);

  // --- Twitter Search: catch viral/trending content ---
  const SEARCH_QUERIES = [
    'Claude Code',
    'AI coding agent',
    'AI agent framework',
    'MCP server',
    'open source LLM',
  ];

  const seenSearchIds = new Set(items.map(i => i.id));

  for (const query of SEARCH_QUERIES) {
    try {
      console.log(`   - Search: "${query}"...`);
      const response = await fetch(
        `${TWITTER_API_BASE}/twitter/tweet/advanced_search?query=${encodeURIComponent(query)}&queryType=Top&count=5`,
        {
          headers: {
            'X-API-Key': TWITTER_API_KEY!,
            'Content-Type': 'application/json',
          },
        }
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
        const views = tweet.view_count || tweet.viewCount || 0;
        const engagement = likes + retweets * 2;

        if (engagement < 1000) continue; // Only viral content

        const author = tweet.author?.userName || tweet.user?.screen_name || '?';
        const title = text.split('\n')[0].slice(0, 100).trim();

        items.push({
          id: itemId,
          title,
          summary: text.slice(0, 500),
          url: `https://x.com/${author}/status/${tweetId}`,
          twitter_url: `https://x.com/${author}/status/${tweetId}`,
          source: `@${author}`,
          source_tier: 2,
          category: 'developer_platform' as Category,
          score: Math.min(90, 70 + Math.floor(engagement / 5000)),
          engagement,
          detected_at: tweet.created_at || tweet.date || new Date().toISOString(),
        });
      }
    } catch (e) {
      console.log(`   ❌ Search "${query}": ${e}`);
    }
  }
  console.log(`   ✅ Total after search: ${items.length} tweets`);

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
    const response = await fetch('https://huggingface.co/api/models?sort=likes&direction=-1&limit=30');
    if (!response.ok) {
      console.log(`   ⚠️ HF returned ${response.status}`);
      return items;
    }

    const models: any[] = await response.json();
    
    for (const model of models.slice(0, 10)) {
      const modelId = model.id || model.modelId;
      const likes = model.likes || 0;
      const downloads = model.downloads || 0;
      
      items.push({
        id: `hf-${modelId.replace('/', '-')}`,
        title: `Trending: ${modelId}`,
        summary: `${likes.toLocaleString()}❤️, ${downloads.toLocaleString()} downloads. Pipeline: ${model.pipeline_tag || 'General'}. Tags: ${(model.tags || []).slice(0, 5).join(', ')}`,
        action: 'Try it on HuggingFace',
        url: `https://huggingface.co/${modelId}`,
        source: 'HuggingFace Trending',
        source_tier: 3,
        category: 'model_release',
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

function isFreshTweet(tweet: any, maxAgeHours: number = 48): boolean {
  const dateStr = tweet.created_at || tweet.date;
  if (!dateStr) return true;
  const tweetDate = new Date(dateStr);
  if (isNaN(tweetDate.getTime())) return true;
  const ageMs = Date.now() - tweetDate.getTime();
  return ageMs < maxAgeHours * 60 * 60 * 1000;
}

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
  
  // Header — use AI-generated headline if available
  const headline = newsletter.headline || `LoreAI Daily — ${date}`;
  lines.push(`# ${headline}`);
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

async function generateNewsletterWithOpus(items: NewsItem[], date: string): Promise<string | null> {
  console.log('   ✍️ Generating newsletter with Claude Opus...');
  
  const rawData = JSON.stringify(items.slice(0, 50).map(i => ({
    title: i.title,
    summary: i.summary?.slice(0, 300),
    source: i.source,
    url: i.url,
    engagement: i.engagement,
    category: i.category,
    score: i.score,
  })), null, 2);

  const prompt = `You are the editor-in-chief of LoreAI Daily. Write today's AI digest based on the raw news data below. Date: ${date}

## Categories (use exactly these 6 + 2 special sections)
🧠 MODEL — New model releases & trends (include HuggingFace trending with likes and downloads)
📱 APP — Consumer products & platform updates
🔧 DEV — Developer tools, SDKs, APIs
📝 TECHNIQUE — Practical tips, best practices, viral dev tips
🚀 PRODUCT — New products, research, open-source projects
🎓 MODEL LITERACY — Pick one technical concept worth explaining today, 3-4 sentences for non-technical readers
🎯 PICK OF THE DAY — The single most impactful item today, 2-3 sentences on why it matters + link

## Writing rules
1. Each item: bullet point (•), **bold title**, followed by source (— @handle or — Source Name)
2. Each item: what happened + why it matters, 1-2 sentences
3. Include engagement data in parentheses (likes, RTs, downloads — show them separately, not combined)
4. 3-5 most important items per category, skip empty categories
5. Tone: professional, concise, opinionated — you're an editor curating, not a bot summarizing
6. Forbidden phrases: "In this article", "Stay tuned", "Exciting times", "Let's dive in", "Game-changing"
7. Output pure markdown, title: 🌅 AI Daily Digest — ${date}
8. Write entirely in English
9. Every item MUST include a source link at the end: [Read more →](url)

## Raw data (${items.length} items)
${rawData}`;

  try {
    const { execSync } = await import('child_process');
    const tmpPrompt = path.join('/tmp', `opus-prompt-${Date.now()}.txt`);
    fs.writeFileSync(tmpPrompt, prompt);
    const result = execSync(
      `cat "${tmpPrompt}" | claude -p --verbose`,
      {
        timeout: 5 * 60 * 1000,
        maxBuffer: 1024 * 1024,
        env: { ...process.env },
        shell: '/bin/bash',
      }
    ).toString().trim();
    try { fs.unlinkSync(tmpPrompt); } catch {}
    
    // Clean ANSI escape codes
    const cleaned = result.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').trim();
    
    if (cleaned && cleaned.length > 200) {
      console.log(`   ✅ Opus newsletter: ${cleaned.length} chars`);
      return cleaned;
    }
    console.log('   ⚠️ Opus output too short or empty');
    return null;
  } catch (e) {
    console.log(`   ⚠️ Opus failed: ${e}`);
    return null;
  }
}

// ============================================
// Chinese Newsletter Generation
// ============================================

async function generateNewsletterWithOpusZH(items: NewsItem[], date: string): Promise<string | null> {
  console.log('   ✍️ Generating ZH newsletter with Claude Opus...');
  
  const rawData = JSON.stringify(items.slice(0, 50).map(i => ({
    title: i.title,
    summary: i.summary?.slice(0, 300),
    source: i.source,
    url: i.url,
    engagement: i.engagement,
    category: i.category,
    score: i.score,
  })), null, 2);

  const prompt = `你是 LoreAI 每日简报的中文主编。基于以下原始新闻数据，撰写今日 AI 简报。日期：${date}

## 栏目（使用以下 6 个固定栏目 + 2 个特别栏目）
🧠 模型动态 — 新模型发布与趋势（包含 HuggingFace 热门模型的点赞和下载数据）
📱 产品应用 — 消费级产品与平台更新
🔧 开发工具 — 开发者工具、SDK、API
📝 技术实践 — 实用技巧、最佳实践、热门开发技巧
🚀 开源前沿 — 新产品、研究成果、开源项目
🎓 概念科普 — 挑选一个值得今天科普的技术概念，用 3-4 句话向非技术读者解释
🎯 今日精选 — 今天最有影响力的一条新闻，2-3 句话说明为什么重要 + 链接

## 写作规范
1. 每条：bullet point（•），**加粗标题**，来源（— @handle 或 — 来源名称）
2. 每条：发生了什么 + 为什么重要，1-2 句话
3. 括号内标注互动数据（点赞、转发、下载 — 分开显示，不要合并）
4. 每个栏目 3-5 条最重要的内容，空栏目跳过
5. 语气：专业、简洁、有观点 — 你是主编在策展，不是机器人在搬运
6. 如果涉及国产模型（Qwen、Kimi、GLM 等），自然融入对比视角
7. 禁止翻译腔："值得注意的是"、"让我们来看看"、"众所周知"
8. 输出纯 markdown，标题：🌅 AI 每日简报 — ${date}
9. 全文使用中文撰写
10. 每条必须在末尾包含来源链接：[查看详情 →](url)

## 原始数据（${items.length} 条）
${rawData}`;

  try {
    const { execSync } = await import('child_process');
    const tmpPrompt = path.join('/tmp', `opus-prompt-zh-${Date.now()}.txt`);
    fs.writeFileSync(tmpPrompt, prompt);
    const result = execSync(
      `cat "${tmpPrompt}" | claude -p --verbose`,
      {
        timeout: 5 * 60 * 1000,
        maxBuffer: 1024 * 1024,
        env: { ...process.env },
        shell: '/bin/bash',
      }
    ).toString().trim();
    try { fs.unlinkSync(tmpPrompt); } catch {}
    
    const cleaned = result.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').trim();
    
    if (cleaned && cleaned.length > 200) {
      console.log(`   ✅ Opus ZH newsletter: ${cleaned.length} chars`);
      return cleaned;
    }
    console.log('   ⚠️ Opus ZH output too short or empty');
    return null;
  } catch (e) {
    console.log(`   ⚠️ Opus ZH failed: ${e}`);
    return null;
  }
}

async function writeNewsletterWithGeminiZH(items: NewsItem[], date: string): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    console.log('   ⚠️ No Gemini API key, skipping ZH newsletter');
    return null;
  }

  console.log('🤖 Writing ZH newsletter with Gemini Flash...');

  const rawData = JSON.stringify(items.slice(0, 30).map(i => ({
    title: i.title,
    summary: i.summary?.slice(0, 300),
    source: i.source,
    url: i.url,
    engagement: i.engagement,
  })), null, 2);

  const prompt = `你是 LoreAI 每日简报的中文主编。基于以下原始新闻数据，撰写今日 AI 简报。日期：${date}

栏目：🧠 模型动态、📱 产品应用、🔧 开发工具、📝 技术实践、🚀 开源前沿、🎓 概念科普、🎯 今日精选

写作规范：每条用 bullet point + 加粗标题 + 来源，1-2 句话说明发生了什么和为什么重要。括号内标注互动数据。每个栏目 3-5 条，空栏目跳过。语气专业简洁有观点。禁止翻译腔。输出纯 markdown，标题：🌅 AI 每日简报 — ${date}。全文中文。每条末尾包含来源链接。

原始数据（${items.length} 条）：
${rawData}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 4000 }
        })
      }
    );

    if (!response.ok) {
      console.log(`   ⚠️ Gemini ZH API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (text && text.length > 200) {
      console.log(`   ✅ Gemini ZH newsletter: ${text.length} chars`);
      return text;
    }
    return null;
  } catch (e) {
    console.log(`   ⚠️ Gemini ZH error: ${e}`);
    return null;
  }
}

// ============================================
// Generate Markdown (Fallback - PRD Categories)
// ============================================

function generateMarkdown(digest: DailyDigest, allItems: NewsItem[]): string {
  const lines: string[] = [];
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  
  // ===== HEADER =====
  lines.push(`# 🔥 LoreAI Daily — ${date}`);
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
  lines.push('*Stay ahead. Build smarter. — LoreAI*');
  lines.push('');
  
  return lines.join('\n');
}

// ============================================
// ============================================
// Cross-day Dedup: extract URLs from recent newsletters
// ============================================

function getRecentNewsletterUrls(days: number): Set<string> {
  const urls = new Set<string>();
  const newsletterDir = path.join(process.cwd(), 'content', 'newsletters', 'en');
  
  try {
    const files = fs.readdirSync(newsletterDir)
      .filter(f => f.endsWith('.md'))
      .sort()
      .slice(-days); // last N files
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(newsletterDir, file), 'utf-8');
      // Extract URLs from markdown links [text](url) and plain URLs
      const linkMatches = content.matchAll(/\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g);
      for (const match of linkMatches) {
        urls.add(match[2]);
      }
      const plainUrls = content.matchAll(/(?<!\()(https?:\/\/[^\s)]+)/g);
      for (const match of plainUrls) {
        urls.add(match[0]);
      }
    }
    console.log(`   📂 Found ${urls.size} URLs from ${files.length} recent newsletters`);
  } catch {
    console.log('   ⚠️ Could not read recent newsletters for dedup');
  }
  
  return urls;
}

// Main
// ============================================

async function main() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  🔥 LoreAI Daily Scout v2');
  console.log('  AI Daily Digest 格式');
  console.log('═'.repeat(60));
  console.log('\n');

  // Scan all tiers
  const officialItems = await scanOfficialBlogs();  // Tier 1: Official blogs
  const twitterItems = await scanTwitter();         // Tier 2: Twitter
  // const hfItems = await scanHuggingFace();       // Tier 3: HuggingFace trending (disabled: low relevance)
  const hfItems: NewsItem[] = [];
  console.log('📡 Tier 3: HuggingFace Trending... ⏭️ Disabled (low relevance)');
  const hnItems = await scanHackerNews();           // Tier 4: Hacker News
  const ghItems = await scanGitHub();               // Tier 5: GitHub

  // Combine and deduplicate
  const allItems = [...officialItems, ...twitterItems, ...hfItems, ...hnItems, ...ghItems];
  console.log(`\n🔄 Deduplicating ${allItems.length} items...`);
  
  const deduped = deduplicate(allItems);
  console.log(`   ✅ ${deduped.length} unique items`);

  // Cross-day dedup: check DB first, fallback to file-based
  let recentUrls: Set<string>;
  try {
    const db = getDb();
    initSchema(db);
    recentUrls = getRecentUrls(db, 3);
    console.log(`   📂 Found ${recentUrls.size} URLs from DB (last 3 days)`);
  } catch {
    console.log('   ⚠️ DB not available, falling back to file-based dedup');
    recentUrls = getRecentNewsletterUrls(3);
  }
  const fresh = recentUrls.size > 0 
    ? deduped.filter(item => !recentUrls.has(item.url))
    : deduped;
  console.log(`   📰 ${fresh.length} fresh items (filtered ${deduped.length - fresh.length} already covered)`);

  // Save raw data
  const OUTPUT_DIR = path.join(process.cwd(), 'output');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const date = new Date().toISOString().split('T')[0];
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `raw-${date}.json`),
    JSON.stringify({ date, items: fresh, stats: { total: allItems.length, deduped: deduped.length, fresh: fresh.length } }, null, 2)
  );
  console.log(`   💾 Saved raw data: output/raw-${date}.json`);

  // Group by category first (for Gemini input)
  const byCategory: Record<Category, NewsItem[]> = {
    model_release: [],
    developer_platform: [],
    official_blog: [],
    product_ecosystem: [],
  };
  
  for (const item of fresh) {
    byCategory[item.category].push(item);
  }

  // Try Opus first, fallback to Flash
  console.log('');
  let digestMarkdown: string | null = await generateNewsletterWithOpus(fresh, date);
  
  let newsletterContent: NewsletterContent | null = null;
  if (!digestMarkdown) {
    console.log('   🔄 Falling back to Gemini Flash...');
    newsletterContent = await writeNewsletterWithGemini(fresh);
  }

  // Create digest
  const digest: DailyDigest = {
    date,
    generated_at: new Date().toISOString(),
    items: fresh.slice(0, 20),
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
  if (digestMarkdown) {
    digest.markdown = digestMarkdown;
  } else if (newsletterContent) {
    digest.markdown = generateMarkdownFromNewsletter(newsletterContent);
  } else {
    digest.markdown = generateMarkdown(digest, deduped);
  }

  // Save outputs
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  // JSON
  const jsonPath = path.join(OUTPUT_DIR, 'daily-digest.json');
  fs.writeFileSync(jsonPath, JSON.stringify(digest, null, 2));
  
  // Markdown
  const mdPath = path.join(OUTPUT_DIR, `digest-${digest.date}.md`);
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

  // ===== Generate Chinese Newsletter =====
  console.log('\n🇨🇳 Generating Chinese newsletter...');
  let zhMarkdown: string | null = await generateNewsletterWithOpusZH(fresh, date);
  if (!zhMarkdown) {
    console.log('   🔄 Falling back to Gemini Flash for ZH...');
    zhMarkdown = await writeNewsletterWithGeminiZH(fresh, date);
  }
  if (zhMarkdown) {
    const zhMdPath = path.join(OUTPUT_DIR, `digest-zh-${date}.md`);
    fs.writeFileSync(zhMdPath, zhMarkdown);
    console.log(`✅ Saved ZH Markdown: ${zhMdPath}`);
  } else {
    console.log('⚠️ ZH newsletter generation failed (non-fatal)');
  }

  // ===== DB: persist news items + newsletter =====
  try {
    const db = getDb();
    initSchema(db);

    // Insert all fresh news items
    insertNewsItems(db, fresh.map(item => ({
      id: item.id,
      title: item.title,
      url: item.url,
      source: item.source,
      source_tier: item.source_tier,
      category: item.category,
      score: item.score,
      raw_summary: item.summary,
      detected_at: item.detected_at,
    })));
    console.log(`🗄️  Inserted ${fresh.length} news items into DB`);

    // Insert newsletter as content
    const headline = digest.markdown.split('\n')[0]?.replace(/^#\s*/, '') || `LoreAI Daily — ${digest.date}`;
    const contentId = insertContent(db, {
      type: 'newsletter',
      title: headline,
      slug: `newsletter-${digest.date}`,
      body_markdown: digest.markdown,
      language: 'en',
      status: 'published',
      source_type: 'auto',
    });

    // Link newsletter to its source news items
    linkContentSources(db, contentId, fresh.slice(0, 20).map(i => i.id));
    console.log(`🗄️  Inserted newsletter (content_id=${contentId}) with ${Math.min(fresh.length, 20)} source links`);

    closeDb();
  } catch (e) {
    console.log(`⚠️ DB write error (non-fatal): ${e}`);
  }

  return digest;
}

main().catch(console.error);

export { NewsItem, DailyDigest, main as runDailyScout };
