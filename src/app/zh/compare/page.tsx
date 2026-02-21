import Link from 'next/link'
import { getAllCompares } from '@/lib/compare'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getNavItems } from '@/lib/nav'

export const metadata = {
  title: 'AI 模型对比 | LoreAI',
  description: 'AI 模型并排对比 — 基准测试、定价和功能特性。',
  alternates: {
    languages: {
      'en': '/en/compare',
      'zh': '/zh/compare',
    },
  },
}

export default function ComparePageZh() {
  const compares = getAllCompares('zh')

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <Header
          lang="zh"
          navItems={getNavItems('zh', '/zh/compare')}
          langSwitchHref="/en/compare"
        />

        {/* Hero */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>AI 模型对比</h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>并排对比 — 基准测试、定价和功能特性</p>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '40px' }}>
          <div style={{ height: '8px', width: '120px', background: 'linear-gradient(90deg, #EC4899, #8B5CF6, #3B82F6)', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#60A5FA', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#93C5FD', borderRadius: '2px', opacity: 0.7 }} />
        </div>

        {compares.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>暂无对比内容，敬请期待！</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {compares.map(c => (
              <Link key={c.slug} href={`/zh/compare/${c.slug}`} style={{ textDecoration: 'none', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#111827' }}>{c.title}</span>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>{c.date}</span>
                </div>
                <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>{c.model_a} vs {c.model_b}</p>
              </Link>
            ))}
          </div>
        )}

        <Footer lang="zh" />
      </div>
    </main>
  )
}
