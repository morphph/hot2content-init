'use client'

import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'

interface MermaidRendererProps {
  content: string
}

export default function MermaidRenderer({ content }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      fontFamily: 'inherit',
      fontSize: 14,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      },
      timeline: {
        useMaxWidth: true
      }
    })
    
    const renderDiagrams = async () => {
      if (!containerRef.current) return
      
      // Find all mermaid code blocks
      const codeBlocks = containerRef.current.querySelectorAll('pre code.language-mermaid, pre code')
      
      for (let i = 0; i < codeBlocks.length; i++) {
        const block = codeBlocks[i]
        const pre = block.parentElement
        const code = block.textContent || ''
        
        // Check if it's mermaid content
        if (code.trim().startsWith('graph') || 
            code.trim().startsWith('flowchart') || 
            code.trim().startsWith('timeline') ||
            code.trim().startsWith('sequenceDiagram') ||
            code.trim().startsWith('classDiagram') ||
            code.trim().startsWith('stateDiagram') ||
            code.trim().startsWith('erDiagram') ||
            code.trim().startsWith('gantt') ||
            code.trim().startsWith('pie') ||
            code.trim().startsWith('mindmap')) {
          
          try {
            const id = `mermaid-${i}-${Date.now()}`
            const { svg } = await mermaid.render(id, code.trim())
            
            // Create wrapper div
            const wrapper = document.createElement('div')
            wrapper.className = 'mermaid-diagram'
            wrapper.innerHTML = svg
            
            // Replace the pre block
            pre?.replaceWith(wrapper)
          } catch (err) {
            console.error('Mermaid render error:', err)
          }
        }
      }
    }
    
    renderDiagrams()
  }, [content])
  
  return (
    <div 
      ref={containerRef}
      className="article-content"
      dangerouslySetInnerHTML={{ __html: content }} 
    />
  )
}
