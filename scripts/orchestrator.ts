#!/usr/bin/env tsx
/**
 * Hot2Content Orchestrator
 * 
 * 完整 Content Pipeline 编排脚本
 * 基于 2026-02-07/08 优化的最终方案：
 * 
 * 1. Gemini Deep Research (API) - 深度调研
 * 2. Claude Code Subagent: narrative-architect (Max Plan) - 叙事提炼
 * 3. Claude Code Subagent: writer-en (Max Plan) - 英文博客
 * 4. Claude Code Subagent: writer-zh (Max Plan) - 中文博客
 * 
 * 关键决策：
 * - Research: Gemini Deep Research（效果好）
 * - Narrative: 独立步骤（Plan A，质量更高）
 * - Writers: 同时读 Research + Narrative（深度更好）
 * - 中文: Claude Opus（不用 Kimi，质量更好）
 * - 计费: Gemini API (~$1/篇) + Claude Code Max Plan (免费)
 */

import { execSync, spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getDb, initSchema, insertContent, insertResearch, upsertTopicIndex, closeDb } from '../src/lib/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'output');
const INPUT_DIR = path.join(PROJECT_ROOT, 'input');

interface TopicInput {
  mode: 'keyword' | 'url' | 'auto_detect';
  keyword?: string;
  source_url?: string;
  created_at: string;
  force?: boolean;
}

interface OrchestratorConfig {
  topic: string;
  skipResearch?: boolean;
  skipNarrative?: boolean;
  skipWriters?: boolean;
  dryRun?: boolean;
}

function log(step: string, message: string) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] [${step}] ${message}`);
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Step 1: Gemini Deep Research (API)
 * 成本: ~$1/次
 */
async function runGeminiResearch(topic: string): Promise<boolean> {
  log('RESEARCH', `Starting Gemini Deep Research for: ${topic}`);
  
  // Update the topic in the research script
  const scriptPath = path.join(PROJECT_ROOT, 'scripts', 'research-gemini-deep.py');
  let script = fs.readFileSync(scriptPath, 'utf-8');
  
  // Replace topic in script (simple approach - could be improved with env vars)
  const topicLine = script.match(/^topic = ".*"$/m);
  if (topicLine) {
    script = script.replace(topicLine[0], `topic = "${topic}"`);
    fs.writeFileSync(scriptPath, script);
  }
  
  log('RESEARCH', 'Running Gemini Deep Research (this may take 10-20 minutes)...');
  
  return new Promise((resolve) => {
    const child = spawn('bash', ['-c',
      `cd ${PROJECT_ROOT} && source .venv/bin/activate && python scripts/research-gemini-deep.py`
    ], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      env: { ...process.env },
    });

    const timer = setTimeout(() => {
      log('RESEARCH', '⚠️ Timeout after 20 minutes, killing process');
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 5000);
      resolve(false);
    }, 20 * 60 * 1000);

    child.on('close', (code) => {
      clearTimeout(timer);
      const outputFile = path.join(OUTPUT_DIR, 'research-gemini-deep.md');
      if (code === 0 && fs.existsSync(outputFile)) {
        const stats = fs.statSync(outputFile);
        log('RESEARCH', `✅ Research complete: ${(stats.size / 1024).toFixed(2)} KB`);
        resolve(true);
      } else {
        log('RESEARCH', `❌ Research failed (exit code ${code})`);
        resolve(false);
      }
    });
  });
}

/**
 * Helper: run claude -p via stdin pipe
 * Uses temp file + cat pipe to avoid shell escaping issues with long prompts
 */
function runClaudePipe(prompt: string, timeoutMs: number = 10 * 60 * 1000): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    const tmpFile = path.join('/tmp', `claude-prompt-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, prompt);

    const child = spawn('bash', ['-c',
      `cat "${tmpFile}" | claude -p --allowedTools Read,Write,Bash`
    ], {
      cwd: PROJECT_ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let output = '';
    let stderr = '';
    child.stdout?.on('data', (d: Buffer) => { output += d.toString(); process.stdout.write(d); });
    child.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); process.stderr.write(d); });

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      try { fs.unlinkSync(tmpFile); } catch {}
      resolve({ ok: false, output: `Timeout after ${timeoutMs / 1000}s` });
    }, timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);
      try { fs.unlinkSync(tmpFile); } catch {}
      resolve({ ok: code === 0, output: output + stderr });
    });
  });
}

