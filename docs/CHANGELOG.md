# LoreAI Changelog

## 2026-02-19 — Migrate Sonnet API + Gemini Flash to Claude CLI (Max Plan)

### Reason
Eliminate paid Anthropic Sonnet API and Gemini 2.0 Flash API costs by routing all calls through `claude` CLI (free on Max Plan). Only `scripts/gemini-research.ts` (Gemini 2.5 Pro Deep Research) remains on paid API.

### Changes
- **NEW** `src/lib/claude-cli.ts` — shared CLI helper (callCLI, callSonnet, callOpus)
- `scripts/extract-glossary.ts` — callGemini → callSonnet (CLI)
- `scripts/extract-compare.ts` — callGemini → callSonnet (CLI)
- `scripts/extract-keywords.ts` — inline Gemini fetch → callSonnet (CLI)
- `scripts/extract-faq.ts` — callClaude (API) + callGemini → callSonnet (CLI), removed A/B test split
- `scripts/generate-tier2.ts` — Anthropic SDK + callGemini → callSonnet (CLI), removed `@anthropic-ai/sdk` import
- `scripts/write-newsletter.ts` — Gemini ZH fallback → callSonnet (CLI), renamed `generateNewsletterWithGeminiZH` → `generateNewsletterWithSonnetZH`
- `scripts/daily-scout.ts` — Gemini Flash fallbacks → callSonnet (CLI), renamed `writeNewsletterWithGemini` → `writeNewsletterWithSonnet`, `writeNewsletterWithGeminiZH` → `writeNewsletterWithSonnetZH`
- `scripts/claude-writer.ts` — Opus API fetch → callOpus (CLI)
- **DELETED** `src/lib/gemini.ts` — no longer needed (all callers migrated)
- `CLAUDE.md` — Updated Content Tiers table (all tiers now $0 CLI)

### Known Issues
- CLI calls are synchronous (`execSync`); if a call hangs, it blocks the process until timeout (3 min default, 5 min for Opus)

---

## 2026-02-19 — Codebase Audit Batch 6: Content & Skills Fixes

### M12: Added `skills/newsletter-zh/SKILL.md`
- Created Chinese newsletter writing skill (previously missing; only EN existed)
- Independent creation following the same principle as blog writing — not a translation of the EN skill
- Uses "knowledgeable friend" tone consistent with `skills/blog-zh/SKILL.md`
- Includes Chinese punctuation conventions, terminology handling, and China ecosystem perspective

### M21: EN/ZH Newsletter Count Mismatch
- **EN newsletters:** 12 issues (Feb 8-19)
- **ZH newsletters:** 10 issues (Feb 8-17)
- ZH is 2 days behind (Feb 18 and Feb 19 missing)
- **Recommendation:** Run `write-newsletter.ts` for the missing dates to catch up ZH newsletters. The news items for those dates should still be in the DB within the 72h lookback window, or can be regenerated from the EN source items.

### L12: Removed Deprecated `localization` Fields from `research-gemini-narrative.py`
- Removed `localization.zh_strategy` and `localization.zh_hints` from the output schema
- These fields were deprecated in PRD v4.0 (Core Narrative is pure English; Chinese writers create independently)

### L15: Added `scripts/generate-roundup.ts` Stub
- Phase 2+ placeholder for monthly roundup generation
- Prints a "not yet implemented" message when run
- Referenced in PRD but no implementation existed

---

## 2026-02-15 — Newsletter Pipeline Refactor

### Architecture: Split Pipeline (#38)
**Commit:** `991eb45`, `9c4fb20`, `120a958`, `2d31127`

Separated `daily-scout.ts` (monolithic) into two independent scripts:

| Script | Role | Cron |
|---|---|---|
| `collect-news.ts` | Pure collection: all sources → dedup → DB insert | UTC 22:00 |
| `write-newsletter.ts` | DB 72h read → agent-filter → Opus EN/ZH → git push | UTC 23:00 |

**Why:** Collection and writing were coupled. Cross-day dedup happened before agent-filter, causing good items from the 72h window to be hard-filtered. Now DB accumulates all items, and the writer reads 72h full pool.

**DB change:** Added `getRecentItemsFull(db, hours)` in `src/lib/db.ts` — returns complete item data (not just URLs) for the past N hours.

### New Source: OpenAI Platform Changelog
- Scrapes `developers.openai.com/api/docs/changelog`
- Catches API features, model updates, and platform changes that don't appear on blogs or Twitter
- Items scored 85-92 depending on type (Feature > Update)

### Twitter Search: Added API Keywords
Added 3 new search queries: `"OpenAI Responses API"`, `"Claude API"`, `"OpenAI skills"`
- Catches high-engagement API/platform tweets from non-followed accounts

### Source Quality Controls

**Reddit hard cap (code-level, in `write-newsletter.ts`):**
- Pre-filter: sort all Reddit items by score, keep top 2 only
- Rationale: Reddit content is high-volume but inconsistent quality

**GitHub hard cap (code-level):**
- Pre-filter: sort by score (correlates with stars), keep top 3 only
- Titles now include star count: `owner/repo (⭐3,600)` for better agent assessment

### Prompt Updates

**Agent filter (`write-newsletter.ts`):**
- Changed "collected today" → "from the past 72 hours"
- Added: "When items from different days cover the same event, prefer the one with the most complete information"
- Added source quotas in prompt (Reddit max 2, GitHub max 3-4) as backup to code-level filtering

**EN/ZH newsletter writer:**
- Added rule #10: Changelog source citation format (`— OpenAI Changelog (Feb 10)`)

### Known Issues
- `UNIQUE constraint failed: content.slug` — non-fatal DB error on re-runs (same date slug exists). Needs upsert logic.
- ZH generation sometimes outputs meta-summary instead of actual newsletter. Workaround: use `--output-format text --max-turns 1 --print` flags instead of `--verbose`.

---

## 2026-02-14 — Newsletter Pipeline Established

- Daily cron: `0 23 * * *` (UTC 23:00 = SGT 7am)
- 72h lookback window, daily runs (overlap accepted for quality monitoring)
- Agent filter: Claude Opus via CLI, semantic selection of 20-25 items
- Newsletter writing: Claude Opus EN + ZH
- Sources: Twitter (accounts + search), Official blogs (Anthropic/OpenAI/Google/Meta/Mistral), HuggingFace, Hacker News, GitHub Trending, Reddit

---

## Architecture Reference

```
collect-news.ts (Cron UTC 22:00)
  ├── Tier 1: Official Blogs (Google AI RSS, Anthropic Eng/News, OpenAI Changelog)
  ├── Tier 2: Twitter (30+ accounts + keyword search)
  ├── Tier 4: Hacker News (top stories API)
  ├── Tier 5: GitHub (Search API, 3 query strategies)
  └── Tier 6: Reddit (4 subreddits, OAuth)
  → deduplicate → INSERT OR IGNORE → DB (data/loreai.db)

write-newsletter.ts (Cron UTC 23:00)
  ├── Read DB: 72h full items
  ├── Pre-filter: GitHub top 3, Reddit top 2
  ├── Agent filter: Claude Opus CLI → 20-25 items
  ├── Write EN: Claude Opus CLI + skills/newsletter-en/SKILL.md
  ├── Write ZH: Claude Opus CLI
  └── git push → Vercel auto-deploy
```
