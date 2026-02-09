import Link from 'next/link'
import fs from 'fs'
import path from 'path'

interface NewsletterEntry {
  date: string
  title: string
  preview: string
}

async function getNewsletterList(): Promise<NewsletterEntry[]> {
  try {
    const newsletterDir = path.join(process.cwd(), 'content', 'newsletters')
    if (!fs.existsSync(newsletterDir)) {
      return []
    }
    
    const files = fs.readdirSync(newsletterDir)
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse()
    
    const entries: NewsletterEntry[] = []
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(newsletterDir, file), 'utf-8')
      const date = file.replace('.md', '')
      
      // Extract title (first # heading)
      const titleMatch = content.match(/^#\s+(.+)$/m)
      const title = titleMatch ? titleMatch[1] : 'AI Newsletter'
      
      // Extract preview (first paragraph after title)
      const lines = content.split('\n')
      let preview = ''
      for (const line of lines) {
        if (line.startsWith('#') || line.startsWith('**') || line.trim() === '' || line.startsWith('---')) continue
        if (line.trim().length > 20) {
          preview = line.trim().slice(0, 150)
          if (line.trim().length > 150) preview += '...'
          break
        }
      }
      
      entries.push({ date, title, preview })
    }
    
    return entries
  } catch {
    return []
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

export const metadata = {
  title: 'Newsletter | LoreAI',
  description: 'Daily AI news digest - curated hot topics',
}

export default async function NewsletterPage() {
  const newsletters = await getNewsletterList()

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
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
          <nav style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
            <Link href="/newsletter" style={{ color: '#111827', fontWeight: '500', textDecoration: 'none' }}>Newsletter</Link>
            <Link href="/en/blog" style={{ color: '#6b7280', textDecoration: 'none' }}>Blog</Link>
          </nav>
        </header>

        {/* Hero */}
        <div style={{ marginBottom: '40px' }}>
          <h1 
            style={{ 
              fontSize: '28px', 
              fontWeight: 'bold',
              background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}
          >
            AI Newsletter
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Daily curated AI news
          </p>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '40px' }}>
          <div style={{ height: '8px', width: '120px', background: 'linear-gradient(90deg, #EC4899, #8B5CF6, #3B82F6)', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#60A5FA', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#93C5FD', borderRadius: '2px', opacity: 0.7 }} />
        </div>

        {/* Newsletter List */}
        {newsletters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ color: '#6b7280' }}>No newsletters yet. Check back soon!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {newsletters.map((entry) => (
              <Link 
                key={entry.date} 
                href={`/newsletter/${entry.date}`}
                style={{ textDecoration: 'none' }}
              >
                <article 
                  style={{ 
                    padding: '24px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#ffffff',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#a855f7'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(168, 85, 247, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px' }}>
                    📅 {formatDateLong(entry.date)}
                  </p>
                  <h2 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#111827',
                    marginBottom: '8px',
                    lineHeight: '1.4'
                  }}>
                    {entry.title}
                  </h2>
                  {entry.preview && (
                    <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: '1.6', marginBottom: '12px' }}>
                      {entry.preview}
                    </p>
                  )}
                  <span style={{ color: '#2563eb', fontSize: '14px', fontWeight: '500' }}>
                    Read →
                  </span>
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer style={{ textAlign: 'center', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
          <p style={{ color: '#9ca3af', fontSize: '13px' }}>
            Curated by AI · Updated daily
          </p>
        </footer>
      </div>
    </main>
  )
}
