#!/usr/bin/env bash
# One-time setup: installs all cron jobs
set -euo pipefail

H="/home/ubuntu/hot2content-init"

cat > /tmp/mycron << CRONTAB
0 22 * * * $H/scripts/daily-newsletter.sh >> $H/logs/daily-newsletter.log 2>&1
0 5 * * * $H/scripts/daily-seo.sh >> $H/logs/seo-pipeline.log 2>&1
CRONTAB

crontab /tmp/mycron
rm /tmp/mycron
echo "Crontab installed:"
crontab -l
