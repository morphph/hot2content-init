#!/bin/bash
# Track B: SEO Auto-Pipeline
# Run daily at 05:00 UTC (1pm SGT) — 3h gap after last morning job
# Usage: bash scripts/daily-seo.sh [--dry-run]

set -euo pipefail

# Ensure PATH includes node/npm binaries (cron has minimal PATH)
export PATH="/home/ubuntu/.nvm/versions/node/v22.22.0/bin:/home/ubuntu/.npm-global/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export NVM_DIR="/home/ubuntu/.nvm"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"
source .env

# Ensure logs directory
mkdir -p logs

# Pull latest code before running
git pull --rebase 2>&1 | tee -a logs/seo-pipeline.log || { echo "❌ git pull failed" | tee -a logs/seo-pipeline.log; exit 1; }

echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — Starting SEO pipeline" | tee -a logs/seo-pipeline.log

# Step 1: Main SEO pipeline (extracts keywords from news → generates content → persists keywords to DB)
npx tsx scripts/seo-pipeline.ts "$@" 2>&1 | tee -a logs/seo-pipeline.log

# Step 2: Enrich backlog keywords with search volume/difficulty via Brave Search
echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — Enriching keywords" | tee -a logs/seo-pipeline.log
npx tsx scripts/keyword-enricher.ts 2>&1 | tee -a logs/seo-pipeline.log || echo "⚠️ keyword-enricher failed (non-fatal)"

# Step 3: PAA mining (every run — budget allows daily, ~60 calls/run)
echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — Mining PAA questions" | tee -a logs/seo-pipeline.log
npx tsx scripts/paa-miner.ts 2>&1 | tee -a logs/seo-pipeline.log || echo "⚠️ paa-miner failed (non-fatal)"

# Step 4: Consume PAA questions → generate FAQ pages
echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — Generating FAQ from PAA questions" | tee -a logs/seo-pipeline.log
npx tsx scripts/generate-paa-faq.ts 2>&1 | tee -a logs/seo-pipeline.log || echo "⚠️ generate-paa-faq failed (non-fatal)"

# Step 5: Content freshness updates (append update sections to stale articles)
echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — Updating stale content" | tee -a logs/seo-pipeline.log
npx tsx scripts/content-updater.ts 2>&1 | tee -a logs/seo-pipeline.log || echo "⚠️ content-updater failed (non-fatal)"

# Step 6: Export timeline data for SSG
echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — Exporting timeline data" | tee -a logs/seo-pipeline.log
npx tsx scripts/export-timeline-data.ts 2>&1 | tee -a logs/seo-pipeline.log || echo "⚠️ export-timeline-data failed (non-fatal)"

# Step 6.5: Refresh dashboard data
echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — Generating dashboard data" | tee -a logs/seo-pipeline.log
npx tsx scripts/generate-dashboard-data.ts 2>&1 | tee -a logs/seo-pipeline.log || echo "⚠️ Dashboard generation failed (non-fatal)"

# Step 7: Verify build before committing
echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — Verifying build" | tee -a logs/seo-pipeline.log
if ! npm run build 2>&1 | tee -a logs/seo-pipeline.log; then
  echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — ❌ Build failed — skipping commit" | tee -a logs/seo-pipeline.log
  exit 1
fi

# Step 8: Commit and push generated content
echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — Git commit + push" | tee -a logs/seo-pipeline.log
git add content/
if ! git diff --staged --quiet 2>/dev/null; then
  git commit -m "🤖 Auto SEO content $(date -u +%Y-%m-%d)" 2>&1 | tee -a logs/seo-pipeline.log
  # Retry push (handles concurrent pushes from OpenClaw)
  for i in 1 2 3; do
    git push 2>&1 | tee -a logs/seo-pipeline.log && break
    echo "⚠️ Push failed (attempt $i/3), rebasing..." | tee -a logs/seo-pipeline.log
    git pull --rebase origin main 2>&1 | tee -a logs/seo-pipeline.log || { echo "❌ Rebase failed" | tee -a logs/seo-pipeline.log; exit 1; }
  done
  echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — Pushed to remote" | tee -a logs/seo-pipeline.log
else
  echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — No new content to push" | tee -a logs/seo-pipeline.log
fi

echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — SEO pipeline complete" | tee -a logs/seo-pipeline.log
