---
slug: github-copilot-sdk-multi-platform
title: "GitHub Copilot SDK 多平台 — 快速指南"
description: "GitHub Copilot SDK 多平台实用快速指南，面向AI开发者和团队。"
keywords: ["GitHub Copilot SDK 多平台", "GitHub Copilot SDK multi-platform", "AI指南"]
date: 2026-02-16
tier: 3
lang: zh
type: blog
tags: ["快速阅读", "实用"]
---

# GitHub Copilot SDK 多平台

**一句话总结：** GitHub 开源了 Copilot SDK，让开发者能在任意平台和应用中集成 AI 编程助手能力。

## 这是什么

GitHub 近期在 Trending 榜单上线了 `github/copilot-sdk` 项目——一个多平台 SDK，用于将 GitHub Copilot Agent 集成到各类应用和服务中。这意味着 Copilot 的代码补全、对话、代码解释等能力不再局限于 VS Code 或 JetBrains 插件，而是可以嵌入到你自己的 CLI 工具、Web 应用、IDE 插件甚至移动端 App。

## 核心能力

SDK 提供三大核心模块：

1. **代码补全（Code Completion）**：流式返回代码建议，支持多语言
2. **对话接口（Chat API）**：与 Copilot Agent 进行多轮对话
3. **上下文管理（Context Management）**：传递文件、代码片段、项目结构等上下文

支持的平台包括：
- Node.js / TypeScript
- Python
- Go
- Rust（社区维护）

## 快速上手

以 TypeScript 为例，安装和初始化流程如下：