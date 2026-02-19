import type { Metadata } from 'next'
import { Inter, Noto_Sans_SC, Press_Start_2P } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
})

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-noto-sans-sc',
})

const pressStart2P = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-press-start-2p',
})

export const metadata: Metadata = {
  title: 'LoreAI',
  description: 'LoreAI — AI-powered research and content creation',
  alternates: {
    types: {
      'application/rss+xml': [
        { url: '/feed.xml', title: 'LoreAI Blog (EN)' },
        { url: '/zh/feed.xml', title: 'LoreAI Blog (ZH)' },
      ],
    },
  },
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'LoreAI',
  url: 'https://loreai.dev',
  description: 'AI-powered research and content creation — bilingual deep dives into AI development, models, and tools.',
  inLanguage: ['en', 'zh'],
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://loreai.dev/en/blog?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'LoreAI',
  url: 'https://loreai.dev',
  logo: 'https://loreai.dev/favicon.ico',
  description: 'AI content engine that transforms trending AI/tech topics into bilingual deep-dive articles, newsletters, glossary, FAQ, and comparison pages.',
  sameAs: [
    'https://github.com/loreai',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Note: lang="en" is set at root level. Chinese pages under /zh/ override
    // this via src/app/zh/layout.tsx which wraps content with lang="zh".
    // A route-group refactor would be needed for a fully correct per-route <html lang>.
    <html lang="en" className={`${inter.variable} ${notoSansSC.variable} ${pressStart2P.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        {children}
      </body>
    </html>
  )
}
