#!/usr/bin/env npx tsx
/**
 * Generate Dashboard Data
 *
 * Queries SQLite DB + reads log files → writes content/dashboard-data.json
 * for SSG consumption by /admin page.
 *
 * Usage: npx tsx scripts/generate-dashboard-data.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import matter from 'gray-matter'
import { getDb, initSchema, closeDb } from '../src/lib/db.js'

dotenv.config()

const PROJECT_ROOT = process.cwd()
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'content', 'dashboard-data.json')

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardData {
  generatedAt: string

  pipelineHealth: {
    newsletter: {
      lastRunDate: string | null
      lastRunStatus: string
      lastRunMessage: string
      enPublished: boolean
      zhPublished: boolean
    }
    seo: {
      lastRunTimestamp: string | null
      lastRunStatus: string
    }
    newsItems: { last24h: number; last72h: number; total: number }
    recentErrors: string[]
  }

  keywordQuality: {
    byStatus: Record<string, number>
    byLanguage: Record<string, number>
    byIntent: Record<string, number>
    volumeDistribution: { noData: number; low: number; medium: number; high: number }
    difficultyDistribution: { noData: number; easy: number; medium: number; hard: number }
    top20: Array<{
      keyword: string; language: string; score: number | null
      status: string; search_volume: number | null; difficulty: number | null
      search_intent: string | null
    }>
    staleBacklogCount: number
    total: number
  }

  contentOutput: {
    byType: Record<string, number>
    byTier: Record<string, number>
    publishedLast7d: number
    publishedLast30d: number
    seoScoreDistribution: { poor: number; fair: number; good: number; excellent: number; noScore: number }
    enArticles: number
    zhArticles: number
    newsletterStreak: { en: number; zh: number; lastEnDate: string; lastZhDate: string }
  }

  recentKeywords?: {
    days: Array<{
      date: string
      count: number
      items: Array<{
        keyword: string
        language: string
        type: string | null
        search_intent: string | null
        score: number | null
        sourceNews: Array<{ title: string; url: string }>
      }>
    }>
  }

  recentContent?: {
    days: Array<{
      date: string
      count: number
      items: Array<{
        title: string
        slug: string
        type: 'blog' | 'glossary' | 'faq' | 'compare'
        language: string
        tier: number | null
        wordCount: number
        preview: string
      }>
    }>
  }
}

// ─── Pipeline Health ─────────────────────────────────────────────────────────

function getNewsletterHealth(): DashboardData['pipelineHealth']['newsletter'] {
  try {
    const statusPath = path.join(PROJECT_ROOT, 'logs', 'last-run-status.json')
    if (!fs.existsSync(statusPath)) {
      return { lastRunDate: null, lastRunStatus: 'unknown', lastRunMessage: 'No status file found', enPublished: false, zhPublished: false }
    }
    const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'))

    // Check if today's newsletters exist
    const date = status.date || ''
    const enDir = path.join(PROJECT_ROOT, 'content', 'newsletters', 'en')
    const zhDir = path.join(PROJECT_ROOT, 'content', 'newsletters', 'zh')
    const enPublished = date ? fs.existsSync(path.join(enDir, `${date}.md`)) : false
    const zhPublished = date ? fs.existsSync(path.join(zhDir, `${date}.md`)) : false

    return {
      lastRunDate: status.date || null,
      lastRunStatus: status.status || 'unknown',
      lastRunMessage: status.message || '',
      enPublished,
      zhPublished,
    }
  } catch {
    return { lastRunDate: null, lastRunStatus: 'unknown', lastRunMessage: 'Error reading status', enPublished: false, zhPublished: false }
  }
}

function getSeoHealth(): DashboardData['pipelineHealth']['seo'] {
  try {
    const logPath = path.join(PROJECT_ROOT, 'logs', 'seo-pipeline.log')
    if (!fs.existsSync(logPath)) {
      return { lastRunTimestamp: null, lastRunStatus: 'unknown' }
    }
    const content = fs.readFileSync(logPath, 'utf-8')
    const lines = content.split('\n').filter(Boolean)
    const lastLines = lines.slice(-20)

    // Find last "complete" line
    let lastRunTimestamp: string | null = null
    let lastRunStatus = 'unknown'
    for (let i = lastLines.length - 1; i >= 0; i--) {
      const line = lastLines[i]
      if (line.includes('SEO pipeline complete')) {
        const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC)/)
        lastRunTimestamp = match ? match[1] : null
        lastRunStatus = 'complete'
        break
      }
      if (/❌|FATAL|\bfailed\b|\berror\b/i.test(line) && !/Errors:\s*0/i.test(line)) {
        lastRunStatus = 'error'
      }
    }

    return { lastRunTimestamp, lastRunStatus }
  } catch {
    return { lastRunTimestamp: null, lastRunStatus: 'unknown' }
  }
}

function getRecentErrors(): string[] {
  try {
    const logPath = path.join(PROJECT_ROOT, 'logs', 'seo-pipeline.log')
    if (!fs.existsSync(logPath)) return []
    const content = fs.readFileSync(logPath, 'utf-8')
    const lines = content.split('\n').filter(Boolean)
    const lastLines = lines.slice(-50)
    return lastLines
      .filter(l => /❌|FATAL|\bfailed\b|\berror\b/i.test(l) && !/Errors:\s*0/i.test(l))
      .slice(-10)
  } catch {
    return []
  }
}

function getNewsItemCounts(db: ReturnType<typeof getDb>): DashboardData['pipelineHealth']['newsItems'] {
  try {
    const last24h = (db.prepare(`SELECT COUNT(*) as c FROM news_items WHERE detected_at > datetime('now', '-24 hours')`).get() as { c: number }).c
    const last72h = (db.prepare(`SELECT COUNT(*) as c FROM news_items WHERE detected_at > datetime('now', '-72 hours')`).get() as { c: number }).c
    const total = (db.prepare(`SELECT COUNT(*) as c FROM news_items`).get() as { c: number }).c
    return { last24h, last72h, total }
  } catch {
    return { last24h: 0, last72h: 0, total: 0 }
  }
}

// ─── Keyword Quality ─────────────────────────────────────────────────────────

function getKeywordQuality(db: ReturnType<typeof getDb>): DashboardData['keywordQuality'] {
  const byStatus: Record<string, number> = {}
  const byLanguage: Record<string, number> = {}
  const byIntent: Record<string, number> = {}

  try {
    const statusRows = db.prepare(`SELECT COALESCE(status, 'unknown') as s, COUNT(*) as c FROM keywords GROUP BY status`).all() as { s: string; c: number }[]
    for (const r of statusRows) byStatus[r.s] = r.c

    const langRows = db.prepare(`SELECT COALESCE(language, 'unknown') as l, COUNT(*) as c FROM keywords GROUP BY language`).all() as { l: string; c: number }[]
    for (const r of langRows) byLanguage[r.l] = r.c

    const intentRows = db.prepare(`SELECT COALESCE(search_intent, 'unknown') as i, COUNT(*) as c FROM keywords GROUP BY search_intent`).all() as { i: string; c: number }[]
    for (const r of intentRows) byIntent[r.i] = r.c
  } catch { /* tables may not exist */ }

  // Volume distribution
  const volumeDistribution = { noData: 0, low: 0, medium: 0, high: 0 }
  try {
    const volRows = db.prepare(`
      SELECT
        CASE
          WHEN search_volume IS NULL THEN 'noData'
          WHEN search_volume < 100 THEN 'low'
          WHEN search_volume < 1000 THEN 'medium'
          ELSE 'high'
        END as bucket,
        COUNT(*) as c
      FROM keywords GROUP BY bucket
    `).all() as { bucket: string; c: number }[]
    for (const r of volRows) {
      if (r.bucket in volumeDistribution) (volumeDistribution as Record<string, number>)[r.bucket] = r.c
    }
  } catch { /* */ }

  // Difficulty distribution
  const difficultyDistribution = { noData: 0, easy: 0, medium: 0, hard: 0 }
  try {
    const diffRows = db.prepare(`
      SELECT
        CASE
          WHEN difficulty IS NULL THEN 'noData'
          WHEN difficulty < 30 THEN 'easy'
          WHEN difficulty < 60 THEN 'medium'
          ELSE 'hard'
        END as bucket,
        COUNT(*) as c
      FROM keywords GROUP BY bucket
    `).all() as { bucket: string; c: number }[]
    for (const r of diffRows) {
      if (r.bucket in difficultyDistribution) (difficultyDistribution as Record<string, number>)[r.bucket] = r.c
    }
  } catch { /* */ }

  // Top 20
  let top20: DashboardData['keywordQuality']['top20'] = []
  try {
    top20 = db.prepare(`
      SELECT keyword, language, score, status, search_volume, difficulty, search_intent
      FROM keywords ORDER BY score DESC, id LIMIT 20
    `).all() as typeof top20
  } catch { /* */ }

  // Stale backlog
  let staleBacklogCount = 0
  try {
    staleBacklogCount = (db.prepare(`SELECT COUNT(*) as c FROM keywords WHERE status = 'backlog' AND created_at < datetime('now', '-7 days')`).get() as { c: number }).c
  } catch { /* */ }

  // Total
  let total = 0
  try {
    total = (db.prepare(`SELECT COUNT(*) as c FROM keywords`).get() as { c: number }).c
  } catch { /* */ }

  return { byStatus, byLanguage, byIntent, volumeDistribution, difficultyDistribution, top20, staleBacklogCount, total }
}

