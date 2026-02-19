import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getGlossaryTerms, getGlossaryTerm, generateGlossaryJsonLd } from '@/lib/glossary'
import Header from '@/components/Header'
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
    alternates: {
      languages: {
        'en': `/en/glossary/${slug}`,
        'zh': `/zh/glossary/${slug}`,
      },
    },
  }
}

export default async function GlossaryTermPageEn({ params }: Props) {
  const { term: slug } = await params
  const entry = await getGlossaryTerm(slug, 'en')
  if (!entry) notFound()

  const jsonLd = generateGlossaryJsonLd(entry)
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://loreai.dev' },
      { '@type': 'ListItem', position: 2, name: 'Glossary', item: 'https://loreai.dev/en/glossary' },
      { '@type': 'ListItem', position: 3, name: entry.term },
    ],
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />

        <Header
          lang="en"
          navItems={[
            { label: 'Newsletter', href: '/newsletter' },
            { label: 'Blog', href: '/en/blog' },
            { label: 'FAQ', href: '/en/faq' },
            { label: 'Glossary', href: '/en/glossary', active: true },
            { label: 'Compare', href: '/en/compare' },
          ]}
          langSwitchHref={`/zh/glossary/${slug}`}
        />

        {/* Breadcrumb */}
        <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px' }}>
          <Link href="/en/glossary" style={{ color: '#6b7280', textDecoration: 'none' }}>Glossary</Link>
          <span style={{ margin: '0 8px' }}>→</span>
          <span style={{ color: '#111827' }}>{entry.term}</span>
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>{entry.term}</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '12px', padding: '2px 10px', borderRadius: '9999px', backgroundColor: '#f5f3ff', color: '#7c3aed' }}>{entry.category}</span>
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>{entry.date}</span>
        </div>

        <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '32px' }}>
          <p style={{ color: '#374151', fontStyle: 'italic', margin: 0 }}>{entry.definition}</p>
        </div>

        <div
          className="content-area"
          dangerouslySetInnerHTML={{ __html: entry.contentHtml }}
        />

        {entry.related.length > 0 && (
          <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
            <h2 className="related-section-title">Related Terms</h2>
            {entry.related.map(r => (
              <Link key={r} href={`/en/glossary/${r}`} className="related-card">
                <div className="related-card-title">{r}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
