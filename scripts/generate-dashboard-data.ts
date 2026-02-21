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
import type { DashboardData, QualityFlag, SampleReviewItem, SampleContentItem } from '../src/lib/dashboard.js'

dotenv.config()

const PROJECT_ROOT = process.cwd()
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'content', 'dashboard-data.json')

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
  const byType: Record<string, number> = {}

  try {
    const statusRows = db.prepare(`SELECT COALESCE(status, 'unknown') as s, COUNT(*) as c FROM keywords GROUP BY status`).all() as { s: string; c: number }[]
    for (const r of statusRows) byStatus[r.s] = r.c

    const langRows = db.prepare(`SELECT COALESCE(language, 'unknown') as l, COUNT(*) as c FROM keywords GROUP BY language`).all() as { l: string; c: number }[]
    for (const r of langRows) byLanguage[r.l] = r.c

    const intentRows = db.prepare(`SELECT COALESCE(search_intent, 'unknown') as i, COUNT(*) as c FROM keywords GROUP BY search_intent`).all() as { i: string; c: number }[]
    for (const r of intentRows) byIntent[r.i] = r.c

    const typeRows = db.prepare(`SELECT COALESCE(type, 'unknown') as t, COUNT(*) as c FROM keywords GROUP BY type`).all() as { t: string; c: number }[]
    for (const r of typeRows) byType[r.t] = r.c
  } catch { /* tables may not exist */ }

  // Enrichment coverage
  const enrichmentCoverage = { enriched: 0, unenriched: 0 }
  try {
    const enriched = (db.prepare(`SELECT COUNT(*) as c FROM keywords WHERE search_volume IS NOT NULL`).get() as { c: number }).c
    const total = (db.prepare(`SELECT COUNT(*) as c FROM keywords`).get() as { c: number }).c
    enrichmentCoverage.enriched = enriched
    enrichmentCoverage.unenriched = total - enriched
  } catch { /* */ }

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

  return { byStatus, byLanguage, byIntent, byType, enrichmentCoverage, volumeDistribution, difficultyDistribution, top20, staleBacklogCount, total }
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

  // Bilingual coverage — scan filesystem for paired content
  const bilingualCoverage = { paired: 0, enOnly: 0, zhOnly: 0 }
  try {
    const enDir = path.join(PROJECT_ROOT, 'content', 'blogs', 'en')
    const zhDir = path.join(PROJECT_ROOT, 'content', 'blogs', 'zh')
    const enSlugs = new Set<string>()
    const zhSlugs = new Set<string>()
    if (fs.existsSync(enDir)) {
      for (const f of fs.readdirSync(enDir).filter(f => f.endsWith('.md'))) {
        enSlugs.add(f.replace('.md', ''))
      }
    }
    if (fs.existsSync(zhDir)) {
      for (const f of fs.readdirSync(zhDir).filter(f => f.endsWith('.md'))) {
        zhSlugs.add(f.replace('.md', ''))
      }
    }
    for (const slug of enSlugs) {
      if (zhSlugs.has(slug)) {
        bilingualCoverage.paired++
      } else {
        bilingualCoverage.enOnly++
      }
    }
    for (const slug of zhSlugs) {
      if (!enSlugs.has(slug)) bilingualCoverage.zhOnly++
    }
  } catch { /* */ }

  // Freshness backlog
  let freshnessBacklog = 0
  try {
    freshnessBacklog = (db.prepare(`SELECT COUNT(*) as c FROM freshness_signals WHERE status = 'detected'`).get() as { c: number }).c
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

  return { byType, byTier, publishedLast7d, publishedLast30d, seoScoreDistribution, enArticles, zhArticles, bilingualCoverage, freshnessBacklog, newsletterStreak }
}

// ─── Keyword Provenance ──────────────────────────────────────────────────────

