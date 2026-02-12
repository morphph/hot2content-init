---
slug: claude-mem-persistent-memory-claude-code
title: "Claude-Mem 深度解析：AI 编程助手的记忆架构设计哲学"
description: "从 Claude-Mem 的 Hook 架构、渐进式上下文注入到 RAD 协议愿景，解读 AI Agent 持久记忆的工程实践与设计取舍。"
keywords: ["Claude-Mem", "Claude Code", "AI 记忆管理", "持久上下文", "Hook 架构", "Agent 记忆"]
date: 2026-02-12
lang: zh
tier: 1
hreflang_en: /en/blog/claude-mem-persistent-memory-claude-code
---

# Claude-Mem 深度解析：AI Agent 的记忆该怎么设计？

**核心观点：** Claude-Mem 不只是一个插件，它是 AI Agent 记忆架构的一次完整实验——从"人工维护上下文"到"自动捕获、压缩、检索"，它的设计取舍对所有构建 Agent 系统的工程师都有参考价值。

## 问题本质：上下文窗口 ≠ 记忆

做过大模型应用的人都清楚一个事实：上下文窗口再大，也不是记忆。

Claude Code 每次新会话都从零开始。你的项目架构、技术决策、踩过的坑——全部丢失。Anthropic 官方提供了 `CLAUDE.md` 作为解决方案：一个在会话启动时自动加载的 Markdown 文件。

但 `CLAUDE.md` 本质上是**声明式配置**。你需要手动写入、手动维护。它能承载"项目用 TypeScript"这类静态信息，但无法承载"上次我们尝试了 X 方案，因为 Y 原因失败了"这类**经验型知识**。

经验型知识的特点是：产生于工作过程中，事先无法预知，且价值随时间衰减。这正是 Claude-Mem 要解决的问题。

## 架构拆解：5 个 Hook + 3 层存储

Claude-Mem 由 Alex Newman（GitHub: @thedotmack）开发，目前 12.9K+ Star，架构经历了 5 个大版本迭代。

### Hook 管线

Claude Code 提供了生命周期 Hook 机制，Claude-Mem 利用其中 5 个：

```
SessionStart → 注入历史记忆
UserPromptSubmit → 加载相关上下文  
PostToolUse → 捕获工具执行观察
Stop → 压缩存储新观察
SessionEnd → 生成会话摘要
```

这个设计最精妙的地方在于：**零侵入**。不修改 Claude Code 本身，不需要 fork，不依赖未公开 API。完全基于官方暴露的 Hook 接口构建。

### 三层渐进式存储

**第一层：上下文注入（~150 行）**

自动生成的摘要，在 `SessionStart` 时注入。包含按置信度和访问频率排序的核心项目知识。80% 的会话只需要这一层。

**第二层：SQLite + FTS5 全文检索**

完整的观察记录，通过 5 个 MCP 工具按需查询。存储了每次会话的结构化观察：类型、内容、时间戳、关联会话。

**第三层：Chroma 向量数据库（可选）**

语义搜索层。支持自然语言查询项目历史。

这个三层设计体现了一个重要的工程原则：**Token 成本感知**。不是把所有记忆都塞进上下文，而是按需加载。Claude-Mem 团队称之为"渐进式披露"（Progressive Disclosure）。

### 压缩管线的细节

压缩管线是整个系统最值得研究的部分：

1. **增量读取**：通过游标文件追踪已处理位置，只处理新增内容
2. **分块策略**：6000 字符为一个块，匹配 Haiku 模型的最佳处理区间
3. **带上下文的提取**：向 Haiku 发送新内容时，同时附带已有记忆——防止重复提取
4. **类型化观察**：每条记忆有明确类型（architecture/decision/pattern/gotcha/progress/coordination）
5. **去重机制**：Jaccard 相似度超过 60% 则合并（supersede）
6. **衰减模型**：永久类型（架构、决策）不衰减；临时类型（进度、协调）7 天半衰期

这个衰减模型特别有意思。它模拟了人类记忆的工作方式：你会永远记住"我们为什么选了 PostgreSQL"，但会忘记"上周二我在改哪个文件"。

