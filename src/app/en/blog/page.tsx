import Link from 'next/link'
import { getBlogPosts } from '@/lib/blog'

function formatDate(dateStr: string): { day: string; month: string; weekday: string } {
  const date = new Date(dateStr + 'T00:00:00')
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
  }
}

export const metadata = {
  title: 'Blog | LoreAI',
  description: 'Deep dives, tutorials, and insights on AI development',
}

export default async function BlogPage() {
  const posts = await getBlogPosts('en')

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
              <Link href="/newsletter" style={{ color: '#6b7280', textDecoration: 'none', paddingBottom: '4px' }}>Newsletter</Link>
              <span style={{ color: '#111827', fontWeight: '600', borderBottom: '2px solid #8b5cf6', paddingBottom: '4px' }}>Blog</span>
            </nav>
          </div>
          
          {/* Language Switch */}
          <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: '#111827', fontWeight: '500' }}>EN</span>
            <span style={{ color: '#d1d5db' }}>|</span>
            <Link href="/zh/blog" style={{ color: '#6b7280', textDecoration: 'none' }}>中文</Link>
          </div>
        </header>

        {/* Title */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '6px' }}>
            Blog
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Deep dives, tutorials, and insights
          </p>
        </div>

        {/* Timeline */}
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '8px' }}>No posts yet</p>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>Check back soon!</p>
          </div>
        ) : (
          <div style={{ borderLeft: '2px solid #e5e7eb', marginLeft: '8px' }}>
            {posts.map((post) => {
              const { day, month, weekday } = formatDate(post.date)
              return (
                <Link 
                  key={post.slug}
                  href={`/en/blog/${post.slug}`}
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
                      {post.title}
                    </h2>
                    {post.description && (
                      <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                        {post.description.length > 100 ? post.description.slice(0, 100) + '...' : post.description}
                      </p>
                    )}
                  </div>
                  
                  <div style={{ color: '#d1d5db', fontSize: '18px', flexShrink: 0 }}>›</div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <footer style={{ textAlign: 'center', marginTop: '64px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
          <p style={{ color: '#9ca3af', fontSize: '13px' }}>
            Curated by AI · Built for humans
          </p>
        </footer>
      </div>
    </main>
  )
}
