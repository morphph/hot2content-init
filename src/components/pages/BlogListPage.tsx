import Link from 'next/link'
import { getBlogPosts } from '@/lib/blog'
import Header from '@/components/Header'

const tierConfigEn = {
  1: { label: '🔬 Deep Dive', color: '#7c3aed', bg: '#f5f3ff' },
  2: { label: '📝 Analysis', color: '#2563eb', bg: '#eff6ff' },
  3: { label: '⚡ Quick Read', color: '#059669', bg: '#ecfdf5' },
}

const tierConfigZh = {
  1: { label: '🔬 深度解读', color: '#7c3aed', bg: '#f5f3ff' },
  2: { label: '📝 分析', color: '#2563eb', bg: '#eff6ff' },
  3: { label: '⚡ 快读', color: '#059669', bg: '#ecfdf5' },
}

function formatDateEn(dateStr: string): { day: string; month: string; weekday: string } {
  const date = new Date(dateStr + 'T00:00:00')
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
  }
}

function formatDateZh(dateStr: string): { day: string; month: string } {
  const date = new Date(dateStr + 'T00:00:00')
  return {
    day: date.getDate().toString(),
    month: (date.getMonth() + 1) + '月',
  }
}

interface BlogListPageProps {
  lang: 'en' | 'zh'
}

export default async function BlogListPage({ lang }: BlogListPageProps) {
  const isEn = lang === 'en'
  const posts = await getBlogPosts(lang, { tier: 1 })
  const tierConfig = isEn ? tierConfigEn : tierConfigZh

  const navItems = [
    { label: isEn ? 'Newsletter' : 'Newsletter', href: isEn ? '/newsletter' : '/zh/newsletter' },
    { label: isEn ? 'Blog' : '博客', href: `/${lang}/blog`, active: true },
  ]

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: isEn ? 'LoreAI Blog' : 'LoreAI 博客',
    itemListElement: posts.slice(0, 20).map((post, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `https://loreai.dev/${lang}/blog/${post.slug}`,
      name: post.title,
    })),
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
        />
        <Header
          lang={lang}
          navItems={navItems}
          langSwitchHref={isEn ? '/zh/blog' : '/en/blog'}
        />

        {/* Hero */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
            {isEn ? 'Blog' : '博客'}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            {isEn ? 'Deep dives, tutorials, and insights' : '深度解读、教程和洞察'}
          </p>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '40px' }}>
          <div style={{ height: '8px', width: '120px', background: 'linear-gradient(90deg, #EC4899, #8B5CF6, #3B82F6)', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#60A5FA', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#93C5FD', borderRadius: '2px', opacity: 0.7 }} />
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '8px' }}>
              {isEn ? 'No posts yet' : '暂无文章'}
            </p>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
              {isEn ? 'Check back soon!' : '敬请期待！'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {posts.map((post) => {
              const tier = tierConfig[post.tier] || tierConfig[2]
              const isTier1 = post.tier === 1

              let dateLabel: string
              if (isEn) {
                const { month, day } = formatDateEn(post.date)
                dateLabel = `${month} ${day}`
              } else {
                const { month, day } = formatDateZh(post.date)
                dateLabel = `${month}${day}日`
              }

              const readTimeLabel = isEn
                ? `${post.readingTime} min read`
                : `${post.readingTime} 分钟阅读`

              const descLimit = isEn
                ? (isTier1 ? 200 : 100)
                : (isTier1 ? 150 : 80)

              return (
                <Link
                  key={post.slug}
                  href={`/${lang}/blog/${post.slug}`}
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    padding: isTier1 ? '24px' : '16px 20px',
                    borderRadius: '12px',
                    border: isTier1 ? '2px solid #e9d5ff' : '1px solid #f3f4f6',
                    backgroundColor: isTier1 ? '#faf5ff' : '#ffffff',
                    transition: 'box-shadow 0.2s',
                  }}
                  className="blog-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: isTier1 ? '12px' : '6px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: tier.color,
                      backgroundColor: tier.bg,
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}>
                      {tier.label}
                    </span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{dateLabel}</span>
                    <span style={{ fontSize: '12px', color: '#d1d5db' }}>·</span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{readTimeLabel}</span>
                  </div>

                  <h2 style={{
                    fontSize: isTier1 ? '18px' : '15px',
                    fontWeight: isTier1 ? '600' : '500',
                    color: '#111827',
                    marginBottom: '4px',
                    lineHeight: '1.4'
                  }}>
                    {post.title}
                  </h2>

                  {post.description && (
                    <p style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      lineHeight: '1.5',
                      marginTop: '4px'
                    }}>
                      {post.description.length > descLimit
                        ? post.description.slice(0, descLimit) + '...'
                        : post.description}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <footer style={{ textAlign: 'center', marginTop: '64px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
          <p style={{ color: '#9ca3af', fontSize: '13px' }}>
            {isEn ? 'Curated by AI · Built for humans' : 'AI 驱动 · 为人而建'}
          </p>
        </footer>
      </div>
    </main>
  )
}
