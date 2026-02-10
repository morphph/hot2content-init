---
term: "SWE-Bench"
slug: swe-bench
lang: zh
category: 基准测试
definition: "一个评估 AI 编程代理的基准测试，通过测试其解决来自流行开源仓库的真实 GitHub Issue 的能力来衡量。"
related: [agentic-coding, context-window]
date: 2026-02-10
source_topic: swe-bench-benchmark
---

## 什么是 SWE-Bench？

SWE-Bench（软件工程基准测试）是由普林斯顿研究人员创建的评估框架，测试 AI 模型解决真实软件工程任务的能力。与合成编码基准不同，SWE-Bench 使用来自 Django、Flask、scikit-learn、sympy 等流行开源项目的真实 GitHub Issue 和 Pull Request。

每个任务向模型提供仓库快照和 Issue 描述。模型必须生成能解决问题并通过项目测试套件的代码补丁。这使 SWE-Bench 成为衡量 AI 编码能力最真实的标准之一。

## 变体

截至 2026 年，SWE-Bench 有多个变体：

- **SWE-Bench（原版）**：来自 12 个 Python 仓库的 2,294 个任务
- **SWE-Bench Verified**：人工验证的子集，确保任务可解且测试有意义。Claude Opus 4.6 以 **80.8%** 领先，GPT-5.3 Codex 为 **80.0%**
- **SWE-Bench Pro**：更难的变体，包含更复杂的多文件问题。GPT-5.3 Codex 以 **56.8%** 领先
- **SWE-Bench Multimodal**：包含需要理解截图和 UI 的任务（2025 年推出）

## 为什么重要

SWE-Bench 已成为 AI 编程代理的主要衡量标准，因为：

- **真实**：在实际软件项目上测试，而非玩具问题
- **端到端**：模型必须理解代码库、编写补丁、满足测试
- **标准化**：跨模型和工具的一致评估
- **渐进难度**：不同变体可以追踪随时间的进步

但批评者指出，SWE-Bench 任务偏向 Python，可能不反映企业代码库，高分不保证在你的特定项目上表现良好。

## 相关术语

- **Terminal-Bench 2.0**：测试终端/CLI 工具使用的基准
- **HumanEval**：较早的函数级代码生成基准
- **Agentic Coding**：SWE-Bench 所衡量的开发范式
