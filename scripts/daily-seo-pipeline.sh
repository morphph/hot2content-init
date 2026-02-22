#!/bin/bash
# Daily SEO Pipeline (Track B)
# Runs after newsletter pipeline to generate SEO content from collected news
# Cron: 30 23 * * * (UTC 23:30 = SGT 07:30, 30min after newsletter)

export PATH="/home/ubuntu/.nvm/versions/node/v22.22.0/bin:/home/ubuntu/.npm-global/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export NVM_DIR="/home/ubuntu/.nvm"

cd /home/ubuntu/hot2content-init
source .env

DATE=$(TZ='Asia/Singapore' date +%Y-%m-%d)
LOG_FILE="/home/ubuntu/hot2content-init/logs/seo-pipeline.log"
STATUS_FILE="/home/ubuntu/hot2content-init/logs/seo-pipeline-status.json"
mkdir -p logs

notify() {
  local status="$1"
  local message="$2"
  echo "{\"date\":\"${DATE}\",\"status\":\"${status}\",\"message\":\"${message}\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"}" > "$STATUS_FILE"
  echo "$message"
}

echo "🔍 SEO Pipeline starting for ${DATE}..."

if timeout 3600 npx tsx scripts/seo-pipeline.ts --limit 10 2>&1; then
  notify "success" "✅ SEO pipeline ${DATE} complete"
else
  EXIT_CODE=$?
  if [ $EXIT_CODE -eq 124 ]; then
    notify "failed" "❌ SEO pipeline ${DATE} timed out (10min)"
  else
    notify "failed" "❌ SEO pipeline ${DATE} failed (exit $EXIT_CODE)"
  fi
  exit 1
fi
