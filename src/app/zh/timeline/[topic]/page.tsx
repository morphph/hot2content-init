import Link from 'next/link'
import Header from '@/components/Header'
import { getAllTimelines, getTimeline, groupByDate, generateTimelineJsonLd } from '@/lib/timeline'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ topic: string }>
}

export function generateStaticParams() {
  const timelines = getAllTimelines()
  return timelines.map(t => ({ topic: t.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params
  const timeline = getTimeline(topic)
  if (!timeline) return { title: 'Not Found' }

  return {
    title: `${timeline.name_zh} 新闻时间线 | LoreAI`,
    description: `${timeline.name_zh} 新闻时间线——追踪 ${timeline.entries.length} 条动态。`,
    alternates: {
      canonical: `https://loreai.dev/zh/timeline/${topic}/`,
      languages: {
        'en': `/en/timeline/${topic}/`,
        'zh': `/zh/timeline/${topic}/`,
        'x-default': `/en/timeline/${topic}/`,
      },
    },
  }
}

export default async function TimelineDetailZh({ params }: Props) {
  const { topic } = await params
  const timeline = getTimeline(topic)
  if (!timeline) notFound()

  const jsonLd = generateTimelineJsonLd(timeline, 'zh')
  const grouped = groupByDate(timeline.entries)
  const dates = [...grouped.keys()].sort().reverse()

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <Header
          lang="zh"
          navItems={[
            { label: 'Newsletter', href: '/zh/newsletter' },
            { label: '博客', href: '/zh/blog' },
            { label: '话题', href: '/zh/topics' },
            { label: '时间线', href: '/zh/timeline', active: true },
          ]}
          langSwitchHref={`/en/timeline/${topic}`}
        />

        {/* Back link */}
        <div style={{ marginBottom: '24px' }}>
          <Link href="/zh/timeline" style={{ color: '#2563eb', fontSize: '14px', textDecoration: 'none' }}>
            &larr; 所有时间线
          </Link>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
            {timeline.name_zh} 时间线
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            追踪 {timeline.entries.length} 条动态 · 最后更新 {timeline.lastUpdated}
          </p>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '40px' }}>
          <div style={{ height: '8px', width: '120px', background: 'linear-gradient(90deg, #EC4899, #8B5CF6, #3B82F6)', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#60A5FA', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#93C5FD', borderRadius: '2px', opacity: 0.7 }} />
        </div>

        {/* Timeline */}
        <div style={{ position: 'relative' }}>
          {/* Vertical line */}
          <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', backgroundColor: '#e5e7eb' }} />

          {dates.map(date => {
            const entries = grouped.get(date)!
            return (
              <div key={date} style={{ marginBottom: '32px' }}>
                {/* Date header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#8b5cf6', flexShrink: 0, position: 'relative', zIndex: 1 }} />
                  <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>{date}</h2>
                </div>

                {/* Entries for this date */}
                <div style={{ marginLeft: '32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {entries.map(entry => (
                    <a
                      key={entry.id}
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'block' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontWeight: '500', color: '#111827', fontSize: '14px', lineHeight: '1.5' }}>
                          {entry.title}
                        </span>
                        <span style={{ fontSize: '11px', color: '#9ca3af', backgroundColor: '#f9fafb', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 }}>
                          {entry.source}
                        </span>
                      </div>
                      {entry.summary && (
                        <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px', lineHeight: '1.5' }}>
                          {entry.summary.slice(0, 150)}{entry.summary.length > 150 ? '...' : ''}
                        </p>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Related links */}
        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #f3f4f6', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', fontSize: '14px' }}>
          <Link href={`/zh/topics/${topic}`} style={{ padding: '6px 16px', borderRadius: '9999px', backgroundColor: '#f3f4f6', color: '#6b7280', textDecoration: 'none' }}>
            {timeline.name_zh} 话题中心
          </Link>
          <Link href="/zh/timeline" style={{ padding: '6px 16px', borderRadius: '9999px', backgroundColor: '#f3f4f6', color: '#6b7280', textDecoration: 'none' }}>
            所有时间线
          </Link>
          <Link href="/zh/blog" style={{ padding: '6px 16px', borderRadius: '9999px', backgroundColor: '#f3f4f6', color: '#6b7280', textDecoration: 'none' }}>
            博客
          </Link>
        </div>

        {/* Footer */}
        <footer style={{ textAlign: 'center', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
          <p style={{ color: '#9ca3af', fontSize: '13px' }}>AI 策展 · 为人而建</p>
        </footer>
      </div>
    </main>
  )
}
