/**
 * Shared Blog Frontmatter Schema
 * Used by both frontend (blog.ts) and pipeline (validate-blog.ts)
 */
export const REQUIRED_FIELDS = ['slug', 'title', 'description', 'keywords', 'date', 'lang', 'tier'] as const

export const VALID_TIERS = [1, 2, 3] as const
export type Tier = typeof VALID_TIERS[number]

export const TIER_LABELS: Record<Tier, string> = {
  1: 'Deep Dive',
  2: 'Analysis',
  3: 'Quick Read',
}
