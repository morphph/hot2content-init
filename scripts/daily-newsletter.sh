#!/bin/bash
# Daily Newsletter Auto-generation
# Runs daily via crontab

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

# Run the scout script
echo "🔥 Starting daily scout for ${DATE}..."
if ! npx tsx scripts/daily-scout.ts; then
  notify "failed" "❌ daily-scout.ts failed for ${DATE}"
  exit 1
fi

# Copy EN digest
if [ -f "output/digest-${DATE}.md" ]; then
  mkdir -p content/newsletters/en
  cp "output/digest-${DATE}.md" "content/newsletters/en/${DATE}.md"
  echo "✅ Copied EN digest for ${DATE}"
else
  LATEST=$(ls -t output/digest-*.md 2>/dev/null | grep -v 'digest-zh-' | head -1)
  if [ -n "$LATEST" ]; then
    BASENAME=$(basename "$LATEST" | sed 's/digest-//')
    mkdir -p content/newsletters/en
    cp "$LATEST" "content/newsletters/en/${BASENAME}"
    echo "✅ Copied EN $LATEST"
  else
    notify "failed" "❌ No digest files found for ${DATE}"
    exit 1
  fi
fi

# Copy ZH digest
if [ -f "output/digest-zh-${DATE}.md" ]; then
  mkdir -p content/newsletters/zh
  cp "output/digest-zh-${DATE}.md" "content/newsletters/zh/${DATE}.md"
  echo "✅ Copied ZH digest for ${DATE}"
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
