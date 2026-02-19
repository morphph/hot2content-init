import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

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
  const dir = path.join(process.cwd(), 'content', 'newsletters', 'en')
  let items = ''

  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort().reverse()

    items = files.map(file => {
      const date = file.replace('.md', '')
      const content = fs.readFileSync(path.join(dir, file), 'utf-8')
      const { data } = matter(content)
      const titleMatch = content.match(/^#\s+(.+)$/m)
      const title = data.title || (titleMatch ? titleMatch[1] : `AI News - ${date}`)

      return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${BASE_URL}/newsletter/${date}/</link>
      <guid isPermaLink="true">${BASE_URL}/newsletter/${date}/</guid>
      <description>${escapeXml(`AI news digest for ${date}`)}</description>
      <pubDate>${new Date(date + 'T00:00:00Z').toUTCString()}</pubDate>
      <category>Newsletter</category>
    </item>`
    }).join('\n')
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>LoreAI Newsletter</title>
    <link>${BASE_URL}/newsletter/</link>
    <description>Daily AI news digest from LoreAI.</description>
    <language>en</language>
    <atom:link href="${BASE_URL}/newsletter/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
