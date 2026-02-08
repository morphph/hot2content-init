# Hot2Content — AI Content Engine

## 概述
输入话题 → AI 深度调研 → Core Narrative → 多平台内容 → SEO/GEO 长期流量

## 部署架构

**网站为主 + Telegram 推送通知**

- **网站 (loreai.dev)**: 每日自动生成内容，作为 source of truth
- **Telegram**: 通知渠道，提醒"今日内容已生成"，包含链接跳转网站
- **GitHub**: 代码仓库 + 可选的内容存储（output/ 目录）

**设计原则：**
1. 内容有固定的家 — 不在聊天记录里丢失
2. 可积累/回溯 — 网站上能看历史记录
3. 分享便捷 — 一个链接即可
4. Telegram 保持轻量 — 只负责提醒，不堆积长内容

## 技术栈
- 热点采集: WebFetch + twitterapi.io (scripts/twitter-collector.ts)
- 调研: Gemini 2.5 Pro Deep Research API (scripts/gemini-research.ts)
- 英文内容: Claude Opus (writer-en subagent)
- 中文内容: Kimi K2.5 (scripts/kimi-writer.ts)
- 编排: Claude Code Subagents (Task tool)
- 质量审核: Claude Sonnet (seo-reviewer subagent)

## Pipeline
trend-scout → dedup-checker → researcher → narrative-architect → (writer-en ∥ kimi-writer.ts) → seo-reviewer → 更新索引

## 核心约定
- Core Narrative (output/core-narrative.json) 是纯英文叙事中枢
- 中文博客由 Kimi K2.5 基于英文 Core Narrative + 调研报告独立创作，不是翻译
- output/topic-index.json 是去重数据源，pipeline 完成后追加，勿覆盖

## 运行
- /hot2content [话题] — 完整 pipeline
- /hot2content https://... — URL 模式
- /hot2content — 自动热点检测
- /hot2content-scout — 仅发现话题

## 环境变量
- GEMINI_API_KEY — Gemini 2.5 Pro API
- KIMI_API_KEY — Kimi K2.5 API (或 MOONSHOT_API_KEY)
- TWITTER_API_KEY — twitterapi.io API

## 质量标准
- Core Narrative 必须通过 validate-narrative.ts
- SEO ❌ 项必须修复
- 所有引用含来源链接
