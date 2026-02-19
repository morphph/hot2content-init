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
      <body>{children}</body>
    </html>
  )
}
