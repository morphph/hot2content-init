import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import gfm from 'remark-gfm'

const FAQ_DIR = path.join(process.cwd(), 'content', 'faq')

export interface FAQTopic {
  slug: string
  title: string
  description: string
  date: string
  questions: { question: string; answer: string }[]
  contentHtml: string
}

export function getAllFAQTopics(): { slug: string; title: string; description: string; date: string; lang: string; questionCount: number }[] {
  if (!fs.existsSync(FAQ_DIR)) return []
  const files = fs.readdirSync(FAQ_DIR).filter(f => f.endsWith('.md'))
  return files.map(file => {
    const raw = fs.readFileSync(path.join(FAQ_DIR, file), 'utf-8')
    const { data, content } = matter(raw)
    const questionCount = (content.match(/^### /gm) || []).length
    return {
      slug: file.replace(/\.md$/, ''),
      title: data.title || file.replace(/\.md$/, ''),
      description: data.description || '',
      date: typeof data.date === 'string' ? data.date : (data.date ? new Date(data.date).toISOString().split('T')[0] : ''),
      lang: data.lang || (file.endsWith('-zh.md') ? 'zh' : 'en'),
      questionCount,
    }
  }).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}

export async function getFAQTopic(slug: string): Promise<FAQTopic | null> {
  const filePath = path.join(FAQ_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)

  // Extract Q&A pairs from H3 headers
  const questions: { question: string; answer: string }[] = []
  const qBlocks = content.split(/(?=^### )/m).filter(b => b.startsWith('### '))
  for (const block of qBlocks) {
    const lines = block.split('\n')
    const q = lines[0].replace(/^### /, '').trim()
    const a = lines.slice(1).join('\n').trim()
    if (q) questions.push({ question: q, answer: a })
  }

  const processed = await remark().use(gfm).use(html).process(content)

  return {
    slug,
    title: data.title || slug,
    description: data.description || '',
    date: data.date || '',
    questions,
    contentHtml: processed.toString(),
  }
}

export function generateFAQJsonLd(topic: FAQTopic): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: topic.questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer.replace(/[#*`]/g, '').trim(),
      },
    })),
  }
}
