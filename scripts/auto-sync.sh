#!/usr/bin/env bash
# Auto-sync: polls origin/main every 15 min via cron, pulls if behind,
# regenerates dashboard data if code changed.
# Crontab: */15 * * * * /home/ubuntu/hot2content-init/scripts/auto-sync.sh 2>> /home/ubuntu/hot2content-init/logs/auto-sync.log

set -euo pipefail

PROJECT_DIR="/home/ubuntu/hot2content-init"
LOG="$PROJECT_DIR/logs/auto-sync.log"

# Same PATH/NVM setup as daily-newsletter.sh and daily-seo.sh
export PATH="/home/ubuntu/.nvm/versions/node/v22.22.0/bin:/home/ubuntu/.npm-global/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export NVM_DIR="/home/ubuntu/.nvm"

cd "$PROJECT_DIR"
source .env 2>/dev/null || true
mkdir -p logs

# Fetch latest
git fetch origin main --quiet

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

# Nothing to do if already up to date
if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0
fi

echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') Syncing: ${LOCAL:0:7} → ${REMOTE:0:7}" >> "$LOG"

# Pull (fast-forward only — same as cron scripts)
git pull --rebase origin main >> "$LOG" 2>&1

# Regenerate dashboard data with new code
npx tsx scripts/generate-dashboard-data.ts >> "$LOG" 2>&1

# Push updated dashboard data if changed
git add content/dashboard-data.json
if ! git diff --staged --quiet; then
  git commit -m "Auto-sync: regenerate dashboard data" >> "$LOG" 2>&1
  git push origin main >> "$LOG" 2>&1
  echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') Dashboard data pushed" >> "$LOG"
fi
