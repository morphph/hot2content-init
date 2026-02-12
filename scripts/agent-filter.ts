#!/usr/bin/env npx tsx
/**
 * Agent Filter — Claude Opus semantic filtering layer
 * 
 * Reads raw-items-{date}.json, calls Claude via CLI (Max Plan),
 * outputs filtered-items-{date}.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const OUTPUT_DIR = path.join(process.cwd(), 'output');

interface RawItem {
  id: string;
  title: string;
  summary: string;
  full_text: string;
  url: string;
  twitter_url?: string | null;
  source: string;
  source_tier: number;
  category: string;
  score: number;
  engagement: number;
  detected_at: string;
}

interface FilteredItem extends RawItem {
  agent_category: string;
  agent_score: number;
  why_it_matters: string;
  action: string;
}

// ============================================
// Agent Filter via Claude CLI (Max Plan)
// ============================================

async function agentFilter(items: RawItem[]): Promise<FilteredItem[]> {
  console.log(`🤖 Calling Claude Opus via CLI to filter ${items.length} items...`);

  const rawData = JSON.stringify(items.map((item, i) => ({
    index: i,
    title: item.title,
    summary: item.summary?.slice(0, 400),
    source: item.source,
    url: item.url,
    engagement: item.engagement,
    source_tier: item.source_tier,
    detected_at: item.detected_at,
  })), null, 2);

  const prompt = `You are the editor-in-chief of an AI industry newsletter. From the following ${items.length} raw news items collected today, select the 8-12 most important ones.

## Selection Criteria
1. **Signal vs Noise** — Real news vs daily chatter. Product launches, model releases, major updates = signal. Generic tips, self-promotion, vague opinions = noise.
2. **Impact** — How much does this affect AI developers, product builders, or the industry? Prioritize items with concrete implications.
3. **Freshness** — Prefer items from the last 24 hours. Deprioritize old content that's been recycled.
4. **Semantic Dedup** — Multiple items about the same event should be merged into one. Pick the best source.
5. **Trend Detection** — If multiple sources discuss the same topic, that's a strong signal. Note it.

## Categories (assign exactly one per item)
- LAUNCH — New model or product launches
- TOOL — Developer tools, SDKs, frameworks, APIs
- TECHNIQUE — Practical techniques, best practices, coding tips
- RESEARCH — Papers, benchmarks, technical deep-dives
- INSIGHT — Industry analysis, opinions from key figures, trend pieces
- BUILD — Open-source projects, community builds, tutorials

## Output Format
Return a JSON array. Each item:
{
  "index": <original index from input>,
  "agent_category": "LAUNCH|TOOL|TECHNIQUE|RESEARCH|INSIGHT|BUILD",
  "agent_score": <1-100, your importance rating>,
  "why_it_matters": "<1 sentence: why this matters to AI practitioners>",
  "action": "<1 short phrase: what the reader should do>"
}

Sort by agent_score descending. Pick 8-12 items. Return ONLY the JSON array, no markdown fences.

## Raw Items
${rawData}`;

  try {
    // Write prompt to temp file (too large for command line args)
    const tmpPrompt = path.join(OUTPUT_DIR, '.agent-filter-prompt.txt');
    fs.writeFileSync(tmpPrompt, prompt);

    const result = execSync(
      `cat "${tmpPrompt}" | claude --model claude-opus-4-6 --output-format text --max-turns 1 --print`,
      {
        encoding: 'utf-8',
        timeout: 120000, // 2 min timeout
        env: { ...process.env, HOME: process.env.HOME || '/home/ubuntu' },
      }
    );

    // Clean up temp file
    fs.unlinkSync(tmpPrompt);

    // Parse JSON array from response
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('⚠️ Could not parse Claude response, falling back to rule-based');
      console.log('Raw response:', result.slice(0, 500));
      return ruleBasedFilter(items);
    }

    const selections: Array<{
      index: number;
      agent_category: string;
      agent_score: number;
      why_it_matters: string;
      action: string;
    }> = JSON.parse(jsonMatch[0]);

    console.log(`   ✅ Claude selected ${selections.length} items`);

    // Map back to full items
    const filtered: FilteredItem[] = selections
      .filter(s => s.index >= 0 && s.index < items.length)
      .map(s => ({
        ...items[s.index],
        agent_category: s.agent_category,
        agent_score: s.agent_score,
        why_it_matters: s.why_it_matters,
        action: s.action,
      }))
      .sort((a, b) => b.agent_score - a.agent_score);

    return filtered;

  } catch (e) {
    console.log(`⚠️ Claude CLI error: ${e}`);
    console.log('Falling back to rule-based filter');
    return ruleBasedFilter(items);
  }
}

// ============================================
// Rule-based fallback
// ============================================

function ruleBasedFilter(items: RawItem[]): FilteredItem[] {
  console.log('📋 Using rule-based filter as fallback...');
  
  return items
    .sort((a, b) => {
      if (a.source_tier !== b.source_tier) return a.source_tier - b.source_tier;
      if (a.score !== b.score) return b.score - a.score;
      return (b.engagement || 0) - (a.engagement || 0);
    })
    .slice(0, 12)
    .map(item => ({
      ...item,
      agent_category: mapCategory(item.category),
      agent_score: item.score,
      why_it_matters: item.summary.slice(0, 100),
      action: 'Check it out',
    }));
}

function mapCategory(oldCat: string): string {
  const map: Record<string, string> = {
    model_release: 'LAUNCH',
    developer_platform: 'TOOL',
    official_blog: 'RESEARCH',
    product_ecosystem: 'INSIGHT',
  };
  return map[oldCat] || 'INSIGHT';
}

// ============================================
// Main
// ============================================

async function main() {
  const date = new Date().toISOString().split('T')[0];
  const rawPath = path.join(OUTPUT_DIR, `raw-items-${date}.json`);

  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  🧠 Agent Filter — Semantic News Selection');
  console.log(`  Date: ${date}`);
  console.log('═'.repeat(60));
  console.log('');

  if (!fs.existsSync(rawPath)) {
    console.log(`❌ Raw items not found: ${rawPath}`);
    console.log('Run daily-scout.ts --raw-only first.');
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
  const items: RawItem[] = rawData.items || rawData;
  console.log(`📂 Loaded ${items.length} raw items from ${rawPath}`);

  const filtered = await agentFilter(items);

  // Save filtered output
  const outputPath = path.join(OUTPUT_DIR, `filtered-items-${date}.json`);
  const output = {
    date,
    generated_at: new Date().toISOString(),
    raw_count: items.length,
    filtered_count: filtered.length,
    items: filtered,
  };
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`\n✅ Filtered: ${items.length} → ${filtered.length} items`);
  console.log(`💾 Saved: ${outputPath}`);
  
  // Print summary
  console.log('\n📊 Selected Items:\n');
  for (const item of filtered) {
    console.log(`  [${item.agent_score}] ${item.agent_category.padEnd(10)} ${item.title.slice(0, 60)}`);
    console.log(`     → ${item.why_it_matters}`);
    console.log('');
  }
}

main().catch(console.error);
