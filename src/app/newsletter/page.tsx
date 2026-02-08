import Link from 'next/link'
import fs from 'fs'
import path from 'path'

interface Topic {
  id: string
  rank: number
  title: string
  summary: string
  score: number
  sources: Array<{
    tier: number
    name: string
    url: string
    type: string
  }>
  category: string
  urgency: string
  detected_at: string
}

interface DailyDigest {
  date: string
  generated_at: string
  topics: Topic[]
}

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
  title: 'AI Newsletter | Lore',
  description: 'Daily AI and tech news digest - curated hot topics from official sources, Twitter, GitHub, and Hacker News',
}

export default async function NewsletterPage() {
  const digest = await getNewsletterData()

  return (
    <main className="min-h-screen px-8 py-12 max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-12 fade-in">
        <Link href="/" className="text-2xl tracking-tight hover:opacity-60 transition-opacity">
          Lore
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/" className="text-muted hover:text-foreground transition-colors">Blog</Link>
          <span className="text-muted">/</span>
          <span className="text-foreground">Newsletter</span>
        </nav>
      </header>

      {/* Title */}
      <div className="mb-12 fade-in-delay-1">
        <h1 className="text-3xl mb-3">AI Newsletter</h1>
        <p className="text-muted">
          Daily AI & tech hot topics — curated from official sources, Twitter, GitHub, and Hacker News
        </p>
        {digest && (
          <p className="text-muted text-sm mt-2">
            Last updated: {new Date(digest.generated_at).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        )}
      </div>

      <div className="divider mb-12"></div>

      {/* Topics */}
      {!digest || digest.topics.length === 0 ? (
        <div className="text-center py-16 fade-in-delay-2">
          <p className="text-muted text-lg mb-4">No topics yet</p>
          <p className="text-muted text-sm">
            The daily scout runs automatically. Check back soon!
          </p>
        </div>
      ) : (
        <ul className="space-y-8 fade-in-delay-2">
          {digest.topics.map((topic) => (
            <li key={topic.id} className="group">
              <div className="flex items-start gap-4">
                {/* Rank */}
                <span className="text-2xl font-light text-muted w-8 shrink-0">
                  {topic.rank}
                </span>
                
                <div className="flex-1 min-w-0">
                  {/* Source badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge ${
                      topic.sources[0]?.tier === 1 ? 'text-green-600' :
                      topic.sources[0]?.tier === 3 ? 'text-purple-600' :
                      'text-orange-600'
                    }`}>
                      {topic.sources[0]?.tier === 1 ? '🏢 Official' :
                       topic.sources[0]?.tier === 3 ? '💻 GitHub' :
                       topic.sources[0]?.tier === 4 ? '📰 HN' : 
                       '🐦 Twitter'}
                    </span>
                    <span className="badge">Score: {topic.score}</span>
                    {topic.urgency === 'high' && (
                      <span className="badge text-red-600">🔥 Hot</span>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="text-lg mb-2 leading-snug">
                    {topic.sources[0]?.url ? (
                      <a 
                        href={topic.sources[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:opacity-60 transition-opacity"
                      >
                        {topic.title}
                      </a>
                    ) : (
                      topic.title
                    )}
                  </h2>

                  {/* Summary */}
                  <p className="text-muted text-sm">
                    {topic.summary}
                  </p>

                  {/* Sources */}
                  {topic.sources.length > 1 && (
                    <p className="text-muted text-xs mt-2">
                      Also on: {topic.sources.slice(1).map(s => s.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-subtle">
        <p className="text-muted text-sm">
          Data sources: Official AI company blogs, GitHub Trending, Hacker News
        </p>
        <p className="text-muted text-xs mt-2">
          Scanned automatically every day at 9:00 AM UTC
        </p>
      </footer>
    </main>
  )
}
