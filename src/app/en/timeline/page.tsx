import Link from 'next/link'
import Header from '@/components/Header'
import { getAllTimelines } from '@/lib/timeline'

export const metadata = {
  title: 'AI News Timelines | LoreAI',
  description: 'Chronological timelines of AI news by topic — track the evolution of Claude Code, GPT-5, AI Agents, and more.',
  alternates: {
    languages: {
      'en': '/en/timeline',
      'zh': '/zh/timeline',
    },
  },
}

export default function TimelineIndexEn() {
  const timelines = getAllTimelines()

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <Header
          lang="en"
          navItems={[
            { label: 'Newsletter', href: '/newsletter' },
            { label: 'Blog', href: '/en/blog' },
            { label: 'Topics', href: '/en/topics' },
            { label: 'Timeline', href: '/en/timeline', active: true },
          ]}
          langSwitchHref="/zh/timeline"
        />

        {/* Hero */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
            News Timelines
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Track the evolution of AI topics over time — every major development, chronologically organized.
          </p>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '40px' }}>
          <div style={{ height: '8px', width: '120px', background: 'linear-gradient(90deg, #EC4899, #8B5CF6, #3B82F6)', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#60A5FA', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#93C5FD', borderRadius: '2px', opacity: 0.7 }} />
        </div>

        {timelines.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No timelines yet. Check back after the next data export!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {timelines.map(t => (
              <Link
                key={t.slug}
                href={`/en/timeline/${t.slug}`}
                style={{ textDecoration: 'none', padding: '20px 24px', border: '1px solid #e5e7eb', borderRadius: '12px', display: 'block' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                    {t.name_en}
                  </h2>
                  <span style={{ fontSize: '12px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '9999px' }}>
                    {t.entries.length} events
                  </span>
                </div>
                <p style={{ color: '#9ca3af', fontSize: '13px' }}>
                  Latest: {t.entries[0]?.date || 'N/A'} · Updated: {t.lastUpdated}
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
