---
slug: opus-4-6-is-now-available-in-kiro
title: "Opus 4.6 is now available in Kiro"
description: "关于Opus 4.6 is now available in Kiro及Claude Opus 4.6相关问题的专业解答。"
keywords: ["Claude Opus 4.6", "Opus 4.6 is now available in Kiro", "AI常见问题"]
date: 2026-02-26
tier: 3
lang: zh
type: faq
tags: ["常见问题", "AI"]
---

# Opus 4.6 is now available in Kiro

## Claude Opus 4.6 在 Kiro 中的可用性

Claude Opus 4.6 是 Anthropic 发布的最新旗舰模型，目前已在 Kiro IDE 和 Kiro CLI 中提供实验性支持。这款模型被 Anthropic 定位为迄今为止最强大的产品，特别擅长大规模代码库处理和复杂智能体（Agent）开发场景。

根据 Kiro 官方公告，Opus 4.6 的核心优势体现在三个方面：更周密的规划能力、更优秀的上下文理解，以及更强的调试能力。这些特性使其成为构建复杂 AI 应用的理想选择。

**使用门槛与计费：** Opus 4.6 目前以实验性功能的形式开放，仅限 Pro、Pro+ 和 Power 三个付费订阅层级的用户使用。在计费方面，该模型采用 2.2 倍信用点数乘数（credit multiplier），意味着使用成本是基础模型的 2.2 倍。

**区域可用性：** 除了默认区域外，Opus 4.6 现已在 eu-central-1（欧洲中部）区域上线，为欧洲用户提供更低延迟的访问体验。

### Kiro 是什么？它和 Claude Code 有什么区别？

Kiro 是 AWS 推出的 AI 驱动开发环境，包含 IDE 和命令行工具（CLI）两种形态。与 Anthropic 官方的 Claude Code 不同，Kiro 是 AWS 生态系统的一部分，专注于与 AWS 服务的深度集成。

两者的定位差异明显：Claude Code 是 Anthropic 的官方编程助手，直接调用 Claude API；Kiro 则是 AWS 的综合开发平台，支持多种模型选择，Opus 4.6 是其中之一。对于重度使用 AWS 基础设施的团队，Kiro 可能提供更顺畅的工作流整合。

### 如何在 Kiro CLI 中切换到 Opus 4.6？

根据 Kiro 官方文档，模型选择功能内置于 CLI 的聊天模式中。Pro 及以上订阅用户可以在会话中指定使用 Opus 4.6。具体的切换命令和配置方式，建议参考 Kiro 官方文档的 Model Selection 章节获取最新指引。

需要注意的是，由于 Opus 4.6 仍处于实验性支持阶段，部分功能的稳定性和可用性可能会随版本更新而变化。

### 2.2 倍信用点数乘数意味着什么？

Kiro 采用信用点数制度计费。2.2x 乘数意味着每次调用 Opus 4.6 消耗的信用点数是标准模型（如 Sonnet）的 2.2 倍。

举个例子：如果一次 Sonnet 调用消耗 1 个信用点，同等 token 数量的 Opus 4.6 调用则消耗 2.2 个信用点。这个定价反映了 Opus 系列作为旗舰模型的计算成本差异。对于日常开发任务，混合使用不同模型是控制成本的有效策略——简单任务用轻量模型，复杂推理和架构设计再调用 Opus。

### Opus 4.6 适合哪些使用场景？

根据 Kiro 官方描述，Opus 4.6 在以下场景表现突出：

- **大规模代码库重构**：模型具备更强的全局上下文理解能力，适合跨文件、跨模块的复杂修改
- **复杂智能体开发**：构建需要多步推理和工具调用的 AI Agent 时，规划能力的提升尤为关键
- **高难度调试**：面对隐蔽 bug 或复杂的系统交互问题，Opus 4.6 的推理深度能提供更有效的诊断

对于简单的代码补全或文档生成任务，使用 Sonnet 级别模型通常更具性价比。