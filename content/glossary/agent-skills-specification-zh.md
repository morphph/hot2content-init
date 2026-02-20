---
slug: agent-skills-specification
title: "Agent Skills 规范（Agent Skills specification）— 定义、原理与应用"
description: "了解Agent Skills 规范的含义、工作原理以及对开发者和企业的重要性。"
keywords: ["Agent Skills 规范", "Agent Skills specification", "AI术语", "AI Agent", "技能扩展"]
date: 2026-02-17
tier: 3
lang: zh
type: glossary
tags: ["术语表", "AI", "Agent Skills"]
---

# Agent Skills 规范（Agent Skills specification）

## 定义

Agent Skills 规范是一套开放标准，定义了 AI 代理（AI Agent）如何发现、加载和执行可复用技能模块。该规范通过标准化的元数据格式和执行协议，使不同厂商的 AI 代理能够共享同一套技能生态系统。简单来说，它让 AI 代理像安装应用一样获取新能力。

## 为什么重要

2026 年 2 月，Anthropic 宣布将 Agent Skills 作为开放标准发布，这标志着 AI 代理生态从封闭走向互通。此前，Claude Code、OpenAI Codex、Gemini CLI 等工具各自维护独立的扩展体系，开发者需要为每个平台重复开发相似功能。开放标准打破了这一壁垒。

对开发者而言，一次编写的技能可在多个 AI 代理中运行，降低了维护成本。对企业用户而言，技能市场的形成意味着可以快速组装符合业务需求的 AI 工作流，无需从零开发。GitHub Trending 上 agentskills/agentskills 仓库已获得近万星标，awesome-agent-skills 项目收录了 300 多个社区贡献的技能，生态增长速度可见一斑。

## 工作原理

Agent Skills 规范的核心是一个 JSON 或 YAML 格式的清单文件（manifest），声明技能的名称、版本、触发条件、输入输出参数和执行入口。AI 代理在启动时扫描本地或远程技能仓库，解析清单并注册可用技能。

当用户发出指令时，代理的意图识别模块判断是否匹配某个技能的触发模式。若匹配，代理将上下文参数传入技能执行器，执行器可以是本地脚本、容器化服务或远程 API 调用。执行结果返回后，代理将其整合进对话流程或后续操作链。

规范还定义了权限模型，技能需显式声明所需的文件系统、网络或工具访问权限，代理在首次加载时向用户请求授权，确保安全可控。

## 相关术语

- **AI Agent（AI 代理）**：能够自主规划、执行多步骤任务的智能程序。
- **MCP（Model Context Protocol）**：Anthropic 提出的模型上下文协议，用于标准化代理与外部工具的通信。
- **Function Calling（函数调用）**：大语言模型（LLM）调用外部函数的能力，是技能执行的底层机制之一。
- **Prompt Engineering（提示工程）**：设计高效提示词以引导模型行为的技术。
- **Tool Use（工具使用）**：AI 模型通过调用外部工具完成任务的范式。

## 延伸阅读

- [Agent Skills 官方规范仓库](https://github.com/agentskills/agentskills)
- [awesome-agent-skills：300+ 社区技能合集](https://github.com/VoltAgent/awesome-agent-skills)
- [Alex Albert 关于开放标准的公告](https://twitter.com/alexalbert__)