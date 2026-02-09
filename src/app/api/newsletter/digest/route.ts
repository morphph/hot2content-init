import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const newsletterDir = path.join(process.cwd(), 'content', 'newsletters')
    
    if (!fs.existsSync(newsletterDir)) {
      return NextResponse.json({ content: null })
    }
    
    const files = fs.readdirSync(newsletterDir)
      .filter(f => f.endsWith('.md'))
      .sort()
      .reverse()
    
    if (files.length === 0) {
      return NextResponse.json({ content: null })
    }
    
    const content = fs.readFileSync(path.join(newsletterDir, files[0]), 'utf-8')
    const date = files[0].replace('.md', '')
    
    return NextResponse.json({ date, content })
  } catch {
    return NextResponse.json({ content: null })
  }
}
