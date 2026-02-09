import Link from 'next/link'
import { getBlogPosts } from '@/lib/blog'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const tierConfig = {
  2: { label: '📝 分析', color: '#2563eb', bg: '#eff6ff' },
  3: { label: '⚡ 快读', color: '#059669', bg: '#ecfdf5' },
}

export const metadata = {
  title: '资源 | LoreAI',
  description: '快速阅读、分析和 AI 热点洞察',
}

export default async function ResourcesPageZh() {
  const posts = await getBlogPosts('zh', { excludeTier: 1 })

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
              <Link href="/zh/blog" style={{ color: '#6b7280', textDecoration: 'none', paddingBottom: '4px' }}>博客</Link>
              <span style={{ color: '#111827', fontWeight: '600', borderBottom: '2px solid #059669', paddingBottom: '4px' }}>资源</span>
            </nav>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
            <Link href="/en/resources" style={{ color: '#6b7280', textDecoration: 'none' }}>EN</Link>
            <span style={{ color: '#d1d5db' }}>|</span>
            <span style={{ color: '#111827', fontWeight: '500' }}>中文</span>
          </div>
        </header>

        {/* Hero */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(to right, #059669, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>资源</h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>快速阅读和 AI 热点分析</p>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '40px' }}>
          <div style={{ height: '8px', width: '120px', background: 'linear-gradient(90deg, #059669, #2563eb)', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#34d399', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#6ee7b7', borderRadius: '2px', opacity: 0.7 }} />
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '8px' }}>暂无资源</p>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>敬请期待！</p>
            <Link href="/zh/blog" style={{ color: '#2563eb', fontSize: '14px', textDecoration: 'none', marginTop: '16px', display: 'inline-block' }}>
              ← 阅读深度文章
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {posts.map((post) => {
              const tier = tierConfig[post.tier as 2 | 3] || tierConfig[2]

              return (
                <Link
                  key={post.slug}
                  href={`/zh/blog/${post.slug}`}
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    padding: '14px 18px',
                    borderRadius: '10px',
                    border: '1px solid #f3f4f6',
                    backgroundColor: '#ffffff',
                  }}
                  className="blog-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
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
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{formatDate(post.date)}</span>
                    <span style={{ fontSize: '12px', color: '#d1d5db' }}>·</span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{post.readingTime} 分钟阅读</span>
                  </div>
                  <h2 style={{ fontSize: '15px', fontWeight: '500', color: '#111827', marginBottom: '4px', lineHeight: '1.4' }}>
                    {post.title}
                  </h2>
                  {post.description && (
                    <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                      {post.description.length > 80 ? post.description.slice(0, 80) + '...' : post.description}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: '48px', padding: '24px', borderRadius: '12px', backgroundColor: '#f5f3ff', textAlign: 'center' }}>
          <p style={{ fontSize: '15px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>想深入了解？</p>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>我们的深度文章不止于表面。</p>
          <Link href="/zh/blog" style={{ fontSize: '14px', color: '#7c3aed', fontWeight: '600', textDecoration: 'none' }}>
            🔬 阅读深度解读 →
          </Link>
        </div>

        {/* Footer */}
        <footer style={{ textAlign: 'center', marginTop: '64px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
          <p style={{ color: '#9ca3af', fontSize: '13px' }}>AI 驱动 · 为人而建</p>
        </footer>
      </div>
    </main>
  )
}
