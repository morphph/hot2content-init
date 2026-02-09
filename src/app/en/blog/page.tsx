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

const tierConfig = {
  1: { label: '🔬 Deep Dive', color: '#7c3aed', bg: '#f5f3ff' },
  2: { label: '📝 Analysis', color: '#2563eb', bg: '#eff6ff' },
  3: { label: '⚡ Quick Read', color: '#059669', bg: '#ecfdf5' },
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link href="/newsletter" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#2563eb', letterSpacing: '-0.02em' }}>LoreAI</span>
            </Link>
            <nav style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
              <Link href="/newsletter" style={{ color: '#6b7280', textDecoration: 'none', paddingBottom: '4px' }}>Newsletter</Link>
              <span style={{ color: '#111827', fontWeight: '600', borderBottom: '2px solid #8b5cf6', paddingBottom: '4px' }}>Blog</span>
            </nav>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: '#111827', fontWeight: '500' }}>EN</span>
            <span style={{ color: '#d1d5db' }}>|</span>
            <Link href="/zh/blog" style={{ color: '#6b7280', textDecoration: 'none' }}>中文</Link>
          </div>
        </header>

        {/* Hero */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>Blog</h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Deep dives, tutorials, and insights</p>
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
            <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '8px' }}>No posts yet</p>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>Check back soon!</p>
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
                  href={`/en/blog/${post.slug}`}
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    padding: isTier1 ? '24px' : '16px 20px',
                    borderRadius: '12px',
                    border: isTier1 ? '2px solid #e9d5ff' : '1px solid #f3f4f6',
                    backgroundColor: isTier1 ? '#faf5ff' : '#ffffff',
                    transition: 'box-shadow 0.2s',
                  }}
                  className="blog-card"
                >
                  {/* Meta row: tier badge + date + reading time */}
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
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{month} {day}</span>
                    <span style={{ fontSize: '12px', color: '#d1d5db' }}>·</span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{post.readingTime} min read</span>
                  </div>

                  {/* Title */}
                  <h2 style={{
                    fontSize: isTier1 ? '18px' : '15px',
                    fontWeight: isTier1 ? '600' : '500',
                    color: '#111827',
                    marginBottom: '4px',
                    lineHeight: '1.4'
                  }}>
                    {post.title}
                  </h2>

                  {/* Description */}
                  {post.description && (
                    <p style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      lineHeight: '1.5',
                      marginTop: '4px'
                    }}>
                      {post.description.length > (isTier1 ? 200 : 100) 
                        ? post.description.slice(0, isTier1 ? 200 : 100) + '...' 
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
          <p style={{ color: '#9ca3af', fontSize: '13px' }}>Curated by AI · Built for humans</p>
        </footer>
      </div>
    </main>
  )
}
