---
name: hot2content-scout
description: 只运行热点发现 + 去重检查，不生成内容。
---

## Step 1
用 Task tool 启动 **trend-scout**。等待完成。

## Step 2
用 Task tool 启动 **dedup-checker**。等待完成。

## Step 3
向用户展示：Top 3 话题及评分 + 去重结果 + 推荐。
询问是否对某个话题运行完整 /hot2content pipeline。
