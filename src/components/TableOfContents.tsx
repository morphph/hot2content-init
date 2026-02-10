'use client'
import { useEffect, useState } from 'react'

interface TOCItem {
  id: string
  text: string
}

export default function TableOfContents({ headings }: { headings: TOCItem[] }) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    headings.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav className="toc-sidebar">
      <div className="toc-sticky">
        <ul className="toc-list">
          {headings.map(({ id, text }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
                }}
                className={`toc-link ${activeId === id ? 'toc-link-active' : ''}`}
              >
                {text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
