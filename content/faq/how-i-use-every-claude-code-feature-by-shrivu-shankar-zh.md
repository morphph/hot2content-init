---
slug: how-i-use-every-claude-code-feature-by-shrivu-shankar
title: "How I Use Every Claude Code Feature - by Shrivu Shankar"
description: "关于How I Use Every Claude Code Feature - by Shrivu Shankar及Claude Code相关问题的专业解答。"
keywords: ["Claude Code", "How I Use Every Claude Code Feature - by Shrivu Shankar", "AI常见问题"]
date: 2026-02-25
tier: 3
lang: zh
type: faq
tags: ["常见问题", "AI"]
---

# How I Use Every Claude Code Feature - by Shrivu Shankar

## Shrivu Shankar 的 Claude Code 使用指南讲了什么？

Shrivu Shankar 是一位 Claude Code 深度用户，他撰写了一篇详尽的功能指南，覆盖了从基础配置到高级自动化的完整使用场景。这篇文章被 Simon Willison 评价为"详细且实用"，特别适合个人开发者和团队项目配置参考。

指南核心内容包括：

**基础配置层**：`CLAUDE.md` 文件是 Claude Code 的项目指令中心，开发者可以在这里定义代码规范、项目上下文和工作流程偏好。这个文件让 Claude 能够理解特定项目的需求，而不是给出泛泛的通用建议。

**自定义命令**：通过自定义斜杠命令（Slash Commands），可以把常用操作封装成一键触发的工作流。比如 `/review` 触发代码审查流程，`/deploy` 执行部署检查清单。

**进阶功能**：文章深入讲解了子代理（Subagents）、钩子（Hooks）和 GitHub Actions 集成。子代理允许 Claude 在运行时动态定义任务，这样上下文信息既能被主任务看到，又能享受子代理带来的隔离执行优势。

Shankar 特别提到，他不仅分享了常用功能，也明确指出哪些功能他选择不用——这种"有所为有所不为"的实战经验对新手尤其有参考价值。

### CLAUDE.md 文件具体怎么用？

`CLAUDE.md` 是放在项目根目录的指令文件，Claude Code 启动时会自动读取。你可以在里面写：

- 项目技术栈说明（框架、语言版本、依赖管理）
- 代码风格规范（命名约定、目录结构）
- 关键文件路径和用途
- 特定的工作流程（比如"修改代码后必须运行测试"）

实际效果是 Claude 的回答会更贴合你的项目实际，而不是给出脱离上下文的通用代码。

### 什么是 Claude Code 子代理（Subagents）？

子代理是 Claude Code 的任务分发机制。当你通过 Task 工具启动子代理时，它会在独立的上下文中执行特定任务，完成后把结果返回给主对话。

根据 Shankar 的解释，子代理的一个关键技巧是"让 Claude 动态定义子代理任务"。这样做的好处是：主任务的上下文信息对其他任务可见，同时又能获得子代理执行带来的隔离性和专注性。

常见用法包括：探索代码库、运行测试、执行特定文件搜索等。

### Hooks 功能能做什么？

Hooks 是 Claude Code 的事件钩子系统，允许你在特定操作发生时自动触发 shell 命令。比如：

- 在每次文件保存后自动运行 linter
- 在执行某些工具调用前进行权限检查
- 在代码提交前自动运行测试套件

这让 Claude Code 可以无缝融入现有的开发工作流，而不是作为一个孤立的工具存在。

### 这篇指南适合什么水平的开发者？

从内容深度看，这篇指南适合已经用过 Claude Code 基础功能、想要提升效率的中级用户。完全的新手可能需要先熟悉基本操作。

对于团队负责人，文章中关于"为大型团队项目配置 Claude Code"的部分特别有价值——如何让整个团队共享统一的 AI 辅助开发体验，是很多组织面临的实际问题。

指南原文地址：[blog.sshh.io/p/how-i-use-every-claude-code-feature](https://blog.sshh.io/p/how-i-use-every-claude-code-feature)