import fs from 'fs'
import path from 'path'

const DASHBOARD_PATH = path.join(process.cwd(), 'content', 'dashboard-data.json')

export interface SourceStats {
  total: number
  backlog: number
  published: number
  error: number
  avgDaysToPublish: number | null
}

export interface PAAStats {
  total: number
  discovered: number
  published: number
  duplicate: number
  error: number
}

export interface QualityFlag {
  name: string
  status: 'pass' | 'warn' | 'fail'
  detail?: string
}

export interface SampleContentItem {
  title: string
  slug: string
  language: string
  tier: number | null
  wordCount: number
  seoScore: number | null
  flags: QualityFlag[]
}

export interface SampleReviewItem {
  keyword: string
  type: string | null
  score: number | null
  source: 'research' | 'news' | 'paa'
  sourceNews: Array<{ title: string; url: string }>
  content: SampleContentItem[]
}

export interface DashboardData {
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
    byType: Record<string, number>
    enrichmentCoverage: { enriched: number; unenriched: number }
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
    bilingualCoverage: { paired: number; enOnly: number; zhOnly: number }
    freshnessBacklog: number
    newsletterStreak: { en: number; zh: number; lastEnDate: string; lastZhDate: string }
  }

  keywordProvenance: {
    research: SourceStats
    news: SourceStats
    paa: PAAStats
    last7d: {
      research: { added: number; published: number }
      news: { added: number; published: number }
      paa: { added: number; published: number }
    }
  }

  sampleReview: {
    days: Array<{
      date: string
      qualitySummary: { total: number; passed: number; flagged: number; flags: Record<string, number> }
      items: SampleReviewItem[]
    }>
  }

  dailyTrend: Array<{
    date: string
    contentCount: number
    qualityPassRate: number
    kwExtracted: number
    kwPublished: number
  }>

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

/** Get dashboard data from pre-generated JSON (returns null if file missing) */
export function getDashboardData(): DashboardData | null {
  if (!fs.existsSync(DASHBOARD_PATH)) return null
  return JSON.parse(fs.readFileSync(DASHBOARD_PATH, 'utf-8'))
}
