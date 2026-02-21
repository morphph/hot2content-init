import Link from 'next/link'
import { getBlogPosts } from '@/lib/blog'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getNavItems } from '@/lib/nav'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const tierConfig = {
  2: { label: '📝 Analysis', color: '#2563eb', bg: '#eff6ff' },
  3: { label: '⚡ Quick Read', color: '#059669', bg: '#ecfdf5' },
}

export const metadata = {
  title: 'Resources | LoreAI',
  description: 'Quick reads, analyses, and insights on trending AI topics',
  alternates: {
    languages: {
      'en': '/en/resources',
      'zh': '/zh/resources',
    },
  },
}

export default async function ResourcesPage() {
  const posts = await getBlogPosts('en', { excludeTier: 1 })

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <Header
          lang="en"
          navItems={getNavItems('en', '/en/resources')}
          langSwitchHref="/zh/resources"
        />

        {/* Hero */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(to right, #059669, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>Resources</h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Quick reads and analyses on trending AI topics</p>
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
            <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '8px' }}>No resources yet</p>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>Check back soon!</p>
            <Link href="/en/blog" style={{ color: '#2563eb', fontSize: '14px', textDecoration: 'none', marginTop: '16px', display: 'inline-block' }}>
              ← Read our deep dives
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {posts.map((post) => {
              const tier = tierConfig[post.tier as 2 | 3] || tierConfig[2]

              return (
                <Link
                  key={post.slug}
                  href={`/en/blog/${post.slug}`}
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
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{post.readingTime} min read</span>
                  </div>
                  <h2 style={{ fontSize: '15px', fontWeight: '500', color: '#111827', marginBottom: '4px', lineHeight: '1.4' }}>
                    {post.title}
                  </h2>
                  {post.description && (
                    <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                      {post.description.length > 120 ? post.description.slice(0, 120) + '...' : post.description}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: '48px', padding: '24px', borderRadius: '12px', backgroundColor: '#f5f3ff', textAlign: 'center' }}>
          <p style={{ fontSize: '15px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Want the full picture?</p>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>Our deep dives go beyond the surface.</p>
          <Link href="/en/blog" style={{ fontSize: '14px', color: '#7c3aed', fontWeight: '600', textDecoration: 'none' }}>
            🔬 Read Deep Dives →
          </Link>
        </div>

        <Footer lang="en" />
      </div>
    </main>
  )
}
