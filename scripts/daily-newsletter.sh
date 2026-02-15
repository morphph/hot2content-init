#!/bin/bash
# Daily Newsletter Auto-generation (v2 - split pipeline)
# Runs daily via crontab
# Step 1: collect-news.ts (fetch all sources → DB)
# Step 2: write-newsletter.ts (DB → filter → write → push)

# Ensure PATH includes node/npm binaries (cron has minimal PATH)
export PATH="/home/ubuntu/.nvm/versions/node/v22.22.0/bin:/home/ubuntu/.npm-global/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export NVM_DIR="/home/ubuntu/.nvm"

cd /home/ubuntu/hot2content-init
source .env

DATE=$(date -u +%Y-%m-%d)
STATUS_FILE="/home/ubuntu/hot2content-init/logs/last-run-status.json"
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

# Step 2: Write newsletter from DB data
echo "✍️ Step 2: Writing newsletter for ${DATE}..."
if npx tsx scripts/write-newsletter.ts; then
  echo "✅ Newsletter written and pushed"
else
  notify "failed" "❌ write-newsletter.ts failed for ${DATE}"
  exit 1
fi

notify "success" "✅ Newsletter pipeline complete for ${DATE}"
