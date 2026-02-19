#!/bin/bash
# Track B: SEO Auto-Pipeline
# Run daily at 02:00 UTC (1 hour after newsletter)
# Usage: bash scripts/daily-seo.sh [--dry-run]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Ensure logs directory
mkdir -p logs

echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — Starting SEO pipeline" | tee -a logs/seo-pipeline.log

# Step 1: Main SEO pipeline (extracts keywords from news → generates content → persists keywords to DB)
npx tsx scripts/seo-pipeline.ts "$@" 2>&1 | tee -a logs/seo-pipeline.log

# Step 2: Enrich backlog keywords with search volume/difficulty via Brave Search
echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — Enriching keywords" | tee -a logs/seo-pipeline.log
npx tsx scripts/keyword-enricher.ts 2>&1 | tee -a logs/seo-pipeline.log || echo "⚠️ keyword-enricher failed (non-fatal)"

# Step 3: PAA mining (every run — budget allows daily, ~60 calls/run)
echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — Mining PAA questions" | tee -a logs/seo-pipeline.log
npx tsx scripts/paa-miner.ts 2>&1 | tee -a logs/seo-pipeline.log || echo "⚠️ paa-miner failed (non-fatal)"

# Step 4: Content freshness updates (append update sections to stale articles)
echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — Updating stale content" | tee -a logs/seo-pipeline.log
npx tsx scripts/content-updater.ts 2>&1 | tee -a logs/seo-pipeline.log || echo "⚠️ content-updater failed (non-fatal)"

# Step 5: Export timeline data for SSG
echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — Exporting timeline data" | tee -a logs/seo-pipeline.log
npx tsx scripts/export-timeline-data.ts 2>&1 | tee -a logs/seo-pipeline.log || echo "⚠️ export-timeline-data failed (non-fatal)"

echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — SEO pipeline complete" | tee -a logs/seo-pipeline.log
