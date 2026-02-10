import Link from 'next/link'
import { getAllFAQTopics } from '@/lib/faq'

export const metadata = {
  title: '常见问题 | LoreAI',
  description: '关于 AI 模型、工具和对比的常见问题解答。',
}

export default function FAQPageZh() {
  const topics = getAllFAQTopics('zh')

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
              <span style={{ color: '#111827', fontWeight: '600', borderBottom: '2px solid #8b5cf6', paddingBottom: '4px' }}>常见问题</span>
              <Link href="/zh/glossary" style={{ color: '#6b7280', textDecoration: 'none', paddingBottom: '4px' }}>术语表</Link>
              <Link href="/zh/compare" style={{ color: '#6b7280', textDecoration: 'none', paddingBottom: '4px' }}>对比</Link>
            </nav>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
            <Link href="/en/faq" style={{ color: '#6b7280', textDecoration: 'none' }}>EN</Link>
            <span style={{ color: '#d1d5db' }}>|</span>
            <span style={{ color: '#111827', fontWeight: '500' }}>中文</span>
          </div>
        </header>

        {/* Hero */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>常见问题</h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>AI 模型、基准测试和工具 — 你的问题我们来答</p>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '40px' }}>
          <div style={{ height: '8px', width: '120px', background: 'linear-gradient(90deg, #EC4899, #8B5CF6, #3B82F6)', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#60A5FA', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#93C5FD', borderRadius: '2px', opacity: 0.7 }} />
        </div>

        {topics.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>暂无常见问题，敬请期待！</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topics.map(t => (
              <Link key={t.slug} href={`/zh/faq/${t.slug}`} style={{ textDecoration: 'none', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#111827' }}>{t.title}</span>
                  <span style={{ fontSize: '12px', color: '#9ca3af', backgroundColor: '#f9fafb', padding: '2px 8px', borderRadius: '4px' }}>{t.questionCount} 问</span>
                </div>
                {t.description && <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>{t.description}</p>}
              </Link>
            ))}
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