/**
 * Step 2: Claude Code Subagent - Narrative Architect
 * 成本: Max Plan (免费)
 * 
 * 读取: research-gemini-deep.md
 * 输出: core-narrative.json
 */
async function runNarrativeArchitect(): Promise<boolean> {
  log('NARRATIVE', 'Starting Narrative Architect (Claude Code Subagent)...');
  
  // Inject research summary for context
  let researchSummary = '';
  const researchFile = path.join(OUTPUT_DIR, 'research-gemini-deep.md');
  if (fs.existsSync(researchFile)) {
    const full = fs.readFileSync(researchFile, 'utf-8');
    researchSummary = full.slice(0, 3000);
  }

  const prompt = `
读取 output/research-gemini-deep.md，提炼 Core Narrative。

Focus on controversy, industry implications, and what makes this story matter to developers — not just what happened.

输出要求：
1. 写入 output/core-narrative.json，严格遵循以下 JSON schema：
   - topic_id: string (kebab-case)
   - title: string
   - created_at: string (ISO 8601)
   - is_update: boolean
   - previous_topic_id: string | null
   - one_liner: string (must be provocative enough to share on Twitter)
   - key_points: string[] (3-5 items, each must contain a specific number, date, or verifiable fact)
   - story_spine: { background, breakthrough, mechanism, significance, risks } (all non-empty strings)
   - faq: { question, answer }[] (min 3)
   - references: { title, url, source, date (YYYY-MM-DD) }[] (min 1)
   - diagrams: { type: "mermaid", title, code }[] (min 1)
   - seo: { slug (kebab-case), meta_title_en (50-60 chars), meta_description_en (150-160 chars), keywords_en (3-5), keywords_zh (3-5) }

2. Quality bar:
   - one_liner must be provocative enough to share on Twitter
   - key_points must each contain a specific number, date, or verifiable fact

完成后执行: npx tsx scripts/validate-narrative.ts
如果验证失败，修复后重新输出。

Here is the research executive summary for context:

${researchSummary}

(Full report is at output/research-gemini-deep.md — read it for details)
`.trim();

  try {
    const result = await runClaudePipe(prompt, 10 * 60 * 1000);
    
    const outputFile = path.join(OUTPUT_DIR, 'core-narrative.json');
    if (fs.existsSync(outputFile)) {
      log('NARRATIVE', '✅ Narrative complete');
      return true;
    }
    log('NARRATIVE', `❌ Narrative failed: output file not found (exit ok=${result.ok})`);
    return false;
  } catch (error) {
    log('NARRATIVE', `❌ Narrative failed: ${error}`);
    return false;
  }
}

/**
 * Step 3a: Claude Code Subagent - Writer EN
 * 成本: Max Plan (免费)
 * 
 * 读取: research-gemini-deep.md + core-narrative.json
 * 输出: blog-en.md
 */
async function runWriterEN(): Promise<boolean> {
  log('WRITER-EN', 'Starting English Writer (Claude Code Subagent)...');
  
  // Inject narrative key content
  let narrativeContext = '';
  const narrativeFile = path.join(OUTPUT_DIR, 'core-narrative.json');
  if (fs.existsSync(narrativeFile)) {
    try {
      const narr = JSON.parse(fs.readFileSync(narrativeFile, 'utf-8'));
      narrativeContext = `
Key narrative elements (from core-narrative.json):
- One-liner: ${narr.one_liner || 'N/A'}
- Key points: ${JSON.stringify(narr.key_points || [])}
- Story spine: ${JSON.stringify(narr.story_spine || {})}
`;
    } catch {}
  }

  const prompt = `
You are an English SEO blog writer.

Follow skills/blog-en/SKILL.md strictly for formatting, tone, and structure.

Input files:
- output/research-gemini-deep.md (deep research material)
- output/core-narrative.json (structural framework)
- skills/blog-en/SKILL.md (writing spec)

${narrativeContext}

Editorial angle: Extract the one_liner and story_spine from core-narrative.json and use them as your structural backbone. Your article must have a clear *thesis* — not just summarize facts, but argue a position.

What unique insight can LoreAI offer that TechCrunch or The Verge won't? Go deeper on technical implications.

Writing principles:
- Narrative provides structure: organize by story_spine
- Research provides depth: extract specific data, user feedback, technical details
- Combine both for a piece with both framework and depth

IMPORTANT: Include "tier: 1" in the frontmatter. This pipeline produces Tier 1 deep dive articles.

Output: write to output/blog-en.md

(Full narrative: output/core-narrative.json, Full research: output/research-gemini-deep.md)
`.trim();

  try {
    const result = await runClaudePipe(prompt, 10 * 60 * 1000);
    
    const outputFile = path.join(OUTPUT_DIR, 'blog-en.md');
    if (fs.existsSync(outputFile)) {
      log('WRITER-EN', '✅ English blog complete');
      return true;
    }
    log('WRITER-EN', `❌ Output file not found (exit ok=${result.ok})`);
    return false;
  } catch (error) {
    log('WRITER-EN', `❌ English writer failed: ${error}`);
    return false;
  }
}

