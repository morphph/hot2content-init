'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function DigestPage() {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/newsletter/digest')
      .then(res => res.json())
      .then(data => {
        setContent(data.content)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <Link href="/" className="text-2xl tracking-tight hover:opacity-60 transition-opacity font-medium">
          Lore
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/newsletter" className="text-muted hover:text-foreground transition-colors">← Back to Newsletter</Link>
        </nav>
      </header>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16">
          <p className="text-muted">Loading...</p>
        </div>
      ) : content ? (
        <article className="prose prose-lg max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-hr:my-8 prose-hr:border-foreground/10">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </article>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted text-lg mb-4">No digest available</p>
          <Link href="/newsletter" className="text-blue-600 hover:underline">
            ← Back to Newsletter
          </Link>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-foreground/10 text-center">
        <p className="text-muted text-sm">
          Powered by Lore AI
        </p>
      </footer>
    </main>
  )
}
