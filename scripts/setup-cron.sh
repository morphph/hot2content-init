#!/usr/bin/env bash
# One-time setup: installs all cron jobs
set -euo pipefail

H="/home/ubuntu/hot2content-init"

cat > /tmp/mycron << CRONTAB
0 23 * * * $H/scripts/daily-newsletter.sh >> $H/logs/daily-newsletter.log 2>&1
0 2 * * * $H/scripts/daily-seo.sh >> $H/logs/seo-pipeline.log 2>&1
*/15 * * * * $H/scripts/auto-sync.sh 2>> $H/logs/auto-sync.log
CRONTAB

crontab /tmp/mycron
rm /tmp/mycron
echo "Crontab installed:"
crontab -l
