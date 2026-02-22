import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Header from '@/components/Header'

function getContentDir(type: string): string {
  switch (type) {
    case 'ai-product': return path.join(process.cwd(), 'content', 'newsletters', 'ai-product', 'zh')
    case 'indie': return path.join(process.cwd(), 'content', 'newsletters', 'indie', 'zh')
    default: return path.join(process.cwd(), 'content', 'newsletters', 'zh')
  }
}

async function getNewsletterContent(date: string, type: string = 'daily'): Promise<string | null> {
  try {
    const filePath = path.join(getContentDir(type), `${date}.md`)
    if (!fs.existsSync(filePath)) {
      return null
    }
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

export async function generateStaticParams() {
  const dir = path.join(process.cwd(), 'content', 'newsletters', 'zh')
  if (!fs.existsSync(dir)) return []
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'))
  return files.map(f => ({ date: f.replace('.md', '') }))
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ date: string }>; searchParams: Promise<{ type?: string }> }) {
  const { date } = await params
  const { type = 'daily' } = await searchParams
  const content = await getNewsletterContent(date, type)
  const titleMatch = content?.match(/^#\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1] : `AI 简报 - ${date}`
  return {
    title: `${title} | LoreAI`,
    description: `AI 每日简报 ${date}`,
    alternates: {
      canonical: `https://loreai.dev/zh/newsletter/${date}/`,
      languages: {
        'en': `/newsletter/${date}/`,
        'zh': `/zh/newsletter/${date}/`,
        'x-default': `/newsletter/${date}/`,
      },
    },
  }
}

export default async function NewsletterZHDatePage({ params, searchParams }: { params: Promise<{ date: string }>; searchParams: Promise<{ type?: string }> }) {
  const { date } = await params
  const { type = 'daily' } = await searchParams
  const currentType = ['daily', 'ai-product', 'indie'].includes(type) ? type : 'daily'
  const content = await getNewsletterContent(date, currentType)

  if (!content) {
    notFound()
  }

  const formattedDate = formatDateLong(date)
  const enExists = fs.existsSync(path.join(process.cwd(), 'content', 'newsletters', 'en', `${date}.md`))
  const langSwitchHref = enExists ? `/newsletter/${date}` : '/newsletter'

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <Header
          lang="zh"
          navItems={[
            { label: '每日简报', href: '/zh/newsletter', active: true },
            { label: '博客', href: '/zh/blog' },
          ]}
          langSwitchHref={langSwitchHref}
        />

        {/* Date & Title */}
        <div style={{ marginBottom: '40px' }}>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>{formattedDate}</p>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AI 每日简报
          </h1>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '40px' }}>
          <div style={{ height: '8px', width: '120px', background: 'linear-gradient(90deg, #EC4899, #8B5CF6, #3B82F6)', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#60A5FA', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#93C5FD', borderRadius: '2px', opacity: 0.7 }} />
        </div>

        {/* Markdown Content */}
        <article style={{ fontSize: '16px', lineHeight: '1.8', color: '#1f2937' }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (<h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', marginTop: '32px', color: '#111827' }}>{children}</h1>),
              h2: ({ children }) => (<h2 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '32px', marginBottom: '16px', color: '#111827' }}>{children}</h2>),
              h3: ({ children }) => (<h3 style={{ fontSize: '18px', fontWeight: '600', marginTop: '24px', marginBottom: '12px', color: '#111827' }}>{children}</h3>),
              p: ({ children }) => (<p style={{ marginBottom: '16px', color: '#4b5563' }}>{children}</p>),
              a: ({ href, children }) => (<a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>{children}</a>),
              ul: ({ children }) => (<ul style={{ marginBottom: '16px', paddingLeft: '24px' }}>{children}</ul>),
              li: ({ children }) => (<li style={{ marginBottom: '8px', color: '#4b5563' }}>{children}</li>),
              hr: () => (<hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '32px 0' }} />),
              strong: ({ children }) => (<strong style={{ fontWeight: '600', color: '#111827' }}>{children}</strong>),
            }}
          >
            {content}
          </ReactMarkdown>
        </article>

        {/* Footer */}
        <footer style={{ textAlign: 'center', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
          <Link href={`/zh/newsletter${currentType === 'daily' ? '' : `?type=${currentType}`}`} style={{ color: '#8b5cf6', fontSize: '14px', textDecoration: 'none' }}>
            ← 查看所有简报
          </Link>
        </footer>
      </div>
    </main>
  )
}