function getKeywordProvenance(db: ReturnType<typeof getDb>): DashboardData['keywordProvenance'] {
  const emptySource = (): DashboardData['keywordProvenance']['research'] => ({ total: 0, backlog: 0, published: 0, error: 0, avgDaysToPublish: null })
  const emptyPAA = (): DashboardData['keywordProvenance']['paa'] => ({ total: 0, discovered: 0, published: 0, duplicate: 0, error: 0 })

  const research = emptySource()
  const news = emptySource()
  const paa = emptyPAA()
  const last7d = {
    research: { added: 0, published: 0 },
    news: { added: 0, published: 0 },
    paa: { added: 0, published: 0 },
  }

  try {
    // Keyword source breakdown
    const rows = db.prepare(`
      SELECT COALESCE(source, 'news') as src, COALESCE(status, 'backlog') as st, COUNT(*) as c
      FROM keywords GROUP BY src, st
    `).all() as { src: string; st: string; c: number }[]

    for (const r of rows) {
      const target = r.src === 'research' ? research : news
      target.total += r.c
      if (r.st === 'backlog') target.backlog += r.c
      else if (r.st === 'published') target.published += r.c
      else if (r.st === 'error') target.error += r.c
    }

    // Avg days to publish per source
    for (const src of ['research', 'news'] as const) {
      try {
        const row = db.prepare(`
          SELECT AVG(julianday(c.published_at) - julianday(k.created_at)) as avg_days
          FROM keywords k JOIN content c ON k.content_id = c.id
          WHERE k.source = ? AND k.status = 'published'
        `).get(src) as { avg_days: number | null } | undefined
        const target = src === 'research' ? research : news
        target.avgDaysToPublish = row?.avg_days ? Math.round(row.avg_days * 10) / 10 : null
      } catch { /* */ }
    }

    // PAA stats
    try {
      const paaRows = db.prepare(`
        SELECT COALESCE(status, 'discovered') as st, COUNT(*) as c
        FROM paa_questions GROUP BY st
      `).all() as { st: string; c: number }[]
      for (const r of paaRows) {
        paa.total += r.c
        if (r.st === 'discovered') paa.discovered += r.c
        else if (r.st === 'published') paa.published += r.c
        else if (r.st === 'duplicate') paa.duplicate += r.c
        else if (r.st === 'error') paa.error += r.c
      }
    } catch { /* */ }

    // Last 7 days
    try {
      const recent = db.prepare(`
        SELECT COALESCE(source, 'news') as src, status, COUNT(*) as c
        FROM keywords WHERE created_at > datetime('now', '-7 days')
        GROUP BY src, status
      `).all() as { src: string; status: string; c: number }[]
      for (const r of recent) {
        const target = r.src === 'research' ? last7d.research : last7d.news
        target.added += r.c
        if (r.status === 'published') target.published += r.c
      }
    } catch { /* */ }

    try {
      const recentPAA = db.prepare(`
        SELECT status, COUNT(*) as c
        FROM paa_questions WHERE discovered_at > datetime('now', '-7 days')
        GROUP BY status
      `).all() as { status: string; c: number }[]
      for (const r of recentPAA) {
        last7d.paa.added += r.c
        if (r.status === 'published') last7d.paa.published += r.c
      }
    } catch { /* */ }
  } catch { /* */ }

  return { research, news, paa, last7d }
}

// ─── Sample Review (last 7 days) ────────────────────────────────────────────

