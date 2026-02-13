#!/usr/bin/env npx tsx
/**
 * Test script for GitHub Trending v2 — wider search + no isAIRepo pre-filter
 * 
 * Goal: verify that widening the candidate pool captures projects like claude-mem
 * that were missed by the keyword-based isAIRepo filter.
 * 
 * Test criteria:
 *   1. Q1/Q2/Q3 all return results
 *   2. Total unique repos ≥ 100 (wider pool)
 *   3. claude-mem is in the candidate pool (the specific project that was missed)
 *   4. Known AI projects are included (companion, openai/skills, etc.)
 *   5. Format validation passes
 */

const GH_SEARCH_HEADERS = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'Hot2Content/2.0' };

interface GHSearchRepo {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  html_url: string;
  created_at: string;
  topics?: string[];
}

async function ghSearch(q: string, perPage = 30): Promise<GHSearchRepo[]> {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${perPage}`;
  const resp = await fetch(url, { headers: GH_SEARCH_HEADERS });
  if (!resp.ok) {
    console.log(`   ⚠️ ${resp.status}: ${await resp.text()}`);
    return [];
  }
  const data = await resp.json();
  return data.items || [];
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🧪 GitHub Trending v2 Test Suite');
  console.log('='.repeat(50));

  const now = Date.now();
  const date7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const date3d = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const date90d = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const allRepos: GHSearchRepo[] = [];

  // === Q1: New repos (7d, 50+ stars) — NO isAIRepo filter ===
  console.log('\n=== Q1: New repos (7d, 50+ stars, unfiltered) ===');
  const q1 = await ghSearch(`created:>${date7d} stars:>50`);
  console.log(`   Got ${q1.length} repos`);
  allRepos.push(...q1);
  await delay(2000);

  // === Q2: Rising repos (8-90d, 100+ stars, no upper limit) — NO isAIRepo filter ===
  console.log('\n=== Q2: Rising repos (8-90d, 100+ stars, unfiltered) ===');
  const q2 = await ghSearch(`stars:>100 created:${date90d}..${date7d} pushed:>${date3d}`);
  console.log(`   Got ${q2.length} repos`);
  allRepos.push(...q2);
  await delay(2000);

  // === Q3: Resurgent repos — individual keywords, wider search ===
  console.log('\n=== Q3: Resurgent repos (individual keywords, 200+ stars) ===');
  const q3Keywords = ['mcp', 'agent', 'skill', 'plugin', 'memory', 'rag', 'claude code'];
  const q3Items: GHSearchRepo[] = [];

  for (const kw of q3Keywords) {
    const batch = await ghSearch(`"${kw}" stars:>200 pushed:>${date3d}`, 15);
    console.log(`   "${kw}": ${batch.length} repos`);
    q3Items.push(...batch);
    await delay(2000);
  }
  allRepos.push(...q3Items);

  // === Dedup ===
  const seen = new Set<string>();
  const deduped = allRepos.filter(r => {
    if (seen.has(r.full_name)) return false;
    seen.add(r.full_name);
    return true;
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Results Summary:`);
  console.log(`   Q1: ${q1.length} repos`);
  console.log(`   Q2: ${q2.length} repos`);
  console.log(`   Q3: ${q3Items.length} repos (across ${q3Keywords.length} keywords)`);
  console.log(`   Total unique: ${deduped.length} repos`);

  // === Test 1: Pool size ≥ 100 ===
  const test1 = deduped.length >= 100;
  console.log(`\n   Test 1 — Pool ≥ 100: ${test1 ? '✅ PASS' : '❌ FAIL'} (${deduped.length})`);

  // === Test 2: claude-mem is in the pool ===
  const hasClaudeMem = deduped.some(r => r.full_name.toLowerCase().includes('claude-mem'));
  console.log(`   Test 2 — claude-mem found: ${hasClaudeMem ? '✅ PASS' : '❌ FAIL'}`);

  // === Test 3: Known AI projects present ===
  const mustHave = ['openai/skills', 'anthropics/claude-plugins-official'];
  const found = mustHave.filter(name => deduped.some(r => r.full_name === name));
  const test3 = found.length === mustHave.length;
  console.log(`   Test 3 — Known projects: ${test3 ? '✅ PASS' : '❌ FAIL'} (${found.length}/${mustHave.length})`);

  // === Test 4: Non-AI repos exist in pool (confirming we removed pre-filter) ===
  // This is expected — Opus agent filter will handle the final filtering
  const sampleNonAI = deduped.filter(r => {
    const text = `${r.full_name} ${r.description || ''}`;
    return !/ai|llm|gpt|claude|model|machine.?learning|agent/i.test(text);
  });
  console.log(`   Test 4 — Non-AI in pool: ${sampleNonAI.length} repos (expected: some, Opus will filter)`);

  // === Test 5: Format check ===
  const sample = deduped.slice(0, 3).map(r => ({
    id: `gh-${r.full_name.replace('/', '-')}`,
    title: r.full_name,
    summary: (r.description || '').slice(0, 200),
    url: r.html_url,
    source: 'GitHub Trending',
  }));
  const test5 = sample.every(i => i.id && i.title && i.url);
  console.log(`   Test 5 — Format valid: ${test5 ? '✅ PASS' : '❌ FAIL'}`);

  // === Overall ===
  const allPass = test1 && hasClaudeMem && test3 && test5;
  console.log(`\n${'='.repeat(50)}`);
  if (allPass) {
    console.log('🎉 ALL TESTS PASSED — ready to implement');
  } else {
    console.log('❌ SOME TESTS FAILED — review before implementing');
  }

  // Show where claude-mem came from
  if (hasClaudeMem) {
    const cm = deduped.find(r => r.full_name.toLowerCase().includes('claude-mem'))!;
    console.log(`\n📌 claude-mem: ⭐${cm.stargazers_count} ${cm.full_name}`);
    console.log(`   ${cm.description}`);
    console.log(`   ${cm.html_url}`);
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
