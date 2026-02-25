---
slug: letta-stateful-ai-agents
title: "Letta 有状态 AI 代理（Letta stateful AI agents）— 定义、原理与应用"
description: "了解Letta 有状态 AI 代理的含义、工作原理以及对开发者和企业的重要性。"
keywords: ["Letta 有状态 AI 代理", "Letta stateful AI agents", "AI术语"]
date: 2026-02-25
tier: 3
lang: zh
type: glossary
tags: ["术语表", "AI"]
---

# Letta 有状态 AI 代理（Letta stateful AI agents）

## 定义

Letta 有状态 AI 代理是一种具备持久记忆能力的智能代理系统。与传统的无状态对话模型不同，Letta 代理能够跨会话保留上下文信息，随着交互不断学习并自我改进。这种架构让 AI 代理拥有类似人类的长期记忆，可以记住用户偏好、历史对话和任务进度。

## 为什么重要

传统大语言模型（LLM）的上下文窗口有限，每次对话结束后状态即清空。这导致用户需要反复解释背景，AI 助手也无法建立持续的用户画像。Letta 通过引入有状态架构，解决了这一核心痛点。

Letta 项目在 GitHub 上已获得超过 21,000 星标，反映出开发者社区对有状态 AI 代理的强烈需求。企业级应用场景尤其受益：客服机器人能记住客户历史问题，编程助手能追踪项目进展，个人 AI 助理能持续优化服务。

## 工作原理

Letta 的核心设计包含三层记忆系统：

- **核心记忆（Core Memory）**：存储用户基本信息和关键偏好，类似工作记忆
- **归档记忆（Archival Memory）**：长期存储历史对话和重要事件，支持向量检索
- **回溯记忆（Recall Memory）**：近期对话的滑动窗口，用于维持会话连贯性

代理通过自主管理这些记忆层，决定哪些信息需要持久化、哪些可以遗忘。开发者可通过 Letta SDK 构建代理，并使用 Letta Cloud 或自托管服务器部署。整个系统支持工具调用（Tool Use）和多代理编排（Multi-agent Orchestration），适合构建复杂的自动化工作流。

## 相关术语

- **上下文窗口（Context Window）**：LLM 单次能处理的最大 token 数量
- **RAG（检索增强生成）**：通过检索外部知识库增强模型回答的技术
- **代理框架（Agent Framework）**：用于构建自主 AI 代理的开发工具集
- **向量数据库（Vector Database）**：存储和检索语义嵌入向量的专用数据库
- **长期记忆（Long-term Memory）**：AI 系统跨会话持久化信息的能力

## 延伸阅读

- [Letta 官方 GitHub 仓库](https://github.com/letta-ai/letta)
- [Letta 文档：构建有状态代理](https://docs.letta.com)