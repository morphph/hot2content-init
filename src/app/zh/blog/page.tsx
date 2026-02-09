import Link from 'next/link'
import { getBlogPosts } from '@/lib/blog'

function formatDate(dateStr: string): { day: string; month: string; weekday: string } {
  const date = new Date(dateStr + 'T00:00:00')
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: (date.getMonth() + 1) + '月',
    weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
  }
}

export const metadata = {
  title: '博客 | LoreAI',
  description: '深度解读、教程和 AI 开发洞察',
}

export default async function BlogPageZh() {
  const posts = await getBlogPosts('zh')

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px' }}>
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
            
            <nav style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
              <Link href="/newsletter" style={{ color: '#6b7280', textDecoration: 'none', paddingBottom: '4px' }}>Newsletter</Link>
              <span style={{ color: '#111827', fontWeight: '600', borderBottom: '2px solid #8b5cf6', paddingBottom: '4px' }}>博客</span>
            </nav>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
            <Link href="/en/blog" style={{ color: '#6b7280', textDecoration: 'none' }}>EN</Link>
            <span style={{ color: '#d1d5db' }}>|</span>
            <span style={{ color: '#111827', fontWeight: '500' }}>中文</span>
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
            博客
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            深度解读、教程和洞察
          </p>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '40px' }}>
          <div style={{ height: '8px', width: '120px', background: 'linear-gradient(90deg, #EC4899, #8B5CF6, #3B82F6)', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#60A5FA', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#93C5FD', borderRadius: '2px', opacity: 0.7 }} />
        </div>

        {/* Timeline */}
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '8px' }}>暂无文章</p>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>敬请期待！</p>
          </div>
        ) : (
          <div style={{ borderLeft: '2px solid #e5e7eb', marginLeft: '8px' }}>
            {posts.map((post) => {
              const { day, month, weekday } = formatDate(post.date)
              return (
                <Link 
                  key={post.slug}
                  href={`/zh/blog/${post.slug}`}
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
                      {month}{day}日
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
                        {post.description.length > 80 ? post.description.slice(0, 80) + '...' : post.description}
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
            AI 驱动 · 为人而建
          </p>
        </footer>
      </div>
    </main>
  )
}
