---
slug: openai-responses-api-websockets
title: "OpenAI Responses API WebSocket 支持：Agent 开发者的低延迟利器"
description: "OpenAI 为 Responses API 新增 WebSocket 模式，专为工具调用密集的 Agent 场景优化，实测可降低 40% 端到端延迟。"
keywords:
  - "OpenAI Responses API WebSocket"
  - "OpenAI WebSocket 模式"
  - "AI Agent 低延迟"
  - "openai-python v2.22.0"
date: 2026-02-24
tier: 3
lang: zh
type: blog
tags: ["快速阅读", "实用"]
hreflang_en: /en/blog/openai-responses-api-websockets
---

# OpenAI Responses API WebSocket 支持：Agent 开发者的低延迟利器

**一句话总结：** OpenAI 为 Responses API 新增 WebSocket 模式，通过持久连接和增量输入，让工具调用密集的 Agent 工作流实现约 40% 的端到端延迟优化。

---

## 这次更新解决什么问题

如果你在构建 AI Agent，大概率遇到过这个痛点：Agent 需要反复调用工具（function calling），每次调用都是一次完整的 HTTP 请求。20 轮工具调用下来，光是网络握手的开销就很可观。

2026 年 2 月 23 日，OpenAI 发布 openai-python v2.22.0，核心功能就是为 Responses API 加入 [WebSocket 支持](https://developers.openai.com/api/docs/guides/websocket-mode)。官方推文直接点明定位：**专为低延迟、长时间运行、工具调用密集的 Agent 场景设计**。

## WebSocket 模式怎么用

### 基本原理

传统 REST 模式下，每轮对话都需要：建立连接 → 发送完整上下文 → 等待响应 → 关闭连接。

WebSocket 模式改为：建立一次连接 → 持续发送增量输入 → 持续接收流式响应。

关键在于 `previous_response_id` 参数——你只需要发送新增的输入内容，服务端会自动关联上一轮的上下文。

### 代码示例

**首次请求：**