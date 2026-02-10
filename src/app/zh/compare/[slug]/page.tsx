import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAllCompares, getCompare, generateCompareJsonLd } from '@/lib/compare'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllCompares('zh').map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getCompare(slug)
  if (!post) return {}
  return {
    title: `${post.title} | LoreAI`,
    description: post.description,
  }
}

export default async function CompareDetailPageZh({ params }: Props) {
  const { slug } = await params
  const post = await getCompare(slug)
  if (!post) notFound()

  const jsonLd = generateCompareJsonLd(post)
  const allCompares = getAllCompares('zh')
  const related = allCompares.filter(c => c.slug !== slug).slice(0, 3)
  const enSlug = slug.replace(/-zh$/, '-en')

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
              <Link href="/zh/blog" style={{ color: '#6b7280', textDecoration: 'none', paddingBottom: '4px' }}>博客</Link>
              <Link href="/zh/faq" style={{ color: '#6b7280', textDecoration: 'none', paddingBottom: '4px' }}>常见问题</Link>
              <Link href="/zh/glossary" style={{ color: '#6b7280', textDecoration: 'none', paddingBottom: '4px' }}>术语表</Link>
              <Link href="/zh/compare" style={{ color: '#6b7280', textDecoration: 'none', borderBottom: '2px solid #8b5cf6', paddingBottom: '4px' }}>对比</Link>
            </nav>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
            <Link href={`/en/compare/${enSlug}`} style={{ color: '#6b7280', textDecoration: 'none' }}>EN</Link>
            <span style={{ color: '#d1d5db' }}>|</span>
            <span style={{ color: '#111827', fontWeight: '500' }}>中文</span>
          </div>
        </header>

        {/* Breadcrumb */}
        <nav style={{ fontSize: '14px', marginBottom: '24px', color: '#6b7280' }}>
          <Link href="/zh/compare" style={{ color: '#6b7280', textDecoration: 'none' }}>对比</Link>
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
            <h2 className="related-section-title">更多对比</h2>
            {related.map(r => (
              <Link key={r.slug} href={`/zh/compare/${r.slug}`} className="related-card">
                <div className="related-card-title">{r.title}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
