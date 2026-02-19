import BlogListPage from '@/components/pages/BlogListPage'

export const metadata = {
  title: 'Blog | LoreAI',
  description: 'Deep dives, tutorials, and insights on AI development',
  alternates: {
    languages: {
      'en': '/en/blog',
      'zh': '/zh/blog',
    },
  },
}

export default async function BlogPage() {
  return <BlogListPage lang="en" />
}
