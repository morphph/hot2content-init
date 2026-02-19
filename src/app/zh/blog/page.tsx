import BlogListPage from '@/components/pages/BlogListPage'

export const metadata = {
  title: '博客 | LoreAI',
  description: '深度解读、教程和 AI 开发洞察',
  alternates: {
    languages: {
      'en': '/en/blog',
      'zh': '/zh/blog',
    },
  },
}

export default async function BlogPageZh() {
  return <BlogListPage lang="zh" />
}
