#!/usr/bin/env npx tsx
/**
 * Export Timeline Data
 *
 * Pre-generates JSON files from the news_items DB table for SSG consumption.
 * Groups news items by topic (extracted via keyword matching against topic clusters).
 * Outputs to content/timelines/{topic}.json.
 *
 * Run as part of daily cron, before `npm run build`.
 *
 * Usage: npx tsx scripts/export-timeline-data.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { getDb, initSchema, closeDb } from '../src/lib/db.js'

dotenv.config()

const PROJECT_ROOT = process.cwd()
const TIMELINES_DIR = path.join(PROJECT_ROOT, 'content', 'timelines')

interface NewsItem {
  id: string
  title: string
  url: string
  source: string
  category: string
  score: number
  raw_summary: string
  detected_at: string
}

interface TopicCluster {
  slug: string
  name_en: string
  name_zh: string
  keywords: string[]
}

interface TimelineEntry {
  id: string
  title: string
  url: string
  source: string
  category: string
  score: number
  summary: string
  date: string
}

interface TimelineData {
  slug: string
  name_en: string
  name_zh: string
  entries: TimelineEntry[]
  lastUpdated: string
}

function loadTopicClusters(): TopicCluster[] {
  const filePath = path.join(PROJECT_ROOT, 'content', 'topic-clusters.json')
  if (!fs.existsSync(filePath)) return []
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

/**
 * Check if a news item matches a topic cluster
 */
function matchesTopic(newsTitle: string, newsSummary: string, keywords: string[]): boolean {
  const searchText = `${newsTitle} ${newsSummary}`.toLowerCase()
  for (const kw of keywords) {
    if (searchText.includes(kw)) return true
  }
  return false
}

async function main() {
  console.log('📊 Export Timeline Data — Generating topic timeline JSONs\n')

  const db = getDb()
  initSchema(db)

  // Get all news items (no time limit — timelines show full history)
  const newsItems = db.prepare(
    `SELECT id, title, url, source, category, score, raw_summary, detected_at
     FROM news_items
     ORDER BY detected_at DESC`
  ).all() as NewsItem[]

  if (newsItems.length === 0) {
    console.log('📭 No news items in database.')
    closeDb()
    return
  }

  console.log(`📰 Found ${newsItems.length} news items`)

  const clusters = loadTopicClusters()
  if (clusters.length === 0) {
    console.log('📭 No topic clusters defined.')
    closeDb()
    return
  }

  console.log(`📋 Matching against ${clusters.length} topic clusters\n`)

  // Ensure output directory exists
  fs.mkdirSync(TIMELINES_DIR, { recursive: true })

  const today = new Date().toISOString().split('T')[0]
  let totalEntries = 0

  for (const cluster of clusters) {
    const entries: TimelineEntry[] = []

    for (const news of newsItems) {
      if (matchesTopic(news.title, news.raw_summary || '', cluster.keywords)) {
        entries.push({
          id: news.id,
          title: news.title,
          url: news.url,
          source: news.source,
          category: news.category,
          score: news.score,
          summary: news.raw_summary || '',
          date: news.detected_at?.split('T')[0] || today,
        })
      }
    }

    if (entries.length === 0) {
      console.log(`  ⏭️  ${cluster.name_en}: 0 entries, skipping`)
      continue
    }

    const data: TimelineData = {
      slug: cluster.slug,
      name_en: cluster.name_en,
      name_zh: cluster.name_zh,
      entries,
      lastUpdated: today,
    }

    const outPath = path.join(TIMELINES_DIR, `${cluster.slug}.json`)
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2))
    console.log(`  ✅ ${cluster.name_en}: ${entries.length} entries → ${outPath}`)
    totalEntries += entries.length
  }

  closeDb()

  console.log('\n═══════════════════════════════════════════════════')
  console.log(`  ✅ Timeline Export Complete`)
  console.log(`  Topics: ${clusters.length}`)
  console.log(`  Total entries: ${totalEntries}`)
  console.log(`  Output: ${TIMELINES_DIR}/`)
  console.log('═══════════════════════════════════════════════════')
}

main().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
