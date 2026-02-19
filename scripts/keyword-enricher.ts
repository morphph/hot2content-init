#!/usr/bin/env npx tsx
/**
 * Keyword Enricher
 *
 * Uses Brave Search to estimate search demand for backlog keywords.
 * Updates `search_volume` and `difficulty` columns in the keywords table.
 *
 * search_volume: proxy based on log10(totalResults) * 15, capped at 100
 * difficulty: count of authoritative domains (wikipedia, docs, official) * 20, capped at 100
 *
 * Budget: 20 keywords/day = 600/month (well within Brave's 2000/month free tier)
 * Requires: BRAVE_API_KEY
 *
 * Usage: npx tsx scripts/keyword-enricher.ts [--dry-run] [--limit N]
 */

import * as dotenv from 'dotenv'
import { getDb, initSchema, closeDb } from '../src/lib/db.js'

dotenv.config()

const BRAVE_API_KEY = process.env.BRAVE_API_KEY
if (!BRAVE_API_KEY) {
  console.error('BRAVE_API_KEY not set. Get one at https://api.search.brave.com/')
  process.exit(1)
}

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const limitIdx = args.indexOf('--limit')
const BATCH_LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : 20

// Authoritative domains that indicate high competition
const AUTHORITATIVE_DOMAINS = [
  'wikipedia.org', 'docs.anthropic.com', 'platform.openai.com',
  'cloud.google.com', 'ai.google.dev', 'huggingface.co',
  'github.com', 'arxiv.org', 'microsoft.com', 'developer.mozilla.org',
  'aws.amazon.com', 'docs.github.com', 'stackoverflow.com',
]

interface KeywordRow {
  id: number
  keyword: string
  keyword_zh: string | null
  score: number | null
}

interface BraveSearchResponse {
  web?: {
    results: Array<{ url: string }>
    totalResults?: number
  }
}

async function braveSearch(query: string): Promise<BraveSearchResponse> {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': BRAVE_API_KEY!,
    },
  })

  if (!response.ok) {
    throw new Error(`Brave Search API error: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<BraveSearchResponse>
}

function estimateVolume(totalResults: number): number {
  if (totalResults <= 0) return 0
  return Math.min(100, Math.round(Math.log10(totalResults) * 15))
}

function estimateDifficulty(urls: string[]): number {
  let authCount = 0
  for (const url of urls) {
    for (const domain of AUTHORITATIVE_DOMAINS) {
      if (url.includes(domain)) {
        authCount++
        break
      }
    }
  }
  return Math.min(100, authCount * 20)
}

async function main() {
  console.log('📊 Keyword Enricher — Estimating search demand via Brave Search\n')

  const db = getDb()
  initSchema(db)

  // Get keywords with status='backlog' and no search_volume yet
  const keywords = db.prepare(
    `SELECT id, keyword, keyword_zh, score
     FROM keywords
     WHERE status = 'backlog' AND search_volume IS NULL
     ORDER BY score DESC, id
     LIMIT ?`
  ).all(BATCH_LIMIT) as KeywordRow[]

  if (keywords.length === 0) {
    console.log('📭 No unenriched backlog keywords found.')
    closeDb()
    return
  }

  console.log(`📋 Enriching ${keywords.length} keywords\n`)

  const updateStmt = db.prepare(
    `UPDATE keywords SET search_volume = ?, difficulty = ? WHERE id = ?`
  )

  let enriched = 0

  for (const kw of keywords) {
    try {
      console.log(`  🔎 "${kw.keyword}"`)

      const response = await braveSearch(kw.keyword)
      const totalResults = response.web?.totalResults || 0
      const urls = (response.web?.results || []).map(r => r.url)

      const volume = estimateVolume(totalResults)
      const difficulty = estimateDifficulty(urls)

      console.log(`     Volume: ${volume} (${totalResults.toLocaleString()} results) | Difficulty: ${difficulty}`)

      if (!DRY_RUN) {
        updateStmt.run(volume, difficulty, kw.id)
      }

      enriched++

      // Rate limit: 1 request/second
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (e) {
      console.error(`     ❌ Error: ${(e as Error).message}`)
    }
  }

  closeDb()

  console.log('\n═══════════════════════════════════════════════════')
  console.log(`  ✅ Keyword Enrichment Complete`)
  console.log(`  Keywords processed: ${enriched}/${keywords.length}`)
  console.log(`  Mode: ${DRY_RUN ? 'Dry Run' : 'Production'}`)
  console.log('═══════════════════════════════════════════════════')
}

main().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
