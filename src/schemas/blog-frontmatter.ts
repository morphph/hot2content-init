/**
 * Shared Blog Frontmatter Schema
 * Used by both frontend (blog.ts) and pipeline (validate-blog.ts)
 */
import { z } from 'zod'

export const REQUIRED_FIELDS = ['slug', 'title', 'description', 'keywords', 'date', 'lang', 'tier'] as const

export const VALID_TIERS = [1, 2, 3] as const
export type Tier = typeof VALID_TIERS[number]

export const TIER_LABELS: Record<Tier, string> = {
  1: 'Deep Dive',
  2: 'Analysis',
  3: 'Quick Read',
}

/**
 * Zod schema for blog frontmatter validation
 */
export const blogFrontmatterSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  keywords: z.array(z.string()).default([]),
  date: z.union([z.string(), z.date()]),
  updated: z.union([z.string(), z.date()]).optional(),
  lang: z.string().optional(),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  hreflang_en: z.string().optional(),
  hreflang_zh: z.string().optional(),
})
