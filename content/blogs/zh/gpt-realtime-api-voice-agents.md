---
slug: gpt-realtime-api-voice-agents
title: "GPT 实时 API 语音代理 — 快速指南"
description: "GPT 实时 API 语音代理实用快速指南，面向AI开发者和团队。涵盖 gpt-realtime-1.5 模型、WebRTC/WebSocket 连接、工具调用配置。"
keywords: ["GPT 实时 API 语音代理", "GPT Realtime API voice agents", "gpt-realtime-1.5", "语音 Agent 开发", "OpenAI 语音 AI"]
date: 2026-02-27
tier: 3
lang: zh
type: blog
tags: ["快速阅读", "实用"]
---

# GPT 实时 API 语音代理 — 快速指南

**一句话总结：** 用 OpenAI 的 gpt-realtime-1.5 和 Agents SDK，可以在 50 行代码内搭建一个支持工具调用和多轮对话的生产级语音 Agent。

---

## 背景：为什么要用 Realtime API

OpenAI 近期发布了[餐厅语音 Agent 的实现案例](https://t.co/m23FBmJDOP)，展示了 gpt-realtime-1.5 在实际业务场景中的能力。这不是简单的 STT → LLM → TTS 管道，而是端到端的语音到语音模型，延迟低到可以实现自然对话。

gpt-realtime-1.5 的关键提升：
- **指令遵循 +7%**：长对话中保持角色一致性
- **工具调用更可靠**：准确识别用户意图，正确触发 function calling
- **多语言准确性 +10.23%**：尤其是字母数字混合场景（如电话号码、订单号）

## 两种架构选择

### 方案一：Speech-to-Speech（推荐）

直接用 gpt-realtime-1.5 处理音频输入输出，延迟最低。