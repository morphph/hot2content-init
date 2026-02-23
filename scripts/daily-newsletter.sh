#!/bin/bash
# Daily Newsletter Auto-generation (v2 - split pipeline)
# Runs daily via crontab
# Step 1: collect-news.ts (fetch all sources → DB)
# Step 2: write-newsletter.ts (DB → filter → write → push)

# Ensure PATH includes node/npm binaries (cron has minimal PATH)
export PATH="/home/ubuntu/.nvm/versions/node/v22.22.0/bin:/home/ubuntu/.npm-global/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export NVM_DIR="/home/ubuntu/.nvm"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"
source .env

# Pull latest code before running (use merge instead of rebase to avoid conflicts)
git stash --include-untracked 2>/dev/null
git pull --no-rebase || git pull --ff-only || { echo "⚠️ git pull failed, resetting to origin/main"; git fetch origin && git reset --hard origin/main; }
git stash pop 2>/dev/null

DATE=$(TZ='Asia/Singapore' date +%Y-%m-%d)
STATUS_FILE="${PROJECT_DIR}/logs/last-run-status.json"
mkdir -p logs

notify() {
  local status="$1"
  local message="$2"
  echo "{\"date\":\"${DATE}\",\"status\":\"${status}\",\"message\":\"${message}\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$STATUS_FILE"
  echo "$message"
}

# Step 1: Collect news from all sources into DB
echo "📡 Step 1: Collecting news for ${DATE}..."
if npx tsx scripts/collect-news.ts; then
  echo "✅ News collection complete"
else
  notify "failed" "❌ collect-news.ts failed for ${DATE}"
  exit 1
fi

# Step 2: Freshness detection (match new news against existing blogs)
echo "🔄 Step 2: Detecting freshness signals..."
if npx tsx scripts/freshness-detector.ts; then
  echo "✅ Freshness detection complete"
else
  echo "⚠️ freshness-detector.ts failed (non-fatal)"
fi

# Step 3: Write newsletter from DB data
echo "✍️ Step 3: Writing newsletter for ${DATE}..."
if npx tsx scripts/write-newsletter.ts; then
  echo "✅ Newsletter written and pushed"
else
  notify "failed" "❌ write-newsletter.ts failed for ${DATE}"
  exit 1
fi

notify "success" "✅ Newsletter pipeline complete for ${DATE}"

# Step 4: Verify build before committing
echo "🔨 Step 4: Verifying build..."
if ! npm run build 2>&1 | tail -5; then
  notify "failed" "❌ Build verification failed for ${DATE} — skipping commit"
  exit 1
fi

# Step 5: Refresh dashboard data
echo "📊 Step 5: Generating dashboard data..."
npx tsx scripts/generate-dashboard-data.ts || echo "⚠️ Dashboard generation failed (non-fatal)"
git add content/dashboard-data.json 2>/dev/null
if ! git diff --staged --quiet 2>/dev/null; then
  git commit -m "📊 Dashboard data ${DATE}" 2>/dev/null
  git push 2>/dev/null
fi
