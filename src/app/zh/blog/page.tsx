import Link from 'next/link'
import { getBlogPosts } from '@/lib/blog'

export const metadata = {
  title: '博客 | Hot2Content',
  description: 'AI与科技深度解读、研究报告、技术分析',
}

export default async function BlogIndex() {
  const posts = await getBlogPosts('zh')
  
  return (
    <main className="min-h-screen px-8 py-16 max-w-2xl mx-auto">
      {/* Header */}
      <header className="mb-16 fade-in">
        <Link 
          href="/" 
          className="text-muted text-sm inline-block mb-8 hover:opacity-60"
        >
          ← 返回
        </Link>
        <h1 className="text-3xl mb-3">博客</h1>
        <div className="divider mt-6"></div>
      </header>
      
      {/* Posts */}
      {posts.length === 0 ? (
        <p className="text-muted fade-in-delay-1">
          暂无文章
        </p>
      ) : (
        <ul className="space-y-12 fade-in-delay-1">
          {posts.map((post, i) => (
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
    </main>
  )
}
