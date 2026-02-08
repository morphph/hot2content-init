import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hot2Content - AI Content Engine',
  description: 'AI-powered content generation from research to multi-platform publishing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
