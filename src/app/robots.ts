import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://loreai.dev'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/dashboard/'] },
      { userAgent: ['GPTBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'Applebot-Extended'], allow: '/' },
      { userAgent: ['Bytespider', 'CCBot'], disallow: '/' },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