// ─── Content Output ──────────────────────────────────────────────────────────

function getContentOutput(db: ReturnType<typeof getDb>): DashboardData['contentOutput'] {
  const byType: Record<string, number> = {}
  const byTier: Record<string, number> = {}

  try {
    const typeRows = db.prepare(`SELECT COALESCE(type, 'unknown') as t, COUNT(*) as c FROM content GROUP BY type`).all() as { t: string; c: number }[]
    for (const r of typeRows) byType[r.t] = r.c
  } catch { /* */ }

  // Tier counts from blog frontmatter
  try {
    const blogDirs = [
      path.join(PROJECT_ROOT, 'content', 'blogs', 'en'),
      path.join(PROJECT_ROOT, 'content', 'blogs', 'zh'),
    ]
    for (const dir of blogDirs) {
      if (!fs.existsSync(dir)) continue
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'))
      for (const file of files) {
        try {
          const raw = fs.readFileSync(path.join(dir, file), 'utf-8')
          const { data } = matter(raw)
          const tier = String(data.tier || '0')
          byTier[tier] = (byTier[tier] || 0) + 1
        } catch { /* skip unparseable */ }
      }
    }
  } catch { /* */ }

  let publishedLast7d = 0
  let publishedLast30d = 0
  try {
    publishedLast7d = (db.prepare(`SELECT COUNT(*) as c FROM content WHERE published_at > datetime('now', '-7 days')`).get() as { c: number }).c
    publishedLast30d = (db.prepare(`SELECT COUNT(*) as c FROM content WHERE published_at > datetime('now', '-30 days')`).get() as { c: number }).c
  } catch { /* */ }

  // SEO score distribution
  const seoScoreDistribution = { poor: 0, fair: 0, good: 0, excellent: 0, noScore: 0 }
  try {
    const seoRows = db.prepare(`
      SELECT
        CASE
          WHEN seo_score IS NULL THEN 'noScore'
          WHEN seo_score < 50 THEN 'poor'
          WHEN seo_score < 70 THEN 'fair'
          WHEN seo_score < 85 THEN 'good'
          ELSE 'excellent'
        END as bucket,
        COUNT(*) as c
      FROM content GROUP BY bucket
    `).all() as { bucket: string; c: number }[]
    for (const r of seoRows) {
      if (r.bucket in seoScoreDistribution) (seoScoreDistribution as Record<string, number>)[r.bucket] = r.c
    }
  } catch { /* */ }

  // EN/ZH article counts
  let enArticles = 0
  let zhArticles = 0
  try {
    const langRows = db.prepare(`SELECT language, COUNT(*) as c FROM content WHERE type LIKE '%blog%' GROUP BY language`).all() as { language: string; c: number }[]
    for (const r of langRows) {
      if (r.language === 'en') enArticles = r.c
      if (r.language === 'zh') zhArticles = r.c
    }
  } catch { /* */ }

  // Newsletter streak
  const newsletterStreak = { en: 0, zh: 0, lastEnDate: '', lastZhDate: '' }
  try {
    for (const lang of ['en', 'zh'] as const) {
      const dir = path.join(PROJECT_ROOT, 'content', 'newsletters', lang)
      if (!fs.existsSync(dir)) continue
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort().reverse()
      if (files.length === 0) continue

      // Extract dates from filenames (YYYY-MM-DD.md)
      const dates = files.map(f => f.replace('.md', '')).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().reverse()
      if (dates.length === 0) continue

      const lastDate = dates[0]
      newsletterStreak[lang === 'en' ? 'lastEnDate' : 'lastZhDate'] = lastDate

      // Count consecutive days from the most recent date
      let streak = 1
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1])
        const curr = new Date(dates[i])
        const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
        if (diffDays <= 1.5) {
          streak++
        } else {
          break
        }
      }
      newsletterStreak[lang] = streak
    }
  } catch { /* */ }

  return { byType, byTier, publishedLast7d, publishedLast30d, seoScoreDistribution, enArticles, zhArticles, newsletterStreak }
}

