import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBlogPost, getBlogPosts } from '@/lib/blog'
import MermaidRenderer from '@/components/MermaidRenderer'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = await getBlogPosts('en')
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost('en', slug)
  
  if (!post) return { title: 'Not Found' }
  
  return {
    title: `${post.title} | Lore`,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      languages: {
        'zh': `/zh/blog/${slug}`,
      },
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
    },
  }
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params
  const post = await getBlogPost('en', slug)
  
  if (!post) notFound()
  
  return (
    <main className="min-h-screen px-8 py-12 max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-12 fade-in">
        <Link href="/" className="text-2xl tracking-tight hover:opacity-60 transition-opacity">
          Lore
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/" className="text-foreground">EN</Link>
          <span className="text-muted">/</span>
          <Link href={`/zh/blog/${slug}`} className="text-muted hover:text-foreground transition-colors">中文</Link>
        </nav>
      </header>

      {/* Article */}
      <article className="fade-in-delay-1">
        <header className="mb-8">
          <time className="badge block mb-4">{post.date}</time>
        </header>
        
        <MermaidRenderer content={post.contentHtml} />
      </article>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-subtle">
        <Link href="/" className="text-muted text-sm hover:text-foreground transition-colors">
          ← Back to all posts
        </Link>
      </footer>
    </main>
  )
}
