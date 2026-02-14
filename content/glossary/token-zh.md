---
term: "Token（令牌/词元）"
slug: token
lang: zh
category: LLM 基础概念
definition: "大语言模型处理文本的基本单位——一个子词片段，可能是一个完整的词、词的一部分或标点符号。模型逐 Token 地读取、理解和生成文本。"
related: [context-window, prompt-engineering]
date: 2026-02-10
source_topic: token
keywords:
  - "token"
  - "分词"
  - "LLM token"
---

## 什么是 Token？

Token（令牌，又称词元）是大语言模型（LLM）处理文本的最小单位。当你向 AI 模型发送一段文字时，模型首先会将其拆分为一系列 Token，然后逐个处理。一个 Token 可能是一个完整的英文单词（如 "hello"）、一个词的片段（如 "un" + "believ" + "able"）、一个数字或一个标点符号。

对于中文来说，通常 **一个汉字 = 1-2 个 Token**。英文的粗略换算是 **1 个 Token ≈ 0.75 个英文单词**，即 **1000 个 Token ≈ 750 个英文单词**。

## Token 化的工作原理

模型使用分词器（Tokenizer）将文本转换为 Token 序列，最常见的算法是 BPE（Byte Pair Encoding，字节对编码）：

- **高频词** 通常对应单个 Token：英文中 "the"、"and" 各占 1 个 Token
- **低频词** 会被拆分：如 "tokenization" → "token" + "ization"（2 个 Token）
- **中文文本** Token 效率通常低于英文：同样含义的句子，中文往往需要更多 Token
- **代码** 消耗 Token 较多：变量名、语法符号、缩进空格都会占用 Token
- **数字** 往往按位拆分："12345" 可能变成多个 Token

每个模型系列都有自己的分词器，因此同一段文本在 Claude、GPT、Gemini 上的 Token 数量可能不同。

## 为什么 Token 很重要？

Token 是 LLM 世界的"货币"，直接影响使用体验和成本：

- **上下文窗口**：以 Token 为单位衡量（如 Claude Opus 4.6 的 100 万 Token 窗口）
- **API 计费**：按 Token 收费（Claude Opus 4.6：输入 $5/百万 Token，输出 $25/百万 Token）
- **响应速度**：生成的 Token 越多，等待时间越长（当前模型一般每秒生成 50-150 个 Token）
- **输出质量**：Prompt 中的 Token 数量和质量直接影响模型的理解和回答效果

对于开发者来说，理解 Token 机制有助于估算成本、优化 Prompt 设计、避免超出上下文限制。在 2026 年，随着多模态模型的普及，图片和音频也会被转化为 Token 进行处理，Token 的概念变得更加重要。

## 相关术语

- **上下文窗口（Context Window）**：模型一次能处理的最大 Token 数量
- **Prompt 工程（Prompt Engineering）**：优化输入 Token 以获得更好的模型输出
- **BPE（字节对编码）**：现代 LLM 最常用的分词算法
