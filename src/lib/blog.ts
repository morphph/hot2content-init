import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

const OUTPUT_DIR = path.join(process.cwd(), 'output')

export interface BlogPost {
  slug: string
  title: string
  description: string
  keywords: string[]
  date: string
  content: string
  contentHtml: string
}

/**
 * Parse markdown frontmatter and content
 */
async function parseMarkdown(content: string): Promise<{
  data: Record<string, any>
  contentHtml: string
}> {
  const { data, content: markdownContent } = matter(content)
  
  const processedContent = await remark()
    .use(html)
    .process(markdownContent)
  
  return {
    data,
    contentHtml: processedContent.toString()
  }
}

/**
 * Get all blog posts for a language
 */
export async function getBlogPosts(lang: 'en' | 'zh'): Promise<BlogPost[]> {
  const filename = lang === 'en' ? 'blog-en.md' : 'blog-zh.md'
  const filePath = path.join(OUTPUT_DIR, filename)
  
  // Also check for versioned files (e.g., blog-en-v2.md)
  const v2Path = path.join(OUTPUT_DIR, filename.replace('.md', '-v2.md'))
  
  const posts: BlogPost[] = []
  
  // Try v2 first, then regular
  for (const fp of [v2Path, filePath]) {
    if (fs.existsSync(fp)) {
      try {
        const content = fs.readFileSync(fp, 'utf-8')
        const { data, contentHtml } = await parseMarkdown(content)
        
        posts.push({
          slug: data.slug || 'untitled',
          title: data.title || 'Untitled',
          description: data.description || '',
          keywords: data.keywords || [],
          date: data.date || new Date().toISOString().split('T')[0],
          content,
          contentHtml
        })
        break // Only take the first found file
      } catch (error) {
        console.error(`Error parsing ${fp}:`, error)
      }
    }
  }
  
  return posts
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
