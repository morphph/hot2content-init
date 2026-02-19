import { getBlogPosts } from '@/lib/blog'
import { getAllFAQTopics } from '@/lib/faq'
import { getGlossaryTerms } from '@/lib/glossary'
import { getAllCompares } from '@/lib/compare'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-static'

const BASE_URL = 'https://loreai.dev'

export async function GET() {
  const enPosts = await getBlogPosts('en')
  const zhPosts = await getBlogPosts('zh')
  const faqTopicsEn = getAllFAQTopics('en')
  const faqTopicsZh = getAllFAQTopics('zh')
  const glossaryEn = getGlossaryTerms('en')
  const glossaryZh = getGlossaryTerms('zh')
  const comparesEn = getAllCompares('en')
  const comparesZh = getAllCompares('zh')

  // Newsletter dates
  const newsletterDir = path.join(process.cwd(), 'content', 'newsletters', 'en')
  const newsletterDates: string[] = []
  if (fs.existsSync(newsletterDir)) {
    const files = fs.readdirSync(newsletterDir).filter(f => f.endsWith('.md')).sort().reverse()
    newsletterDates.push(...files.map(f => f.replace('.md', '')))
  }

  const lines: string[] = [
    '# LoreAI — AI Content Engine',
    '> LoreAI covers AI development news, model comparisons, coding tools, and developer tutorials. Updated daily.',
    '',
    '## Focus Areas',
    '- AI coding tools and models (Claude, GPT, Gemini, open-source)',
    '- LLM benchmarks and comparisons',
    '- Agent frameworks and agentic coding',
    '- AI product launches and industry trends',
    '',
    '## Daily Newsletter',
    `- ${BASE_URL}/newsletter`,
    '',
  ]

  // Newsletter dates (last 10)
  if (newsletterDates.length > 0) {
    lines.push('## Recent Newsletters')
    for (const date of newsletterDates.slice(0, 10)) {
      lines.push(`- ${BASE_URL}/newsletter/${date}/`)
    }
    lines.push('')
  }

  // EN blog posts
  if (enPosts.length > 0) {
    lines.push('## Deep Dive Blog Posts (EN)')
    for (const post of enPosts) {
      lines.push(`- ${BASE_URL}/en/blog/${post.slug}/`)
    }
    lines.push('')
  }

  // ZH blog posts
  if (zhPosts.length > 0) {
    lines.push('## Deep Dive Blog Posts (ZH)')
    for (const post of zhPosts) {
      lines.push(`- ${BASE_URL}/zh/blog/${post.slug}/`)
    }
    lines.push('')
  }

  // FAQ
  if (faqTopicsEn.length > 0 || faqTopicsZh.length > 0) {
    lines.push('## FAQ')
    for (const t of faqTopicsEn) {
      lines.push(`- ${BASE_URL}/en/faq/${t.slug}/`)
    }
    for (const t of faqTopicsZh) {
      lines.push(`- ${BASE_URL}/zh/faq/${t.slug}/`)
    }
    lines.push('')
  }

  // Glossary
  if (glossaryEn.length > 0 || glossaryZh.length > 0) {
    lines.push('## Glossary')
    for (const g of glossaryEn) {
      lines.push(`- ${BASE_URL}/en/glossary/${g.slug}/`)
    }
    for (const g of glossaryZh) {
      lines.push(`- ${BASE_URL}/zh/glossary/${g.slug}/`)
    }
    lines.push('')
  }

  // Comparisons
  if (comparesEn.length > 0 || comparesZh.length > 0) {
    lines.push('## Comparisons')
    for (const c of comparesEn) {
      lines.push(`- ${BASE_URL}/en/compare/${c.slug}/`)
    }
    for (const c of comparesZh) {
      lines.push(`- ${BASE_URL}/zh/compare/${c.slug}/`)
    }
    lines.push('')
  }

  lines.push('## Resources')
  lines.push(`- ${BASE_URL}/en/faq`)
  lines.push(`- ${BASE_URL}/en/glossary`)
  lines.push(`- ${BASE_URL}/en/compare`)
  lines.push(`- ${BASE_URL}/about/`)
  lines.push('')
  lines.push('## Sitemap')
  lines.push(`- ${BASE_URL}/sitemap.xml`)
  lines.push('')
  lines.push('## Contact')
  lines.push(`- Website: ${BASE_URL}`)

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
