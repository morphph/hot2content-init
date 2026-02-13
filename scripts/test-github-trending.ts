#!/usr/bin/env npx tsx
/**
 * Test script for GitHub Trending data source
 * Issue #36: Validates both old (HTML scraping) and new (Search API) approaches
 * 
 * Usage: npx tsx scripts/test-github-trending.ts
 */

// ============================================
// Test 1: Current HTML regex approach (should FAIL)
// ============================================
async function testOldApproach(): Promise<{ repos: string[]; descs: string[] }> {
  console.log('\n=== Test 1: Old HTML Regex Approach ===');
  const response = await fetch('https://github.com/trending?since=daily', {
    headers: { 'User-Agent': 'Hot2Content/2.0' }
  });

  if (!response.ok) {
    console.log(`   ❌ HTTP ${response.status}`);
    return { repos: [], descs: [] };
  }

  const html = await response.text();

  // These are the CURRENT (broken) patterns from daily-scout.ts
  const repoPattern = /<h2 class="h3[^"]*">\s*<a href="\/([^"]+)"[^>]*>/g;
  const descPattern = /<p class="col-[^"]*">([^<]+)<\/p>/g;

  const repos: string[] = [];
  const descs: string[] = [];

  let match;
  while ((match = repoPattern.exec(html)) !== null) repos.push(match[1]);
  while ((match = descPattern.exec(html)) !== null) descs.push(match[1].trim());

  console.log(`   Repos found: ${repos.length}`);
  console.log(`   Descriptions found: ${descs.length}`);

  if (repos.length === 0) {
    console.log('   ✅ Confirmed: old regex is broken (expected)');
  } else {
    console.log('   ⚠️ Unexpected: old regex still works?');
    repos.slice(0, 3).forEach(r => console.log(`      - ${r}`));
  }

  return { repos, descs };
}

// ============================================
// Test 2: New GitHub Search API approach (should SUCCEED)
// ============================================
interface SearchRepo {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  html_url: string;
  created_at: string;
  language: string | null;
  topics: string[];
}

const AI_KEYWORDS = /ai|llm|gpt|claude|model|machine.?learning|neural|transformer|agent|diffusion|embedding|rag|langchain|openai|anthropic|deep.?learning/i;

async function testNewApproach(): Promise<SearchRepo[]> {
  console.log('\n=== Test 2: New GitHub Search API Approach ===');
  const allRepos: SearchRepo[] = [];

  // Query 1: New repos gaining traction (last 7 days, 50+ stars)
  const date7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const q1 = `created:>${date7d} stars:>50`;
  console.log(`\n   Query 1 (new rising repos): ${q1}`);

  const resp1 = await fetch(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(q1)}&sort=stars&order=desc&per_page=30`,
    { headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'Hot2Content/2.0' } }
  );

  if (!resp1.ok) {
    console.log(`   ❌ HTTP ${resp1.status}: ${await resp1.text()}`);
  } else {
    const data1 = await resp1.json();
    console.log(`   Total results: ${data1.total_count}`);
    const items1: SearchRepo[] = data1.items || [];
    
    // Filter for AI-related
    const aiItems1 = items1.filter(r => {
      const text = `${r.full_name} ${r.description || ''} ${(r.topics || []).join(' ')}`;
      return AI_KEYWORDS.test(text);
    });
    console.log(`   AI-related: ${aiItems1.length} / ${items1.length}`);
    aiItems1.slice(0, 5).forEach(r => 
      console.log(`      ⭐${r.stargazers_count} ${r.full_name}: ${(r.description || '').slice(0, 80)}`)
    );
    allRepos.push(...aiItems1);
  }

  // Query 2: Active established AI projects (500+ stars, pushed recently)
  const date3d = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const q2 = `stars:>500 pushed:>${date3d} topic:machine-learning`;
  console.log(`\n   Query 2 (active AI projects): ${q2}`);

  // Rate limit: wait 2s between requests
  await new Promise(resolve => setTimeout(resolve, 2000));

  const resp2 = await fetch(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(q2)}&sort=stars&order=desc&per_page=10`,
    { headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'Hot2Content/2.0' } }
  );

  if (!resp2.ok) {
    console.log(`   ❌ HTTP ${resp2.status}: ${await resp2.text()}`);
  } else {
    const data2 = await resp2.json();
    console.log(`   Total results: ${data2.total_count}`);
    const items2: SearchRepo[] = data2.items || [];
    items2.slice(0, 5).forEach(r => 
      console.log(`      ⭐${r.stargazers_count} ${r.full_name}: ${(r.description || '').slice(0, 80)}`)
    );
    allRepos.push(...items2);
  }

  // Dedup by full_name
  const seen = new Set<string>();
  const deduped = allRepos.filter(r => {
    if (seen.has(r.full_name)) return false;
    seen.add(r.full_name);
    return true;
  });

  console.log(`\n   Total unique AI repos: ${deduped.length}`);
  return deduped;
}

// ============================================
// Test 3: Verify output format matches NewsItem shape
// ============================================
function testOutputFormat(repos: SearchRepo[]) {
  console.log('\n=== Test 3: Output Format Validation ===');

  const newsItems = repos.slice(0, 5).map(r => ({
    id: `gh-${r.full_name.replace('/', '-')}`,
    title: r.full_name,
    summary: (r.description || '').slice(0, 200),
    action: `Star the repo (⭐${r.stargazers_count})`,
    url: r.html_url,
    source: 'GitHub Trending',
    source_tier: 5,
    category: 'developer_platform',
    score: Math.min(90, 50 + Math.floor(r.stargazers_count / 100)),
    detected_at: new Date().toISOString(),
  }));

  console.log(`   Generated ${newsItems.length} NewsItems:`);
  newsItems.forEach(item => {
    const valid = item.id && item.title && item.url && item.source;
    console.log(`   ${valid ? '✅' : '❌'} ${item.title} (score: ${item.score})`);
  });

  const allValid = newsItems.every(i => i.id && i.title && i.url && i.source);
  console.log(`\n   Format validation: ${allValid ? '✅ PASS' : '❌ FAIL'}`);
}

// ============================================
// Run all tests
// ============================================
async function main() {
  console.log('🧪 GitHub Trending Test Suite');
  console.log('=' .repeat(50));

  const oldResult = await testOldApproach();
  const newRepos = await testNewApproach();
  testOutputFormat(newRepos);

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   Old approach: ${oldResult.repos.length} repos (expected: 0)`);
  console.log(`   New approach: ${newRepos.length} repos (expected: ≥5)`);

  const oldBroken = oldResult.repos.length === 0;
  const newWorks = newRepos.length >= 5;

  if (oldBroken && newWorks) {
    console.log('\n   ✅ ALL TESTS PASSED — ready to implement fix');
  } else if (!oldBroken) {
    console.log('\n   ⚠️ Old approach still works — regex fix may not be needed?');
  } else {
    console.log('\n   ❌ New approach returned too few results — investigate queries');
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
