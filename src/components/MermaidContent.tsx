'use client'

import dynamic from 'next/dynamic'

const MermaidRenderer = dynamic(() => import('@/components/MermaidRenderer'), { ssr: false })

interface MermaidContentProps {
  html: string
  hasMermaid: boolean
}

export default function MermaidContent({ html, hasMermaid }: MermaidContentProps) {
  if (hasMermaid) {
    return <MermaidRenderer content={html} />
  }
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
