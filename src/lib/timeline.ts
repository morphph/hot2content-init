import fs from 'fs'
import path from 'path'

const TIMELINES_DIR = path.join(process.cwd(), 'content', 'timelines')

export interface TimelineEntry {
  id: string
  title: string
  url: string
  source: string
  category: string
  score: number
  summary: string
  date: string
}

export interface TimelineData {
  slug: string
  name_en: string
  name_zh: string
  entries: TimelineEntry[]
  lastUpdated: string
}

/**
 * Get all available timeline topics (from pre-generated JSON files)
 */
export function getAllTimelines(): TimelineData[] {
  if (!fs.existsSync(TIMELINES_DIR)) return []
  const files = fs.readdirSync(TIMELINES_DIR).filter(f => f.endsWith('.json'))
  return files
    .map(file => {
      const raw = fs.readFileSync(path.join(TIMELINES_DIR, file), 'utf-8')
      return JSON.parse(raw) as TimelineData
    })
    .filter(t => t.entries.length > 0)
    .sort((a, b) => b.entries.length - a.entries.length)
}

/**
 * Get a single timeline by topic slug
 */
export function getTimeline(slug: string): TimelineData | null {
  const filePath = path.join(TIMELINES_DIR, `${slug}.json`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as TimelineData
}

/**
 * Group timeline entries by date for display
 */
export function groupByDate(entries: TimelineEntry[]): Map<string, TimelineEntry[]> {
  const grouped = new Map<string, TimelineEntry[]>()
  for (const entry of entries) {
    const date = entry.date
    const existing = grouped.get(date) || []
    existing.push(entry)
    grouped.set(date, existing)
  }
  return grouped
}

/**
 * Generate ItemList JSON-LD for a timeline page
 */
export function generateTimelineJsonLd(
  timeline: TimelineData,
  lang: 'en' | 'zh',
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: lang === 'en'
      ? `${timeline.name_en} — News Timeline`
      : `${timeline.name_zh} — 新闻时间线`,
    description: lang === 'en'
      ? `Chronological timeline of ${timeline.name_en} news and developments`
      : `${timeline.name_zh} 新闻和动态的时间线`,
    url: `https://loreai.dev/${lang}/timeline/${timeline.slug}/`,
    numberOfItems: timeline.entries.length,
    itemListElement: timeline.entries.slice(0, 50).map((entry, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: entry.title,
      url: entry.url,
    })),
  }
}
