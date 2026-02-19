#!/usr/bin/env npx tsx
/**
 * PAA (People Also Ask) Miner
 *
 * Mines questions from Brave Search for existing topics/keywords.
 * Inserts discovered questions into `paa_questions` table for
 * downstream FAQ content generation via seo-pipeline.ts.
 *
 * Budget: ~60 API calls/run (20 topics × 3 queries). Run every other day = ~900/month.
 * Requires: BRAVE_API_KEY
 *
 * Usage: npx tsx scripts/paa-miner.ts [--dry-run] [--limit N]
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { getDb, initSchema, insertPAAQuestion, closeDb } from '../src/lib/db.js'

dotenv.config()

const BRAVE_API_KEY = process.env.BRAVE_API_KEY
if (!BRAVE_API_KEY) {
  console.error('BRAVE_API_KEY not set. Get one at https://api.search.brave.com/')
  process.exit(1)
}

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const limitIdx = args.indexOf('--limit')
const TOPIC_LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : 20

// Question patterns to match in search result titles
const QUESTION_PATTERNS = /\b(what|how|why|which|can|does|is|are|should|will|when|where|who)\b/i
const HAS_QUESTION_MARK = /\?/

interface BraveSearchResult {
  title: string
  url: string
  description: string
}

interface BraveSearchResponse {
  web?: {
    results: BraveSearchResult[]
    totalResults?: number
  }
  faq?: {
    results: Array<{
      question: string
      answer: string
      url: string
    }>
  }
}

/**
 * Load topics from topic-clusters.json + existing blog keywords
 */
function getTopics(): string[] {
  const topics = new Set<string>()

  // From topic clusters
  const clustersPath = path.join(process.cwd(), 'content', 'topic-clusters.json')
  if (fs.existsSync(clustersPath)) {
    const clusters = JSON.parse(fs.readFileSync(clustersPath, 'utf-8'))
    for (const cluster of clusters) {
      topics.add(cluster.name_en)
    }
  }

  // From existing blog keywords (extract from frontmatter)
  const blogDir = path.join(process.cwd(), 'content', 'blogs', 'en')
  if (fs.existsSync(blogDir)) {
    for (const file of fs.readdirSync(blogDir)) {
      if (!file.endsWith('.md')) continue
      const content = fs.readFileSync(path.join(blogDir, file), 'utf-8')
      const kwMatch = content.match(/^keywords:\s*\[(.*?)\]/ms)
      if (kwMatch) {
        const kws = kwMatch[1].match(/["']([^"']+)["']/g)
        if (kws) {
          for (const kw of kws.slice(0, 3)) {
            topics.add(kw.replace(/["']/g, ''))
          }
        }
      }
    }
  }

  // From glossary terms
  const glossaryDir = path.join(process.cwd(), 'content', 'glossary')
  if (fs.existsSync(glossaryDir)) {
    for (const file of fs.readdirSync(glossaryDir)) {
      if (!file.endsWith('-en.md')) continue
      const content = fs.readFileSync(path.join(glossaryDir, file), 'utf-8')
      const termMatch = content.match(/^term:\s*["']?(.+?)["']?\s*$/m)
      if (termMatch) topics.add(termMatch[1])
    }
  }

  return [...topics].slice(0, TOPIC_LIMIT)
}

/**
 * Get existing FAQ slugs for dedup
 */
function getExistingFAQSlugs(): Set<string> {
  const slugs = new Set<string>()
  const faqDir = path.join(process.cwd(), 'content', 'faq')
  if (fs.existsSync(faqDir)) {
    for (const file of fs.readdirSync(faqDir)) {
      slugs.add(file.replace(/-(en|zh)\.md$/, ''))
    }
  }
  return slugs
}

/**
 * Call Brave Search API
 */
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

/**
 * Extract questions from search results
 */
function extractQuestions(results: BraveSearchResult[], faqResults?: BraveSearchResponse['faq']): string[] {
  const questions = new Set<string>()

  // From search result titles
  for (const r of results) {
    const title = r.title.replace(/<\/?[^>]+(>|$)/g, '').trim()
    if (HAS_QUESTION_MARK.test(title) || QUESTION_PATTERNS.test(title)) {
      // Clean up the title to extract the question
      const cleaned = title
        .replace(/\s*\|.*$/, '')  // Remove "| Site Name" suffixes
        .replace(/\s*-\s*[A-Z].*$/, '')  // Remove "- Site Name" suffixes
        .trim()
      if (cleaned.length > 15 && cleaned.length < 200) {
        questions.add(cleaned)
      }
    }
  }

  // From Brave's FAQ section
  if (faqResults?.results) {
    for (const faq of faqResults.results) {
      if (faq.question && faq.question.length > 10) {
        questions.add(faq.question)
      }
    }
  }

  return [...questions]
}

async function main() {
  console.log('🔍 PAA Miner — Mining questions from Brave Search\n')

  const db = getDb()
  initSchema(db)

  const topics = getTopics()
  console.log(`📋 Found ${topics.length} topics to mine\n`)

  const existingFAQs = getExistingFAQSlugs()
  let totalQuestions = 0
  let totalCalls = 0

  for (const topic of topics) {
    const queries = [
      `what is ${topic}`,
      `${topic} how to`,
      `${topic} vs`,
    ]

    console.log(`\n📎 Topic: ${topic}`)

    for (const query of queries) {
      try {
        totalCalls++
        console.log(`  🔎 Query: "${query}"`)

        const response = await braveSearch(query)
        const results = response.web?.results || []
        const totalResults = response.web?.totalResults || 0
        const questions = extractQuestions(results, response.faq)

        console.log(`     ${results.length} results, ${questions.length} questions found`)

        for (const question of questions) {
          // Simple dedup: skip if the question slug matches an existing FAQ
          const slug = question.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
          if (existingFAQs.has(slug)) {
            console.log(`     ⏭️  Skip (exists): ${question}`)
            continue
          }

          if (DRY_RUN) {
            console.log(`     📝 [DRY] Would insert: ${question}`)
          } else {
            insertPAAQuestion(db, {
              question,
              source_keyword: topic,
              source_query: query,
              result_count: totalResults,
            })
          }
          totalQuestions++
        }

        // Rate limit: 1 request/second to stay well under Brave's limits
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (e) {
        console.error(`     ❌ Error: ${(e as Error).message}`)
      }
    }
  }

  closeDb()

  console.log('\n═══════════════════════════════════════════════════')
  console.log(`  ✅ PAA Mining Complete`)
  console.log(`  Topics: ${topics.length}`)
  console.log(`  API calls: ${totalCalls}`)
  console.log(`  Questions discovered: ${totalQuestions}`)
  console.log(`  Mode: ${DRY_RUN ? 'Dry Run' : 'Production'}`)
  console.log('═══════════════════════════════════════════════════')
}

main().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