/**
 * Step 3b: Claude Code Subagent - Writer ZH
 * 成本: Max Plan (免费)
 * 
 * 读取: research-gemini-deep.md + core-narrative.json
 * 输出: blog-zh.md
 * 
 * 注意: 用 Claude Opus，不用 Kimi（质量更好）
 */
async function runWriterZH(): Promise<boolean> {
  log('WRITER-ZH', 'Starting Chinese Writer (Claude Code Subagent)...');
  
  // Inject narrative key content for ZH writer
  let narrativeContextZH = '';
  const narrativeFileZH = path.join(OUTPUT_DIR, 'core-narrative.json');
  if (fs.existsSync(narrativeFileZH)) {
    try {
      const narr = JSON.parse(fs.readFileSync(narrativeFileZH, 'utf-8'));
      narrativeContextZH = `
核心叙事要素（来自 core-narrative.json）：
- One-liner: ${narr.one_liner || 'N/A'}
- Key points: ${JSON.stringify(narr.key_points || [])}
- Story spine: ${JSON.stringify(narr.story_spine || {})}
`;
    } catch {}
  }

  const prompt = `
你是中文科技博客作家。

严格遵循 skills/blog-zh/SKILL.md 的格式、语气和结构规范。

输入：
- output/research-gemini-deep.md (深度素材)
- output/core-narrative.json (结构框架)
- skills/blog-zh/SKILL.md (写作规范)

${narrativeContextZH}

重要原则：
- 你不是在翻译！基于同一话题独立创作中文内容
- 用中文读者熟悉的比喻和类比
- 如果话题与中国市场相关，自然融入本地视角和国产模型对比；如果不相关，不要强行加入。
- 专业术语首次出现标注英文：大语言模型（LLM）
- 语气像懂技术的朋友在科普

文章必须有明确的观点和立场，不是简单的信息汇总。从 core-narrative.json 的 one_liner 和 story_spine 中提取叙事主线。

LoreAI 的差异化：比机器之心更有观点，比少数派更有技术深度。

IMPORTANT: Include "tier: 1" in the frontmatter. This pipeline produces Tier 1 deep dive articles.

输出：写入 output/blog-zh.md

(Full narrative: output/core-narrative.json, Full research: output/research-gemini-deep.md)
`.trim();

  try {
    const result = await runClaudePipe(prompt, 10 * 60 * 1000);
    
    const outputFile = path.join(OUTPUT_DIR, 'blog-zh.md');
    if (fs.existsSync(outputFile)) {
      log('WRITER-ZH', '✅ Chinese blog complete');
      return true;
    }
    log('WRITER-ZH', `❌ Output file not found (exit ok=${result.ok})`);
    return false;
  } catch (error) {
    log('WRITER-ZH', `❌ Chinese writer failed: ${error}`);
    return false;
  }
}

/**
 * Step 4: Validate outputs
 */
