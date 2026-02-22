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
  tier?: string
}

export default async function BlogListPage({ lang, tier }: BlogListPageProps) {
  const isEn = lang === 'en'
  const posts = await getBlogPosts(lang)
  const tierConfig = isEn ? tierConfigEn : tierConfigZh
  
  const currentTier = tier && ['1', '2', '3'].includes(tier) ? Number(tier) : 0  // 0 = all

  const tier1Posts = posts.filter(p => p.tier === 1)
  const tier2Posts = posts.filter(p => p.tier === 2)
  const tier3Posts = posts.filter(p => p.tier === 3)

  const navItems = [
    { label: isEn ? 'Newsletter' : '每日简报', href: isEn ? '/newsletter' : '/zh/newsletter' },
    { label: isEn ? 'Blog' : '博客', href: `/${lang}/blog`, active: true },
  ]

  const allPosts = [...tier1Posts, ...tier2Posts, ...tier3Posts]
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: isEn ? 'LoreAI Blog' : 'LoreAI 博客',
    itemListElement: allPosts.slice(0, 50).map((post, idx) => ({
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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {[
            { key: '0', label: isEn ? 'All' : '全部' },
            { key: '1', label: isEn ? '🔬 Deep Dive' : '🔬 深度解读' },
            { key: '2', label: isEn ? '📝 Analysis' : '📝 分析' },
            { key: '3', label: isEn ? '⚡ Quick Read' : '⚡ 快读' },
          ].map((tab) => (
            <Link
              key={tab.key}
              href={`/${lang}/blog${tab.key === '0' ? '' : `?tier=${tab.key}`}`}
              style={{
                padding: '6px 16px',
                borderRadius: '999px',
                fontSize: '14px',
                fontWeight: '500',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                ...(currentTier === Number(tab.key)
                  ? { background: 'linear-gradient(to right, #8b5cf6, #6366f1)', color: '#ffffff' }
                  : { background: '#f3f4f6', color: '#6b7280' }),
              }}
            >
              {tab.label}
            </Link>
          ))}
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
          <>
            {/* Featured / Tier 1 */}
            {tier1Posts.length > 0 && (currentTier === 0 || currentTier === 1) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '48px' }}>
                {tier1Posts.map((post) => {
                  const tier = tierConfig[1]
                  let dateLabel: string
                  if (isEn) {
                    const { month, day } = formatDateEn(post.date)
                    dateLabel = `${month} ${day}`
                  } else {
                    const { month, day } = formatDateZh(post.date)
                    dateLabel = `${month}${day}日`
                  }
                  const readTimeLabel = isEn ? `${post.readingTime} min read` : `${post.readingTime} 分钟阅读`
                  const descLimit = isEn ? 200 : 150

                  return (
                    <Link key={post.slug} href={`/${lang}/blog/${post.slug}`} style={{ display: 'block', textDecoration: 'none', padding: '24px', borderRadius: '12px', border: '2px solid #e9d5ff', backgroundColor: '#faf5ff', transition: 'box-shadow 0.2s' }} className="blog-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: tier.color, backgroundColor: tier.bg, padding: '2px 8px', borderRadius: '4px' }}>{tier.label}</span>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>{dateLabel}</span>
                        <span style={{ fontSize: '12px', color: '#d1d5db' }}>·</span>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>{readTimeLabel}</span>
                      </div>
                      <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '4px', lineHeight: '1.4' }}>{post.title}</h2>
                      {post.description && (
                        <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5', marginTop: '4px' }}>
                          {post.description.length > descLimit ? post.description.slice(0, descLimit) + '...' : post.description}
                        </p>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Analysis / Tier 2 */}
            {tier2Posts.length > 0 && (currentTier === 0 || currentTier === 2) && (
              <div style={{ marginBottom: '48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#2563eb' }}>{isEn ? '📝 Analysis' : '📝 分析'}</h2>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>({tier2Posts.length})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tier2Posts.map((post) => {
                    const tier = tierConfig[2]
                    let dateLabel: string
                    if (isEn) {
                      const { month, day } = formatDateEn(post.date)
                      dateLabel = `${month} ${day}`
                    } else {
                      const { month, day } = formatDateZh(post.date)
                      dateLabel = `${month}${day}日`
                    }
                    const readTimeLabel = isEn ? `${post.readingTime} min read` : `${post.readingTime} 分钟阅读`
                    const descLimit = isEn ? 100 : 80

                    return (
                      <Link key={post.slug} href={`/${lang}/blog/${post.slug}`} style={{ display: 'block', textDecoration: 'none', padding: '16px 20px', borderRadius: '12px', border: '1px solid #f3f4f6', backgroundColor: '#ffffff', transition: 'box-shadow 0.2s' }} className="blog-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: tier.color, backgroundColor: tier.bg, padding: '2px 8px', borderRadius: '4px' }}>{tier.label}</span>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{dateLabel}</span>
                          <span style={{ fontSize: '12px', color: '#d1d5db' }}>·</span>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{readTimeLabel}</span>
                        </div>
                        <h2 style={{ fontSize: '15px', fontWeight: '500', color: '#111827', marginBottom: '4px', lineHeight: '1.4' }}>{post.title}</h2>
                        {post.description && (
                          <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5', marginTop: '4px' }}>
                            {post.description.length > descLimit ? post.description.slice(0, descLimit) + '...' : post.description}
                          </p>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quick Read / Tier 3 */}
            {tier3Posts.length > 0 && (currentTier === 0 || currentTier === 3) && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#059669' }}>{isEn ? '⚡ Quick Read' : '⚡ 快读'}</h2>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>({tier3Posts.length})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tier3Posts.map((post) => {
                    const tier = tierConfig[3]
                    let dateLabel: string
                    if (isEn) {
                      const { month, day } = formatDateEn(post.date)
                      dateLabel = `${month} ${day}`
                    } else {
                      const { month, day } = formatDateZh(post.date)
                      dateLabel = `${month}${day}日`
                    }
                    const readTimeLabel = isEn ? `${post.readingTime} min read` : `${post.readingTime} 分钟阅读`
                    const descLimit = isEn ? 100 : 80

                    return (
                      <Link key={post.slug} href={`/${lang}/blog/${post.slug}`} style={{ display: 'block', textDecoration: 'none', padding: '16px 20px', borderRadius: '12px', border: '1px solid #f3f4f6', backgroundColor: '#ffffff', transition: 'box-shadow 0.2s' }} className="blog-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: tier.color, backgroundColor: tier.bg, padding: '2px 8px', borderRadius: '4px' }}>{tier.label}</span>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{dateLabel}</span>
                          <span style={{ fontSize: '12px', color: '#d1d5db' }}>·</span>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{readTimeLabel}</span>
                        </div>
                        <h2 style={{ fontSize: '15px', fontWeight: '500', color: '#111827', marginBottom: '4px', lineHeight: '1.4' }}>{post.title}</h2>
                        {post.description && (
                          <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5', marginTop: '4px' }}>
                            {post.description.length > descLimit ? post.description.slice(0, descLimit) + '...' : post.description}
                          </p>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </>
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
