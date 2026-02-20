---
slug: deerflow-multi-agent-framework
title: "DeerFlow 多代理框架（DeerFlow multi-agent framework）— 定义、原理与应用"
description: "了解DeerFlow 多代理框架的含义、工作原理以及对开发者和企业的重要性。"
keywords: ["DeerFlow 多代理框架", "DeerFlow multi-agent framework", "AI术语", "多智能体系统", "字节跳动开源"]
date: 2026-02-16
tier: 3
lang: zh
type: glossary
tags: ["术语表", "AI", "开源框架"]
---

# DeerFlow 多代理框架（DeerFlow multi-agent framework）

## 定义

DeerFlow 是字节跳动开源的多代理（multi-agent）协作框架，定位为"SuperAgent harness"——一个能够调度多个子代理（subagent）协同完成复杂任务的编排系统。该框架整合了沙箱执行环境、持久化记忆、工具调用、技能库等核心能力，支持从简单查询到耗时数小时的深度研究任务。

## 为什么重要

单一大语言模型（LLM）在处理多步骤、跨领域任务时存在明显局限：上下文窗口有限、缺乏状态持久化、难以执行真实代码。DeerFlow 通过多代理架构突破这些瓶颈，让不同专长的代理各司其职——研究代理负责信息检索、编码代理处理代码生成、创作代理输出内容——再由主代理统一调度。

字节跳动将 DeerFlow 开源并登上 GitHub Trending，标志着国内大厂在 AI Agent 基础设施层面的技术输出。对开发者而言，这提供了一个经过大规模验证的多代理参考实现；对企业而言，开源许可降低了构建复杂 AI 工作流的门槛。

## 工作原理

DeerFlow 采用分层架构：

1. **主代理（Orchestrator）**：解析用户意图，拆解任务，决定调用哪些子代理
2. **子代理池**：包含研究、编码、创作等专项代理，每个代理可配置独立的 LLM 后端和工具集
3. **沙箱环境**：隔离执行代码，防止危险操作影响宿主系统
4. **记忆层（Memory）**：跨会话保存上下文，支持长周期任务的状态恢复
5. **技能库（Skills）**：可复用的任务模板，减少重复编排开销

任务执行时，主代理将复杂请求分解为子任务，分配给对应子代理并行或串行处理，最终汇总结果返回用户。

## 相关术语

- **多智能体系统（Multi-Agent System）**：多个自主代理协作解决问题的计算范式
- **LangGraph**：LangChain 推出的图结构代理编排框架
- **AutoGen**：微软开源的多代理对话框架
- **工具调用（Tool Use）**：LLM 通过结构化接口调用外部功能的能力
- **ReAct**：结合推理（Reasoning）与行动（Acting）的代理提示策略

## 延伸阅读

- [bytedance/deer-flow - GitHub](https://github.com/bytedance/deer-flow)