import Link from 'next/link'
import { getAllFAQTopics } from '@/lib/faq'
import Header from '@/components/Header'

export const metadata = {
  title: '常见问题 | LoreAI',
  description: '关于 AI 模型、工具和对比的常见问题解答。',
  alternates: {
    languages: {
      'en': '/en/faq',
      'zh': '/zh/faq',
    },
  },
}

export default function FAQPageZh() {
  const topics = getAllFAQTopics('zh')

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <Header
          lang="zh"
          navItems={[
            { label: 'Newsletter', href: '/zh/newsletter' },
            { label: '博客', href: '/zh/blog' },
            { label: '常见问题', href: '/zh/faq', active: true },
            { label: '术语表', href: '/zh/glossary' },
            { label: '对比', href: '/zh/compare' },
          ]}
          langSwitchHref="/en/faq"
        />

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
