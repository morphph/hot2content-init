import Link from 'next/link'
import { getGlossaryTerms } from '@/lib/glossary'

export const metadata = {
  title: 'Glossary | LoreAI',
  description: 'AI terminology explained — a comprehensive glossary of AI concepts, models, and techniques.',
}

export default function GlossaryPageEn() {
  const terms = getGlossaryTerms('en')
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
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link href="/newsletter" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#2563eb', letterSpacing: '-0.02em' }}>LoreAI</span>
            </Link>
            <nav style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
              <Link href="/newsletter" style={{ color: '#6b7280', textDecoration: 'none', paddingBottom: '4px' }}>Newsletter</Link>
              <Link href="/en/blog" style={{ color: '#6b7280', textDecoration: 'none', paddingBottom: '4px' }}>Blog</Link>
              <Link href="/en/faq" style={{ color: '#6b7280', textDecoration: 'none', paddingBottom: '4px' }}>FAQ</Link>
              <span style={{ color: '#111827', fontWeight: '600', borderBottom: '2px solid #8b5cf6', paddingBottom: '4px' }}>Glossary</span>
              <Link href="/en/compare" style={{ color: '#6b7280', textDecoration: 'none', paddingBottom: '4px' }}>Compare</Link>
            </nav>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: '#111827', fontWeight: '500' }}>EN</span>
            <span style={{ color: '#d1d5db' }}>|</span>
            <Link href="/zh/glossary" style={{ color: '#6b7280', textDecoration: 'none' }}>中文</Link>
          </div>
        </header>

        {/* Hero */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>Glossary</h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>AI terminology explained — from architectures to benchmarks</p>
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
          <p style={{ color: '#9ca3af' }}>No glossary entries yet. Check back soon!</p>
        ) : (
          letters.map(letter => (
            <div key={letter} style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#a855f7', marginBottom: '12px' }}>{letter}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {grouped[letter].map(t => (
                  <Link key={t.slug} href={`/en/glossary/${t.slug}`} style={{ textDecoration: 'none', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'block' }}>
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
          <p style={{ color: '#9ca3af', fontSize: '13px' }}>Curated by AI · Built for humans</p>
        </footer>
      </div>
    </main>
  )
}