function computeQualityFlags(filePath: string, frontmatter: Record<string, unknown>, body: string, tier: number | null): QualityFlag[] {
  const flags: QualityFlag[] = []

  // Word count
  const wordCount = body.split(/\s+/).filter(Boolean).length
  const tierNum = tier ?? 3
  const ranges: Record<number, [number, number]> = { 1: [1500, 2500], 2: [800, 1500], 3: [300, 500] }
  const [min, max] = ranges[tierNum] || [300, 500]
  if (wordCount < min * 0.8) {
    flags.push({ name: 'Word count', status: 'fail', detail: `${wordCount} words (T${tierNum} needs ${min}-${max})` })
  } else if (wordCount < min || wordCount > max * 1.2) {
    flags.push({ name: 'Word count', status: 'warn', detail: `${wordCount} words (target: ${min}-${max})` })
  } else {
    flags.push({ name: 'Word count', status: 'pass' })
  }

  // TL;DR
  const hasTldr = /TL;DR|一句话总结/.test(body)
  flags.push({ name: 'Has TL;DR', status: hasTldr ? 'pass' : 'warn', detail: hasTldr ? undefined : 'Missing TL;DR / 一句话总结' })

  // Title length
  const title = String(frontmatter.title || '')
  if (title.length < 30 || title.length > 65) {
    flags.push({ name: 'Title length', status: title.length < 20 || title.length > 80 ? 'fail' : 'warn', detail: `${title.length} chars (target: 30-65)` })
  } else {
    flags.push({ name: 'Title length', status: 'pass' })
  }

  // Description length
  const desc = String(frontmatter.description || '')
  if (desc.length < 100 || desc.length > 160) {
    flags.push({ name: 'Description length', status: desc.length < 50 || desc.length > 200 ? 'fail' : 'warn', detail: `${desc.length} chars (target: 100-160)` })
  } else {
    flags.push({ name: 'Description length', status: 'pass' })
  }

  // Keywords array
  const kwArray = frontmatter.keywords
  if (Array.isArray(kwArray) && kwArray.length > 0) {
    flags.push({ name: 'Has keywords', status: 'pass' })
  } else {
    flags.push({ name: 'Has keywords', status: 'warn', detail: 'Missing or empty keywords array' })
  }

  // Hreflang pair
  const lang = String(frontmatter.lang || '')
  const basename = path.basename(filePath, '.md')
  const dirPath = path.dirname(filePath)
  let hasPair = false
  if (lang === 'en') {
    // Check for ZH pair by looking in sibling zh dir or same dir
    const zhCandidates = [
      path.join(dirPath, '..', 'zh', basename + '.md'),
      path.join(dirPath, basename.replace(/-en$/, '-zh') + '.md'),
    ]
    hasPair = zhCandidates.some(p => fs.existsSync(p))
  } else if (lang === 'zh') {
    const enCandidates = [
      path.join(dirPath, '..', 'en', basename + '.md'),
      path.join(dirPath, basename.replace(/-zh$/, '-en') + '.md'),
    ]
    hasPair = enCandidates.some(p => fs.existsSync(p))
  }
  flags.push({ name: 'Hreflang pair', status: hasPair ? 'pass' : 'warn', detail: hasPair ? undefined : 'No matching language pair found' })

  return flags
}

