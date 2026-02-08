#!/usr/bin/env tsx
/**
 * Hot2Content Trend Scout
 * 
 * 热点自动检测 - 复用 AI Daily Digest 数据源
 * 
 * 数据源:
 * - X/Twitter 官方账号
 * - HuggingFace Trending Models
 * - 官方博客 (Anthropic, OpenAI, Google AI, etc.)
 * 
 * 输出:
 * - 评分排序的热点话题列表
 * - 可直接触发 Content Pipeline
 */

import * as fs from 'fs';
import * as path from 'path';

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

// 官方博客列表 (Tier 1 sources)
const OFFICIAL_BLOGS = [
  { name: 'Anthropic', url: 'https://www.anthropic.com/news', category: 'model' as const },
  { name: 'OpenAI', url: 'https://openai.com/blog', category: 'model' as const },
  { name: 'Google AI', url: 'https://blog.google/technology/ai/', category: 'model' as const },
  { name: 'DeepMind', url: 'https://deepmind.google/blog/', category: 'research' as const },
  { name: 'HuggingFace', url: 'https://huggingface.co/blog', category: 'dev' as const },
  { name: 'Mistral', url: 'https://mistral.ai/news', category: 'model' as const },
];

// Twitter 官方账号 (Tier 1-2)
const TWITTER_ACCOUNTS = [
  '@AnthropicAI',
  '@OpenAI', 
  '@GoogleAI',
  '@DeepMind',
  '@huggingface',
  '@MistralAI',
  '@xaborevsky', // Demis Hassabis
  '@DarioAmodei',
  '@sama', // Sam Altman
];

/**
 * 评分算法
 * 
 * 基础分:
 * - 官方源: 80
 * - Twitter Tier 1: 70
 * - Twitter Tier 2: 60
 * - HuggingFace Trending: 65
 * 
 * 加分:
 * - 24小时内: +15
 * - 多源交叉验证: +10
 * - 高 engagement: +5-15
 */
function calculateScore(topic: Partial<Topic>, signals: {
  isOfficial: boolean;
  hoursAgo: number;
  crossSourceCount: number;
  engagement?: number;
}): number {
  let score = 50; // 基础分

  // 来源加分
  if (signals.isOfficial) score += 30;
  
  // 时效性加分
  if (signals.hoursAgo < 24) score += 15;
  else if (signals.hoursAgo < 48) score += 10;
  else if (signals.hoursAgo < 72) score += 5;

  // 交叉验证加分
  if (signals.crossSourceCount >= 3) score += 10;
  else if (signals.crossSourceCount >= 2) score += 5;

  // Engagement 加分
  if (signals.engagement) {
    if (signals.engagement > 1000) score += 15;
    else if (signals.engagement > 500) score += 10;
    else if (signals.engagement > 100) score += 5;
  }

  return Math.min(score, 100);
}

/**
 * 读取 AI Daily Digest 数据
 */
function readDigestData(): Topic[] {
  const topics: Topic[] = [];
  const digestDir = path.join(process.env.HOME || '', 'clawd-fresh/memory/ai-news');
  
  if (!fs.existsSync(digestDir)) {
    console.log('⚠️ AI News digest directory not found');
    return topics;
  }

  // 读取最近的 digest 文件
  const files = fs.readdirSync(digestDir)
    .filter(f => f.startsWith('digest-') && f.endsWith('.md'))
    .sort()
    .reverse()
    .slice(0, 3); // 最近 3 天

  for (const file of files) {
    const content = fs.readFileSync(path.join(digestDir, file), 'utf-8');
    // 解析 digest 内容提取话题
    // (简化实现 - 实际应该解析 markdown 结构)
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('## ') || line.startsWith('### ')) {
        const title = line.replace(/^#+\s*/, '').trim();
        if (title.length > 10 && !title.includes('DIGEST') && !title.includes('MODEL LITERACY')) {
          topics.push({
            title,
            source: 'ai-daily-digest',
            score: 70, // 基础分
            category: 'model',
            detected_at: new Date().toISOString()
          });
        }
      }
    }
  }

  return topics;
}

/**
 * 去重 + 合并同一话题
 */
function deduplicateTopics(topics: Topic[]): Topic[] {
  const seen = new Map<string, Topic>();
  
  for (const topic of topics) {
    const key = topic.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);
    
    if (seen.has(key)) {
      // 合并: 保留更高分
      const existing = seen.get(key)!;
      if (topic.score > existing.score) {
        seen.set(key, { ...topic, score: Math.min(topic.score + 10, 100) }); // 交叉验证加分
      }
    } else {
      seen.set(key, topic);
    }
  }

  return Array.from(seen.values());
}

/**
 * 主函数
 */
async function main() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  🔥 Hot2Content Trend Scout');
  console.log('  热点自动检测');
  console.log('═'.repeat(60));
  console.log('\n');

  const config = DEFAULT_CONFIG;
  let allTopics: Topic[] = [];

  // 1. 读取 AI Daily Digest 数据
  console.log('📡 Reading AI Daily Digest data...');
  const digestTopics = readDigestData();
  console.log(`   Found ${digestTopics.length} topics from digest`);
  allTopics.push(...digestTopics);

  // 2. 去重 + 排序
  console.log('\n🔄 Deduplicating and scoring...');
  const uniqueTopics = deduplicateTopics(allTopics);
  const sortedTopics = uniqueTopics
    .sort((a, b) => b.score - a.score)
    .filter(t => t.score >= config.minScore)
    .slice(0, config.maxTopics);

  // 3. 输出结果
  console.log('\n📊 Top Topics:\n');
  sortedTopics.forEach((topic, i) => {
    console.log(`${i + 1}. [${topic.score}] ${topic.title}`);
    console.log(`   Source: ${topic.source} | Category: ${topic.category}`);
    if (topic.url) console.log(`   URL: ${topic.url}`);
    console.log('');
  });

  // 4. 保存到文件
  const outputPath = path.join(process.cwd(), 'content', 'trending-topics.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify({
    generated_at: new Date().toISOString(),
    topics: sortedTopics
  }, null, 2));
  
  console.log(`\n✅ Saved to ${outputPath}`);
  console.log(`   Total: ${sortedTopics.length} topics above score ${config.minScore}`);

  // 5. 返回最高分话题用于 pipeline
  if (sortedTopics.length > 0) {
    console.log(`\n🎯 Top pick: "${sortedTopics[0].title}" (score: ${sortedTopics[0].score})`);
    return sortedTopics[0];
  }

  return null;
}

main().catch(console.error);

export { Topic, TrendScoutConfig, calculateScore };
