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

npx tsx scripts/seo-pipeline.ts "$@" 2>&1 | tee -a logs/seo-pipeline.log

echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') — SEO pipeline complete" | tee -a logs/seo-pipeline.log
