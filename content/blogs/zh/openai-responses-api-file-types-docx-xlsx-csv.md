---
slug: openai-responses-api-file-types-docx-xlsx-csv
title: "OpenAI Responses API支持docx xlsx csv文件 — 快速指南"
description: "OpenAI Responses API支持docx xlsx csv文件实用快速指南，面向AI开发者和团队。"
keywords: ["OpenAI Responses API支持docx xlsx csv文件", "OpenAI Responses API file types docx xlsx csv", "AI指南"]
date: 2026-02-26
tier: 3
lang: zh
type: blog
tags: ["快速阅读", "实用"]
---

# OpenAI Responses API支持docx xlsx csv文件

**一句话总结：** OpenAI Responses API 现在原生支持 docx、xlsx、csv、pptx 等常见办公文件格式，开发者可以直接传入文件让 AI 读取内容，无需再做格式转换。

## 这意味着什么

2026年2月，OpenAI 官方宣布扩展了 Responses API 的文件输入类型支持。过去开发者想让 AI 处理 Word 文档或 Excel 表格，得先用第三方库把文件转成纯文本或 JSON，再喂给模型。现在这一步可以省掉了——直接把 .docx、.xlsx、.csv、.pptx 文件传给 API，模型自己解析。

这对构建 AI Agent（智能代理）场景尤其有用。你的 Agent 可以直接从用户上传的合同、报表、演示文稿中提取信息，输出更准确的结果。

## 支持的文件类型

根据官方公告，目前 Responses API 支持以下格式：

| 格式 | 说明 |
|------|------|
| .docx | Microsoft Word 文档 |
| .xlsx | Microsoft Excel 电子表格 |
| .csv | 逗号分隔值文件 |
| .pptx | Microsoft PowerPoint 演示文稿 |

PDF 和图片格式此前已支持，这次更新补齐了办公文档这块短板。

## 代码示例

使用 Python SDK 传入 Excel 文件的典型写法：