function getSampleReview(db: ReturnType<typeof getDb>): DashboardData['sampleReview'] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  // Scan all content directories for recently published items
  interface FileInfo {
    filePath: string
    slug: string
    title: string
    language: string
    tier: number | null
    wordCount: number
    seoScore: number | null
    date: string
    frontmatter: Record<string, unknown>
    body: string
    type: string
  }

  const fileInfos: FileInfo[] = []
  const scanDirs: Array<{ dir: string; type: string; lang?: string }> = [
    { dir: path.join(PROJECT_ROOT, 'content', 'blogs', 'en'), type: 'blog', lang: 'en' },
    { dir: path.join(PROJECT_ROOT, 'content', 'blogs', 'zh'), type: 'blog', lang: 'zh' },
    { dir: path.join(PROJECT_ROOT, 'content', 'glossary'), type: 'glossary' },
    { dir: path.join(PROJECT_ROOT, 'content', 'faq'), type: 'faq' },
    { dir: path.join(PROJECT_ROOT, 'content', 'compare'), type: 'compare' },
  ]

  for (const { dir, type, lang } of scanDirs) {
    if (!fs.existsSync(dir)) continue
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
      try {
        const filePath = path.join(dir, file)
        const raw = fs.readFileSync(filePath, 'utf-8')
        const { data, content } = matter(raw)
        const dateStr = data.date ? (typeof data.date === 'object' ? (data.date as Date).toISOString().slice(0, 10) : String(data.date).slice(0, 10)) : ''
        if (!dateStr || dateStr < cutoffStr) continue

        const language = lang || data.lang || (file.endsWith('-zh.md') ? 'zh' : 'en')
        const body = content.trim()

        fileInfos.push({
          filePath,
          slug: data.slug || file.replace('.md', ''),
          title: data.title || file.replace('.md', ''),
          language,
          tier: type === 'blog' ? (data.tier ?? null) : null,
          wordCount: body.split(/\s+/).filter(Boolean).length,
          seoScore: data.seo_score ?? null,
          date: dateStr,
          frontmatter: data,
          body,
          type,
        })
      } catch { /* skip */ }
    }
  }

  // Build slug → file info map
  const slugToFiles = new Map<string, FileInfo[]>()
  for (const fi of fileInfos) {
    const normSlug = fi.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    if (!slugToFiles.has(normSlug)) slugToFiles.set(normSlug, [])
    slugToFiles.get(normSlug)!.push(fi)
  }

  // Get recent keywords
  let recentKeywords: Array<{
    keyword: string; type: string | null; score: number | null
    source: string; date: string; news_ids: string | null
  }> = []
  try {
    recentKeywords = db.prepare(`
      SELECT keyword, type, score, COALESCE(source, 'news') as source, DATE(created_at) as date, news_ids
      FROM keywords WHERE created_at > datetime('now', '-7 days')
      ORDER BY DATE(created_at) DESC, score DESC
    `).all() as typeof recentKeywords
  } catch { /* */ }

  // Get news items for linking
  const newsItemCache = new Map<string, { title: string; url: string }>()
  try {
    const newsRows = db.prepare(`SELECT id, title, url FROM news_items WHERE detected_at > datetime('now', '-14 days')`).all() as { id: string; title: string; url: string }[]
    for (const r of newsRows) newsItemCache.set(r.id, { title: r.title, url: r.url })
  } catch { /* */ }

  // Group by date
  const dayMap = new Map<string, SampleReviewItem[]>()

  for (const kw of recentKeywords) {
    if (!dayMap.has(kw.date)) dayMap.set(kw.date, [])

    const kwSlug = kw.keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const matchedFiles = slugToFiles.get(kwSlug) || []

    // Resolve source news
    const sourceNews: Array<{ title: string; url: string }> = []
    if (kw.news_ids) {
      try {
        const ids = JSON.parse(kw.news_ids) as string[]
        for (const id of ids.slice(0, 3)) {
          const ni = newsItemCache.get(id)
          if (ni) sourceNews.push(ni)
        }
      } catch { /* */ }
    }

    const contentItems: SampleContentItem[] = matchedFiles.map(fi => {
      const flags = computeQualityFlags(fi.filePath, fi.frontmatter, fi.body, fi.tier)
      return {
        title: fi.title,
        slug: fi.slug,
        language: fi.language,
        tier: fi.tier,
        wordCount: fi.wordCount,
        seoScore: fi.seoScore,
        flags,
      }
    })

    dayMap.get(kw.date)!.push({
      keyword: kw.keyword,
      type: kw.type,
      score: kw.score,
      source: kw.source as 'research' | 'news' | 'paa',
      sourceNews,
      content: contentItems,
    })
  }

  const days = Array.from(dayMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => {
      // Compute quality summary
      let total = 0
      let passed = 0
      let flagged = 0
      const flagCounts: Record<string, number> = {}

      for (const item of items) {
        for (const ci of item.content) {
          total++
          const hasFails = ci.flags.some(f => f.status === 'fail' || f.status === 'warn')
          if (hasFails) {
            flagged++
            for (const f of ci.flags) {
              if (f.status !== 'pass') {
                flagCounts[f.name] = (flagCounts[f.name] || 0) + 1
              }
            }
          } else {
            passed++
          }
        }
      }

      return {
        date,
        qualitySummary: { total, passed, flagged, flags: flagCounts },
        items: items.slice(0, 30),
      }
    })

  return { days }
}