// ─── Recent Keywords (last 7 days, from DB) ─────────────────────────────────

function getRecentKeywords(db: ReturnType<typeof getDb>): DashboardData['recentKeywords'] {
  try {
    const rows = db.prepare(`
      SELECT
        k.id as kid, k.keyword, k.language, k.type, k.search_intent, k.score,
        DATE(k.created_at) as date,
        n.title as news_title, n.url as news_url
      FROM keywords k
      LEFT JOIN research r ON k.parent_research_id = r.id
      LEFT JOIN content_sources cs ON r.content_id = cs.content_id
      LEFT JOIN news_items n ON cs.news_item_id = n.id
      WHERE k.created_at > datetime('now', '-7 days')
      ORDER BY DATE(k.created_at) DESC, k.score DESC
    `).all() as Array<{
      kid: number; keyword: string; language: string; type: string | null
      search_intent: string | null; score: number | null; date: string
      news_title: string | null; news_url: string | null
    }>

    // Group by date, dedup keywords, cap sourceNews at 2 per keyword
    const dayMap = new Map<string, Map<number, {
      keyword: string; language: string; type: string | null
      search_intent: string | null; score: number | null
      sourceNews: Array<{ title: string; url: string }>
    }>>()

    for (const row of rows) {
      if (!dayMap.has(row.date)) dayMap.set(row.date, new Map())
      const kwMap = dayMap.get(row.date)!

      if (!kwMap.has(row.kid)) {
        kwMap.set(row.kid, {
          keyword: row.keyword,
          language: row.language || 'en',
          type: row.type,
          search_intent: row.search_intent,
          score: row.score,
          sourceNews: [],
        })
      }

      const kw = kwMap.get(row.kid)!
      if (row.news_title && row.news_url && kw.sourceNews.length < 2) {
        // Avoid duplicate news entries
        if (!kw.sourceNews.some(s => s.url === row.news_url)) {
          kw.sourceNews.push({ title: row.news_title, url: row.news_url })
        }
      }
    }

    const days = Array.from(dayMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, kwMap]) => {
        const items = Array.from(kwMap.values()).slice(0, 30)
        return { date, count: kwMap.size, items }
      })

    return { days }
  } catch {
    return { days: [] }
  }
}

