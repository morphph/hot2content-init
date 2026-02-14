---
term: "MCP（模型上下文协议）"
slug: mcp-model-context-protocol
lang: zh
category: AI 基础设施
definition: "一种开放协议，标准化 AI 模型连接外部工具、数据源和服务的方式，使代理能够超越文本生成与真实世界交互。"
related: [function-calling, agentic-coding, agent-teams]
date: 2026-02-10
source_topic: mcp-protocol
keywords:
  - "模型上下文协议"
  - "MCP"
  - "AI 工具集成"
---

## 什么是 MCP（模型上下文协议）？

MCP（Model Context Protocol，模型上下文协议）是由 Anthropic 开发的开放标准，定义了 AI 模型如何与外部工具和数据源通信。可以将其理解为"AI 的 USB-C"——一个通用连接器，让任何 AI 模型通过标准化接口与任何工具对话。

在 MCP 之前，每个 AI 工具集成都需要自定义代码。MCP 用一个协议取代了这些，任何工具提供商都可以实现。

## 工作原理

MCP 使用客户端-服务器架构：

- **MCP 客户端**：需要访问外部工具的 AI 应用（如 Claude Code、Cursor）
- **MCP 服务器**：暴露工具能力的轻量级服务（如 GitHub MCP 服务器、数据库 MCP 服务器）
- **协议**：基于 JSON-RPC 的通信，定义工具发现、调用和结果处理

当 AI 代理需要使用工具时，它发现可用的 MCP 服务器、查询其能力、通过标准化协议调用功能。代理无需了解实现细节——只需工具的接口。

## 为什么重要

MCP 在 2026 年正在改变 AI 工具生态：

- **互操作性**：为 Claude 构建的工具可以与任何兼容 MCP 的模型一起使用
- **生态增长**：开发者构建一个 MCP 服务器，处处可用——减少碎片化
- **代理能力**：MCP 使代理能与数据库、API、云服务、浏览器等交互
- **安全性**：协议包含权限模型和沙箱机制，让用户控制代理可以访问什么工具
- **可组合性**：代理可以同时连接多个 MCP 服务器，动态组合能力

2026 年主要的 MCP 服务器包括 GitHub、PostgreSQL、Slack、Google Drive、AWS 以及数百个社区构建的集成。MCP 已成为 AI 工具连接的事实标准。

## 相关术语

- **Function Calling**：模型级别调用结构化函数的能力；MCP 跨工具标准化了这一点
- **Agentic Coding**：代理通过 MCP 使用工具自主完成任务的开发范式
- **Agent Teams**：多个代理可各自连接不同的 MCP 服务器获取专门能力
