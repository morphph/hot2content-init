import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import gfm from 'remark-gfm'

const FAQ_DIR = path.join(process.cwd(), 'content', 'faq')

export type FAQIntent = 'comparison' | 'pricing' | 'tutorial' | 'informational'

export interface FAQQuestion {
  slug: string
  question: string
  answer: string
  summary: string
  intent: FAQIntent
  answerHtml: string
}

export interface FAQTopic {
  slug: string
  title: string
  description: string
  date: string
  questions: FAQQuestion[]
  contentHtml: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function detectIntent(question: string): FAQIntent {
  const q = question.toLowerCase()
  if (/\bvs\b|compare|对比|比较/.test(q)) return 'comparison'
  if (/price|cost|pricing|多少钱|定价/.test(q)) return 'pricing'
  if (/how to|tutorial|怎么|如何/.test(q)) return 'tutorial'
  return 'informational'
}

function extractSummary(answer: string): string {
  const plain = answer.replace(/[#*`\[\]]/g, '').replace(/\n+/g, ' ').trim()
  const sentences = plain.match(/[^.!?。！？]+[.!?。！？]+/g) || [plain]
  let summary = sentences[0] || ''
  if (sentences.length > 1 && summary.length < 80) {
    summary += ' ' + sentences[1]
  }
  return summary.trim().slice(0, 160)
}

function parseQuestions(content: string): FAQQuestion[] {
  const qBlocks = content.split(/(?=^### )/m).filter(b => b.startsWith('### '))
  return qBlocks.map(block => {
    const lines = block.split('\n')
    const q = lines[0].replace(/^### /, '').trim()
    const a = lines.slice(1).join('\n').trim()
    return {
      slug: slugify(q),
      question: q,
      answer: a,
      summary: extractSummary(a),
      intent: detectIntent(q),
      answerHtml: '',
    }
  }).filter(q => q.question)
}

export function getAllFAQTopics(lang?: string): { slug: string; title: string; description: string; date: string; lang: string; questionCount: number }[] {
  if (!fs.existsSync(FAQ_DIR)) return []
  let files = fs.readdirSync(FAQ_DIR).filter(f => f.endsWith('.md'))
  if (lang) {
    files = files.filter(f => f.endsWith(`-${lang}.md`))
  }
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

  const questions = parseQuestions(content)

  // Generate HTML for each question's answer
  for (const q of questions) {
    const processed = await remark().use(gfm).use(html).process(q.answer)
    q.answerHtml = processed.toString()
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

export async function getQuestion(topicSlug: string, questionSlug: string): Promise<{ topic: FAQTopic; question: FAQQuestion } | null> {
  const topic = await getFAQTopic(topicSlug)
  if (!topic) return null
  const question = topic.questions.find(q => q.slug === questionSlug)
  if (!question) return null
  return { topic, question }
}

export function getRelatedQuestions(topic: FAQTopic, questionSlug: string): FAQQuestion[] {
  return topic.questions.filter(q => q.slug !== questionSlug)
}

export function getAllQuestionParams(lang: string): { topic: string; question: string }[] {
  const topics = getAllFAQTopics(lang)
  const params: { topic: string; question: string }[] = []
  for (const t of topics) {
    const filePath = path.join(FAQ_DIR, `${t.slug}.md`)
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { content } = matter(raw)
    const questions = parseQuestions(content)
    for (const q of questions) {
      params.push({ topic: t.slug, question: q.slug })
    }
  }
  return params
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
        text: q.summary,
      },
    })),
  }
}

export function generateQuestionJsonLd(question: FAQQuestion, topicTitle: string, url: string): object[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'QAPage',
      mainEntity: {
        '@type': 'Question',
        name: question.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: question.answer.replace(/[#*`\[\]]/g, '').trim(),
        },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'LoreAI', item: url.split('/').slice(0, 3).join('/') },
        { '@type': 'ListItem', position: 2, name: 'FAQ', item: url.replace(/\/[^/]+\/[^/]+\/?$/, '') },
        { '@type': 'ListItem', position: 3, name: topicTitle, item: url.replace(/\/[^/]+\/?$/, '') },
        { '@type': 'ListItem', position: 4, name: question.question },
      ],
    },
  ]
}
