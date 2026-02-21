import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getNavItems } from '@/lib/nav'
import { getTopicClusters, getTopicClusterContent } from '@/lib/topic-cluster'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ topic: string }>
}

export async function generateStaticParams() {
  const clusters = getTopicClusters()
  return clusters.map(c => ({ topic: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params
  const content = await getTopicClusterContent(topic, 'en')
  if (!content) return { title: 'Not Found' }

  return {
    title: `${content.cluster.name_en} — Topic Hub | LoreAI`,
    description: content.cluster.description_en,
    alternates: {
      canonical: `https://loreai.dev/en/topics/${topic}/`,
      languages: {
        'en': `/en/topics/${topic}/`,
        'zh': `/zh/topics/${topic}/`,
        'x-default': `/en/topics/${topic}/`,
      },
    },
  }
}

export default async function TopicHubPageEn({ params }: Props) {
  const { topic } = await params
  const data = await getTopicClusterContent(topic, 'en')
  if (!data) notFound()

  const { cluster, blogs, glossary, faq, compare } = data

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${cluster.name_en} — Topic Hub`,
    description: cluster.description_en,
    url: `https://loreai.dev/en/topics/${topic}/`,
    inLanguage: 'en',
    hasPart: [
      ...blogs.map(b => ({
        '@type': 'Article',
        name: b.title,
        url: `https://loreai.dev/en/blog/${b.slug}/`,
      })),
      ...glossary.map(g => ({
        '@type': 'DefinedTerm',
        name: g.term,
        url: `https://loreai.dev/en/glossary/${g.slug}/`,
      })),
      ...faq.map(f => ({
        '@type': 'FAQPage',
        name: f.title,
        url: `https://loreai.dev/en/faq/${f.slug}/`,
      })),
      ...compare.map(c => ({
        '@type': 'Article',
        name: c.title,
        url: `https://loreai.dev/en/compare/${c.slug}/`,
      })),
    ],
  }

  const sections = [
    { title: 'Deep Dives & Analysis', items: blogs, type: 'blog' as const },
    { title: 'Glossary', items: glossary, type: 'glossary' as const },
    { title: 'FAQ', items: faq, type: 'faq' as const },
    { title: 'Comparisons', items: compare, type: 'compare' as const },
  ]

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <Header
          lang="en"
          navItems={getNavItems('en', '/en/topics')}
          langSwitchHref={`/zh/topics/${topic}`}
        />

        {/* Back link */}
        <div style={{ marginBottom: '24px' }}>
          <Link href="/en/topics" style={{ color: '#2563eb', fontSize: '14px', textDecoration: 'none' }}>
            &larr; All Topics
          </Link>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
            {cluster.name_en}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px', lineHeight: '1.6' }}>
            {cluster.description_en}
          </p>
          <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '8px' }}>
            {data.totalCount} {data.totalCount === 1 ? 'article' : 'articles'} in this hub
          </p>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '40px' }}>
          <div style={{ height: '8px', width: '120px', background: 'linear-gradient(90deg, #EC4899, #8B5CF6, #3B82F6)', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#60A5FA', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#93C5FD', borderRadius: '2px', opacity: 0.7 }} />
        </div>

        {/* Content sections */}
        {sections.map(section => {
          if (section.items.length === 0) return null
          return (
            <div key={section.type} style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
                {section.title}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {section.items.map((item: any) => {
                  const href = section.type === 'blog'
                    ? `/en/blog/${item.slug}/`
                    : section.type === 'glossary'
                    ? `/en/glossary/${item.slug}/`
                    : section.type === 'faq'
                    ? `/en/faq/${item.slug}/`
                    : `/en/compare/${item.slug}/`
                  const title = section.type === 'glossary' ? item.term : item.title
                  const subtitle = section.type === 'blog'
                    ? item.description
                    : section.type === 'glossary'
                    ? item.definition
                    : section.type === 'faq'
                    ? item.description
                    : item.description
                  const badge = section.type === 'blog'
                    ? `Tier ${item.tier}`
                    : section.type === 'glossary'
                    ? item.category
                    : section.type === 'compare'
                    ? `${item.model_a} vs ${item.model_b}`
                    : null

                  return (
                    <Link
                      key={item.slug}
                      href={href}
                      style={{ textDecoration: 'none', padding: '14px 18px', border: '1px solid #e5e7eb', borderRadius: '10px', display: 'block' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '600', color: '#111827', fontSize: '15px' }}>{title}</span>
                        {badge && (
                          <span style={{ fontSize: '11px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '9999px' }}>
                            {badge}
                          </span>
                        )}
                      </div>
                      {subtitle && (
                        <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px', lineHeight: '1.5' }}>{subtitle}</p>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Cross-links */}
        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #f3f4f6', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', fontSize: '14px' }}>
          <Link href="/en/topics" style={{ padding: '6px 16px', borderRadius: '9999px', backgroundColor: '#f3f4f6', color: '#6b7280', textDecoration: 'none' }}>
            All Topics
          </Link>
          <Link href="/en/blog" style={{ padding: '6px 16px', borderRadius: '9999px', backgroundColor: '#f3f4f6', color: '#6b7280', textDecoration: 'none' }}>
            Blog
          </Link>
          <Link href="/en/glossary" style={{ padding: '6px 16px', borderRadius: '9999px', backgroundColor: '#f3f4f6', color: '#6b7280', textDecoration: 'none' }}>
            Glossary
          </Link>
        </div>

        <Footer lang="en" />
      </div>
    </main>
  )
}
