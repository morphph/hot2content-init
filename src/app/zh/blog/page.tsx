import Link from 'next/link'
import { getBlogPosts } from '@/lib/blog'

function formatDate(dateStr: string): { day: string; month: string } {
  const date = new Date(dateStr + 'T00:00:00')
  return {
    day: date.getDate().toString(),
    month: (date.getMonth() + 1) + '月',
  }
}

const tierConfig = {
  1: { label: '🔬 深度解读', color: '#7c3aed', bg: '#f5f3ff' },
  2: { label: '📝 分析', color: '#2563eb', bg: '#eff6ff' },
  3: { label: '⚡ 快读', color: '#059669', bg: '#ecfdf5' },
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
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#2563eb', letterSpacing: '-0.02em' }}>LoreAI</span>
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
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>博客</h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>深度解读、教程和洞察</p>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '40px' }}>
          <div style={{ height: '8px', width: '120px', background: 'linear-gradient(90deg, #EC4899, #8B5CF6, #3B82F6)', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#60A5FA', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#93C5FD', borderRadius: '2px', opacity: 0.7 }} />
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '8px' }}>暂无文章</p>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>敬请期待！</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {posts.map((post) => {
              const { month, day } = formatDate(post.date)
              const tier = tierConfig[post.tier] || tierConfig[2]
              const isTier1 = post.tier === 1

              return (
                <Link
                  key={post.slug}
                  href={`/zh/blog/${post.slug}`}
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    padding: isTier1 ? '24px' : '16px 20px',
                    borderRadius: '12px',
                    border: isTier1 ? '2px solid #e9d5ff' : '1px solid #f3f4f6',
                    backgroundColor: isTier1 ? '#faf5ff' : '#ffffff',
                  }}
                  className="blog-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: isTier1 ? '12px' : '6px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: tier.color,
                      backgroundColor: tier.bg,
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}>
                      {tier.label}
                    </span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{month}{day}日</span>
                    <span style={{ fontSize: '12px', color: '#d1d5db' }}>·</span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{post.readingTime} 分钟阅读</span>
                  </div>

                  <h2 style={{
                    fontSize: isTier1 ? '18px' : '15px',
                    fontWeight: isTier1 ? '600' : '500',
                    color: '#111827',
                    marginBottom: '4px',
                    lineHeight: '1.4'
                  }}>
                    {post.title}
                  </h2>

                  {post.description && (
                    <p style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      lineHeight: '1.5',
                      marginTop: '4px'
                    }}>
                      {post.description.length > (isTier1 ? 150 : 80)
                        ? post.description.slice(0, isTier1 ? 150 : 80) + '...'
                        : post.description}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <footer style={{ textAlign: 'center', marginTop: '64px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
          <p style={{ color: '#9ca3af', fontSize: '13px' }}>AI 驱动 · 为人而建</p>
        </footer>
      </div>
    </main>
  )
}
