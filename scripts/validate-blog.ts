#!/usr/bin/env tsx
/**
 * Blog Markdown Frontmatter Validator
 * Validates that blog files have all required frontmatter fields.
 * Usage: npx tsx scripts/validate-blog.ts [path/to/blog.md]
 *        npx tsx scripts/validate-blog.ts --all  (validates all blogs)
 */

import { z } from 'zod'
import { readFileSync, readdirSync } from 'fs'
import { resolve, join } from 'path'
import matter from 'gray-matter'

const BlogFrontmatterSchema = z.object({
  slug: z.string()
    .min(1, 'slug cannot be empty')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
  title: z.string().min(1, 'title cannot be empty'),
  description: z.string().min(1, 'description cannot be empty'),
  keywords: z.array(z.string()).min(1, 'keywords must have at least 1 item'),
  date: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
    z.date()
  ], { errorMap: () => ({ message: 'date must be YYYY-MM-DD string or Date' }) }),
  lang: z.enum(['en', 'zh']),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)], {
    errorMap: () => ({ message: 'tier must be 1, 2, or 3' })
  }),
})

// Optional but recommended fields
const BlogFrontmatterFullSchema = BlogFrontmatterSchema.extend({
  hreflang_en: z.string().optional(),
  hreflang_zh: z.string().optional(),
})

function validateFile(filePath: string): { valid: boolean; errors: string[] } {
  const content = readFileSync(filePath, 'utf-8')
  const { data } = matter(content)

  const result = BlogFrontmatterFullSchema.safeParse(data)

  if (result.success) {
    return { valid: true, errors: [] }
  }

  return {
    valid: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
  }
}

function main() {
  const args = process.argv.slice(2)

  if (args[0] === '--all') {
    // Validate all blog files
    const blogsDir = resolve(process.cwd(), 'content', 'blogs')
    let totalFiles = 0
    let failedFiles = 0
    const failures: { file: string; errors: string[] }[] = []

    for (const lang of ['en', 'zh']) {
      const langDir = join(blogsDir, lang)
      let files: string[]
      try {
        files = readdirSync(langDir).filter(f => f.endsWith('.md'))
      } catch {
        continue
      }

      for (const file of files) {
        totalFiles++
        const filePath = join(langDir, file)
        const result = validateFile(filePath)
        if (!result.valid) {
          failedFiles++
          failures.push({ file: `${lang}/${file}`, errors: result.errors })
        }
      }
    }

    console.log(`\nBlog Frontmatter Validation`)
    console.log(`Total: ${totalFiles} files`)
    console.log(`Passed: ${totalFiles - failedFiles}`)
    console.log(`Failed: ${failedFiles}`)

    if (failures.length > 0) {
      console.log(`\nFailures:`)
      for (const f of failures) {
        console.log(`\n  ${f.file}:`)
        f.errors.forEach(e => console.log(`    - ${e}`))
      }
      process.exit(1)
    } else {
      console.log(`\n✅ All blog files valid`)
      process.exit(0)
    }
  } else {
    // Validate single file
    const filePath = args[0]
    if (!filePath) {
      console.error('Usage: npx tsx scripts/validate-blog.ts [path] or --all')
      process.exit(1)
    }

    const resolvedPath = resolve(process.cwd(), filePath)
    console.log(`\nValidating: ${resolvedPath}`)

    const result = validateFile(resolvedPath)
    if (result.valid) {
      console.log('✅ Blog frontmatter valid')
      process.exit(0)
    } else {
      console.log('❌ Blog frontmatter invalid:')
      result.errors.forEach(e => console.log(`  - ${e}`))
      process.exit(1)
    }
  }
}

main()
