import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBlogPost } from '@/lib/blog'
import { getRelatedContent, type RelatedItem } from '@/lib/related-content'
import { getTopicClusters, type TopicCluster } from '@/lib/topic-cluster'
import { getNavItems } from '@/lib/nav'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
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
    author: { '@type': 'Organization', name: 'LoreAI', url: 'https://loreai.dev/about/' },
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
  const relatedContent = await getRelatedContent(lang, slug, post.keywords || [])

  // Find matching topic cluster
  const clusters = getTopicClusters()
  const postSearchable = [post.title.toLowerCase(), ...post.keywords.map(k => k.toLowerCase()), post.slug]
  const matchedCluster = clusters.find(c =>
    c.keywords.some(kw => postSearchable.some(t => t.includes(kw)))
  )

  const altLangHref = isEn
    ? (post.hreflang_zh || '/zh/blog')
    : (post.hreflang_en || '/en/blog')

  const navItems = getNavItems(lang, `/${lang}/blog`)

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
              <div className="mt-4 text-sm text-gray-500">
                {isEn ? 'By ' : '作者：'}
                <Link href="/about/" className="text-blue-600 hover:underline">LoreAI</Link>
                {post.readingTime > 0 && (
                  <span className="ml-3">{isEn ? `${post.readingTime} min read` : `${post.readingTime} 分钟阅读`}</span>
                )}
              </div>
              {matchedCluster && (
                <div className="mt-3">
                  <Link
                    href={`/${lang}/topics/${matchedCluster.slug}`}
                    className="inline-flex items-center text-xs px-3 py-1 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                  >
                    {isEn
                      ? `Part of ${matchedCluster.name_en} Hub`
                      : `${matchedCluster.name_zh} 话题中心`
                    } &rarr;
                  </Link>
                </div>
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

          {/* Related Resources */}
          {relatedContent.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {isEn ? 'Related Resources' : '相关资源'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedContent.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 mb-1">
                      {item.typeLabel}
                    </span>
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Cross-Content Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-3 justify-center text-sm">
            <Link href={`/${lang}/faq`} className="px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
              {isEn ? 'FAQ' : '常见问题'}
            </Link>
            <Link href={`/${lang}/glossary`} className="px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
              {isEn ? 'Glossary' : '术语表'}
            </Link>
            <Link href={`/${lang}/compare`} className="px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
              {isEn ? 'Comparisons' : '对比'}
            </Link>
          </div>

          <Footer lang={lang} />
        </div>
      </div>
    </main>
  )
}