// ─── Recent Content (last 7 days, from filesystem) ──────────────────────────

function getRecentContent(): DashboardData['recentContent'] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  interface ContentItem {
    title: string; slug: string; type: 'blog' | 'glossary' | 'faq' | 'compare'
    language: string; tier: number | null; wordCount: number; preview: string; date: string
  }

  const items: ContentItem[] = []

  const scanDirs: Array<{ dir: string; type: 'blog' | 'glossary' | 'faq' | 'compare'; lang?: string }> = [
    { dir: path.join(PROJECT_ROOT, 'content', 'blogs', 'en'), type: 'blog', lang: 'en' },
    { dir: path.join(PROJECT_ROOT, 'content', 'blogs', 'zh'), type: 'blog', lang: 'zh' },
    { dir: path.join(PROJECT_ROOT, 'content', 'glossary'), type: 'glossary' },
    { dir: path.join(PROJECT_ROOT, 'content', 'faq'), type: 'faq' },
    { dir: path.join(PROJECT_ROOT, 'content', 'compare'), type: 'compare' },
  ]

  for (const { dir, type, lang } of scanDirs) {
    if (!fs.existsSync(dir)) continue
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'))

    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(dir, file), 'utf-8')
        const { data, content } = matter(raw)

        const dateStr = data.date ? (typeof data.date === 'object' ? (data.date as Date).toISOString().slice(0, 10) : String(data.date).slice(0, 10)) : ''
        if (!dateStr || dateStr < cutoffStr) continue

        const language = lang || data.lang || (file.endsWith('-zh.md') ? 'zh' : 'en')
        const title = data.title || data.term || file.replace('.md', '')
        const slug = data.slug || file.replace('.md', '')
        const tier = type === 'blog' ? (data.tier ?? null) : null
        const body = content.trim()
        const wordCount = body.split(/\s+/).length
        const preview = body.replace(/^#+\s.*/gm, '').replace(/\n+/g, ' ').trim().slice(0, 200)

        items.push({ title, slug, type, language, tier, wordCount, preview, date: dateStr })
      } catch { /* skip unparseable */ }
    }
  }

  // Group by date
  const dayMap = new Map<string, ContentItem[]>()
  for (const item of items) {
    if (!dayMap.has(item.date)) dayMap.set(item.date, [])
    dayMap.get(item.date)!.push(item)
  }

  const days = Array.from(dayMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, dayItems]) => ({
      date,
      count: dayItems.length,
      items: dayItems.slice(0, 30).map(({ date: _, ...rest }) => rest),
    }))

  return { days }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Generating dashboard data...')

  const db = getDb()
  initSchema(db)

  const data: DashboardData = {
    generatedAt: new Date().toISOString(),

    pipelineHealth: {
      newsletter: getNewsletterHealth(),
      seo: getSeoHealth(),
      newsItems: getNewsItemCounts(db),
      recentErrors: getRecentErrors(),
    },

    keywordQuality: getKeywordQuality(db),
    contentOutput: getContentOutput(db),
    recentKeywords: getRecentKeywords(db),
  }

  closeDb()

  // Filesystem-based data (no DB needed)
  data.recentContent = getRecentContent()

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2))
  console.log(`Dashboard data written to ${OUTPUT_PATH}`)
}

main().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
