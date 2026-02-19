import { getBlogPosts } from '@/lib/blog'

export const dynamic = 'force-static'

const BASE_URL = 'https://loreai.dev'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const posts = await getBlogPosts('zh')

  const items = posts.map(post => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${BASE_URL}/zh/blog/${post.slug}/</link>
      <guid isPermaLink="true">${BASE_URL}/zh/blog/${post.slug}/</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(post.date + 'T00:00:00Z').toUTCString()}</pubDate>
      <category>AI</category>
    </item>`).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>LoreAI Blog (ZH)</title>
    <link>${BASE_URL}/zh/blog/</link>
    <description>AI 深度分析——涵盖 AI 开发、模型与工具。</description>
    <language>zh</language>
    <atom:link href="${BASE_URL}/zh/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
