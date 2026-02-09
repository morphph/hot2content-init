import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import gfm from 'remark-gfm'

const COMPARE_DIR = path.join(process.cwd(), 'content', 'compare')

export interface ComparePost {
  slug: string
  title: string
  description: string
  model_a: string
  model_b: string
  date: string
  lang: string
  category: string
  contentHtml: string
}

export function getAllCompares(lang?: string): Omit<ComparePost, 'contentHtml'>[] {
  if (!fs.existsSync(COMPARE_DIR)) return []
  let files = fs.readdirSync(COMPARE_DIR).filter(f => f.endsWith('.md'))
  if (lang) {
    files = files.filter(f => f.endsWith(`-${lang}.md`))
  }
  return files.map(file => {
    const content = fs.readFileSync(path.join(COMPARE_DIR, file), 'utf-8')
    const { data } = matter(content)
    return {
      slug: file.replace(/\.md$/, ''),
      title: data.title || file.replace(/\.md$/, ''),
      description: data.description || '',
      model_a: data.model_a || '',
      model_b: data.model_b || '',
      date: typeof data.date === 'string' ? data.date : (data.date ? new Date(data.date).toISOString().split('T')[0] : ''),
      lang: data.lang || (file.endsWith('-zh.md') ? 'zh' : 'en'),
      category: data.category || '',
    }
  }).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}

export async function getCompare(slug: string): Promise<ComparePost | null> {
  const filePath = path.join(COMPARE_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  const processed = await remark().use(gfm).use(html).process(content)

  return {
    slug,
    title: data.title || slug,
    description: data.description || '',
    model_a: data.model_a || '',
    model_b: data.model_b || '',
    date: typeof data.date === 'string' ? data.date : (data.date ? new Date(data.date).toISOString().split('T')[0] : ''),
    lang: data.lang || 'en',
    category: data.category || '',
    contentHtml: processed.toString(),
  }
}

export function generateCompareJsonLd(post: ComparePost): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      '@type': 'Organization',
      name: 'LoreAI',
      url: 'https://loreai.dev',
    },
    about: [
      { '@type': 'Thing', name: post.model_a },
      { '@type': 'Thing', name: post.model_b },
    ],
  }
}
