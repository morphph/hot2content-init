---
slug: qwen3-5-35b-a3b-local-inference
title: "Qwen3.5-35B-A3B 本地推理 — 快速指南"
description: "Qwen3.5-35B-A3B 本地推理实用快速指南，面向AI开发者和团队。"
keywords: ["Qwen3.5-35B-A3B 本地推理", "Qwen3.5-35B-A3B local inference", "AI指南"]
date: 2026-02-27
tier: 3
lang: zh
type: blog
tags: ["快速阅读", "实用"]
---

# Qwen3.5-35B-A3B 本地推理

**一句话总结：** 单张 RTX 3090 即可跑 350 亿参数模型，4-bit 量化下达到 113 tokens/秒，支持 262K 上下文——本地大模型推理进入实用阶段。

## 为什么值得关注

Qwen3.5-35B-A3B 是阿里通义千问团队推出的混合专家模型（Mixture of Experts, MoE）。它的特殊之处在于：350 亿总参数，但每次推理只激活约 30 亿参数。这意味着你能用消费级显卡获得接近企业级模型的能力。

最近有开发者 @sudoingX 在 X 上分享了实测结果：**单张 RTX 3090（24GB 显存），4-bit 量化，113 tokens/秒，完整 262K 上下文**。他甚至用这套配置本地运行 Claude Code，无需 API、无需订阅。

## 硬件要求

| 配置 | 显存需求 | 推理速度 |
|------|----------|----------|
| 4-bit 量化 | ~18-20GB | ~113 tok/s |
| 8-bit 量化 | ~35-40GB | ~60 tok/s |
| FP16 全精度 | ~70GB | ~30 tok/s |

最低配置：RTX 3090 / RTX 4090 / A6000（24GB+）

## 快速上手

### 方案一：llama.cpp（推荐）

llama.cpp 对 MoE 模型有良好支持，是目前本地部署的首选。