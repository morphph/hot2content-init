---
slug: claude-code-subagents-collection
title: "Claude Code 子代理集合 — 快速指南"
description: "Claude Code 子代理集合实用快速指南，面向AI开发者和团队。"
keywords: ["Claude Code 子代理集合", "Claude Code subagents collection", "AI指南"]
date: 2026-02-24
tier: 3
lang: zh
type: blog
tags: ["快速阅读", "实用"]
---

# Claude Code 子代理集合

**一句话总结：** VoltAgent 开源的 awesome-claude-code-subagents 仓库收录了 100+ 专用子代理（subagent），让你用一行配置就能给 Claude Code 加上代码审查、测试生成、文档写作等专业能力。

## 这是什么

Claude Code 的子代理系统允许你定义专门处理特定任务的 AI 助手。主代理在遇到复杂工作时，会自动把任务分派给对应的子代理——就像一个技术主管把不同工作分给团队里的专家。

VoltAgent/awesome-claude-code-subagents 在 GitHub 上已获得超过 11,000 星标，收录了覆盖开发全流程的子代理集合。

## 核心子代理分类

**代码质量类**
- `code-reviewer`: 自动审查 PR，检查代码风格和潜在 bug
- `test-writer`: 根据实现代码生成单元测试
- `refactor-assistant`: 识别代码异味并提供重构建议

**文档类**
- `doc-generator`: 从代码注释生成 API 文档
- `readme-writer`: 分析项目结构，生成 README
- `changelog-keeper`: 追踪 git 历史，自动更新变更日志

**DevOps 类**
- `dockerfile-builder`: 根据项目依赖生成优化的 Dockerfile
- `ci-config`: 为 GitHub Actions / GitLab CI 生成配置
- `k8s-helper`: 生成 Kubernetes 部署清单

## 快速上手

**1. 克隆仓库**