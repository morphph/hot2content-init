import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBlogPost, getBlogPosts } from '@/lib/blog'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = await getBlogPosts('en')
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost('en', slug)
  
  if (!post) return { title: 'Not Found' }
  
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      languages: {
        'zh': `/zh/blog/${slug}`,
      },
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
    },
  }
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params
  const post = await getBlogPost('en', slug)
  
  if (!post) notFound()
  
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <nav className="mb-8 flex gap-4">
        <Link href="/" className="text-blue-600 hover:underline">Home</Link>
        <span>/</span>
        <Link href="/en/blog" className="text-blue-600 hover:underline">Blog</Link>
      </nav>
      
      <article className="prose prose-lg max-w-none">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          <div className="flex gap-4 text-gray-600">
            <time>{post.date}</time>
            <Link href={`/zh/blog/${slug}`} className="text-blue-600 hover:underline">
              中文版 →
            </Link>
          </div>
        </header>
        
        <div 
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }} 
        />
      </article>
    </main>
  )
}
