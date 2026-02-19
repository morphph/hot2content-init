#!/usr/bin/env npx tsx
/**
 * Content Freshness Detector
 *
 * Runs daily after collect-news.ts. Compares new news_items (last 48h)
 * against existing blog post keywords. When a strong match is found,
 * inserts a freshness_signal so content-updater.ts can append updates.
 *
 * Scoring: counts keyword overlap between news title/summary and blog keywords.
 * Threshold: 2+ keyword matches → insert signal.
 *
 * Usage: npx tsx scripts/freshness-detector.ts [--dry-run] [--hours N]
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import matter from 'gray-matter'
import { getDb, initSchema, closeDb } from '../src/lib/db.js'

dotenv.config()

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const hoursIdx = args.indexOf('--hours')
const LOOKBACK_HOURS = hoursIdx >= 0 ? parseInt(args[hoursIdx + 1]) : 48
const MATCH_THRESHOLD = 2

interface NewsItem {
  id: string
  title: string
  url: string
  source: string
  raw_summary: string
  detected_at: string
}

interface BlogMeta {
  slug: string
  keywords: string[]
  title: string
  lang: string
}

/**
 * Load blog metadata (keywords) from content/blogs/
 */
function loadBlogMeta(): BlogMeta[] {
  const blogs: BlogMeta[] = []
  const blogsDir = path.join(process.cwd(), 'content', 'blogs')

  for (const lang of ['en', 'zh']) {
    const langDir = path.join(blogsDir, lang)
    if (!fs.existsSync(langDir)) continue
    for (const file of fs.readdirSync(langDir)) {
      if (!file.endsWith('.md')) continue
      const content = fs.readFileSync(path.join(langDir, file), 'utf-8')
      const { data } = matter(content)
      if (data.keywords && data.keywords.length > 0) {
        blogs.push({
          slug: data.slug || file.replace(/\.md$/, ''),
          keywords: (data.keywords as string[]).map(k => k.toLowerCase()),
          title: data.title || '',
          lang,
        })
      }
    }
  }

  return blogs
}

/**
 * Count keyword matches between a news item and a blog post.
 * Bidirectional substring matching (same pattern as related-content.ts).
 */
function countMatches(newsText: string[], blogKeywords: string[]): number {
  let count = 0
  const lowerNews = newsText.map(t => t.toLowerCase())
  for (const kw of blogKeywords) {
    for (const text of lowerNews) {
      if (text.includes(kw) || kw.includes(text)) {
        count++
        break
      }
    }
  }
  return count
}

async function main() {
  console.log('🔄 Freshness Detector — Matching news to existing content\n')

  const db = getDb()
  initSchema(db)

  // Get recent news items
  const newsItems = db.prepare(
    `SELECT id, title, url, source, raw_summary, detected_at
     FROM news_items
     WHERE detected_at > datetime('now', '-' || ? || ' hours')
     ORDER BY detected_at DESC`
  ).all(LOOKBACK_HOURS) as NewsItem[]

  if (newsItems.length === 0) {
    console.log(`📭 No news items in the last ${LOOKBACK_HOURS}h.`)
    closeDb()
    return
  }

  console.log(`📰 Found ${newsItems.length} news items (last ${LOOKBACK_HOURS}h)`)

  // Load blog metadata
  const blogs = loadBlogMeta()
  console.log(`📝 Found ${blogs.length} blog posts to match against\n`)

  // Check for existing signals to avoid duplicates
  const existingSignals = new Set(
    (db.prepare(
      `SELECT content_slug || ':' || news_item_id AS key FROM freshness_signals`
    ).all() as { key: string }[]).map(r => r.key)
  )

  const insertSignal = db.prepare(`
    INSERT INTO freshness_signals (content_slug, content_type, news_item_id, match_score)
    VALUES (?, ?, ?, ?)
  `)

  let signalsCreated = 0

  for (const news of newsItems) {
    const newsText = [
      news.title,
      news.raw_summary || '',
    ].filter(Boolean)

    for (const blog of blogs) {
      const score = countMatches(newsText, blog.keywords)

      if (score >= MATCH_THRESHOLD) {
        const key = `${blog.slug}:${news.id}`
        if (existingSignals.has(key)) continue

        console.log(`  ✅ Match (score ${score}): "${news.title.slice(0, 60)}..." → ${blog.slug}`)

        if (!DRY_RUN) {
          insertSignal.run(blog.slug, 'blog', news.id, score)
          existingSignals.add(key)
        }
        signalsCreated++
      }
    }
  }

  closeDb()

  console.log('\n═══════════════════════════════════════════════════')
  console.log(`  ✅ Freshness Detection Complete`)
  console.log(`  News items scanned: ${newsItems.length}`)
  console.log(`  Blog posts checked: ${blogs.length}`)
  console.log(`  Signals created: ${signalsCreated}`)
  console.log(`  Mode: ${DRY_RUN ? 'Dry Run' : 'Production'}`)
  console.log('═══════════════════════════════════════════════════')
}

main().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