// ─── Daily Trend (14 days) ───────────────────────────────────────────────────

function getDailyTrend(db: ReturnType<typeof getDb>): DashboardData['dailyTrend'] {
  const days: DashboardData['dailyTrend'] = []

  // Scan content filesystem to count content per day
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 14)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  // Build date→content map from filesystem
  const dateContentMap = new Map<string, Array<{ tier: number | null; filePath: string; frontmatter: Record<string, unknown>; body: string }>>()

  const scanDirs: Array<{ dir: string; type: string; lang?: string }> = [
    { dir: path.join(PROJECT_ROOT, 'content', 'blogs', 'en'), type: 'blog', lang: 'en' },
    { dir: path.join(PROJECT_ROOT, 'content', 'blogs', 'zh'), type: 'blog', lang: 'zh' },
    { dir: path.join(PROJECT_ROOT, 'content', 'glossary'), type: 'glossary' },
    { dir: path.join(PROJECT_ROOT, 'content', 'faq'), type: 'faq' },
    { dir: path.join(PROJECT_ROOT, 'content', 'compare'), type: 'compare' },
  ]

  for (const { dir, type } of scanDirs) {
    if (!fs.existsSync(dir)) continue
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
      try {
        const filePath = path.join(dir, file)
        const raw = fs.readFileSync(filePath, 'utf-8')
        const { data, content } = matter(raw)
        const dateStr = data.date ? (typeof data.date === 'object' ? (data.date as Date).toISOString().slice(0, 10) : String(data.date).slice(0, 10)) : ''
        if (!dateStr || dateStr < cutoffStr) continue
        if (!dateContentMap.has(dateStr)) dateContentMap.set(dateStr, [])
        dateContentMap.get(dateStr)!.push({
          tier: type === 'blog' ? (data.tier ?? null) : null,
          filePath,
          frontmatter: data,
          body: content.trim(),
        })
      } catch { /* */ }
    }
  }

  // Get keyword counts per day from DB
  const kwByDate = new Map<string, { extracted: number; published: number }>()
  try {
    const kwRows = db.prepare(`
      SELECT DATE(created_at) as d, status, COUNT(*) as c
      FROM keywords WHERE created_at > datetime('now', '-14 days')
      GROUP BY d, status
    `).all() as { d: string; status: string; c: number }[]
    for (const r of kwRows) {
      if (!kwByDate.has(r.d)) kwByDate.set(r.d, { extracted: 0, published: 0 })
      const entry = kwByDate.get(r.d)!
      entry.extracted += r.c
      if (r.status === 'published') entry.published += r.c
    }
  } catch { /* */ }

  // Build 14-day array
  for (let i = 0; i < 14; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)

    const contentItems = dateContentMap.get(dateStr) || []
    const kwData = kwByDate.get(dateStr) || { extracted: 0, published: 0 }

    // Compute quality pass rate
    let passCount = 0
    let totalChecked = 0
    for (const ci of contentItems) {
      const flags = computeQualityFlags(ci.filePath, ci.frontmatter, ci.body, ci.tier)
      totalChecked++
      if (flags.every(f => f.status === 'pass')) passCount++
    }

    days.push({
      date: dateStr,
      contentCount: contentItems.length,
      qualityPassRate: totalChecked > 0 ? Math.round((passCount / totalChecked) * 100) : 0,
      kwExtracted: kwData.extracted,
      kwPublished: kwData.published,
    })
  }

  return days
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
    keywordProvenance: getKeywordProvenance(db),
    sampleReview: getSampleReview(db),
    dailyTrend: getDailyTrend(db),
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
