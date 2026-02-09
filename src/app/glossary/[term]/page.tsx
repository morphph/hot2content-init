import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getGlossaryTerms, getGlossaryTerm, generateGlossaryJsonLd } from '@/lib/glossary'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ term: string }>
}

export async function generateStaticParams() {
  return getGlossaryTerms('en').map(t => ({ term: t.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { term: slug } = await params
  const entry = await getGlossaryTerm(slug, 'en')
  if (!entry) return {}
  return {
    title: `${entry.term} — Glossary | LoreAI`,
    description: entry.definition,
  }
}

export default async function GlossaryTermPage({ params }: Props) {
  const { term: slug } = await params
  const entry = await getGlossaryTerm(slug, 'en')
  if (!entry) notFound()

  const jsonLd = generateGlossaryJsonLd(entry)

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

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
              <Link href="/glossary" style={{ color: '#6b7280', textDecoration: 'none', borderBottom: '2px solid #8b5cf6', paddingBottom: '4px' }}>Glossary</Link>
            </nav>
          </div>
        </header>

        {/* Breadcrumb */}
        <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px' }}>
          <Link href="/glossary" style={{ color: '#6b7280', textDecoration: 'none' }}>Glossary</Link>
          <span style={{ margin: '0 8px' }}>→</span>
          <span style={{ color: '#111827' }}>{entry.term}</span>
        </div>

        {/* Term header */}
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>{entry.term}</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '12px', padding: '2px 10px', borderRadius: '9999px', backgroundColor: '#f5f3ff', color: '#7c3aed' }}>{entry.category}</span>
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>{entry.date}</span>
        </div>

        {/* Definition callout */}
        <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '32px' }}>
          <p style={{ color: '#374151', fontStyle: 'italic', margin: 0 }}>{entry.definition}</p>
        </div>

        {/* Content */}
        <div
          className="prose prose-lg max-w-none"
          style={{ color: '#374151', lineHeight: 1.8 }}
          dangerouslySetInnerHTML={{ __html: entry.contentHtml }}
        />

        {/* Related terms */}
        {entry.related.length > 0 && (
          <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#6b7280', marginBottom: '12px' }}>Related Terms</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {entry.related.map(r => (
                <Link key={r} href={`/glossary/${r}`} style={{ fontSize: '13px', padding: '4px 12px', borderRadius: '9999px', backgroundColor: '#eff6ff', color: '#2563eb', textDecoration: 'none' }}>{r}</Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
