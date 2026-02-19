import { getBlogPost, getBlogPosts } from '@/lib/blog'
import BlogDetailPage from '@/components/pages/BlogDetailPage'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = await getBlogPosts('zh')
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost('zh', slug)

  if (!post) return { title: '未找到' }

  return {
    title: `${post.title} | LoreAI`,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: `https://loreai.dev/zh/blog/${slug}/`,
      languages: {
        'en': post.hreflang_en || `/en/blog/${slug}/`,
        'zh': `/zh/blog/${slug}/`,
        'x-default': `/en/blog/${slug}/`,
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

export default async function BlogPostZh({ params }: Props) {
  const { slug } = await params
  return <BlogDetailPage lang="zh" slug={slug} />
}
