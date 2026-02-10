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
  
  try {
    log('RESEARCH', 'Running Gemini Deep Research (this may take 10-15 minutes)...');
    execSync(`cd ${PROJECT_ROOT} && source .venv/bin/activate && python scripts/research-gemini-deep.py`, {
      stdio: 'inherit',
      shell: '/bin/bash',
      timeout: 20 * 60 * 1000 // 20 minutes timeout
    });
    
    const outputFile = path.join(OUTPUT_DIR, 'research-gemini-deep.md');
    if (fs.existsSync(outputFile)) {
      const stats = fs.statSync(outputFile);
      log('RESEARCH', `✅ Research complete: ${(stats.size / 1024).toFixed(2)} KB`);
      return true;
    }
    return false;
  } catch (error) {
    log('RESEARCH', `❌ Research failed: ${error}`);
    return false;
  }
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
      `cat "${tmpFile}" | cd ${PROJECT_ROOT} && cat "${tmpFile}" | claude -p --allowedTools Read,Write,Bash`
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
  
  const prompt = `
你是英文 SEO 博客作家。

输入：
- output/research-gemini-deep.md (深度素材)
- output/core-narrative.json (结构框架)
- skills/blog-en/SKILL.md (写作规范)

写作原则：
- Narrative 提供结构：按 story_spine 组织文章
- Research 提供深度：提取具体数据、用户反馈、技术细节
- 两者结合，产出既有框架又有深度的文章

输出：写入 output/blog-en.md

文章要求：
- 1500-2500 词
- 语气专业但易读
- TL;DR 放最前
- FAQ 用 H3
- 包含 Mermaid 图
- 禁止: "In this article", "Let's dive in", "Game-changing"
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
  
  const prompt = `
你是中文科技博客作家。

输入：
- output/research-gemini-deep.md (深度素材)
- output/core-narrative.json (结构框架)
- skills/blog-zh/SKILL.md (写作规范)

重要原则：
- 你不是在翻译！基于同一话题独立创作中文内容
- 用中文读者熟悉的比喻和类比
- 正常写中文博客，不需要特殊本地化
- 专业术语首次出现标注英文：大语言模型（LLM）
- 语气像懂技术的朋友在科普

输出：写入 output/blog-zh.md

文章结构：
- 一句话总结（TL;DR）
- 背景：为什么现在要关注
- 核心事件：到底发生了什么
- 技术解读：怎么做到的（包含图表）
- 影响分析：对我们意味着什么
- 风险与局限
- 常见问题（至少 3 个）
- 参考来源

字数：2000-3000 字
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
  return { valid: true, files: existingFiles };
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
  
  const startTime = Date.now();
  
  // Step 1: Research (Gemini API - ~$1)
  console.log('\n' + '─'.repeat(60));
  log('STEP', '1/4 - Gemini Deep Research (API, ~$1)');
  const researchOk = await runGeminiResearch(topic);
  if (!researchOk) {
    log('ERROR', 'Research failed, aborting pipeline');
    process.exit(1);
  }
  
  // Step 2: Narrative (Claude Code Subagent - Max Plan)
  console.log('\n' + '─'.repeat(60));
  log('STEP', '2/4 - Narrative Architect (Max Plan)');
  const narrativeOk = await runNarrativeArchitect();
  if (!narrativeOk) {
    log('ERROR', 'Narrative failed, aborting pipeline');
    process.exit(1);
  }
  
  // Step 3: Writers (Claude Code Subagents - Max Plan, parallel)
  console.log('\n' + '─'.repeat(60));
  log('STEP', '3/4 - Writers EN + ZH (Max Plan, parallel)');
  
  // Run writers sequentially to avoid Max Plan rate limits
  // (Promise.all now works with async spawn, but sequential is safer)
  const enOk = await runWriterEN();
  const zhOk = await runWriterZH();
  
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