## 与官方方案的本质差异

Anthropic 最近发布了 [Memory Tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)，允许 Claude 在会话间持久化文件。但它是一个**原语**（primitive），而 Claude-Mem 是一个**系统**（system）。

关键差异：

| 维度 | 官方 Memory Tool | Claude-Mem |
|------|----------------|------------|
| 触发方式 | Claude 主动决定存储 | Hook 自动捕获 |
| 存储效率 | 原始文件 | AI 压缩摘要 |
| 检索方式 | 文件读取 | FTS5 + 向量搜索 |
| Token 开销 | 全量加载 | 渐进式披露 |
| 时间感知 | 无 | 完整会话时间线 |

**核心区别在于主动 vs 被动。** 官方方案需要模型"意识到"某信息值得保存。Claude-Mem 假设一切都值得观察，然后用压缩和衰减来管理信息量。

这两种哲学各有道理，但在实际编码场景中，被动捕获明显更实用——因为你无法预知哪些信息在未来会变得重要。

## 对 Agent 系统构建者的启示

Claude-Mem 的架构对所有在做 Agent 记忆系统的工程师都有参考价值：

### 1. Hook > Prompt

不要依赖模型在对话中"记住要保存记忆"。用系统级钩子确保捕获发生。模型的注意力应该放在解决问题上，不是管理自己的记忆。

### 2. 压缩是必须的

原始对话日志没有价值。必须经过压缩、类型化、去重。Claude-Mem 用 Haiku 做压缩——这意味着用一个便宜的模型来服务一个昂贵的模型。这个模式在 Agent 系统中会越来越常见。

### 3. 衰减模型要区分类型

不是所有记忆的衰减速度都一样。架构决策不衰减，临时进度快速衰减。如果你的记忆系统没有类型区分，要么上下文会被过时信息淹没，要么重要决策会丢失。

### 4. Token 成本是一等公民

任何记忆系统的设计都必须把 Token 成本作为核心约束。Claude-Mem 的渐进式披露不是"优化"，是**生存策略**。在 Claude Code 的使用场景下，每个 Token 都是钱。

## RAD 协议：野心还是趋势？

Claude-Mem 团队提出了 RAD（Real-time Agent Data）协议概念：

> "RAG 捕获知识，RAD 捕获智能。"

想法是为 Agent 工作记忆建立一个开放标准——Hook 架构、智能压缩、时间感知，统一成协议。这样在不同 AI 编码工具间切换时（Claude Code → Cursor → Windsurf），记忆可以跟着走。

这个愿景很大，能否实现取决于社区采纳。但它指向的问题是真实的：每个 AI 编码工具都在独立解决记忆问题，彼此不互通。

## 实践建议

如果你在用 Claude Code，安装很简单：

```bash
/plugin marketplace add thedotmack/claude-mem
/plugin install claude-mem
```

重启即可。建议关注：

- **Web 查看器**（`localhost:37777`）可以实时观察记忆流，帮助理解系统行为
- **隐私标签**：敏感内容可以排除在存储外
- **Beta 通道**：Endless Mode 等实验性功能

如果你在构建自己的 Agent 系统，Claude-Mem 的源码（AGPL-3.0）值得通读。特别是 Hook 管线的实现和压缩策略的代码——这些是经过 12.9K 用户验证的生产级设计。

## 写在最后

Claude-Mem 的成功不是偶然的。它精准命中了 AI 编程工具的最大痛点：**会话间的知识断裂**。更重要的是，它的解决方案不是暴力堆上下文，而是通过精心设计的捕获-压缩-检索管线来管理信息的生命周期。

对于中国的 AI 工程实践者来说，这个项目的价值不仅在于工具本身，更在于它展示的设计范式：如何在 Token 成本约束下，为 AI Agent 构建高效的工作记忆系统。这个问题，无论你用的是 Claude、GPT 还是国产大模型，都绕不过去。

---

*Claude-Mem 开源协议：AGPL-3.0。GitHub: [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem)*
