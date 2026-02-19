import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAllQuestionParams, getQuestion, getRelatedQuestions, generateQuestionJsonLd } from '@/lib/faq'
import Header from '@/components/Header'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ topic: string; question: string }>
}

export async function generateStaticParams() {
  return getAllQuestionParams('zh')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic: topicSlug, question: questionSlug } = await params
  const result = await getQuestion(topicSlug, questionSlug)
  if (!result) return {}
  const enTopicSlugMeta = topicSlug.replace(/-zh$/, '-en')
  return {
    title: `${result.question.question} — 常见问题 | LoreAI`,
    description: result.question.summary,
    alternates: {
      canonical: `https://loreai.dev/zh/faq/${topicSlug}/${questionSlug}/`,
      languages: {
        'en': `/en/faq/${enTopicSlugMeta}/${questionSlug}/`,
        'zh': `/zh/faq/${topicSlug}/${questionSlug}/`,
        'x-default': `/en/faq/${enTopicSlugMeta}/${questionSlug}/`,
      },
    },
  }
}

export default async function FAQQuestionPageZh({ params }: Props) {
  const { topic: topicSlug, question: questionSlug } = await params
  const result = await getQuestion(topicSlug, questionSlug)
  if (!result) notFound()

  const { topic, question } = result
  const related = getRelatedQuestions(topic, questionSlug)
  const enTopicSlug = topicSlug.replace(/-zh$/, '-en')
  const jsonLdArray = generateQuestionJsonLd(question, topic.title, `https://loreai.dev/zh/faq/${topicSlug}/${questionSlug}`)

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        {jsonLdArray.map((ld, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
          />
        ))}

        <Header
          lang="zh"
          navItems={[
            { label: 'Newsletter', href: '/zh/newsletter' },
            { label: '博客', href: '/zh/blog' },
            { label: '常见问题', href: '/zh/faq', active: true },
            { label: '术语表', href: '/zh/glossary' },
            { label: '对比', href: '/zh/compare' },
          ]}
          langSwitchHref={`/en/faq/${enTopicSlug}/${questionSlug}`}
        />

        {/* Breadcrumb */}
        <nav style={{ fontSize: '14px', marginBottom: '24px', color: '#6b7280' }}>
          <Link href="/zh/faq" style={{ color: '#6b7280', textDecoration: 'none' }}>常见问题</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <Link href={`/zh/faq/${topicSlug}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{topic.title}</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#111827' }}>{question.question}</span>
        </nav>

        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px', background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {question.question}
        </h1>

        <article
          className="content-area"
          dangerouslySetInnerHTML={{ __html: question.answerHtml }}
        />

        {related.length > 0 && (
          <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
            <h2 className="related-section-title">相关问题</h2>
            {related.slice(0, 5).map(q => (
              <Link key={q.slug} href={`/zh/faq/${topicSlug}/${q.slug}`} className="related-card">
                <div className="related-card-title">{q.question}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
