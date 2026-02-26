---
slug: claude-cowork-scheduled-tasks-automation
title: "Claude Cowork定时任务自动化 — 快速指南"
description: "Claude Cowork定时任务自动化实用快速指南，面向AI开发者和团队。"
keywords: ["Claude Cowork定时任务自动化", "Claude Cowork scheduled tasks automation", "AI指南"]
date: 2026-02-26
tier: 3
lang: zh
type: blog
tags: ["快速阅读", "实用"]
---

# Claude Cowork定时任务自动化

**一句话总结：** Claude Cowork 新增定时任务（Scheduled Tasks）功能，让 AI 按固定时间自动执行重复性工作，从晨间日程整理到周报生成一键搞定。

## 这是什么

Claude Cowork 是 Anthropic 推出的协作型 AI 工作空间。2026 年 2 月，官方宣布上线定时任务功能——你可以预设时间点，让 Claude 在指定时刻自动完成特定任务，无需人工触发。

根据 [@claudeai](https://x.com/claudeai) 官方推文：

> Claude can now complete recurring tasks at specific times automatically: a morning brief, weekly spreadsheet updates, Friday team presentations.

简单说：设好时间、写好指令，剩下的交给 Claude。

## 典型应用场景

Anthropic 工程师 [@felixrieseberg](https://x.com/felixrieseberg) 分享了他的实际用法：

> I have Cowork check my calendar every morning and automatically fix conflicts - with clear instructions how to do it.

以下是几个高频场景：

| 场景 | 触发时间 | 任务描述 |
|------|----------|----------|
| 晨间简报 | 每天 8:00 | 汇总当日待办、日历冲突检测 |
| 周报生成 | 每周五 17:00 | 整理本周工作进展，输出 Markdown |
| 数据表更新 | 每天 9:00 | 拉取最新数据填充 Google Sheets |
| 团队演示准备 | 每周五 14:00 | 生成 PPT 大纲和要点 |

## 如何配置

目前定时任务在 Cowork 界面中操作。基本步骤：

1. **进入 Cowork 项目** — 打开你要自动化的工作区
2. **创建任务** — 描述你希望 Claude 执行的具体操作
3. **设置触发器（Trigger）** — 选择执行频率：
   - 单次（One-time）：指定具体日期时间
   - 重复（Recurring）：每日/每周/自定义 cron 表达式
4. **配置上下文权限** — 授权 Claude 访问日历、文件或第三方集成
5. **保存并启用**

伪代码示例（概念演示）：