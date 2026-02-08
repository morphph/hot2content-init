import { getBlogPosts } from '@/lib/blog'
import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://hot2content.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const enPosts = await getBlogPosts('en')
  const zhPosts = await getBlogPosts('zh')
  
  const blogUrls = [
    ...enPosts.map((post) => ({
      url: `${BASE_URL}/en/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...zhPosts.map((post) => ({
      url: `${BASE_URL}/zh/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
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
    ...blogUrls,
  ]
}
