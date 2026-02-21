import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getNavItems } from '@/lib/nav'
import { getAllTimelines } from '@/lib/timeline'

export const metadata = {
  title: 'AI 新闻时间线 | LoreAI',
  description: '按话题追踪 AI 动态——Claude Code、GPT-5、AI 智能体等话题的时间线。',
  alternates: {
    languages: {
      'en': '/en/timeline',
      'zh': '/zh/timeline',
    },
  },
}

export default function TimelineIndexZh() {
  const timelines = getAllTimelines()

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <Header
          lang="zh"
          navItems={getNavItems('zh', '/zh/timeline')}
          langSwitchHref="/en/timeline"
        />

        {/* Hero */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
            新闻时间线
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            追踪 AI 话题的演变——每一个重大进展，按时间排列。
          </p>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '40px' }}>
          <div style={{ height: '8px', width: '120px', background: 'linear-gradient(90deg, #EC4899, #8B5CF6, #3B82F6)', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#60A5FA', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#93C5FD', borderRadius: '2px', opacity: 0.7 }} />
        </div>

        {timelines.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>暂无时间线数据，请稍后再来！</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {timelines.map(t => (
              <Link
                key={t.slug}
                href={`/zh/timeline/${t.slug}`}
                style={{ textDecoration: 'none', padding: '20px 24px', border: '1px solid #e5e7eb', borderRadius: '12px', display: 'block' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                    {t.name_zh}
                  </h2>
                  <span style={{ fontSize: '12px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '9999px' }}>
                    {t.entries.length} 条
                  </span>
                </div>
                <p style={{ color: '#9ca3af', fontSize: '13px' }}>
                  最新: {t.entries[0]?.date || 'N/A'} · 更新: {t.lastUpdated}
                </p>
              </Link>
            ))}
          </div>
        )}

        <Footer lang="zh" />
      </div>
    </main>
  )
}
