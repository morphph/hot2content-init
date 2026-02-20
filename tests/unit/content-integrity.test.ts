import { describe, test, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { blogFrontmatterSchema } from '@/schemas/blog-frontmatter'

const CONTENT_DIR = path.resolve(__dirname, '../../content')

function getBlogFiles(lang: 'en' | 'zh'): string[] {
  const dir = path.join(CONTENT_DIR, 'blogs', lang)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md'))
}

function parseFrontmatter(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return matter(raw)
}

// ──────────────────────────────────────────────
// A. Blog frontmatter validation (using Zod schema)
// ──────────────────────────────────────────────

describe('A. EN blog frontmatter', () => {
  const files = getBlogFiles('en')

  test('EN blog directory has at least 1 file', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  test.each(files)('%s has valid frontmatter', (filename) => {
    const filePath = path.join(CONTENT_DIR, 'blogs', 'en', filename)
    const { data } = parseFrontmatter(filePath)
    const result = blogFrontmatterSchema.safeParse(data)
    if (!result.success) {
      const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
      expect.fail(`Invalid frontmatter in ${filename}:\n  ${errors.join('\n  ')}`)
    }
  })
})

describe('B. ZH blog frontmatter', () => {
  const files = getBlogFiles('zh')

  test('ZH blog directory has at least 1 file', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  test.each(files)('%s has valid frontmatter', (filename) => {
    const filePath = path.join(CONTENT_DIR, 'blogs', 'zh', filename)
    const { data } = parseFrontmatter(filePath)
    const result = blogFrontmatterSchema.safeParse(data)
    if (!result.success) {
      const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
      expect.fail(`Invalid frontmatter in ${filename}:\n  ${errors.join('\n  ')}`)
    }
  })
})

// ──────────────────────────────────────────────
// C. Content body checks
// ──────────────────────────────────────────────

describe('C. Blog content body', () => {
  const enFiles = getBlogFiles('en')
  const zhFiles = getBlogFiles('zh')

  test.each(enFiles)('EN %s has non-empty body (>100 chars)', (filename) => {
    const filePath = path.join(CONTENT_DIR, 'blogs', 'en', filename)
    const { content } = parseFrontmatter(filePath)
    expect(content.trim().length).toBeGreaterThan(100)
  })

  test.each(zhFiles)('ZH %s has non-empty body (>100 chars)', (filename) => {
    const filePath = path.join(CONTENT_DIR, 'blogs', 'zh', filename)
    const { content } = parseFrontmatter(filePath)
    expect(content.trim().length).toBeGreaterThan(100)
  })
})

// ──────────────────────────────────────────────
// D. Slug-filename consistency
// ──────────────────────────────────────────────

describe('D. Slug matches filename', () => {
  const enFiles = getBlogFiles('en')

  test.each(enFiles)('EN %s slug matches filename', (filename) => {
    const filePath = path.join(CONTENT_DIR, 'blogs', 'en', filename)
    const { data } = parseFrontmatter(filePath)
    if (data.slug) {
      const expected = filename.replace(/\.md$/, '')
      expect(data.slug).toBe(expected)
    }
  })
})

// ──────────────────────────────────────────────
// E. No duplicate slugs
// ──────────────────────────────────────────────

describe('E. No duplicate slugs', () => {
  test('EN blogs have unique slugs', () => {
    const files = getBlogFiles('en')
    const slugs = files.map((f) => {
      const { data } = parseFrontmatter(path.join(CONTENT_DIR, 'blogs', 'en', f))
      return data.slug || f.replace(/\.md$/, '')
    })
    const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i)
    expect(dupes).toEqual([])
  })

  test('ZH blogs have unique slugs', () => {
    const files = getBlogFiles('zh')
    const slugs = files.map((f) => {
      const { data } = parseFrontmatter(path.join(CONTENT_DIR, 'blogs', 'zh', f))
      return data.slug || f.replace(/\.md$/, '')
    })
    const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i)
    expect(dupes).toEqual([])
  })
})
