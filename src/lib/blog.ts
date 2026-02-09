import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import gfm from 'remark-gfm'

const BLOGS_DIR = path.join(process.cwd(), 'content', 'blogs')
const OUTPUT_DIR = path.join(process.cwd(), 'output')

export interface BlogPost {
  slug: string
  title: string
  description: string
  keywords: string[]
  date: string
  tier: 1 | 2 | 3
  readingTime: number  // minutes
  content: string
  contentHtml: string
}

function estimateReadingTime(content: string, lang: string): number {
  // ~200 wpm for English, ~400 cpm for Chinese
  if (lang === 'zh') {
    return Math.max(1, Math.round(content.length / 400))
  }
  const words = content.split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

/**
 * Parse markdown frontmatter and content
 */
async function parseMarkdown(content: string): Promise<{
  data: Record<string, any>
  contentHtml: string
}> {
  const { data, content: markdownContent } = matter(content)
  
  // Remove the first h1 heading from markdown content (it's duplicated from frontmatter)
  const contentWithoutFirstH1 = markdownContent.replace(/^#\s+.+\n+/, '')
  
  const processedContent = await remark()
    .use(gfm)
    .use(html, { sanitize: false })
    .process(contentWithoutFirstH1)
  
  return {
    data,
    contentHtml: processedContent.toString()
  }
}

/**
 * Get all blog posts for a language
 * Reads from content/blogs/{lang}/*.md (primary) with fallback to output/ (legacy)
 */
export async function getBlogPosts(lang: 'en' | 'zh', options?: { tier?: number; excludeTier?: number }): Promise<BlogPost[]> {
  const posts: BlogPost[] = []
  const langDir = path.join(BLOGS_DIR, lang)
  
  // Primary: read all .md files from content/blogs/{lang}/
  if (fs.existsSync(langDir)) {
    const files = fs.readdirSync(langDir).filter(f => f.endsWith('.md')).sort().reverse()
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(langDir, file), 'utf-8')
        const { data, contentHtml } = await parseMarkdown(content)
        
        posts.push({
          slug: data.slug || file.replace('.md', ''),
          title: data.title || 'Untitled',
          description: data.description || '',
          keywords: data.keywords || [],
          date: typeof data.date === 'string' ? data.date : new Date(data.date).toISOString().split('T')[0],
          tier: data.tier || 2,
          readingTime: estimateReadingTime(content, lang),
          content,
          contentHtml
        })
      } catch (error) {
        console.error(`Error parsing ${file}:`, error)
      }
    }
  }
  
  // Fallback: legacy output/ files (for backward compatibility)
  if (posts.length === 0) {
    const filename = lang === 'en' ? 'blog-en.md' : 'blog-zh.md'
    const filePath = path.join(OUTPUT_DIR, filename)
    
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const { data, contentHtml } = await parseMarkdown(content)
        
        posts.push({
          slug: data.slug || 'untitled',
          title: data.title || 'Untitled',
          description: data.description || '',
          keywords: data.keywords || [],
          date: typeof data.date === 'string' ? data.date : new Date(data.date).toISOString().split('T')[0],
          tier: data.tier || 2,
          readingTime: estimateReadingTime(content, lang),
          content,
          contentHtml
        })
      } catch (error) {
        console.error(`Error parsing ${filePath}:`, error)
      }
    }
  }
  
  // Sort by date descending
  posts.sort((a, b) => b.date.localeCompare(a.date))
  
  // Filter by tier if specified
  let filtered = posts
  if (options?.tier) {
    filtered = filtered.filter(p => p.tier === options.tier)
  }
  if (options?.excludeTier) {
    filtered = filtered.filter(p => p.tier !== options.excludeTier)
  }
  
  return filtered
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPost(lang: 'en' | 'zh', slug: string): Promise<BlogPost | null> {
  const posts = await getBlogPosts(lang)
  return posts.find(p => p.slug === slug) || null
}

/**
 * Get narrative data for a topic
 */
export async function getNarrative(): Promise<Record<string, any> | null> {
  const narrativePath = path.join(OUTPUT_DIR, 'core-narrative.json')
  
  if (!fs.existsSync(narrativePath)) return null
  
  try {
    return JSON.parse(fs.readFileSync(narrativePath, 'utf-8'))
  } catch {
    return null
  }
}
