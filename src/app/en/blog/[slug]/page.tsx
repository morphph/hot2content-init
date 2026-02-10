import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBlogPost, getBlogPosts } from '@/lib/blog'
import MermaidRenderer from '@/components/MermaidRenderer'
import TableOfContents from '@/components/TableOfContents'
import type { Metadata } from 'next'

function extractHeadings(html: string): { id: string; text: string }[] {
  const regex = /<h2[^>]*id="([^"]*)"[^>]*>(.*?)<\/h2>/gi
  const headings: { id: string; text: string }[] = []
  let match
  while ((match = regex.exec(html)) !== null) {
    headings.push({ id: match[1], text: match[2].replace(/<[^>]*>/g, '') })
  }
  return headings
}

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
    title: `${post.title} | LoreAI`,
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Organization', name: 'LoreAI', url: 'https://loreai.dev' },
    publisher: { '@type': 'Organization', name: 'LoreAI', url: 'https://loreai.dev' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://loreai.dev/en/blog/${slug}` },
    keywords: post.keywords?.join(', '),
    inLanguage: 'en',
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://loreai.dev' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://loreai.dev/en/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: `https://loreai.dev/en/blog/${slug}` },
    ],
  }
  
  const headings = extractHeadings(post.contentHtml)

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link href="/newsletter" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#2563eb', letterSpacing: '-0.02em' }}>
                LoreAI
              </span>
            </Link>
            <nav style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
              <Link href="/newsletter" style={{ color: '#6b7280', textDecoration: 'none' }}>Newsletter</Link>
              <span style={{ color: '#111827', fontWeight: '600', borderBottom: '2px solid #3b82f6', paddingBottom: '4px' }}>Blog</span>
            </nav>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: '#111827', fontWeight: '500' }}>EN</span>
            <span style={{ color: '#d1d5db' }}>|</span>
            <Link href={`/zh/blog/${slug}`} style={{ color: '#6b7280', textDecoration: 'none' }}>中文</Link>
          </div>
        </header>
      </div>

      {/* Three-column layout */}
      <div className="max-w-6xl mx-auto px-6 pb-8 lg:flex lg:gap-8">
        {/* Left: TOC (desktop only) */}
        <TableOfContents headings={headings} />

        {/* Center: Article content */}
        <div className="max-w-3xl mx-auto flex-1 min-w-0">
          {/* Back link */}
          <div className="mb-8 fade-in">
            <Link href="/en/blog" className="text-blue-600 text-sm hover:underline">
              ← Back to Blog
            </Link>
          </div>

          {/* Article */}
          <article className="fade-in-delay-1">
            {/* Article Header */}
            <header className="mb-8 pb-8 border-b border-gray-100">
              <time className="badge block mb-4">{post.date}</time>
              <h1 className="text-3xl font-bold headline-blue mb-4">
                {post.title}
              </h1>
              {post.description && (
                <p className="text-gray-600 text-lg">
                  {post.description}
                </p>
              )}
            </header>
            
            {/* Article Content */}
            <div className="article-content">
              <MermaidRenderer content={post.contentHtml} />
            </div>
          </article>

          {/* Article Footer */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <div className="callout-box mb-8">
              <p className="text-sm">
                <span className="callout-label">Found this useful? </span>
                <span className="text-gray-600">Share it with your network or check out our newsletter for more AI insights.</span>
              </p>
            </div>
            
            <div className="flex justify-between items-center">
              <Link href="/en/blog" className="text-blue-600 text-sm hover:underline">
                ← More Posts
              </Link>
              <Link href="/newsletter" className="text-blue-600 text-sm hover:underline">
                Newsletter →
              </Link>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-gray-100 text-center">
            <p className="text-muted text-sm mb-2">
              Curated by AI, built for humans
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <Link href="/" className="link-blue">Home</Link>
              <Link href="/newsletter" className="link-blue">Newsletter</Link>
              <Link href="/en/blog" className="link-blue">Blog</Link>
            </div>
          </footer>
        </div>
      </div>
    </main>
  )
}
