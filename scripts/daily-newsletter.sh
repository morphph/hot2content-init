#!/bin/bash
# Daily Newsletter Auto-generation
# Runs daily via crontab

set -e

cd /home/ubuntu/hot2content-init
source .env

# Run the scout script
npx tsx scripts/daily-scout.ts

# Find today's digest
DATE=$(date -u +%Y-%m-%d)
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
    echo "❌ No digest files found"
    exit 1
  fi
fi

# Commit and push
git add content/newsletters/
if git diff --staged --quiet; then
  echo "No new content to commit"
else
  git commit -m "📰 Auto newsletter ${DATE}"
  git push
  echo "✅ Pushed to GitHub, Vercel will auto-deploy"
fi
