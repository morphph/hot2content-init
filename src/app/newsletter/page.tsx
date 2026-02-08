import Link from 'next/link'
import fs from 'fs'
import path from 'path'

// PRD 分类
type Category = 'model_release' | 'developer_platform' | 'official_blog' | 'product_ecosystem'

interface NewsItem {
  id: string
  title: string
  summary: string
  action?: string
  url: string
  twitter_url?: string
  source: string
  source_tier: number
  category: Category
  score: number
  engagement?: number
  detected_at: string
}

interface DailyDigest {
  date: string
  generated_at: string
  items: NewsItem[]
  by_category: Record<Category, NewsItem[]>
  markdown: string
}

const CATEGORY_CONFIG: Record<Category, { emoji: string; label: string; labelZh: string; color: string }> = {
  model_release: { 
    emoji: '🧠', 
    label: 'Model Release', 
    labelZh: '模型发布',
    color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30'
  },
  developer_platform: { 
    emoji: '🔧', 
    label: 'Developer Platform', 
    labelZh: '开发者平台',
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30'
  },
  official_blog: { 
    emoji: '📝', 
    label: 'Official Blog', 
    labelZh: '技术博客',
    color: 'from-green-500/20 to-green-600/10 border-green-500/30'
  },
  product_ecosystem: { 
    emoji: '📱', 
    label: 'Product Ecosystem', 
    labelZh: '产品生态',
    color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30'
  },
}

const CATEGORY_ORDER: Category[] = [
  'model_release',
  'developer_platform',
  'official_blog',
  'product_ecosystem',
]

async function getNewsletterData(): Promise<DailyDigest | null> {
  try {
    const dataPath = path.join(process.cwd(), 'src', 'data', 'newsletter.json')
    if (!fs.existsSync(dataPath)) {
      return null
    }
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    return data
  } catch {
    return null
  }
}

export const metadata = {
  title: 'AI Daily Digest | Lore',
  description: 'Daily AI and tech news digest - curated hot topics from official sources, Twitter, GitHub, and Hacker News',
}

function NewsCard({ item, index }: { item: NewsItem; index: number }) {
  const isTwitter = item.twitter_url || item.url.includes('x.com') || item.url.includes('twitter.com')
  
  return (
    <article className="group relative">
      <div className="flex gap-4">
        {/* Number */}
        <div className="shrink-0 w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-sm font-medium text-muted">
          {index + 1}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-base font-medium mb-2 leading-relaxed">
            <a 
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-500 transition-colors"
            >
              {item.title.length > 100 ? item.title.slice(0, 100) + '...' : item.title}
            </a>
          </h3>
          
          {/* Summary */}
          <p className="text-muted text-sm leading-relaxed mb-3">
            {item.summary.length > 280 ? item.summary.slice(0, 280) + '...' : item.summary}
          </p>
          
          {/* Action & Link */}
          <div className="flex items-center gap-3 text-xs">
            {item.action && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-600">
                ⚡ {item.action}
              </span>
            )}
            <a 
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              {isTwitter ? '🔗 View on X' : '🔗 Read more'}
              <svg width="12" height="12" className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <span className="text-muted/50">
              {item.source}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}

function CategorySection({ category, items }: { category: Category; items: NewsItem[] }) {
  if (!items || items.length === 0) return null
  
  const config = CATEGORY_CONFIG[category]
  const displayItems = items.slice(0, 5) // Show top 5 per category
  
  return (
    <section className="mb-12">
      {/* Category Header */}
      <div className={`rounded-xl p-6 mb-6 bg-gradient-to-br ${config.color} border`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{config.emoji}</span>
          <div>
            <h2 className="text-xl font-semibold">{config.label}</h2>
            <p className="text-muted text-sm">{config.labelZh} · {items.length} items</p>
          </div>
        </div>
      </div>
      
      {/* Items */}
      <div className="space-y-6 pl-2">
        {displayItems.map((item, index) => (
          <NewsCard key={item.id} item={item} index={index} />
        ))}
        
        {items.length > 5 && (
          <p className="text-muted text-sm pl-12">
            + {items.length - 5} more items
          </p>
        )}
      </div>
    </section>
  )
}

export default async function NewsletterPage() {
  const digest = await getNewsletterData()

  const totalItems = digest?.items?.length || 0
  const formattedDate = digest?.date 
    ? new Date(digest.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Today'

  return (
    <main className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <Link href="/" className="text-2xl tracking-tight hover:opacity-60 transition-opacity font-medium">
          Lore
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/" className="text-muted hover:text-foreground transition-colors">Blog</Link>
          <span className="text-muted">/</span>
          <span className="text-foreground font-medium">Newsletter</span>
        </nav>
      </header>

      {/* Hero */}
      <div className="mb-12 text-center py-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
          AI Daily Digest
        </h1>
        <p className="text-muted text-lg mb-2">
          {formattedDate}
        </p>
        {digest && (
          <p className="text-muted text-sm">
            📊 {totalItems} stories from Twitter, HuggingFace, Hacker News & more
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent mb-12" />

      {/* Content */}
      {!digest || !digest.by_category ? (
        <div className="text-center py-16">
          <p className="text-muted text-lg mb-4">No digest yet</p>
          <p className="text-muted text-sm">
            The daily scout runs automatically. Check back soon!
          </p>
        </div>
      ) : (
        <div>
          {CATEGORY_ORDER.map((category) => (
            <CategorySection 
              key={category} 
              category={category} 
              items={digest.by_category[category]} 
            />
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {digest && (
        <div className="mt-12 p-6 rounded-xl bg-foreground/5 border border-foreground/10">
          <h3 className="font-medium mb-4">📡 Data Sources</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted">Twitter/X</span>
              <p className="font-medium">{digest.by_category?.model_release?.filter(i => i.source.startsWith('@')).length || 0}+ tweets</p>
            </div>
            <div>
              <span className="text-muted">HuggingFace</span>
              <p className="font-medium">Top 5 models</p>
            </div>
            <div>
              <span className="text-muted">Hacker News</span>
              <p className="font-medium">AI stories</p>
            </div>
            <div>
              <span className="text-muted">GitHub</span>
              <p className="font-medium">Trending repos</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-foreground/10 text-center">
        <p className="text-muted text-sm mb-2">
          Curated by AI, reviewed by humans
        </p>
        <p className="text-muted text-xs">
          Updated daily at 9:00 AM UTC · Powered by Lore AI
        </p>
      </footer>
    </main>
  )
}
