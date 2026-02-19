#!/usr/bin/env tsx
/**
 * Brave Search + Web Fetch Research
 * 
 * Uses Brave Search API to find sources, then fetches and extracts content.
 * Synthesizes findings into a research report.
 */

import * as fs from 'fs';
import * as path from 'path';

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

interface SearchResult {
  title: string;
  url: string;
  description: string;
  published?: string;
}

interface FetchedSource {
  url: string;
  title: string;
  content: string;
  fetchedAt: string;
}

async function braveSearch(query: string, count: number = 10): Promise<SearchResult[]> {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'X-Subscription-Token': BRAVE_API_KEY!
    }
  });
  
  if (!response.ok) {
    throw new Error(`Brave Search failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data.web?.results || [];
}

async function fetchContent(url: string, maxChars: number = 8000): Promise<string> {
  try {
    // Use a simple fetch with readability extraction
    // In production, you'd use a proper extraction service
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ResearchBot/1.0)'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      return `[Failed to fetch: ${response.status}]`;
    }
    
    const html = await response.text();
    
    // Basic text extraction (strip HTML tags)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, maxChars);
    
    return text;
  } catch (error) {
    return `[Error fetching: ${error instanceof Error ? error.message : String(error)}]`;
  }
}

async function main() {
  const topic = process.argv[2] || "Claude Code Agent Teams - Anthropic's new multi-agent feature for Claude Code CLI released with Opus 4.6 in February 2026";
  
  console.log('🔍 Brave Search + Web Fetch Research\n');
  console.log('='.repeat(60));
  console.log(`📝 Topic: ${topic}`);
  console.log(`⏰ Started: ${new Date().toISOString()}\n`);
  
  const startTime = Date.now();
  
  // Multiple search queries to cover different angles
  const queries = [
    'Claude Code Agent Teams Anthropic Opus 4.6',
    'Anthropic agent teams multi-agent Claude Code',
    'Claude Code parallel agents team lead teammate',
    'Anthropic C compiler agent teams',
  ];
  
  const allResults: SearchResult[] = [];
  
  // Run searches
  console.log('🔎 Running searches...');
  for (const query of queries) {
    console.log(`   → "${query}"`);
    try {
      const results = await braveSearch(query, 5);
      allResults.push(...results);
    } catch (error) {
      console.log(`   ⚠️  Search failed: ${error}`);
    }
  }
  
  // Deduplicate by URL
  const uniqueUrls = new Map<string, SearchResult>();
  for (const result of allResults) {
    if (!uniqueUrls.has(result.url)) {
      uniqueUrls.set(result.url, result);
    }
  }
  
  console.log(`\n📊 Found ${uniqueUrls.size} unique sources\n`);
  
  // Prioritize official and authoritative sources
  const priorityDomains = ['anthropic.com', 'claude.com', 'code.claude.com', 'github.com/anthropics'];
  const sortedResults = Array.from(uniqueUrls.values()).sort((a, b) => {
    const aScore = priorityDomains.some(d => a.url.includes(d)) ? 0 : 1;
    const bScore = priorityDomains.some(d => b.url.includes(d)) ? 0 : 1;
    return aScore - bScore;
  });
  
  // Fetch top sources
  const sourcesToFetch = sortedResults.slice(0, 8);
  const fetchedSources: FetchedSource[] = [];
  
  console.log('📥 Fetching source content...');
  for (const source of sourcesToFetch) {
    console.log(`   → ${source.url.substring(0, 60)}...`);
    const content = await fetchContent(source.url);
    fetchedSources.push({
      url: source.url,
      title: source.title,
      content: content.substring(0, 4000), // Limit per source
      fetchedAt: new Date().toISOString()
    });
  }
  
  const elapsed = (Date.now() - startTime) / 1000;
  
  // Build report
  let report = `# Brave Search + Web Fetch Research Report\n\n`;
  report += `**Topic:** ${topic}\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  report += `**Time taken:** ${elapsed.toFixed(1)} seconds\n\n`;
  report += `**Method:** Brave Search API + Direct Web Fetch\n\n`;
  report += `**Sources searched:** ${queries.length} queries, ${uniqueUrls.size} unique results\n\n`;
  report += `---\n\n`;
  
  report += `## Search Results Summary\n\n`;
  for (const result of sortedResults.slice(0, 15)) {
    report += `### ${result.title}\n`;
    report += `- **URL:** ${result.url}\n`;
    report += `- **Published:** ${result.published || 'Unknown'}\n`;
    report += `- **Description:** ${result.description}\n\n`;
  }
  
  report += `---\n\n`;
  report += `## Fetched Source Content\n\n`;
  for (const source of fetchedSources) {
    report += `### ${source.title}\n`;
    report += `**URL:** ${source.url}\n\n`;
    report += `\`\`\`\n${source.content.substring(0, 2000)}...\n\`\`\`\n\n`;
  }
  
  // Save report
  const outputDir = path.join(process.cwd(), 'output');
  const outputFile = path.join(outputDir, 'research-brave.md');
  fs.writeFileSync(outputFile, report);
  
  console.log(`\n✅ Research completed!`);
  console.log(`📄 Report saved to: ${outputFile}`);
  console.log(`⏱️  Time taken: ${elapsed.toFixed(1)} seconds`);
  console.log(`📊 Report length: ${report.length} characters`);
}

main().catch(console.error);
