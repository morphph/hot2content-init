# 博客对比：方案 1 vs 方案 2

## 方案说明

| | 方案 1 | 方案 2 |
|--|--------|--------|
| **Writer 输入** | 只读 core-narrative.json | Research Report + core-narrative.json |
| **输出** | blog-en-v1.md | blog-en-v2.md |

---

## 📊 数量对比

| 维度 | V1 | V2 |
|------|----|----|
| **字数** | ~1,800 words | ~2,400 words |
| **FAQ** | 4 个 | 5 个 |
| **Diagrams** | 1 个 | 1 个（更详细） |
| **Tables** | 0 | 3 |
| **Code blocks** | 2 | 4 |

---

## 🔍 内容深度对比

### V2 独有内容（来自 Research）

| 内容 | V1 | V2 |
|------|----|----|
| Display modes 细节 (in-process vs split-pane) | ❌ | ✅ |
| 键盘快捷键 (Shift+Up/Down, Shift+Tab) | 部分 | ✅ 完整 |
| 文件路径 (~/.claude/teams/, config.json) | ❌ | ✅ |
| Delegation mode 详解 | ❌ | ✅ |
| Plan Approval 功能 | ❌ | ✅ |
| "Vibe Coding" 趋势 | ❌ | ✅ |
| Steve Yegge "Gas Town" | ❌ | ✅ |
| Clean room 环境细节 | ❌ | ✅ |
| OpenAI 25% 速度优势 | ❌ | ✅ |
| Session resumption 问题 | ❌ | ✅ |
| Early adopter 体验 | ❌ | ✅ |
| tmux 安装提示 | ❌ | ✅ |

---

## 📝 TL;DR 对比

### V1
> Anthropic releases Claude Opus 4.6 with Agent Teams, enabling 16 parallel AI agents to autonomously build a 100,000-line C compiler for $20,000.

### V2
> Anthropic releases Claude Opus 4.6 with Agent Teams, enabling 16 parallel AI agents to autonomously build a 100,000-line C compiler for $20,000—signaling the shift from AI as "copilot" to AI as "co-worker."

**V2 更好**：加了 "copilot → co-worker" 的 framing

---

## 🏗️ 结构对比

### V1 Sections
1. The Problem with Single-Agent Coding
2. Agent Teams: A New Architecture
3. How Agent Teams Works
4. The Carlini Experiment
5. Why This Matters
6. Risks and Limitations
7. FAQ
8. References

### V2 Sections
1. From Copilot to Coordinated Squad ← 更有叙事性
2. What Makes Agent Teams Different ← 加了对比表
3. The Four Pillars of Architecture ← 更结构化
4. Display Modes ← V1 没有
5. Control Commands ← V1 没有
6. The Carlini Experiment ← 更详细 (clean room, Docker)
7. Why This Changes Everything
8. The "Vibe Coding" Movement ← V1 没有
9. Risks, Costs, and Reality Checks ← 更全面
10. Claude vs OpenAI Codex ← 独立章节
11. FAQ (5个 vs V1 4个)
12. References

---

## 📖 开头对比

### V1
> As AI coding assistants evolved from autocomplete to autonomous agents, a fundamental limitation emerged...

### V2
> Twenty-seven minutes. That's how long separated Anthropic's Opus 4.6 announcement from OpenAI's GPT-5.3-Codex launch...

**V2 更好**：具体数字开头，更抓眼球

---

## ⚠️ 风险描述对比

### V1 风险
- Cost
- File conflicts
- Experimental status

### V2 风险
- Cost + "expensive as hell" 用户引用
- File conflicts + 解释为什么
- **No session resumption** ← V1 没有
- Configuration complexity + tmux 依赖

**V2 更全面**，有更多实际使用痛点

---

## 🎯 结论

### V2 优势

| 优势 | 原因 |
|------|------|
| **更丰富** | +600 words，更多细节 |
| **更实用** | 键盘快捷键、文件路径、tmux |
| **更有深度** | Vibe Coding 趋势、社区反应 |
| **更平衡** | 更全面的风险描述 |
| **更抓人** | 具体数字开头 |

### V1 优势

| 优势 | 场景 |
|------|------|
| **更简洁** | 快速阅读 |
| **聚焦核心** | 不想要太多背景 |

---

## 📌 最终建议

**方案 2（Writer 同时参考 Research + Narrative）产出质量明显更高。**

Narrative 提供结构框架，Research 提供深度素材。两者结合 = 最佳文章质量。

建议更新 Pipeline：

```
Research Report ─┐
                 ├─→ Writer ─→ Blog
Core Narrative  ─┘
```
