import Link from 'next/link'
import { getBlogPosts } from '@/lib/blog'

export const metadata = {
  title: 'Blog | Hot2Content',
  description: 'AI and tech insights, research reports, and deep dives',
}

export default async function BlogIndex() {
  const posts = await getBlogPosts('en')
  
  return (
    <main className="min-h-screen px-8 py-16 max-w-2xl mx-auto">
      {/* Header */}
      <header className="mb-16 fade-in">
        <Link 
          href="/" 
          className="text-muted text-sm inline-block mb-8 hover:opacity-60"
        >
          ← Back
        </Link>
        <h1 className="text-3xl mb-3">Blog</h1>
        <div className="divider mt-6"></div>
      </header>
      
      {/* Posts */}
      {posts.length === 0 ? (
        <p className="text-muted fade-in-delay-1">
          No posts yet.
        </p>
      ) : (
        <ul className="space-y-12 fade-in-delay-1">
          {posts.map((post, i) => (
            <li key={post.slug}>
              <Link 
                href={`/en/blog/${post.slug}`}
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
