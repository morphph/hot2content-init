import fs from 'fs'
import path from 'path'
import { getBlogPosts, type BlogPost } from './blog'
import { getGlossaryTerms, type GlossaryEntry } from './glossary'
import { getAllFAQTopics } from './faq'
import { getAllCompares, type ComparePost } from './compare'

export interface TopicCluster {
  slug: string
  name_en: string
  name_zh: string
  description_en: string
  description_zh: string
  keywords: string[]
}

// Use the actual return types from content loaders
type GlossaryListItem = Omit<GlossaryEntry, 'contentHtml'>
type CompareListItem = Omit<ComparePost, 'contentHtml'>
type FAQListItem = ReturnType<typeof getAllFAQTopics>[number]

export interface TopicClusterContent {
  cluster: TopicCluster
  blogs: BlogPost[]
  glossary: GlossaryListItem[]
  faq: FAQListItem[]
  compare: CompareListItem[]
  totalCount: number
}

/**
 * Load topic cluster definitions from content/topic-clusters.json
 */
export function getTopicClusters(): TopicCluster[] {
  const filePath = path.join(process.cwd(), 'content', 'topic-clusters.json')
  if (!fs.existsSync(filePath)) return []
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as TopicCluster[]
}

/**
 * Check if a content item matches a topic cluster by keyword overlap.
 * Matches if any cluster keyword appears as a substring in any of the item's searchable text.
 */
function matchesCluster(clusterKeywords: string[], searchableText: string[]): boolean {
  const lowerText = searchableText.map(t => t.toLowerCase())
  for (const kw of clusterKeywords) {
    for (const text of lowerText) {
      if (text.includes(kw)) return true
    }
  }
  return false
}

/**
 * Get all content grouped by a specific topic cluster for a given language.
 */
export async function getTopicClusterContent(
  slug: string,
  lang: 'en' | 'zh',
): Promise<TopicClusterContent | null> {
  const clusters = getTopicClusters()
  const cluster = clusters.find(c => c.slug === slug)
  if (!cluster) return null

  const kws = cluster.keywords

  const allBlogs = await getBlogPosts(lang)
  const blogs = allBlogs.filter(post =>
    matchesCluster(kws, [post.title, ...post.keywords, post.slug])
  )

  const allGlossary = getGlossaryTerms(lang)
  const glossary = allGlossary.filter(term =>
    matchesCluster(kws, [term.term, term.category, term.slug, term.definition])
  )

  const allFaq = getAllFAQTopics(lang)
  const faq = allFaq.filter(topic =>
    matchesCluster(kws, [topic.title, topic.description, topic.slug])
  )

  const allCompare = getAllCompares(lang)
  const compare = allCompare.filter(post =>
    matchesCluster(kws, [post.title, post.model_a, post.model_b, post.slug])
  )

  return {
    cluster,
    blogs,
    glossary,
    faq,
    compare,
    totalCount: blogs.length + glossary.length + faq.length + compare.length,
  }
}

/**
 * Get all topic clusters with content counts for the index page.
 */
export async function getAllTopicClustersWithCounts(
  lang: 'en' | 'zh',
): Promise<(TopicCluster & { totalCount: number })[]> {
  const clusters = getTopicClusters()
  const results: (TopicCluster & { totalCount: number })[] = []

  for (const cluster of clusters) {
    const content = await getTopicClusterContent(cluster.slug, lang)
    if (content && content.totalCount > 0) {
      results.push({ ...cluster, totalCount: content.totalCount })
    }
  }

  return results.sort((a, b) => b.totalCount - a.totalCount)
}
