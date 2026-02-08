import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lore | AI Content Engine',
  description: 'AI-powered research and content creation',
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
