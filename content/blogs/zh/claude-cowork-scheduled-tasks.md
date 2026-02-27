---
slug: claude-cowork-scheduled-tasks
title: "Claude Cowork 定时任务 — 快速指南"
description: "Claude Cowork 定时任务实用快速指南，面向AI开发者和团队。"
keywords: ["Claude Cowork 定时任务", "Claude Cowork scheduled tasks", "AI指南"]
date: 2026-02-27
tier: 3
lang: zh
type: blog
tags: ["快速阅读", "实用"]
---

# Claude Cowork 定时任务

**一句话总结：** Claude Cowork 现在支持定时任务（Scheduled Tasks），让 AI 在指定时间自动完成重复性工作，从晨报生成到周报整理都能自动化。

## 这是什么功能

2026 年 2 月，Anthropic 为 Claude Cowork 推出了定时任务功能。简单说，你可以设定一个时间点或周期，让 Claude 自动执行预设的任务——不需要你手动触发。

Claude 官方账号的说明很直接：

> Claude can now complete recurring tasks at specific times automatically: a morning brief, weekly spreadsheet updates, Friday team presentations.

这意味着你可以把那些「每天早上做一次」「每周五整理一遍」的固定工作交给 Claude 自动处理。

## 典型使用场景

### 1. 日历冲突自动修复

Claude Code 维护者 Felix Rieseberg 分享了他最喜欢的用法：

> I have Cowork check my calendar every morning and automatically fix conflicts - with clear instructions how to do it.

每天早上 Claude 自动检查日历，发现会议时间冲突就按照预设规则处理。不用你每天早起打开日历检查一遍。

### 2. 晨间简报生成

设定每天早上 8 点，让 Claude 汇总：
- 昨日未读邮件摘要
- 今日待办事项
- 团队 Slack 重要消息

### 3. 周期性数据更新

每周一自动更新项目进度表格，从各个数据源拉取最新数字，生成可视化报告。

### 4. 团队汇报自动化

每周五下午自动生成本周工作总结，按照固定模板整理，直接推送到团队频道。

## 如何设置定时任务

在 Claude Cowork 界面中，定时任务的设置流程如下：

1. **创建任务**：进入 Cowork 面板，选择「New Task」
2. **配置触发条件**：选择「Schedule」选项卡
3. **设定时间**：支持以下格式
   - 单次执行：指定日期和时间
   - 重复执行：每日、每周、每月
   - Cron 表达式：精细控制执行周期

4. **编写任务指令**：用自然语言描述任务内容

示例任务配置：