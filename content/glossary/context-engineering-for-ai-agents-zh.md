---
slug: context-engineering-for-ai-agents
title: "AI 代理的上下文工程（Context Engineering for AI Agents）— 定义、原理与应用"
description: "了解AI 代理的上下文工程的含义、工作原理以及对开发者和企业的重要性。"
keywords: ["AI 代理的上下文工程", "context engineering for AI agents", "AI术语", "提示工程", "多代理系统"]
date: 2026-02-16
tier: 3
lang: zh
type: glossary
tags: ["术语表", "AI", "代理系统"]
---

# AI 代理的上下文工程（Context Engineering for AI Agents）

## 定义

上下文工程是一种系统化设计和管理 AI 代理（AI Agent）输入信息的方法论。它超越了传统的提示工程（Prompt Engineering），不仅关注单次对话的提示词，还涵盖记忆管理、工具调用结果、多代理协作信息以及外部知识的动态整合。核心目标是在有限的上下文窗口（Context Window）内，为代理提供最相关、最高效的信息组合。

## 为什么重要

随着 AI 代理从简单的问答系统演进为能够执行复杂任务的自主系统，上下文管理成为性能瓶颈。大语言模型（LLM）的上下文窗口虽然不断扩大，但计算成本与窗口长度成正比，且过长的上下文会导致"中间遗忘"问题——模型对中间位置的信息关注度下降。

2026 年初，GitHub 上涌现的 Agent-Skills-for-Context-Engineering 项目（已获 8,000+ stars）和 get-shit-done 等元提示系统，反映出开发者社区对这一领域的迫切需求。生产级代理系统需要在多轮交互中保持一致性、在多代理架构中高效传递信息，这些都依赖精细的上下文工程。

## 工作原理

上下文工程通常包含以下技术组件：

- **记忆分层**：将信息分为工作记忆（当前任务）、短期记忆（近期交互）和长期记忆（持久化知识），按需检索而非全量加载
- **动态压缩**：对历史对话和工具输出进行摘要，保留关键信息，释放上下文空间
- **相关性排序**：基于向量相似度或规则引擎，筛选与当前任务最相关的上下文片段
- **结构化注入**：将系统指令、用户偏好、环境状态以结构化格式（如 JSON 或 XML 标签）组织，便于模型解析

在多代理系统中，上下文工程还涉及代理间的信息路由——决定哪些上下文传递给下游代理，避免信息过载或关键信息丢失。

## 相关术语

- **提示工程（Prompt Engineering）**：设计有效提示词以引导模型输出的技术
- **检索增强生成（RAG）**：从外部知识库检索相关文档并注入上下文
- **多代理系统（Multi-Agent System）**：多个 AI 代理协作完成复杂任务的架构
- **上下文窗口（Context Window）**：模型单次处理的最大 token 数量限制

## 延伸阅读

- [Agent-Skills-for-Context-Engineering](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) — 面向生产级代理系统的上下文工程技能库
- [get-shit-done](https://github.com/gsd-build/get-shit-done) — 轻量级元提示与规范驱动开发系统