---
slug: swe-bench-pro-vs-verified-deprecation
title: "SWE-bench Pro 与 Verified 废弃对比 — 常见问题解答"
description: "关于SWE-bench Pro 与 Verified 废弃对比的常见问题与详细解答。"
keywords: ["SWE-bench Pro 与 Verified 废弃对比", "SWE-bench Pro vs Verified deprecation", "AI常见问题", "代码评估基准", "AI编程能力"]
date: 2026-02-25
tier: 3
lang: zh
type: faq
tags: ["常见问题", "AI", "编程评估", "SWE-bench"]
---

# SWE-bench Pro 与 Verified 废弃对比：常见问题解答

### 1. 为什么 OpenAI 突然宣布不再使用 SWE-bench Verified？

2026 年 2 月 23 日，OpenAI 正式宣布停止报告 SWE-bench Verified 分数。核心原因有两个：**测试设计缺陷**和**数据污染**。经审计发现，至少 59.4% 的 Verified 测试用例存在问题——它们会错误拒绝功能正确的代码提交。更严重的是，GPT-5.2、Claude Opus 4.5、Gemini 3 Flash 等前沿模型已经能从记忆中复现部分原始修复代码。这意味着跑分高低越来越反映「模型见过什么」，而不是「模型编程能力如何」。当一个基准测试无法区分记忆和能力时，它作为评估工具的价值就归零了。

### 2. SWE-bench Pro 和 Verified 在难度上差多少？

差距相当悬殊。Verified 版本包含 500 个纯 Python 任务，中位数修改量仅 4 行代码，有 161 个任务只需改 1-2 行。而 SWE-bench Pro 包含 1,865 个任务，平均需要修改 107 行代码、跨越 4.1 个文件。从得分看，顶尖模型在 Verified 上能拿到 70%+，但在 Pro 上最高只有约 59%。打个比方：Verified 像是高中编程作业，Pro 则是真实工作中的跨模块 bug 修复。

### 3. SWE-bench Pro 具体包含哪些类型的任务？

Pro 版本覆盖 41 个真实代码仓库，涵盖 Python、Go、TypeScript、JavaScript 四种语言。任务来源于真实的代码提交历史（commit history），每个任务都有配套的验证测试套件。数据集分三部分：公开集（Public Set）包含 731 个 GPL 授权仓库的任务；商业集（Commercial Set）有 276 个来自创业公司的私有代码库任务；保留集（Held-Out Set）存储 858 个任务，专门用于未来检测数据污染。这种设计让基准测试更接近真实软件工程场景。

### 4. 数据污染（Data Contamination）到底是什么问题？

数据污染指的是 AI 模型在训练时已经「见过」测试题的答案。SWE-bench Verified 的任务全部来自公开的 GitHub 仓库，这些代码早已被爬取进各家模型的训练数据。结果就是：模型可能不是在「解决问题」，而是在「回忆答案」。OpenAI 的审计发现部分模型能直接复现原始修复代码，这就像考试前偷看了标准答案。SWE-bench Pro 通过使用 GPL 风格的 copyleft 仓库和私有代码库来降低污染风险——法律和访问限制让这些代码更难进入训练集。

### 5. 当前哪些 AI 模型在 SWE-bench Pro 上表现最好？

截至 2026 年 2 月，使用自定义脚手架（custom scaffolding）的顶尖系统：Codex 5.3 + WarpGrep v2 达到 59.1%，MiniMax 2.5 + WarpGrep v2 为 57.6%，Opus 4.6 + WarpGrep v2 为 57.5%。而在 Scale AI 的 SEAL 标准化排行榜上，Claude Opus 4.5 以 45.9% 领先，Claude Sonnet 4.5 为 43.6%，Gemini 3 Pro 为 43.3%。有趣的是，自定义脚手架和标准化测试之间存在约 12 个百分点的差距，这说明上下文检索质量（context retrieval）对得分的影响甚至超过模型本身的能力。

### 6. 作为开发者，我应该如何看待 AI 编程工具的能力声明？

保持健康的怀疑态度。如果某个 AI 工具宣传「SWE-bench 得分 XX%」，你需要追问：是哪个版本的 SWE-bench？是标准化测试还是自定义脚手架？考虑到 Verified 版本已被废弃且存在严重的污染和测试缺陷问题，任何基于 Verified 的分数都应该打折扣。更实际的做法是：在你自己的代码库上试用这些工具，看它们能否理解你的项目结构、遵循你的代码规范、处理跨文件的复杂修改。真实场景的表现比任何基准分数都重要。

### 7. OpenAI 提到的 GDPVal 是什么？未来评估方向如何？

GDPVal（Graded Domain-specific Private Validation）是 OpenAI 正在投资的下一代评估方法。它的核心思路是：任务由领域专家私下编写，解决方案由受过训练的评审员进行整体评分（holistic grading），而不是简单的通过/失败判定。这种方法资源密集但更难被污染，因为测试题从不公开。这代表了行业共识：随着 AI 模型能力增强，公开基准测试的寿命会越来越短，私有评估将成为常态。对用户来说，这意味着要更关注第三方独立测试和实际使用反馈。

### 8. SWE-bench Pro 的测试流程具体是怎样的？

每个任务在容器化的语言特定环境中运行，使用两类测试：**fail2pass 测试**确认问题被解决（原本失败的测试现在通过），**pass2pass 测试**验证现有功能不被破坏（原本通过的测试仍然通过）。任务经过三阶段人工标注：问题陈述合成（problem statement synthesis）、基于测试用例的需求规格说明、接口文档编写。这种设计确保了评估的严谨性——不只是「能跑通」，还要「不搞坏其他东西」，这正是真实软件工程的核心要求。

### 9. 为什么说 Verified 版本的测试设计有缺陷？

OpenAI 审计发现 59.4% 的 Verified 测试用例会拒绝功能正确的代码提交。这是什么意思？举个例子：如果一个 bug 可以用三种方式修复，但测试只检查了其中一种特定的实现方式，那么另外两种同样正确的解法会被判为「失败」。这种过于严格的测试（over-specified tests）不仅低估了 AI 的真实能力，还会误导模型向特定的「标准答案」靠拢，而不是学习通用的问题解决能力。Pro 版本通过更完善的测试设计和人工审核流程来避免这个问题。

### 10. 这次变化对 AI 编程工具市场有什么影响？

短期内会出现一波营销话术调整。那些依赖 Verified 高分做宣传的公司需要重新定位。长期来看，这推动了行业向更真实的评估标准迁移。SWE-bench Pro 的多语言、跨文件、长修改链条设计更接近真实工作场景，这会倒逼 AI 工具提升「理解复杂代码库」的能力，而不是「做简单填空题」的能力。对于企业采购决策者来说，现在更应该关注工具在自己技术栈上的实际表现、代码审查通过率、以及是否能处理公司内部的复杂业务逻辑，而非追逐基准分数。

---

**相关资源：**
- [Why SWE-bench Verified no longer measures frontier coding capabilities | OpenAI](https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/)
- [SWE-Bench Pro Leaderboard | Scale AI SEAL](https://scale.com/leaderboard/swe_bench_pro_public)
- [What is SWE-Bench Pro? | Morph](https://www.morphllm.com/swe-bench-pro)