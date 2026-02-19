import fs from 'fs'
import path from 'path'
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

function getNewsletterEntries(lang: 'en' | 'zh'): { date: string; title: string; url: string }[] {
  const dir = path.join(process.cwd(), 'content', 'newsletters', lang)
  if (!fs.existsSync(dir)) return []

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'))
  const entries: { date: string; title: string; url: string }[] = []

  for (const file of files) {
    const dateStr = file.replace('.md', '')
    const fileDate = new Date(dateStr + 'T00:00:00Z')
    if (fileDate < cutoff) continue

    const content = fs.readFileSync(path.join(dir, file), 'utf-8')
    const titleMatch = content.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1] : `LoreAI Daily — ${dateStr}`

    const urlPath = lang === 'en' ? `/newsletter/${dateStr}` : `/zh/newsletter/${dateStr}`
    entries.push({ date: dateStr, title, url: `${BASE_URL}${urlPath}` })
  }

  return entries
}

export async function GET() {
  // Get newsletter entries from last 30 days
  const enNewsletters = getNewsletterEntries('en')
  const zhNewsletters = getNewsletterEntries('zh')

  // Get recent Tier 1/2 blog posts (published within 48h)
  const cutoff48h = new Date()
  cutoff48h.setDate(cutoff48h.getDate() - 2)

  const enPosts = await getBlogPosts('en')
  const zhPosts = await getBlogPosts('zh')
  const recentBlogs = [
    ...enPosts
      .filter(p => (p.tier === 1 || p.tier === 2) && new Date(p.date) >= cutoff48h)
      .map(p => ({
        date: p.date,
        title: p.title,
        url: `${BASE_URL}/en/blog/${p.slug}/`,
        lang: 'en',
      })),
    ...zhPosts
      .filter(p => (p.tier === 1 || p.tier === 2) && new Date(p.date) >= cutoff48h)
      .map(p => ({
        date: p.date,
        title: p.title,
        url: `${BASE_URL}/zh/blog/${p.slug}/`,
        lang: 'zh',
      })),
  ]

  const newsItems = [
    ...enNewsletters.map(n => ({ ...n, lang: 'en' })),
    ...zhNewsletters.map(n => ({ ...n, lang: 'zh' })),
    ...recentBlogs,
  ]

  const urlEntries = newsItems.map(item => `  <url>
    <loc>${escapeXml(item.url)}</loc>
    <news:news>
      <news:publication>
        <news:name>LoreAI</news:name>
        <news:language>${item.lang}</news:language>
      </news:publication>
      <news:publication_date>${item.date}</news:publication_date>
      <news:title>${escapeXml(item.title)}</news:title>
    </news:news>
  </url>`).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urlEntries}
</urlset>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
