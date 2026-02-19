import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAllFAQTopics, getFAQTopic, generateFAQJsonLd } from '@/lib/faq'
import Header from '@/components/Header'
import type { FAQIntent } from '@/lib/faq'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ topic: string }>
}

const intentConfig: Record<FAQIntent, { icon: string; label: string }> = {
  comparison: { icon: '🔄', label: 'Comparison' },
  pricing: { icon: '💰', label: 'Pricing' },
  tutorial: { icon: '🛠️', label: 'How-to' },
  informational: { icon: '📋', label: 'Features' },
}

export async function generateStaticParams() {
  return getAllFAQTopics('en').map(t => ({ topic: t.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic: slug } = await params
  const topic = await getFAQTopic(slug)
  if (!topic) return {}
  const zhSlugMeta = slug.replace(/-en$/, '-zh')
  return {
    title: `${topic.title} — FAQ | LoreAI`,
    description: topic.description,
    alternates: {
      languages: {
        'en': `/en/faq/${slug}`,
        'zh': `/zh/faq/${zhSlugMeta}`,
      },
    },
  }
}

export default async function FAQTopicPageEn({ params }: Props) {
  const { topic: slug } = await params
  const topic = await getFAQTopic(slug)
  if (!topic) notFound()

  const jsonLd = generateFAQJsonLd(topic)
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://loreai.dev' },
      { '@type': 'ListItem', position: 2, name: 'FAQ', item: 'https://loreai.dev/en/faq' },
      { '@type': 'ListItem', position: 3, name: topic.title },
    ],
  }
  const zhSlug = slug.replace(/-en$/, '-zh')

  // Group questions by intent
  const groups = new Map<FAQIntent, typeof topic.questions>()
  for (const q of topic.questions) {
    if (!groups.has(q.intent)) groups.set(q.intent, [])
    groups.get(q.intent)!.push(q)
  }
  const intentOrder: FAQIntent[] = ['comparison', 'pricing', 'tutorial', 'informational']

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
            { label: 'FAQ', href: '/en/faq', active: true },
            { label: 'Glossary', href: '/en/glossary' },
            { label: 'Compare', href: '/en/compare' },
          ]}
          langSwitchHref={`/zh/faq/${zhSlug}`}
        />

        {/* Breadcrumb */}
        <nav style={{ fontSize: '14px', marginBottom: '24px', color: '#6b7280' }}>
          <Link href="/en/faq" style={{ color: '#6b7280', textDecoration: 'none' }}>FAQ</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#111827' }}>{topic.title}</span>
        </nav>

        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{topic.title}</h1>
        {topic.description && (
          <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '32px' }}>{topic.description}</p>
        )}

        {intentOrder.map(intent => {
          const qs = groups.get(intent)
          if (!qs || qs.length === 0) return null
          const cfg = intentConfig[intent]
          return (
            <section key={intent} style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
                {cfg.icon} {cfg.label}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {qs.map(q => (
                  <Link
                    key={q.slug}
                    href={`/en/faq/${slug}/${q.slug}`}
                    style={{ display: 'block', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', textDecoration: 'none', transition: 'border-color 0.2s' }}
                  >
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>{q.question}</h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{q.summary}</p>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
