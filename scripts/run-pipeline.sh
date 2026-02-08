#!/bin/bash
#
# Hot2Content Pipeline Runner
# 
# 用法:
#   ./scripts/run-pipeline.sh "话题关键词"
#   ./scripts/run-pipeline.sh  # 使用默认话题
#
# Cron 示例 (每天早上 8 点跑):
#   0 8 * * * cd /home/ubuntu/hot2content-init && ./scripts/run-pipeline.sh "AI 热点" >> logs/pipeline.log 2>&1
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# 创建日志目录
mkdir -p logs

# 日期时间戳
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="logs/pipeline_${TIMESTAMP}.log"

echo "═══════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "  🚀 Hot2Content Pipeline" | tee -a "$LOG_FILE"
echo "  Started: $(date)" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"

# 运行 orchestrator
if [ -n "$1" ]; then
    echo "Topic: $1" | tee -a "$LOG_FILE"
    npx tsx scripts/orchestrator.ts "$1" 2>&1 | tee -a "$LOG_FILE"
else
    echo "Topic: (default)" | tee -a "$LOG_FILE"
    npx tsx scripts/orchestrator.ts 2>&1 | tee -a "$LOG_FILE"
fi

EXIT_CODE=$?

echo "" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "  Finished: $(date)" | tee -a "$LOG_FILE"
echo "  Exit code: $EXIT_CODE" | tee -a "$LOG_FILE"
echo "  Log: $LOG_FILE" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"

exit $EXIT_CODE
