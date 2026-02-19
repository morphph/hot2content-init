import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBlogPost } from '@/lib/blog'
import Header from '@/components/Header'
import TableOfContents from '@/components/TableOfContents'
import MermaidContent from '@/components/MermaidContent'

function extractHeadings(html: string): { id: string; text: string }[] {
  const regex = /<h2[^>]*id="([^"]*)"[^>]*>(.*?)<\/h2>/gi
  const headings: { id: string; text: string }[] = []
  let match
  while ((match = regex.exec(html)) !== null) {
    headings.push({ id: match[1], text: match[2].replace(/<[^>]*>/g, '') })
  }
  return headings
}

function hasMermaidContent(html: string): boolean {
  return html.includes('class="language-mermaid"') ||
    html.includes('class="mermaid"') ||
    /```mermaid/i.test(html)
}

interface BlogDetailPageProps {
  lang: 'en' | 'zh'
  slug: string
}

export default async function BlogDetailPage({ lang, slug }: BlogDetailPageProps) {
  const isEn = lang === 'en'
  const post = await getBlogPost(lang, slug)

  if (!post) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: { '@type': 'Organization', name: 'LoreAI', url: 'https://loreai.dev' },
    publisher: { '@type': 'Organization', name: 'LoreAI', url: 'https://loreai.dev' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://loreai.dev/${lang}/blog/${slug}` },
    keywords: post.keywords?.join(', '),
    inLanguage: lang,
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isEn ? 'Home' : '首页', item: 'https://loreai.dev' },
      { '@type': 'ListItem', position: 2, name: isEn ? 'Blog' : '博客', item: `https://loreai.dev/${lang}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `https://loreai.dev/${lang}/blog/${slug}` },
    ],
  }

  const headings = extractHeadings(post.contentHtml)
  const showMermaid = hasMermaidContent(post.contentHtml)

  const altLangHref = isEn
    ? (post.hreflang_zh || '/zh/blog')
    : (post.hreflang_en || '/en/blog')

  const navItems = [
    { label: 'Newsletter', href: isEn ? '/newsletter' : '/zh/newsletter' },
    { label: isEn ? 'Blog' : '博客', href: `/${lang}/blog`, active: true },
  ]

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Header */}
      <div className="blog-header-container">
        <Header
          lang={lang}
          navItems={navItems}
          langSwitchHref={altLangHref}
        />
      </div>

      {/* Three-column layout */}
      <div className="blog-layout">
        {/* Left: TOC (desktop only) */}
        <TableOfContents headings={headings} />

        {/* Center: Article content */}
        <div className="blog-content">
          {/* Back link */}
          <div className="mb-8 fade-in">
            <Link href={`/${lang}/blog`} className="text-blue-600 text-sm hover:underline">
              {isEn ? '← Back to Blog' : '← 返回博客'}
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

            {/* Article Content */}
            <div className="article-content">
              <MermaidContent html={post.contentHtml} hasMermaid={showMermaid} />
            </div>
          </article>

          {/* Article Footer */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <div className="callout-box mb-8">
              <p className="text-sm">
                {isEn ? (
                  <>
                    <span className="callout-label">Found this useful? </span>
                    <span className="text-gray-600">Share it with your network or check out our newsletter for more AI insights.</span>
                  </>
                ) : (
                  <>
                    <span className="callout-label">觉得有用？</span>
                    <span className="text-gray-600">分享给你的朋友，或订阅 Newsletter 获取更多 AI 洞察。</span>
                  </>
                )}
              </p>
            </div>

            <div className="flex justify-between items-center">
              <Link href={`/${lang}/blog`} className="text-blue-600 text-sm hover:underline">
                {isEn ? '← More Posts' : '← 更多文章'}
              </Link>
              <Link href={isEn ? '/newsletter' : '/zh/newsletter'} className="text-blue-600 text-sm hover:underline">
                Newsletter →
              </Link>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-gray-100 text-center">
            <p className="text-muted text-sm mb-2">
              {isEn ? 'Curated by AI, built for humans' : 'AI 策展，为人而建'}
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <Link href={isEn ? '/' : '/zh'} className="link-blue">
                {isEn ? 'Home' : '首页'}
              </Link>
              <Link href={isEn ? '/newsletter' : '/zh/newsletter'} className="link-blue">
                Newsletter
              </Link>
              <Link href={`/${lang}/blog`} className="link-blue">
                {isEn ? 'Blog' : '博客'}
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </main>
  )
}
