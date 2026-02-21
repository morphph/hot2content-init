# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Hot2Content / LoreAI** — AI content engine that transforms trending AI/tech topics into bilingual (EN/ZH) blog posts, newsletters, glossary, FAQ, and comparison pages. Live at loreai.dev.

**Core flow:** Topic → Gemini Deep Research → Core Narrative JSON → EN Blog (Claude Opus) + ZH Blog (Claude Opus) → SEO Review → Publish

## Commands

```bash
# Development
npm run dev          # Next.js dev server
npm run build        # Production build (static export)
npm run lint         # ESLint
npm run start        # Serve production build

# Testing
npm run test:unit    # Vitest content integrity checks (fast, no server needed)
npm run test:e2e     # Playwright E2E tests (needs dev server)

# Pipeline scripts (via tsx)
npm run pipeline     # Full orchestrator (scripts/orchestrator.ts)
npm run research     # Gemini Deep Research (scripts/gemini-research.ts)
npm run validate     # Core Narrative schema validation (scripts/validate-narrative.ts)

# Individual scripts
npx tsx scripts/daily-scout.ts           # News collection + newsletter generation
npx tsx scripts/collect-news.ts          # Pure news collection (no newsletter)
npx tsx scripts/write-newsletter.ts      # Newsletter composition from DB
npx tsx scripts/twitter-collector.ts     # Twitter/X collection via twitterapi.io
npx tsx scripts/extract-faq.ts           # Extract FAQ from blog content
npx tsx scripts/extract-glossary.ts      # Extract glossary terms
npx tsx scripts/extract-compare.ts       # Extract comparison tables
npx tsx scripts/extract-keywords.ts      # Extract keywords to DB
npx tsx scripts/generate-tier2.ts        # Generate Tier 2/3 articles
npx tsx scripts/generate-paa-faq.ts      # Generate FAQ from PAA questions
npx tsx scripts/seo-pipeline.ts          # Batch SEO content generation
npx tsx scripts/validate-blog.ts         # Blog frontmatter validation

# Claude Code slash commands (run inside Claude Code)
/hot2content [topic]       # Full 8-step pipeline (keyword/URL/auto-detect)
/hot2content-scout         # Discovery only (trend-scout + dedup-checker)
/build-test                # Build + lint + unit tests + optional E2E

# Development with worktrees
claude -w            # Start Claude Code in isolated git worktree (for dev work)
```

## Architecture

### Twin-Track Content Strategy

**Track A (Manual/Brand):** Human-selected topics → Gemini Deep Research → Core Narrative → Claude Opus blogs → SEO review. 1-2 Tier 1 articles/week.

**Track B (Automatic/SEO):** Daily cron → extract keywords from news_items → route by type (glossary/compare/FAQ/tier2-3) → batch generate. 3-5 articles/day.

Both tracks share the same data layer (SQLite `loreai.db`) and publish to `content/` directory → Vercel SSG.

### 8-Step Blog Pipeline (`/hot2content`)

1. **trend-scout** (Sonnet) — 5-tier source scan, score/rank topics → `input/topic.json`
2. **dedup-checker** (Haiku) — 3-level dedup against `output/topic-index.json` → PASS/UPDATE/SKIP
3. **researcher** (Sonnet) — Gemini 2.5 Pro Deep Research → `output/research-report.md`
4. **narrative-architect** (Opus) — Distill to Core Narrative → `output/core-narrative.json` (pure English)
5. **writer-en** + **writer-zh** (Opus, parallel) — Generate blogs → `output/blog-en.md` + `output/blog-zh.md`
6. **seo-reviewer** (Sonnet) — Audit SEO/GEO/E-E-A-T, score 0-100 → `output/seo-review.md`
7. Update `output/topic-index.json`
8. Summary report

Agents are defined in `.claude/agents/*.md`. Commands in `.claude/commands/*.md`.

### Content Tiers

| Tier | Quality | Model | Word Count | Cost |
|------|---------|-------|------------|------|
| 1 (Deep Dive) | Highest | Claude Opus (CLI) | EN 1500-2500 / ZH 2000-3000 | $0 (CLI) |
| 2 (Analysis) | Medium | Claude Sonnet 4.6 (CLI) | 800-1500 | $0 (CLI) |
| 3 (Quick Read) | Basic | Claude Sonnet 4.6 (CLI) | 300-500 | $0 (CLI) |

