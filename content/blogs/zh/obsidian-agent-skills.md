---
slug: obsidian-agent-skills
title: "Obsidian智能体技能 — 快速指南"
description: "Obsidian智能体技能实用快速指南，面向AI开发者和团队。"
keywords: ["Obsidian智能体技能", "Obsidian agent skills", "AI指南"]
date: 2026-02-28
tier: 3
lang: zh
type: blog
tags: ["快速阅读", "实用"]
---

# Obsidian智能体技能

**一句话总结：** kepano 开源的 obsidian-skills 让 AI 智能体（Agent）能直接操作 Obsidian 笔记库，把你的知识管理系统变成 AI 的工作台。

## 这是什么

Obsidian 创始人 kepano 在 GitHub 上发布了 [obsidian-skills](https://github.com/kepano/obsidian-skills) 项目（目前已获 11,430 星），提供一套标准化的技能文件，让 Claude、ChatGPT 等 AI 智能体学会使用 Obsidian 的核心功能：

- **Markdown 读写** — 创建、编辑、搜索笔记
- **Bases 数据库** — 操作类 Notion 的表格数据
- **JSON Canvas** — 生成和修改画布文件
- **CLI 命令行** — 通过 Obsidian CLI 执行本地操作

## 为什么重要

传统上 AI 只能"看"你的笔记内容，现在它能直接"动手"了。这意味着：

1. **自动化整理** — 让 AI 帮你归档、打标签、建立双链
2. **知识提取** — 从会议记录自动生成待办清单
3. **跨库操作** — 在多个 Vault 之间同步和搬运内容

## 快速上手

### 1. 克隆技能文件