function validateOutputs(): { valid: boolean; files: string[] } {
  const requiredFiles = [
    'research-gemini-deep.md',
    'core-narrative.json',
    'blog-en.md',
    'blog-zh.md'
  ];
  
  const existingFiles: string[] = [];
  const missingFiles: string[] = [];
  
  for (const file of requiredFiles) {
    const filePath = path.join(OUTPUT_DIR, file);
    if (fs.existsSync(filePath)) {
      existingFiles.push(file);
    } else {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length > 0) {
    log('VALIDATE', `❌ Missing files: ${missingFiles.join(', ')}`);
    return { valid: false, files: existingFiles };
  }
  
  log('VALIDATE', `✅ All outputs present: ${existingFiles.join(', ')}`);

  // Validate blog frontmatter
  for (const lang of ['en', 'zh']) {
    const blogFile = path.join(OUTPUT_DIR, `blog-${lang}.md`);
    if (fs.existsSync(blogFile)) {
      try {
        execSync(`npx tsx scripts/validate-blog.ts ${blogFile}`, {
          cwd: PROJECT_ROOT,
          stdio: 'inherit',
          timeout: 30000
        });
        log('VALIDATE', `✅ blog-${lang}.md frontmatter valid`);
      } catch {
        log('VALIDATE', `❌ blog-${lang}.md frontmatter invalid`);
      }
    }
  }

  return { valid: true, files: existingFiles };
}

/**
 * Health check: verify claude CLI is available
 */
async function healthCheck(): Promise<boolean> {
  try {
    execSync('echo "hi" | claude -p --allowedTools ""', { timeout: 30000, cwd: PROJECT_ROOT });
    return true;
  } catch {
    return false;
  }
}

/**
 * Retry wrapper: try once, wait 10s, try again
 */
async function withRetry(name: string, fn: () => Promise<boolean>): Promise<boolean> {
  const result = await fn();
  if (result) return true;
  log(name, '⚠️ Failed, retrying in 10s...');
  await new Promise(r => setTimeout(r, 10000));
  return fn();
}

/**
 * Main orchestrator
 */
async function main() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  🚀 Hot2Content Orchestrator');
  console.log('  混合模式: Gemini API + Claude Code Max Plan');
  console.log('═'.repeat(60));
  console.log('\n');

  // Get topic from command line or use default
  const topic = process.argv[2];
  if (!topic) {
    console.error('❌ Usage: npx tsx scripts/orchestrator.ts "Your topic here"');
    console.error('   Example: npx tsx scripts/orchestrator.ts "Claude Opus 4.6 Agent Teams"');
    process.exit(1);
  }
  
  log('START', `Topic: ${topic}`);
  log('START', `Output dir: ${OUTPUT_DIR}`);
  
  ensureDir(OUTPUT_DIR);

  // Health check
  log('HEALTH', 'Checking claude CLI availability...');
  const healthy = await healthCheck();
  if (!healthy) {
    log('HEALTH', '❌ claude CLI not available, aborting');
    process.exit(1);
  }
  log('HEALTH', '✅ claude CLI OK');
  
  const startTime = Date.now();
  
  // Step 1: Research (Gemini API - ~$1)
  console.log('\n' + '─'.repeat(60));
  log('STEP', '1/4 - Gemini Deep Research (API, ~$1)');
  const researchOk = await withRetry('RESEARCH', () => runGeminiResearch(topic));
  if (!researchOk) {
    log('ERROR', 'Research failed, aborting pipeline');
    process.exit(1);
  }
  
  // Step 2: Narrative (Claude Code Subagent - Max Plan)
  console.log('\n' + '─'.repeat(60));
  log('STEP', '2/4 - Narrative Architect (Max Plan)');
  const narrativeOk = await withRetry('NARRATIVE', () => runNarrativeArchitect());
  if (!narrativeOk) {
    log('ERROR', 'Narrative failed, aborting pipeline');
    process.exit(1);
  }
  
  // Step 3: Writers (Claude Code Subagents - Max Plan, parallel)
  console.log('\n' + '─'.repeat(60));
  log('STEP', '3/4 - Writers EN + ZH (Max Plan, parallel)');
  
  // Run writers sequentially to avoid Max Plan rate limits
  // (Promise.all now works with async spawn, but sequential is safer)
  const enOk = await withRetry('WRITER-EN', () => runWriterEN());
  const zhOk = await withRetry('WRITER-ZH', () => runWriterZH());
  
  if (!enOk || !zhOk) {
    log('WARN', `Writers: EN=${enOk}, ZH=${zhOk}`);
  }
  
  // Step 4: Validate
  console.log('\n' + '─'.repeat(60));
  log('STEP', '4/4 - Validate outputs');
  const validation = validateOutputs();
  
  // ===== DB: persist blog content + research =====
  try {
    const db = getDb();
    initSchema(db);

    const slugBase = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
    const date = new Date().toISOString().split('T')[0];
    let enContentId: number | undefined;
    let zhContentId: number | undefined;

    // Insert English blog
    const enPath = path.join(OUTPUT_DIR, 'blog-en.md');
    if (fs.existsSync(enPath)) {
      const enMd = fs.readFileSync(enPath, 'utf-8');
      const enTitle = enMd.split('\n').find(l => l.startsWith('# '))?.replace(/^#\s*/, '') || topic;
      enContentId = insertContent(db, {
        type: 'blog_en', title: enTitle, slug: `${slugBase}-en`,
        body_markdown: enMd, language: 'en', status: 'published', source_type: 'auto',
      });

      // Copy to content/blogs/en/
      const blogEnDir = path.join(PROJECT_ROOT, 'content', 'blogs', 'en');
      fs.mkdirSync(blogEnDir, { recursive: true });
      fs.copyFileSync(enPath, path.join(blogEnDir, `${slugBase}.md`));
    }

    // Insert Chinese blog
    const zhPath = path.join(OUTPUT_DIR, 'blog-zh.md');
    if (fs.existsSync(zhPath)) {
      const zhMd = fs.readFileSync(zhPath, 'utf-8');
      const zhTitle = zhMd.split('\n').find(l => l.startsWith('# '))?.replace(/^#\s*/, '') || topic;
      zhContentId = insertContent(db, {
        type: 'blog_zh', title: zhTitle, slug: `${slugBase}-zh`,
        body_markdown: zhMd, language: 'zh', status: 'published', source_type: 'auto',
      });

      const blogZhDir = path.join(PROJECT_ROOT, 'content', 'blogs', 'zh');
      fs.mkdirSync(blogZhDir, { recursive: true });
      fs.copyFileSync(zhPath, path.join(blogZhDir, `${slugBase}.md`));
    }

    // Link hreflang pairs
    if (enContentId && zhContentId) {
      db.prepare('UPDATE content SET hreflang_pair_id = ? WHERE id = ?').run(zhContentId, enContentId);
      db.prepare('UPDATE content SET hreflang_pair_id = ? WHERE id = ?').run(enContentId, zhContentId);
    }

    // Insert research data
    const researchPath = path.join(OUTPUT_DIR, 'research-gemini-deep.md');
    const narrativePath = path.join(OUTPUT_DIR, 'core-narrative.json');
    if (fs.existsSync(researchPath)) {
      insertResearch(db, {
        content_id: enContentId,
        research_report: fs.readFileSync(researchPath, 'utf-8'),
        core_narrative: fs.existsSync(narrativePath) ? fs.readFileSync(narrativePath, 'utf-8') : undefined,
      });
    }

    // Upsert topic index
    upsertTopicIndex(db, {
      topic_id: slugBase,
      title: topic,
      date,
      slug: slugBase,
      status: validation.valid ? 'published' : 'partial',
    });

    closeDb();
    log('DB', '✅ Persisted blogs, research, and topic index to SQLite');
  } catch (e) {
    log('DB', `⚠️ DB write error (non-fatal): ${e}`);
  }

  // Step 5: Extract keywords from research report
  console.log('\n' + '─'.repeat(60));
  log('STEP', '5/5 - Extract Keywords (Gemini Flash, ~$0.001)');
  try {
    execSync(`cd ${PROJECT_ROOT} && npx tsx scripts/extract-keywords.ts`, {
      stdio: 'inherit',
      shell: '/bin/bash',
      timeout: 2 * 60 * 1000
    });
    log('KEYWORDS', '✅ Keywords extracted');
  } catch (error) {
    log('KEYWORDS', `⚠️ Keyword extraction failed (non-fatal): ${error}`);
  }

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  📊 Pipeline Summary');
  console.log('═'.repeat(60));
  console.log(`  Topic: ${topic.substring(0, 50)}...`);
  console.log(`  Time: ${elapsed} minutes`);
  console.log(`  Cost: ~$1 (Gemini) + Max Plan (Claude)`);
  console.log(`  Files: ${validation.files.length}/4`);
  console.log(`  Status: ${validation.valid ? '✅ SUCCESS' : '⚠️ PARTIAL'}`);
  console.log('═'.repeat(60));
  console.log('\n');
  
  if (validation.valid) {
    console.log('Output files:');
    validation.files.forEach(f => {
      const filePath = path.join(OUTPUT_DIR, f);
      const stats = fs.statSync(filePath);
      console.log(`  - ${f} (${(stats.size / 1024).toFixed(1)} KB)`);
    });
  }
  
  process.exit(validation.valid ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
