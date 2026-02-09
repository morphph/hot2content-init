import { notFound } from 'next/navigation'
import { getAllFAQTopics, getFAQTopic, generateFAQJsonLd } from '@/lib/faq'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ topic: string }>
}

export async function generateStaticParams() {
  return getAllFAQTopics().map(t => ({ topic: t.slug }))
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

export default async function FAQTopicPage({ params }: Props) {
  const { topic: slug } = await params
  const topic = await getFAQTopic(slug)
  if (!topic) notFound()

  const jsonLd = generateFAQJsonLd(topic)

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="text-3xl font-bold mb-8">{topic.title}</h1>
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: topic.contentHtml }}
      />
    </main>
  )
}
