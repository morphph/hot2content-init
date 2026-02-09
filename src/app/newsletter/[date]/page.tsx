import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

async function getNewsletterContent(date: string): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), 'content', 'newsletters', `${date}.md`)
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
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const content = await getNewsletterContent(date)
  
  // Extract title from markdown
  const titleMatch = content?.match(/^#\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1] : `AI News - ${date}`
  
  return {
    title: `${title} | LoreAI`,
    description: `AI news digest for ${date}`,
  }
}

export default async function NewsletterDatePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const content = await getNewsletterContent(date)

  if (!content) {
    notFound()
  }

  const formattedDate = formatDateLong(date)

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px' }}>
          {/* Logo + Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link href="/newsletter" style={{ textDecoration: 'none' }}>
              <span 
                style={{ 
                  fontSize: '20px',
                  fontWeight: '800',
                  color: '#2563eb',
                  letterSpacing: '-0.02em'
                }}
              >
                LoreAI
              </span>
            </Link>
            
            {/* Main Nav Tabs */}
            <nav style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
              <Link href="/newsletter" style={{ color: '#111827', fontWeight: '600', borderBottom: '2px solid #8b5cf6', paddingBottom: '4px', textDecoration: 'none' }}>Newsletter</Link>
              <Link href="/en/blog" style={{ color: '#6b7280', textDecoration: 'none', paddingBottom: '4px' }}>Blog</Link>
            </nav>
          </div>
          
          {/* Language Switch */}
          <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: '#111827', fontWeight: '500' }}>EN</span>
            <span style={{ color: '#d1d5db' }}>|</span>
            <Link href="/zh" style={{ color: '#6b7280', textDecoration: 'none' }}>中文</Link>
          </div>
        </header>

        {/* Date & Title */}
        <div style={{ marginBottom: '40px' }}>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>
            {formattedDate}
          </p>
          <h1 
            style={{ 
              fontSize: '28px', 
              fontWeight: 'bold',
              background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            AI Newsletter
          </h1>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '40px' }}>
          <div style={{ height: '8px', width: '120px', background: 'linear-gradient(90deg, #EC4899, #8B5CF6, #3B82F6)', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#60A5FA', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#93C5FD', borderRadius: '2px', opacity: 0.7 }} />
        </div>

        {/* Markdown Content */}
        <article 
          style={{ 
            fontSize: '16px',
            lineHeight: '1.8',
            color: '#1f2937'
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  marginBottom: '16px',
                  marginTop: '32px',
                  color: '#111827'
                }}>
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  marginTop: '32px', 
                  marginBottom: '16px',
                  color: '#111827'
                }}>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  marginTop: '24px', 
                  marginBottom: '12px',
                  color: '#111827'
                }}>
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p style={{ 
                  marginBottom: '16px',
                  color: '#4b5563'
                }}>
                  {children}
                </p>
              ),
              a: ({ href, children }) => (
                <a 
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#2563eb',
                    textDecoration: 'none'
                  }}
                >
                  {children}
                </a>
              ),
              ul: ({ children }) => (
                <ul style={{ 
                  marginBottom: '16px',
                  paddingLeft: '24px'
                }}>
                  {children}
                </ul>
              ),
              li: ({ children }) => (
                <li style={{ 
                  marginBottom: '8px',
                  color: '#4b5563'
                }}>
                  {children}
                </li>
              ),
              hr: () => (
                <hr style={{ 
                  border: 'none',
                  borderTop: '1px solid #e5e7eb',
                  margin: '32px 0'
                }} />
              ),
              strong: ({ children }) => (
                <strong style={{ 
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  {children}
                </strong>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </article>

        {/* Footer */}
        <footer style={{ textAlign: 'center', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
          <Link 
            href="/newsletter"
            style={{ color: '#8b5cf6', fontSize: '14px', textDecoration: 'none' }}
          >
            ← View all newsletters
          </Link>
        </footer>
      </div>
    </main>
  )
}
