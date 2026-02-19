import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import gfm from 'remark-gfm'
import { blogFrontmatterSchema } from '@/schemas/blog-frontmatter'

const BLOGS_DIR = path.join(process.cwd(), 'content', 'blogs')
const OUTPUT_DIR = path.join(process.cwd(), 'output')

export interface BlogPost {
  slug: string
  title: string
  description: string
  keywords: string[]
  date: string
  updated?: string  // dateModified — if absent, falls back to date
  tier: 1 | 2 | 3
  readingTime: number  // minutes
  content: string
  contentHtml: string
  hreflang_en?: string
  hreflang_zh?: string
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
  const contentWithoutFirstH1 = markdownContent.replace(/^\s*#\s+.+\n+/, '')
  
  const processedContent = await remark()
    .use(gfm)
    .use(html, { sanitize: false })
    .process(contentWithoutFirstH1)
  
  let contentHtml = processedContent.toString()

  // Strip <script> tags to prevent XSS while preserving Mermaid <pre> blocks
  contentHtml = contentHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Add id attributes to H2 tags for TOC anchor links
  let headingIndex = 0
  contentHtml = contentHtml.replace(/<h2>(.*?)<\/h2>/gi, (_match, text) => {
    const plainText = text.replace(/<[^>]*>/g, '')
    // Use index-based ids to handle all languages (including Chinese)
    const id = `section-${headingIndex++}`
    return `<h2 id="${id}">${text}</h2>`
  })
  
  return {
    data,
    contentHtml
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

        // Validate frontmatter against Zod schema (warn but don't throw for backwards compatibility)
        const validation = blogFrontmatterSchema.safeParse(data)
        if (!validation.success) {
          console.warn(`[blog.ts] Invalid frontmatter in ${file}:`, validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '))
        }

        posts.push({
          slug: data.slug || file.replace('.md', ''),
          title: data.title || 'Untitled',
          description: data.description || '',
          keywords: data.keywords || [],
          date: typeof data.date === 'string' ? data.date : new Date(data.date).toISOString().split('T')[0],
          tier: (() => {
            if (!data.tier) {
              console.warn(`⚠️ Missing tier in ${file} — defaulting to 2. Add "tier: 1|2|3" to frontmatter.`)
            }
            return data.tier || 2
          })(),
          readingTime: estimateReadingTime(content, lang),
          content,
          contentHtml,
          hreflang_en: data.hreflang_en,
          hreflang_zh: data.hreflang_zh,
          updated: data.updated ? (typeof data.updated === 'string' ? data.updated : new Date(data.updated).toISOString().split('T')[0]) : undefined,
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

        // Validate frontmatter against Zod schema (warn but don't throw for backwards compatibility)
        const validation = blogFrontmatterSchema.safeParse(data)
        if (!validation.success) {
          console.warn(`[blog.ts] Invalid frontmatter in ${filename}:`, validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '))
        }

        posts.push({
          slug: data.slug || 'untitled',
          title: data.title || 'Untitled',
          description: data.description || '',
          keywords: data.keywords || [],
          date: typeof data.date === 'string' ? data.date : new Date(data.date).toISOString().split('T')[0],
          tier: (() => {
            if (!data.tier) {
              console.warn(`⚠️ Missing tier in ${filename} — defaulting to 2. Add "tier: 1|2|3" to frontmatter.`)
            }
            return data.tier || 2
          })(),
          readingTime: estimateReadingTime(content, lang),
          content,
          contentHtml,
          hreflang_en: data.hreflang_en,
          hreflang_zh: data.hreflang_zh,
          updated: data.updated ? (typeof data.updated === 'string' ? data.updated : new Date(data.updated).toISOString().split('T')[0]) : undefined,
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
 * Get a single blog post by slug (direct file lookup — O(1) instead of loading all posts)
 */
export async function getBlogPost(lang: 'en' | 'zh', slug: string): Promise<BlogPost | null> {
  const langDir = path.join(BLOGS_DIR, lang)

  // Try direct file lookup first: content/blogs/{lang}/{slug}.md
  const directPath = path.join(langDir, `${slug}.md`)
  if (fs.existsSync(directPath)) {
    try {
      const content = fs.readFileSync(directPath, 'utf-8')
      const { data, contentHtml } = await parseMarkdown(content)

      const validation = blogFrontmatterSchema.safeParse(data)
      if (!validation.success) {
        console.warn(`[blog.ts] Invalid frontmatter in ${slug}.md:`, validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '))
      }

      return {
        slug: data.slug || slug,
        title: data.title || 'Untitled',
        description: data.description || '',
        keywords: data.keywords || [],
        date: typeof data.date === 'string' ? data.date : new Date(data.date).toISOString().split('T')[0],
        tier: (() => {
          if (!data.tier) {
            console.warn(`⚠️ Missing tier in ${slug}.md — defaulting to 2. Add "tier: 1|2|3" to frontmatter.`)
          }
          return data.tier || 2
        })(),
        readingTime: estimateReadingTime(content, lang),
        content,
        contentHtml,
        hreflang_en: data.hreflang_en,
        hreflang_zh: data.hreflang_zh,
        updated: data.updated ? (typeof data.updated === 'string' ? data.updated : new Date(data.updated).toISOString().split('T')[0]) : undefined,
      }
    } catch (error) {
      console.error(`Error parsing ${directPath}:`, error)
    }
  }

  // Fallback: scan all files in case the filename doesn't match the slug
  // (e.g., file named differently than frontmatter slug)
  if (fs.existsSync(langDir)) {
    const files = fs.readdirSync(langDir).filter(f => f.endsWith('.md'))
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(langDir, file), 'utf-8')
        const { data } = matter(content)
        if (data.slug === slug) {
          const { contentHtml } = await parseMarkdown(content)
          const validation = blogFrontmatterSchema.safeParse(data)
          if (!validation.success) {
            console.warn(`[blog.ts] Invalid frontmatter in ${file}:`, validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '))
          }
          return {
            slug: data.slug,
            title: data.title || 'Untitled',
            description: data.description || '',
            keywords: data.keywords || [],
            date: typeof data.date === 'string' ? data.date : new Date(data.date).toISOString().split('T')[0],
            tier: (() => {
              if (!data.tier) {
                console.warn(`⚠️ Missing tier in ${file} — defaulting to 2. Add "tier: 1|2|3" to frontmatter.`)
              }
              return data.tier || 2
            })(),
            readingTime: estimateReadingTime(content, lang),
            content,
            contentHtml,
            hreflang_en: data.hreflang_en,
            hreflang_zh: data.hreflang_zh,
            updated: data.updated ? (typeof data.updated === 'string' ? data.updated : new Date(data.updated).toISOString().split('T')[0]) : undefined,
          }
        }
      } catch (error) {
        console.error(`Error scanning ${file}:`, error)
      }
    }
  }

  // Fallback: legacy output/ file
  const filename = lang === 'en' ? 'blog-en.md' : 'blog-zh.md'
  const filePath = path.join(OUTPUT_DIR, filename)
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const { data, contentHtml } = await parseMarkdown(content)
      if ((data.slug || 'untitled') === slug) {
        return {
          slug: data.slug || 'untitled',
          title: data.title || 'Untitled',
          description: data.description || '',
          keywords: data.keywords || [],
          date: typeof data.date === 'string' ? data.date : new Date(data.date).toISOString().split('T')[0],
          tier: data.tier || 2,
          readingTime: estimateReadingTime(content, lang),
          content,
          contentHtml,
          hreflang_en: data.hreflang_en,
          hreflang_zh: data.hreflang_zh,
          updated: data.updated ? (typeof data.updated === 'string' ? data.updated : new Date(data.updated).toISOString().split('T')[0]) : undefined,
        }
      }
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error)
    }
  }

  return null
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
