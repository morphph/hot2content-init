import Link from 'next/link'
import { getGlossaryTerms } from '@/lib/glossary'
import Header from '@/components/Header'

export const metadata = {
  title: '术语表 | LoreAI',
  description: 'AI 术语解释 — 涵盖架构、基准测试等概念的综合术语表。',
  alternates: {
    languages: {
      'en': '/en/glossary',
      'zh': '/zh/glossary',
    },
  },
}

export default function GlossaryPageZh() {
  const terms = getGlossaryTerms('zh')
  const categories = [...new Set(terms.map(t => t.category).filter(Boolean))].sort()

  const grouped: Record<string, typeof terms> = {}
  for (const t of terms) {
    const letter = (t.term[0] || '#').toUpperCase()
    if (!grouped[letter]) grouped[letter] = []
    grouped[letter].push(t)
  }
  const letters = Object.keys(grouped).sort()

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <Header
          lang="zh"
          navItems={[
            { label: 'Newsletter', href: '/zh/newsletter' },
            { label: '博客', href: '/zh/blog' },
            { label: '常见问题', href: '/zh/faq' },
            { label: '术语表', href: '/zh/glossary', active: true },
            { label: '对比', href: '/zh/compare' },
          ]}
          langSwitchHref="/en/glossary"
        />

        {/* Hero */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>术语表</h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>AI 术语解释 — 从架构到基准测试</p>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '40px' }}>
          <div style={{ height: '8px', width: '120px', background: 'linear-gradient(90deg, #EC4899, #8B5CF6, #3B82F6)', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#60A5FA', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#93C5FD', borderRadius: '2px', opacity: 0.7 }} />
        </div>

        {categories.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
            {categories.map(cat => (
              <span key={cat} style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '9999px', backgroundColor: '#f3f4f6', color: '#6b7280' }}>{cat}</span>
            ))}
          </div>
        )}

        {terms.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>暂无术语条目，敬请期待！</p>
        ) : (
          letters.map(letter => (
            <div key={letter} style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#a855f7', marginBottom: '12px' }}>{letter}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {grouped[letter].map(t => (
                  <Link key={t.slug} href={`/zh/glossary/${t.slug}`} style={{ textDecoration: 'none', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', color: '#111827' }}>{t.term}</span>
                      <span style={{ fontSize: '12px', color: '#9ca3af', backgroundColor: '#f9fafb', padding: '2px 8px', borderRadius: '4px' }}>{t.category}</span>
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>{t.definition}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Footer */}
        <footer style={{ textAlign: 'center', marginTop: '64px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
          <p style={{ color: '#9ca3af', fontSize: '13px' }}>AI 驱动 · 为人而建</p>
        </footer>
      </div>
    </main>
  )
}
