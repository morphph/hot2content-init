import { getBlogPost, getBlogPosts } from '@/lib/blog'
import BlogDetailPage from '@/components/pages/BlogDetailPage'
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
    title: `${post.title} | LoreAI`,
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
  return <BlogDetailPage lang="en" slug={slug} />
}
