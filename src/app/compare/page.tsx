import Link from 'next/link'
import { getAllCompares } from '@/lib/compare'

export const metadata = {
  title: 'Compare AI Models | LoreAI',
  description: 'Side-by-side comparisons of AI models — benchmarks, pricing, and features.',
}

export default function CompareIndexPage() {
  const compares = getAllCompares()

  const enCompares = compares.filter(c => c.lang === 'en')
  const zhCompares = compares.filter(c => c.lang === 'zh')

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
              <Link href="/en/blog" style={{ color: '#6b7280', textDecoration: 'none', paddingBottom: '4px' }}>Blog</Link>
              <Link href="/faq" style={{ color: '#6b7280', textDecoration: 'none', paddingBottom: '4px' }}>FAQ</Link>
              <Link href="/glossary" style={{ color: '#6b7280', textDecoration: 'none', paddingBottom: '4px' }}>Glossary</Link>
              <span style={{ color: '#111827', fontWeight: '600', borderBottom: '2px solid #8b5cf6', paddingBottom: '4px' }}>Compare</span>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>Compare AI Models</h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Side-by-side comparisons — benchmarks, pricing, and features</p>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '40px' }}>
          <div style={{ height: '8px', width: '120px', background: 'linear-gradient(90deg, #EC4899, #8B5CF6, #3B82F6)', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#60A5FA', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#93C5FD', borderRadius: '2px', opacity: 0.7 }} />
        </div>

        {compares.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No comparisons yet. Check back soon!</p>
        ) : (
          <>
            {/* EN Section */}
            {enCompares.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#a855f7', marginBottom: '16px' }}>
                  🇺🇸 English ({enCompares.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {enCompares.map(c => (
                    <Link key={c.slug} href={`/compare/${c.slug}`} style={{ textDecoration: 'none', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'block' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '600', color: '#111827' }}>{c.title}</span>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>{c.date}</span>
                      </div>
                      <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>{c.model_a} vs {c.model_b}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ZH Section */}
            {zhCompares.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6', marginBottom: '16px' }}>
                  🇨🇳 中文 ({zhCompares.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {zhCompares.map(c => (
                    <Link key={c.slug} href={`/compare/${c.slug}`} style={{ textDecoration: 'none', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'block' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '600', color: '#111827' }}>{c.title}</span>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>{c.date}</span>
                      </div>
                      <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>{c.model_a} vs {c.model_b}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
