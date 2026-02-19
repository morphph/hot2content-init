import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAllCompares, getCompare, generateCompareJsonLd } from '@/lib/compare'
import Header from '@/components/Header'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllCompares('en').map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getCompare(slug)
  if (!post) return {}
  const zhSlugMeta = slug.replace(/-en$/, '-zh')
  return {
    title: `${post.title} | LoreAI`,
    description: post.description,
    alternates: {
      languages: {
        'en': `/en/compare/${slug}`,
        'zh': `/zh/compare/${zhSlugMeta}`,
      },
    },
  }
}

export default async function CompareDetailPageEn({ params }: Props) {
  const { slug } = await params
  const post = await getCompare(slug)
  if (!post) notFound()

  const jsonLd = generateCompareJsonLd(post)
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://loreai.dev' },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://loreai.dev/en/compare' },
      { '@type': 'ListItem', position: 3, name: `${post.model_a} vs ${post.model_b}` },
    ],
  }
  const allCompares = getAllCompares('en')
  const related = allCompares.filter(c => c.slug !== slug).slice(0, 3)
  const zhSlug = slug.replace(/-en$/, '-zh')

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
            { label: 'Glossary', href: '/en/glossary' },
            { label: 'Compare', href: '/en/compare', active: true },
          ]}
          langSwitchHref={`/zh/compare/${zhSlug}`}
        />

        {/* Breadcrumb */}
        <nav style={{ fontSize: '14px', marginBottom: '24px', color: '#6b7280' }}>
          <Link href="/en/compare" style={{ color: '#6b7280', textDecoration: 'none' }}>Compare</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#111827' }}>{post.model_a} vs {post.model_b}</span>
        </nav>

        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#111827' }}>{post.title}</h1>
        <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#6b7280', marginBottom: '32px' }}>
          <span>{post.date}</span>
          <span style={{ backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' }}>{post.category}</span>
        </div>

        <div
          className="content-area"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        {related.length > 0 && (
          <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
            <h2 className="related-section-title">More Comparisons</h2>
            {related.map(r => (
              <Link key={r.slug} href={`/en/compare/${r.slug}`} className="related-card">
                <div className="related-card-title">{r.title}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
