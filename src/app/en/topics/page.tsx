import Link from 'next/link'
import Header from '@/components/Header'
import { getAllTopicClustersWithCounts } from '@/lib/topic-cluster'

export const metadata = {
  title: 'Topic Hubs | LoreAI',
  description: 'Browse all AI topics — curated hubs with deep dives, glossary, FAQ, and comparisons.',
  alternates: {
    languages: {
      'en': '/en/topics',
      'zh': '/zh/topics',
    },
  },
}

export default async function TopicsPageEn() {
  const clusters = await getAllTopicClustersWithCounts('en')

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <Header
          lang="en"
          navItems={[
            { label: 'Newsletter', href: '/newsletter' },
            { label: 'Blog', href: '/en/blog' },
            { label: 'Topics', href: '/en/topics', active: true },
          ]}
          langSwitchHref="/zh/topics"
        />

        {/* Hero */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
            Topic Hubs
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Everything we&apos;ve written about each topic — deep dives, glossary, FAQ, and comparisons in one place.
          </p>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '40px' }}>
          <div style={{ height: '8px', width: '120px', background: 'linear-gradient(90deg, #EC4899, #8B5CF6, #3B82F6)', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#60A5FA', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#93C5FD', borderRadius: '2px', opacity: 0.7 }} />
        </div>

        {clusters.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No topics yet. Check back soon!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {clusters.map(cluster => (
              <Link
                key={cluster.slug}
                href={`/en/topics/${cluster.slug}`}
                style={{ textDecoration: 'none', padding: '20px 24px', border: '1px solid #e5e7eb', borderRadius: '12px', display: 'block', transition: 'border-color 0.2s' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                    {cluster.name_en}
                  </h2>
                  <span style={{ fontSize: '12px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '9999px' }}>
                    {cluster.totalCount} {cluster.totalCount === 1 ? 'article' : 'articles'}
                  </span>
                </div>
                <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
                  {cluster.description_en}
                </p>
              </Link>
            ))}
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
