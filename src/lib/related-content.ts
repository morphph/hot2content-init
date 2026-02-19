import { getBlogPosts, type BlogPost } from './blog'
import { getGlossaryTerms } from './glossary'
import { getAllFAQTopics } from './faq'
import { getAllCompares } from './compare'

export interface RelatedItem {
  title: string
  href: string
  type: 'blog' | 'glossary' | 'faq' | 'compare'
  typeLabel: string
}

/**
 * Find related content across all content types based on keyword overlap.
 * Returns top matches sorted by relevance (number of keyword matches).
 */
export async function getRelatedContent(
  lang: 'en' | 'zh',
  currentSlug: string,
  keywords: string[],
  limit: number = 6,
): Promise<RelatedItem[]> {
  if (keywords.length === 0) return []

  const lowerKeywords = keywords.map(k => k.toLowerCase())
  const results: (RelatedItem & { score: number })[] = []

  // Match against other blog posts
  const posts = await getBlogPosts(lang)
  for (const post of posts) {
    if (post.slug === currentSlug) continue
    const score = countMatches(lowerKeywords, [
      post.title.toLowerCase(),
      ...post.keywords.map(k => k.toLowerCase()),
    ])
    if (score > 0) {
      results.push({
        title: post.title,
        href: `/${lang}/blog/${post.slug}/`,
        type: 'blog',
        typeLabel: lang === 'en' ? 'Blog' : '博客',
        score,
      })
    }
  }

  // Match against glossary terms
  const glossary = getGlossaryTerms(lang)
  for (const term of glossary) {
    const score = countMatches(lowerKeywords, [
      term.term.toLowerCase(),
      term.category.toLowerCase(),
    ])
    if (score > 0) {
      results.push({
        title: term.term,
        href: `/${lang}/glossary/${term.slug}/`,
        type: 'glossary',
        typeLabel: lang === 'en' ? 'Glossary' : '术语',
        score,
      })
    }
  }

  // Match against FAQ topics
  const faqTopics = getAllFAQTopics(lang)
  for (const topic of faqTopics) {
    const score = countMatches(lowerKeywords, [
      topic.title.toLowerCase(),
      topic.description.toLowerCase(),
    ])
    if (score > 0) {
      results.push({
        title: topic.title,
        href: `/${lang}/faq/${topic.slug}/`,
        type: 'faq',
        typeLabel: 'FAQ',
        score,
      })
    }
  }

  // Match against compare pages
  const compares = getAllCompares(lang)
  for (const compare of compares) {
    const score = countMatches(lowerKeywords, [
      compare.title.toLowerCase(),
      compare.model_a.toLowerCase(),
      compare.model_b.toLowerCase(),
    ])
    if (score > 0) {
      results.push({
        title: compare.title,
        href: `/${lang}/compare/${compare.slug}/`,
        type: 'compare',
        typeLabel: lang === 'en' ? 'Compare' : '对比',
        score,
      })
    }
  }

  // Sort by score descending, take top N
  results.sort((a, b) => b.score - a.score)
  return results.slice(0, limit).map(({ score, ...item }) => item)
}

function countMatches(keywords: string[], targets: string[]): number {
  let count = 0
  for (const kw of keywords) {
    for (const target of targets) {
      if (target.includes(kw) || kw.includes(target)) {
        count++
        break
      }
    }
  }
  return count
}
