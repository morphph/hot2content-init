import Link from 'next/link'
import { getAllFAQTopics } from '@/lib/faq'

export const metadata = {
  title: 'FAQ | LoreAI',
  description: 'Frequently asked questions about AI models, tools, and comparisons.',
}

export default function FAQIndexPage() {
  const topics = getAllFAQTopics()

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Frequently Asked Questions</h1>
      {topics.length === 0 ? (
        <p className="text-gray-500">No FAQ topics yet. Check back soon!</p>
      ) : (
        <div className="space-y-4">
          {topics.map(t => (
            <Link
              key={t.slug}
              href={`/faq/${t.slug}`}
              className="block p-4 border rounded-lg hover:bg-gray-50 transition"
            >
              <h2 className="text-xl font-semibold">{t.title}</h2>
              {t.description && <p className="text-gray-600 mt-1">{t.description}</p>}
              {t.date && <p className="text-sm text-gray-400 mt-1">{t.date}</p>}
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
