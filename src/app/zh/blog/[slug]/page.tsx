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
  const posts = await getBlogPosts('zh')
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost('zh', slug)
  
  if (!post) return { title: '未找到' }
  
  return {
    title: `${post.title} | LoreAI`,
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

export default async function BlogPostZh({ params }: Props) {
  const { slug } = await params
  const post = await getBlogPost('zh', slug)
  
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
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://loreai.dev/zh/blog/${slug}` },
    keywords: post.keywords?.join(', '),
    inLanguage: 'zh',
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '首页', item: 'https://loreai.dev' },
      { '@type': 'ListItem', position: 2, name: '博客', item: 'https://loreai.dev/zh/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: `https://loreai.dev/zh/blog/${slug}` },
    ],
  }
  
  const headings = extractHeadings(post.contentHtml)

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      
      {/* Header */}
      <div className="blog-header-container">
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link href="/newsletter" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#2563eb', letterSpacing: '-0.02em' }}>
                LoreAI
              </span>
            </Link>
            <nav style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
              <Link href="/newsletter" style={{ color: '#6b7280', textDecoration: 'none' }}>Newsletter</Link>
              <span style={{ color: '#111827', fontWeight: '600', borderBottom: '2px solid #3b82f6', paddingBottom: '4px' }}>博客</span>
            </nav>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
            <Link href={post.hreflang_en || '/en/blog'} style={{ color: '#6b7280', textDecoration: 'none' }}>EN</Link>
            <span style={{ color: '#d1d5db' }}>|</span>
            <span style={{ color: '#111827', fontWeight: '500' }}>中文</span>
          </div>
        </header>
      </div>

      {/* Three-column layout */}
      <div className="blog-layout">
        {/* Left: TOC (desktop only) */}
        <TableOfContents headings={headings} />

        {/* Center: Article content */}
        <div className="blog-content">
          {/* Back link */}
          <div className="mb-8 fade-in">
            <Link href="/zh/blog" className="text-blue-600 text-sm hover:underline">
              ← 返回博客
            </Link>
          </div>

          {/* Article */}
          <article className="fade-in-delay-1">
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
            
            <div className="article-content">
              <MermaidRenderer content={post.contentHtml} />
            </div>
          </article>

          {/* Article Footer */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <div className="callout-box mb-8">
              <p className="text-sm">
                <span className="callout-label">觉得有用？</span>
                <span className="text-gray-600">分享给你的朋友，或订阅 Newsletter 获取更多 AI 洞察。</span>
              </p>
            </div>
            
            <div className="flex justify-between items-center">
              <Link href="/zh/blog" className="text-blue-600 text-sm hover:underline">
                ← 更多文章
              </Link>
              <Link href="/newsletter" className="text-blue-600 text-sm hover:underline">
                Newsletter →
              </Link>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-gray-100 text-center">
            <p className="text-muted text-sm mb-2">
              AI 策展，为人而建
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <Link href="/zh" className="link-blue">首页</Link>
              <Link href="/newsletter" className="link-blue">Newsletter</Link>
              <Link href="/zh/blog" className="link-blue">博客</Link>
            </div>
          </footer>
        </div>
      </div>
    </main>
  )
}
