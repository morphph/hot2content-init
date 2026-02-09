import Link from 'next/link'
import fs from 'fs'
import path from 'path'

type Category = 'model_release' | 'developer_platform' | 'official_blog' | 'product_ecosystem'

interface NewsItem {
  id: string
  title: string
  summary: string
  action?: string
  url: string
  source: string
  category: Category
}

interface DailyDigest {
  date: string
  generated_at: string
  items: NewsItem[]
  by_category: Record<Category, NewsItem[]>
}

const CATEGORY_CONFIG: Record<Category, { label: string; gradient: string }> = {
  model_release: { 
    label: 'MODEL RELEASE',
    gradient: 'linear-gradient(to right, #9333ea, #4f46e5)',
  },
  developer_platform: { 
    label: 'DEVELOPER TOOLS',
    gradient: 'linear-gradient(to right, #2563eb, #06b6d4)',
  },
  official_blog: { 
    label: 'RESEARCH & BLOG',
    gradient: 'linear-gradient(to right, #059669, #14b8a6)',
  },
  product_ecosystem: { 
    label: 'PRODUCT NEWS',
    gradient: 'linear-gradient(to right, #db2777, #f43f5e)',
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

function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export const metadata = {
  title: 'Newsletter | LoreAI',
  description: 'Daily AI news digest - curated hot topics',
}

function NewsCard({ item }: { item: NewsItem }) {
  const isTwitter = item.source.startsWith('@')
  
  return (
    <article style={{ marginBottom: '32px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
        <a 
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#2563eb', textDecoration: 'none' }}
        >
          {item.title.length > 100 ? item.title.slice(0, 100) + '...' : item.title}
        </a>
      </h3>
      
      {item.summary && (
        <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' }}>
          {item.summary.length > 200 ? item.summary.slice(0, 200) + '...' : item.summary}
        </p>
      )}
      
      {isTwitter && (
        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
          Source: {item.source}
        </p>
      )}
      
      <a 
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#6b7280', fontSize: '13px', textDecoration: 'none' }}
      >
        {isTwitter ? 'View on X →' : 'Read more →'}
      </a>
    </article>
  )
}

function CategorySection({ category, items }: { category: Category; items: NewsItem[] }) {
  if (!items || items.length === 0) return null
  
  const config = CATEGORY_CONFIG[category]
  const displayItems = items.slice(0, 3)
  
  return (
    <section style={{ marginBottom: '48px' }}>
      <div style={{ marginBottom: '20px' }}>
        <span 
          style={{ 
            display: 'inline-block',
            padding: '6px 12px',
            color: 'white',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '11px',
            letterSpacing: '0.05em',
            background: config.gradient
          }}
        >
          {config.label}
        </span>
      </div>
      
      <div>
        {displayItems.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
      
      {items.length > 3 && (
        <p style={{ color: '#9ca3af', fontSize: '13px' }}>
          + {items.length - 3} more stories
        </p>
      )}
    </section>
  )
}

export default async function NewsletterPage() {
  const digest = await getNewsletterData()

  const formattedDate = digest?.date 
    ? formatDateLong(digest.date)
    : 'Today'
  
  const totalItems = digest?.items?.length || 0

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span 
              style={{ 
                fontSize: '20px',
                fontWeight: '800',
                color: '#2563eb',
                letterSpacing: '-0.02em'
              }}
            >
              LoreAI
            </span>
          </Link>
          <nav style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
            <Link href="/newsletter" style={{ color: '#111827', fontWeight: '500', textDecoration: 'none' }}>Newsletter</Link>
            <Link href="/en/blog" style={{ color: '#6b7280', textDecoration: 'none' }}>Blog</Link>
          </nav>
        </header>

        {/* Hero */}
        <div style={{ marginBottom: '40px' }}>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>
            {formattedDate}
          </p>
          <h1 
            style={{ 
              fontSize: '28px', 
              fontWeight: 'bold',
              background: 'linear-gradient(to right, #ec4899, #a855f7, #6366f1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Today&apos;s AI News
          </h1>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '40px' }}>
          <div style={{ height: '8px', width: '120px', background: 'linear-gradient(90deg, #EC4899, #8B5CF6, #3B82F6)', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#60A5FA', borderRadius: '2px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#93C5FD', borderRadius: '2px', opacity: 0.7 }} />
        </div>

        {/* Content */}
        {!digest || !digest.by_category ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ color: '#6b7280' }}>No news yet. Check back soon!</p>
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

        {/* Stats */}
        {digest && (
          <div style={{ 
            padding: '20px', 
            borderRadius: '8px', 
            backgroundColor: '#f9fafb',
            marginTop: '40px',
            fontSize: '13px',
            color: '#6b7280'
          }}>
            📊 {totalItems} stories from Twitter, HuggingFace, Hacker News & more
          </div>
        )}

        {/* Footer */}
        <footer style={{ textAlign: 'center', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
          <p style={{ color: '#9ca3af', fontSize: '13px' }}>
            Curated by AI · Updated daily
          </p>
        </footer>
      </div>
    </main>
  )
}
