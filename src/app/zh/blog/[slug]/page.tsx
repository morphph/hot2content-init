import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBlogPost, getBlogPosts } from '@/lib/blog'
import MermaidRenderer from '@/components/MermaidRenderer'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = await getBlogPosts('zh')
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost('zh', slug)
  
  if (!post) return { title: 'Not Found' }
  
  return {
    title: `${post.title} | Lore`,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      languages: {
        'en': `/en/blog/${slug}`,
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
  const post = await getBlogPost('zh', slug)
  
  if (!post) notFound()
  
  return (
    <main className="min-h-screen px-8 py-12 max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-12 fade-in">
        <Link href="/zh" className="text-2xl tracking-tight hover:opacity-60 transition-opacity">
          Lore
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href={`/en/blog/${slug}`} className="text-muted hover:text-foreground transition-colors">EN</Link>
          <span className="text-muted">/</span>
          <Link href="/zh" className="text-foreground">中文</Link>
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
        <Link href="/zh" className="text-muted text-sm hover:text-foreground transition-colors">
          ← 返回文章列表
        </Link>
      </footer>
    </main>
  )
}