### Data Flow

```
content/                    # Published content (Vercel reads this)
├── blogs/{en,zh}/*.md     # Blog posts (all tiers)
├── newsletters/{en,zh}/*.md
├── faq/*.md
├── glossary/*.md
└── compare/*.md

input/                      # Pipeline working files
├── topic.json             # Current topic input
├── raw-sources.json       # Trend scout raw data
└── dedup-report.json      # Dedup results

output/                     # Pipeline artifacts (intermediate)
├── core-narrative.json    # Narrative hub (pure English)
├── research-report.md     # Gemini research output
├── blog-en.md, blog-zh.md # Generated blogs before publish
├── seo-review.md          # Review report
└── topic-index.json       # Dedup registry

loreai.db                   # SQLite: news_items, content, keywords, etc.
```

### Key Source Files

- `src/lib/blog.ts` — Blog post loader, reading time, tier filtering
- `src/lib/db.ts` — SQLite schema + helpers (news_items, content, keywords, distributions, research, topic_index)
- `src/lib/faq.ts` — FAQ parser, JSON-LD FAQPage schema
- `src/lib/glossary.ts` — Glossary term loader, DefinedTerm JSON-LD
- `src/lib/compare.ts` — Comparison post reader
- `src/schemas/blog-frontmatter.ts` — Zod validation for blog frontmatter
- `src/components/MermaidRenderer.tsx` — Client-side Mermaid diagram renderer
- `scripts/orchestrator.ts` — Master pipeline coordinator
- `scripts/daily-scout.ts` — News aggregation (largest script, ~79KB)

### Writing Guidelines

Writing style specs live in `skills/`:
- `skills/blog-en/SKILL.md` — English: Ars Technica journalist tone, TL;DR first, 1-2% keyword density, no clichés
- `skills/blog-zh/SKILL.md` — Chinese: knowledgeable friend tone, NOT a translation, China angle, proper Chinese punctuation

## Critical Conventions

- **Core Narrative is pure English** — Chinese writers create independently from the same research, they don't translate
- **`output/topic-index.json` is append-only** — pipeline appends after completion, never overwrite
- **Core Narrative must validate** — run `npx tsx scripts/validate-narrative.ts` after any changes
- **EN prompts in English, ZH prompts in Chinese** — never mix languages in a single prompt
- **Use `Edit` over `Write`** for existing files — prefer precise edits, not full file overwrites
- **All architecture changes go to `docs/CHANGELOG.md`** — date + title + reason + changes + known issues

## Environment Variables

- `GEMINI_API_KEY` — Gemini 2.5 Pro / Flash API
- `TWITTER_API_KEY` — twitterapi.io API
- `KIMI_API_KEY` (or `MOONSHOT_API_KEY`) — Kimi K2.5 API (reserved for future video scripts)

## Tech Stack

- **Framework:** Next.js 16 (App Router, deployed on Vercel)
- **Language:** TypeScript (ES modules, `"type": "module"`)
- **Database:** SQLite via better-sqlite3 (`loreai.db`)
- **Styling:** Tailwind CSS v4
- **Content:** Markdown with gray-matter frontmatter + remark for HTML rendering
- **Validation:** Zod schemas for frontmatter and Core Narrative
- **AI APIs:** Anthropic SDK (@anthropic-ai/sdk), Gemini API, twitterapi.io
- **Scripts:** tsx for running TypeScript scripts directly
- **Testing:** Vitest (unit), Playwright (e2e)
- **Path alias:** `@/*` → `./src/*`

## Build Verification

After code changes to `src/`, `scripts/`, or config: run `npm run build` and `npm run test:unit`.
After content generation: run `npm run test:unit` and `npx tsx scripts/validate-blog.ts`.
After UI changes: also run `npm run test:e2e`.
Never commit code that fails build or tests.

## Cron Schedule (Production)

- **UTC 22:00** — `collect-news.ts` (news aggregation)
- **UTC 23:00** — `daily-newsletter.sh` (collect → freshness-detector → write newsletter → git push)
- **UTC 02:00** — `daily-seo.sh` (seo-pipeline → keyword-enricher → paa-miner → generate-paa-faq → content-updater → export-timeline-data → git push)
