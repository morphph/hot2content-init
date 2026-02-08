import Link from 'next/link'
import { getBlogPosts } from '@/lib/blog'

export const metadata = {
  title: '博客 | Hot2Content',
  description: 'AI与科技深度解读、研究报告、技术分析',
}

export default async function BlogIndex() {
  const posts = await getBlogPosts('zh')
  
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <nav className="mb-8">
        <Link href="/" className="text-blue-600 hover:underline">← 首页</Link>
      </nav>
      
      <h1 className="text-4xl font-bold mb-8">博客</h1>
      
      {posts.length === 0 ? (
        <p className="text-gray-600">暂无文章。运行 pipeline 生成内容！</p>
      ) : (
        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link 
                href={`/zh/blog/${post.slug}`}
                className="block p-6 border rounded-lg hover:bg-gray-50 transition"
              >
                <h2 className="text-2xl font-semibold mb-2">{post.title}</h2>
                <p className="text-gray-600 mb-2">{post.description}</p>
                <time className="text-sm text-gray-500">{post.date}</time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
