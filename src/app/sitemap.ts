import fs from 'fs'
import path from 'path'
import { getBlogPosts } from '@/lib/blog'
import { getAllFAQTopics, getAllQuestionParams } from '@/lib/faq'
import { getGlossaryTerms } from '@/lib/glossary'
import { getAllCompares } from '@/lib/compare'
import { getTopicClusters } from '@/lib/topic-cluster'
import { getAllTimelines } from '@/lib/timeline'
import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://loreai.dev'

function getNewsletterDates(lang: 'en' | 'zh'): string[] {
  try {
    const dir = path.join(process.cwd(), 'content', 'newsletters', lang)
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''))
      .sort()
      .reverse()
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const enPosts = await getBlogPosts('en')
  const zhPosts = await getBlogPosts('zh')
  const enNewsletterDates = getNewsletterDates('en')
  const zhNewsletterDates = getNewsletterDates('zh')
  
  const blogUrls = [
    ...enPosts.map((post) => ({
      url: `${BASE_URL}/en/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'weekly' as const,
      priority: post.tier === 1 ? 0.9 : post.tier === 2 ? 0.7 : 0.5,
    })),
    ...zhPosts.map((post) => ({
      url: `${BASE_URL}/zh/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'weekly' as const,
      priority: post.tier === 1 ? 0.9 : post.tier === 2 ? 0.7 : 0.5,
    })),
  ]

  const newsletterUrls = [
    ...enNewsletterDates.map((date) => ({
      url: `${BASE_URL}/newsletter/${date}`,
      lastModified: new Date(date),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    })),
    ...zhNewsletterDates.map((date) => ({
      url: `${BASE_URL}/zh/newsletter/${date}`,
      lastModified: new Date(date),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    })),
  ]
  
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/newsletter`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/zh/newsletter`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/en/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/zh/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/en/resources`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/zh/resources`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/en/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/zh/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...getAllFAQTopics('en').map((t) => ({
      url: `${BASE_URL}/en/faq/${t.slug}`,
      lastModified: new Date(t.date || new Date()),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...getAllFAQTopics('zh').map((t) => ({
      url: `${BASE_URL}/zh/faq/${t.slug}`,
      lastModified: new Date(t.date || new Date()),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...getAllQuestionParams('en').map((p) => ({
      url: `${BASE_URL}/en/faq/${p.topic}/${p.question}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
    ...getAllQuestionParams('zh').map((p) => ({
      url: `${BASE_URL}/zh/faq/${p.topic}/${p.question}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
    {
      url: `${BASE_URL}/en/glossary`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/zh/glossary`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...getGlossaryTerms('en').map((t) => ({
      url: `${BASE_URL}/en/glossary/${t.slug}`,
      lastModified: new Date(t.date || new Date()),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
    ...getGlossaryTerms('zh').map((t) => ({
      url: `${BASE_URL}/zh/glossary/${t.slug}`,
      lastModified: new Date(t.date || new Date()),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
    {
      url: `${BASE_URL}/en/compare`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/zh/compare`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...getAllCompares('en').map((c) => ({
      url: `${BASE_URL}/en/compare/${c.slug}`,
      lastModified: new Date(c.date || new Date()),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...getAllCompares('zh').map((c) => ({
      url: `${BASE_URL}/zh/compare/${c.slug}`,
      lastModified: new Date(c.date || new Date()),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    // Topic hub pages
    {
      url: `${BASE_URL}/en/topics`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/zh/topics`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...getTopicClusters().flatMap((c) => [
      {
        url: `${BASE_URL}/en/topics/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      {
        url: `${BASE_URL}/zh/topics/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
    ]),
    // Timeline pages
    ...(() => {
      const timelines = getAllTimelines()
      if (timelines.length === 0) return []
      return [
        {
          url: `${BASE_URL}/en/timeline`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.7,
        },
        {
          url: `${BASE_URL}/zh/timeline`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.7,
        },
        ...timelines.flatMap((t) => [
          {
            url: `${BASE_URL}/en/timeline/${t.slug}`,
            lastModified: new Date(t.lastUpdated),
            changeFrequency: 'daily' as const,
            priority: 0.6,
          },
          {
            url: `${BASE_URL}/zh/timeline/${t.slug}`,
            lastModified: new Date(t.lastUpdated),
            changeFrequency: 'daily' as const,
            priority: 0.6,
          },
        ]),
      ]
    })(),
    ...newsletterUrls,
    ...blogUrls,
  ]
}
