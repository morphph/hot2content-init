#!/bin/bash
# Daily Newsletter Auto-generation
# Runs daily via crontab

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

# Run the scout script
echo "🔥 Starting daily scout for ${DATE}..."
if ! npx tsx scripts/daily-scout.ts; then
  notify "failed" "❌ daily-scout.ts failed for ${DATE}"
  exit 1
fi

# Find today's digest
if [ -f "output/digest-${DATE}.md" ]; then
  cp "output/digest-${DATE}.md" "content/newsletters/${DATE}.md"
  echo "✅ Copied digest for ${DATE}"
else
  LATEST=$(ls -t output/digest-*.md 2>/dev/null | head -1)
  if [ -n "$LATEST" ]; then
    BASENAME=$(basename "$LATEST" | sed 's/digest-//')
    cp "$LATEST" "content/newsletters/${BASENAME}"
    echo "✅ Copied $LATEST"
  else
    notify "failed" "❌ No digest files found for ${DATE}"
    exit 1
  fi
fi

# Commit and push
git add content/newsletters/
if git diff --staged --quiet; then
  notify "success" "✅ Newsletter ${DATE}: no new content (already up to date)"
else
  git commit -m "📰 Auto newsletter ${DATE}"
  if git push; then
    notify "success" "✅ Newsletter ${DATE} published successfully"
  else
    notify "failed" "❌ git push failed for ${DATE}"
    exit 1
  fi
fi
