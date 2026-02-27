---
slug: notion-custom-agents-autonomous-workflows
title: "Notion 自定义代理自动化工作流 — 快速指南"
description: "Notion 自定义代理自动化工作流实用快速指南，面向AI开发者和团队。"
keywords: ["Notion 自定义代理自动化工作流", "Notion Custom Agents autonomous workflows", "AI指南"]
date: 2026-02-27
tier: 3
lang: zh
type: blog
tags: ["快速阅读", "实用"]
---

# Notion 自定义代理自动化工作流

**一句话总结：** Notion 推出自定义代理（Custom Agents）功能，让团队无需编码即可创建 7×24 自动执行任务的 AI 助手。

## 这是什么

Notion 于 2026 年 2 月正式发布 Custom Agents 功能。与传统的 AI 聊天助手不同，自定义代理是**自主运行**的——你设定触发条件或时间表，它就会在后台持续工作，无需人工干预。

官方的定位很直接：「The AI team that never sleeps」。

## 核心能力

Custom Agents 具备三个关键特性：

1. **自主执行（Autonomous）**：不需要每次手动触发，按预设规则自动运行
2. **团队协作（Built for teams）**：多人可共享、编辑同一个代理
3. **低门槛构建（Easy to build）**：无需编程，通过自然语言描述任务即可创建

## 实际操作步骤

### 创建一个自定义代理

1. 在 Notion 侧边栏点击 **「+ New Agent」**
2. 为代理命名并描述它的职责（例如：「每周一整理上周的会议记录并生成摘要」）
3. 设置触发方式：
   - **定时触发（Schedule）**：每天/每周/每月固定时间执行
   - **事件触发（Trigger）**：当数据库新增条目、页面更新时自动执行
4. 定义代理的操作范围——它可以读取和修改哪些 workspace 内容
5. 保存并启用

### 示例：自动整理周报

假设你希望每周五下午自动汇总本周所有「已完成」的任务：