#!/usr/bin/env npx tsx
/**
 * Content Updater
 *
 * Reads unprocessed freshness_signals, groups by blog slug,
 * generates a 200-300 word "Update" section via Claude CLI,
 * and appends it to the existing blog post markdown.
 * Sets the `updated:` frontmatter date.
 *
 * Run after freshness-detector.ts.
 *
 * Usage: npx tsx scripts/content-updater.ts [--dry-run] [--limit N]
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import * as dotenv from 'dotenv'
import matter from 'gray-matter'
import { getDb, initSchema, closeDb } from '../src/lib/db.js'

dotenv.config()

const PROJECT_ROOT = process.cwd()
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const limitIdx = args.indexOf('--limit')
const MAX_UPDATES = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : 5

interface FreshnessSignal {
  id: number
  content_slug: string
  content_type: string
  news_item_id: string
  match_score: number
}

interface NewsItem {
  id: string
  title: string
  url: string
  source: string
  raw_summary: string
  detected_at: string
}

/**
 * Claude CLI pipe helper (same pattern as seo-pipeline.ts)
 */
function runClaudePipe(prompt: string, timeoutMs = 3 * 60 * 1000): string {
  const tmpFile = path.join('/tmp', `content-updater-${Date.now()}.txt`)
  fs.writeFileSync(tmpFile, prompt)
  try {
    const output = execSync(
      `cat "${tmpFile}" | claude -p --allowedTools "" 2>/dev/null`,
      { cwd: PROJECT_ROOT, timeout: timeoutMs, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    )
    return output.trim()
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

/**
 * Find the blog file path for a given slug
 */
function findBlogFile(slug: string): { path: string; lang: string } | null {
  for (const lang of ['en', 'zh']) {
    const dir = path.join(PROJECT_ROOT, 'content', 'blogs', lang)
    if (!fs.existsSync(dir)) continue
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.md')) continue
      const content = fs.readFileSync(path.join(dir, file), 'utf-8')
      const { data } = matter(content)
      if (data.slug === slug || file.replace(/\.md$/, '') === slug) {
        return { path: path.join(dir, file), lang }
      }
    }
  }
  return null
}

/**
 * Set the `updated` frontmatter field and append an update section
 */
function applyUpdate(filePath: string, updateSection: string, today: string): void {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)

  // Set updated date
  data.updated = today

  // Append the update section before the last line
  const updatedContent = content.trimEnd() + '\n\n' + updateSection + '\n'

  // Rebuild the file with updated frontmatter
  const newFile = matter.stringify(updatedContent, data)
  fs.writeFileSync(filePath, newFile)
}

async function main() {
  console.log('📝 Content Updater — Appending freshness updates to blog posts\n')

  const db = getDb()
  initSchema(db)

  // Get unprocessed freshness signals, grouped by slug
  const signals = db.prepare(
    `SELECT id, content_slug, content_type, news_item_id, match_score
     FROM freshness_signals
     WHERE status = 'detected'
     ORDER BY match_score DESC`
  ).all() as FreshnessSignal[]

  if (signals.length === 0) {
    console.log('📭 No unprocessed freshness signals found.')
    closeDb()
    return
  }

  // Group signals by slug
  const grouped = new Map<string, FreshnessSignal[]>()
  for (const signal of signals) {
    const existing = grouped.get(signal.content_slug) || []
    existing.push(signal)
    grouped.set(signal.content_slug, existing)
  }

  console.log(`📋 ${grouped.size} blog posts with freshness signals (${signals.length} total signals)\n`)

  const today = new Date().toISOString().split('T')[0]
  const markProcessed = db.prepare(`UPDATE freshness_signals SET status = 'processed' WHERE id = ?`)
  const markSkipped = db.prepare(`UPDATE freshness_signals SET status = 'skipped' WHERE id = ?`)

  let updated = 0
  let slugsProcessed = 0

  for (const [slug, slugSignals] of grouped) {
    if (slugsProcessed >= MAX_UPDATES) break

    console.log(`\n📄 ${slug} (${slugSignals.length} signals)`)

    // Find the blog file
    const blogFile = findBlogFile(slug)
    if (!blogFile) {
      console.log(`  ⏭️  Blog file not found, skipping`)
      for (const s of slugSignals) markSkipped.run(s.id)
      continue
    }

    // Get the news items for these signals
    const newsIds = slugSignals.map(s => s.news_item_id)
    const placeholders = newsIds.map(() => '?').join(',')
    const newsItems = db.prepare(
      `SELECT id, title, url, source, raw_summary, detected_at
       FROM news_items WHERE id IN (${placeholders})`
    ).all(...newsIds) as NewsItem[]

    if (newsItems.length === 0) {
      console.log(`  ⏭️  No news items found, skipping`)
      for (const s of slugSignals) markSkipped.run(s.id)
      continue
    }

    // Read existing blog content for context
    const blogContent = fs.readFileSync(blogFile.path, 'utf-8')
    const { data: blogData } = matter(blogContent)
    const blogTitle = blogData.title || slug

    // Format news context
    const newsContext = newsItems.map(n =>
      `- **${n.title}** (${n.source}, ${n.detected_at.split('T')[0]})\n  ${n.raw_summary || 'No summary'}\n  ${n.url}`
    ).join('\n\n')

    const isZh = blogFile.lang === 'zh'

    const prompt = isZh
      ? `你是 LoreAI 的 AI 技术博客编辑。

以下博客文章需要一个简短的更新段落来反映最新动态：

## 博客标题
${blogTitle}

## 最新相关新闻

${newsContext}

## 要求
- 写一个 200-300 字的更新段落
- 用 "---\n\n## 📰 最新动态（${today}）" 开头
- 总结上述新闻的要点及其对本文话题的影响
- 保持知识渊博的朋友般的语气
- 使用中文标点符号
- 不要重复博客正文的内容，只补充新信息
- 只返回更新段落的 Markdown，不需要其他解释`
      : `You are a tech blog editor for LoreAI.

The following blog post needs a short update section reflecting recent developments:

## Blog Title
${blogTitle}

## Recent Related News

${newsContext}

## Requirements
- Write a 200-300 word update section
- Start with "---\n\n## 📰 Latest Update (${today})"
- Summarize the key developments and their implications for this topic
- Use an Ars Technica journalist tone — clear, technically precise, slightly wry
- Do NOT repeat content from the original blog, only add new information
- Return ONLY the update section markdown, no explanations`

    console.log(`  🤖 Generating ${isZh ? 'ZH' : 'EN'} update section...`)

    if (DRY_RUN) {
      console.log(`  📝 [DRY] Would generate update for: ${blogTitle}`)
      console.log(`     News items: ${newsItems.map(n => n.title.slice(0, 50)).join(', ')}`)
      for (const s of slugSignals) {
        if (!DRY_RUN) markProcessed.run(s.id)
      }
      slugsProcessed++
      continue
    }

    try {
      const updateSection = runClaudePipe(prompt)

      if (!updateSection || updateSection.length < 50) {
        console.log(`  ⚠️  Update too short, skipping`)
        for (const s of slugSignals) markSkipped.run(s.id)
        continue
      }

      // Apply the update
      applyUpdate(blogFile.path, updateSection, today)
      console.log(`  ✅ Updated: ${blogFile.path}`)

      // Mark signals as processed
      for (const s of slugSignals) markProcessed.run(s.id)
      updated++
      slugsProcessed++
    } catch (e) {
      console.error(`  ❌ Error: ${(e as Error).message}`)
      for (const s of slugSignals) markSkipped.run(s.id)
    }
  }

  closeDb()

  console.log('\n═══════════════════════════════════════════════════')
  console.log(`  ✅ Content Update Complete`)
  console.log(`  Blog posts updated: ${updated}`)
  console.log(`  Signals processed: ${signals.length}`)
  console.log(`  Mode: ${DRY_RUN ? 'Dry Run' : 'Production'}`)
  console.log('═══════════════════════════════════════════════════')
}

main().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
