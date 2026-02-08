import Link from 'next/link'
import { getBlogPosts } from '@/lib/blog'

export const metadata = {
  title: 'Lore | AI 内容引擎',
  description: 'AI驱动的研究与内容创作',
}

export default async function ZhHome() {
  const posts = await getBlogPosts('zh')
  
  return (
    <main className="min-h-screen px-8 py-12 max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-16 fade-in">
        <div>
          <h1 className="text-2xl tracking-tight">Lore</h1>
        </div>
        
        {/* Language Switcher */}
        <nav className="flex gap-4 text-sm">
          <Link href="/" className="text-muted hover:text-foreground transition-colors">EN</Link>
          <span className="text-muted">/</span>
          <Link href="/zh" className="text-foreground">中文</Link>
        </nav>
      </header>

      {/* Divider */}
      <div className="divider fade-in-delay-1 mb-12"></div>
      
      {/* Posts */}
      {posts.length === 0 ? (
        <p className="text-muted fade-in-delay-2">
          暂无文章
        </p>
      ) : (
        <ul className="space-y-10 fade-in-delay-2">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link 
                href={`/zh/blog/${post.slug}`}
                className="card-minimal block"
              >
                <time className="badge block mb-3">{post.date}</time>
                <h2 className="text-xl mb-2">{post.title}</h2>
                <p className="text-muted text-sm leading-relaxed">
                  {post.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Footer */}
      <footer className="mt-24 pt-8 border-t border-subtle">
        <p className="text-muted text-xs">
          AI 驱动的研究与内容
        </p>
      </footer>
    </main>
  )
}
