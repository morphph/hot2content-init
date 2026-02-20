import fs from 'fs'
import path from 'path'

const DASHBOARD_PATH = path.join(process.cwd(), 'content', 'dashboard-data.json')

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

/** Get dashboard data from pre-generated JSON (returns null if file missing) */
export function getDashboardData(): DashboardData | null {
  if (!fs.existsSync(DASHBOARD_PATH)) return null
  return JSON.parse(fs.readFileSync(DASHBOARD_PATH, 'utf-8'))
}
