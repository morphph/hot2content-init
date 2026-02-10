import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAllQuestionParams, getQuestion, getRelatedQuestions, generateQuestionJsonLd } from '@/lib/faq'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ topic: string; question: string }>
}

export async function generateStaticParams() {
  return getAllQuestionParams('en')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic: topicSlug, question: questionSlug } = await params
  const result = await getQuestion(topicSlug, questionSlug)
  if (!result) return {}
  return {
    title: `${result.question.question} — FAQ | LoreAI`,
    description: result.question.summary,
  }
}

export default async function FAQQuestionPageEn({ params }: Props) {
  const { topic: topicSlug, question: questionSlug } = await params
  const result = await getQuestion(topicSlug, questionSlug)
  if (!result) notFound()

  const { topic, question } = result
  const related = getRelatedQuestions(topic, questionSlug)
  const zhTopicSlug = topicSlug.replace(/-en$/, '-zh')
  const jsonLdArray = generateQuestionJsonLd(question, topic.title, `https://loreai.dev/en/faq/${topicSlug}/${questionSlug}`)

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
            <Link href={`/zh/faq/${zhTopicSlug}/${questionSlug}`} style={{ color: '#6b7280', textDecoration: 'none' }}>中文</Link>
          </div>
        </header>

        {/* Breadcrumb */}
        <nav style={{ fontSize: '14px', marginBottom: '24px', color: '#6b7280' }}>
          <Link href="/en/faq" style={{ color: '#6b7280', textDecoration: 'none' }}>FAQ</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <Link href={`/en/faq/${topicSlug}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{topic.title}</Link>
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

        {/* Related Questions */}
        {related.length > 0 && (
          <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
            <h2 className="related-section-title">Related Questions</h2>
            {related.slice(0, 5).map(q => (
              <Link key={q.slug} href={`/en/faq/${topicSlug}/${q.slug}`} className="related-card">
                <div className="related-card-title">{q.question}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
