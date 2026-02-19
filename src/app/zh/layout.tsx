import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LoreAI | AI 内容引擎',
  description: 'AI 驱动的研究和内容创作',
  other: {
    'content-language': 'zh',
  },
}

export default function ZhLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout sets lang="zh" for all Chinese pages under /zh/.
  // Note: In static export with Next.js App Router, nested layouts cannot override
  // the root <html> tag. This <div> with lang="zh" provides a semantic signal for
  // assistive technologies and crawlers that understand nested lang attributes.
  return <div lang="zh">{children}</div>
}
