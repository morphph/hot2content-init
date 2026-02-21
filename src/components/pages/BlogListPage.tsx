import Link from 'next/link'
import { getBlogPosts } from '@/lib/blog'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getNavItems } from '@/lib/nav'

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
  const posts = await getBlogPosts(lang)
  const tierConfig = isEn ? tierConfigEn : tierConfigZh

  const tier1Posts = posts.filter(p => p.tier === 1)
  const tier2Posts = posts.filter(p => p.tier === 2)
  const tier3Posts = posts.filter(p => p.tier === 3)

  const navItems = getNavItems(lang, `/${lang}/blog`)

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
    <main className="min-h-screen bg-white">
      <div className="max-w-[800px] mx-auto px-6 py-8">
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
        <div className="mb-10">
          <h1 className="text-[28px] font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent mb-2">
            {isEn ? 'Blog' : '博客'}
          </h1>
          <p className="text-gray-500 text-base">
            {isEn ? 'Deep dives, tutorials, and insights' : '深度解读、教程和洞察'}
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-1 mb-10">
          <div className="h-2 w-[120px] bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-sm" />
          <div className="w-2 h-2 bg-blue-400 rounded-sm" />
          <div className="w-2 h-2 bg-blue-300 rounded-sm opacity-70" />
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-base mb-2">
              {isEn ? 'No posts yet' : '暂无文章'}
            </p>
            <p className="text-gray-400 text-sm">
              {isEn ? 'Check back soon!' : '敬请期待！'}
            </p>
          </div>
        ) : (
          <>
            {/* Featured / Tier 1 */}
            {tier1Posts.length > 0 && (
              <div className="flex flex-col gap-4 mb-12">
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
                    <Link
                      key={post.slug}
                      href={`/${lang}/blog/${post.slug}`}
                      className="block no-underline p-6 rounded-xl border-2 border-purple-200 bg-purple-50 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded"
                          style={{ color: tier.color, backgroundColor: tier.bg }}
                        >
                          {tier.label}
                        </span>
                        <span className="text-xs text-gray-400">{dateLabel}</span>
                        <span className="text-xs text-gray-300">&middot;</span>
                        <span className="text-xs text-gray-400">{readTimeLabel}</span>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1 leading-snug">{post.title}</h2>
                      {post.description && (
                        <p className="text-[13px] text-gray-500 leading-relaxed mt-1">
                          {post.description.length > descLimit ? post.description.slice(0, descLimit) + '...' : post.description}
                        </p>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Analysis / Tier 2 */}
            {tier2Posts.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-semibold text-blue-600">{isEn ? '📝 Analysis' : '📝 分析'}</h2>
                  <span className="text-xs text-gray-400">({tier2Posts.length})</span>
                </div>
                <div className="flex flex-col gap-2.5">
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
                      <Link
                        key={post.slug}
                        href={`/${lang}/blog/${post.slug}`}
                        className="block no-underline px-5 py-4 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded"
                            style={{ color: tier.color, backgroundColor: tier.bg }}
                          >
                            {tier.label}
                          </span>
                          <span className="text-xs text-gray-400">{dateLabel}</span>
                          <span className="text-xs text-gray-300">&middot;</span>
                          <span className="text-xs text-gray-400">{readTimeLabel}</span>
                        </div>
                        <h2 className="text-[15px] font-medium text-gray-900 mb-1 leading-snug">{post.title}</h2>
                        {post.description && (
                          <p className="text-[13px] text-gray-500 leading-relaxed mt-1">
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
            {tier3Posts.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-semibold text-emerald-600">{isEn ? '⚡ Quick Read' : '⚡ 快读'}</h2>
                  <span className="text-xs text-gray-400">({tier3Posts.length})</span>
                </div>
                <div className="flex flex-col gap-2.5">
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
                      <Link
                        key={post.slug}
                        href={`/${lang}/blog/${post.slug}`}
                        className="block no-underline px-5 py-4 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded"
                            style={{ color: tier.color, backgroundColor: tier.bg }}
                          >
                            {tier.label}
                          </span>
                          <span className="text-xs text-gray-400">{dateLabel}</span>
                          <span className="text-xs text-gray-300">&middot;</span>
                          <span className="text-xs text-gray-400">{readTimeLabel}</span>
                        </div>
                        <h2 className="text-[15px] font-medium text-gray-900 mb-1 leading-snug">{post.title}</h2>
                        {post.description && (
                          <p className="text-[13px] text-gray-500 leading-relaxed mt-1">
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

        <Footer lang={lang} />
      </div>
    </main>
  )
}
