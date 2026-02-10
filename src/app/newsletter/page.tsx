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
    const newsletterDir = path.join(process.cwd(), 'content', 'newsletters', 'en')
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
          // Strip markdown formatting (bold, italic, links)
          let cleanLine = line.trim()
            .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove **bold**
            .replace(/\*([^*]+)\*/g, '$1')      // Remove *italic*
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Remove [link](url)
          preview = cleanLine.slice(0, 150)
          if (cleanLine.length > 150) preview += '...'
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

function formatDateShort(dateStr: string): { day: string; month: string; weekday: string } {
  const date = new Date(dateStr + 'T00:00:00')
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
  }
}

export const metadata = {
  title: 'Newsletter | LoreAI',
  description: 'Daily AI news digest - curated hot topics',
}

export default async function NewsletterPage() {
  const newsletters = await getNewsletterList()

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
              <span style={{ color: '#111827', fontWeight: '600', borderBottom: '2px solid #8b5cf6', paddingBottom: '4px' }}>Newsletter</span>
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

        {/* Timeline */}
        {newsletters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '8px' }}>No newsletters yet</p>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>Check back soon!</p>
          </div>
        ) : (
          <div style={{ borderLeft: '2px solid #e5e7eb', marginLeft: '8px' }}>
            {newsletters.map((entry) => {
              const { day, month, weekday } = formatDateShort(entry.date)
              return (
                <Link 
                  key={entry.date}
                  href={`/newsletter/${entry.date}`}
                  style={{ 
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '20px',
                    padding: '20px 0',
                    marginLeft: '-9px',
                    textDecoration: 'none',
                    borderBottom: '1px solid #f3f4f6'
                  }}
                >
                  <div 
                    style={{ 
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: '#3b82f6',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  />
                  
                  <div style={{ width: '56px', flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                      {month} {day}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {weekday}
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ 
                      fontSize: '15px', 
                      fontWeight: '500', 
                      color: '#111827',
                      marginBottom: '4px',
                      lineHeight: '1.5'
                    }}>
                      {entry.title}
                    </h2>
                    {entry.preview && (
                      <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                        {entry.preview.length > 100 ? entry.preview.slice(0, 100) + '...' : entry.preview}
                      </p>
                    )}
                  </div>
                  
                  <div style={{ color: '#d1d5db', fontSize: '18px', flexShrink: 0 }}>›</div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Subscribe */}
        <div style={{ 
          marginTop: '48px',
          padding: '32px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #fdf2f8, #ede9fe, #eff6ff)',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#111827',
            marginBottom: '8px'
          }}>
            Stay in the loop
          </h3>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
            Get the AI newsletter delivered to your inbox daily.
          </p>
          <form 
            action="https://buttondown.com/api/emails/newsletter-subscribe" 
            method="post" 
            target="popupwindow"
            style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <input type="hidden" name="tag" value="loreai" />
            <input 
              type="email" 
              name="email" 
              placeholder="your@email.com"
              required
              style={{ 
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                width: '240px',
                outline: 'none'
              }}
            />
            <button 
              type="submit"
              style={{ 
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(to right, #8b5cf6, #6366f1)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* Footer */}
        <footer style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
          <p style={{ color: '#9ca3af', fontSize: '13px' }}>
            Curated by AI · Updated daily
          </p>
        </footer>
      </div>
    </main>
  )
}
