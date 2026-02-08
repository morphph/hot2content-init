import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

async function getLatestNewsletter(): Promise<{ date: string; content: string } | null> {
  try {
    const newsletterDir = path.join(process.cwd(), 'content', 'newsletters')
    if (!fs.existsSync(newsletterDir)) {
      return null
    }
    
    const files = fs.readdirSync(newsletterDir)
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse()
    
    if (files.length === 0) return null
    
    const latestFile = files[0]
    const content = fs.readFileSync(path.join(newsletterDir, latestFile), 'utf-8')
    const date = latestFile.replace('.md', '')
    
    return { date, content }
  } catch {
    return null
  }
}

export const metadata = {
  title: 'Newsletter | LoreAI',
  description: 'Daily AI news digest - stay updated in 3 minutes',
}

export const dynamic = 'force-dynamic'

export default async function NewsletterPage() {
  const newsletter = await getLatestNewsletter()

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#2563eb', letterSpacing: '-0.02em' }}>
                LoreAI
              </span>
            </Link>
            
            <nav style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
              <span style={{ color: '#111827', fontWeight: '600', borderBottom: '2px solid #8b5cf6', paddingBottom: '4px' }}>Newsletter</span>
              <Link href="/en/blog" style={{ color: '#6b7280', textDecoration: 'none', paddingBottom: '4px' }}>Blog</Link>
            </nav>
          </div>
        </header>

        {/* Newsletter Content */}
        {newsletter ? (
          <article className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-hr:my-8">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {newsletter.content}
            </ReactMarkdown>
          </article>
        ) : (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ color: '#6b7280' }}>No newsletter yet. Check back soon!</p>
          </div>
        )}

        {/* Footer */}
        <footer style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid #e5e7eb', fontSize: '14px', color: '#6b7280' }}>
          <p>© 2026 LoreAI. Daily AI insights.</p>
        </footer>
      </div>
    </main>
  )
}
