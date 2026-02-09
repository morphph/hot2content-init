import fs from 'fs'
import path from 'path'
import { getBlogPosts } from '@/lib/blog'
import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://loreai.dev'

function getNewsletterDates(): string[] {
  try {
    const dir = path.join(process.cwd(), 'content', 'newsletters')
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
  const newsletterDates = getNewsletterDates()
  
  const blogUrls = [
    ...enPosts.map((post) => ({
      url: `${BASE_URL}/en/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'weekly' as const,
      priority: post.tier === 1 ? 0.9 : 0.6,
    })),
    ...zhPosts.map((post) => ({
      url: `${BASE_URL}/zh/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'weekly' as const,
      priority: post.tier === 1 ? 0.9 : 0.6,
    })),
  ]

  const newsletterUrls = newsletterDates.map((date) => ({
    url: `${BASE_URL}/newsletter/${date}`,
    lastModified: new Date(date),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }))
  
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
    ...newsletterUrls,
    ...blogUrls,
  ]
}
