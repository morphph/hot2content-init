import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAllFAQTopics, getFAQTopic, generateFAQJsonLd } from '@/lib/faq'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ topic: string }>
}

export async function generateStaticParams() {
  return getAllFAQTopics('en').map(t => ({ topic: t.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic: slug } = await params
  const topic = await getFAQTopic(slug)
  if (!topic) return {}
  return {
    title: `${topic.title} — FAQ | LoreAI`,
    description: topic.description,
  }
}

export default async function FAQTopicPageEn({ params }: Props) {
  const { topic: slug } = await params
  const topic = await getFAQTopic(slug)
  if (!topic) notFound()

  const jsonLd = generateFAQJsonLd(topic)
  // Derive ZH slug: replace -en suffix with -zh
  const zhSlug = slug.replace(/-en$/, '-zh')

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
              <Link href="/en/faq" style={{ color: '#6b7280', textDecoration: 'none', borderBottom: '2px solid #8b5cf6', paddingBottom: '4px' }}>FAQ</Link>
              <Link href="/en/glossary" style={{ color: '#6b7280', textDecoration: 'none', paddingBottom: '4px' }}>Glossary</Link>
              <Link href="/en/compare" style={{ color: '#6b7280', textDecoration: 'none', paddingBottom: '4px' }}>Compare</Link>
            </nav>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: '#111827', fontWeight: '500' }}>EN</span>
            <span style={{ color: '#d1d5db' }}>|</span>
            <Link href={`/zh/faq/${zhSlug}`} style={{ color: '#6b7280', textDecoration: 'none' }}>中文</Link>
          </div>
        </header>

        {/* Breadcrumb */}
        <nav style={{ fontSize: '14px', marginBottom: '24px', color: '#6b7280' }}>
          <Link href="/en/faq" style={{ color: '#6b7280', textDecoration: 'none' }}>FAQ</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#111827' }}>{topic.title}</span>
        </nav>

        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#111827' }}>{topic.title}</h1>
        {topic.description && (
          <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '32px' }}>{topic.description}</p>
        )}

        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: topic.contentHtml }}
        />
      </div>
    </main>
  )
}
