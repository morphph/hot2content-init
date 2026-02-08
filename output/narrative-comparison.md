# Core Narrative 对比：方案 A vs 方案 B

## 概览

| 维度 | 方案 A (Research → Opus) | 方案 B (Gemini 一步) |
|------|--------------------------|---------------------|
| **流程** | Gemini Research → Opus Narrative | Gemini 直接输出 JSON |
| **时间** | 12.7分钟 + ~2分钟 = **14.7分钟** | **2.6分钟** |
| **成本** | ~$1 Gemini + ~$0.50 Opus = **~$1.50** | **~$1.00** |
| **LLM 调用** | 2 次 | 1 次 |

---

## 1️⃣ One-Liner 对比

### 方案 A
> Anthropic releases Claude Opus 4.6 with Agent Teams, enabling 16 parallel AI agents to autonomously build a 100,000-line C compiler for $20,000.

### 方案 B
> Anthropic's experimental feature allows a 'Team Lead' agent to orchestrate independent peer agents with their own context windows to solve complex tasks like building compilers.

**评价：**
- A 更具体（数字：16 agents, 100K lines, $20K）
- B 更概念化（强调架构：Lead + peers + context windows）
- 📊 **A 胜** - 更有冲击力

---

## 2️⃣ Key Points 对比

### 方案 A (5 points)
1. Agent Teams enables multiple Claude Code instances to work in parallel with independent context windows and peer-to-peer communication, fundamentally different from sequential subagents.
2. The Carlini Experiment demonstrated 16 agents building a full C compiler in Rust that compiles Linux 6.9 kernel, passes 99% of GCC torture tests, and runs Doom—all for $20,000 in API costs.
3. Opus 4.6 introduces a 1 million token context window (beta) and 128K max output tokens, specifically engineered for long-running agentic workflows.
4. The release coincided within 27 minutes of OpenAI's GPT-5.3-Codex launch, marking an intensification of the multi-agent AI coding race.
5. Agent Teams is currently a research preview requiring manual enablement via CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 environment variable.

### 方案 B (5 points)
1. Released in February 2026 with Claude Opus 4.6, 'Agent Teams' enables parallel, autonomous multi-agent coordination within the Claude Code CLI.
2. Unlike standard sub-agents, teammates possess independent context windows and communicate peer-to-peer via a shared task list and messaging system.
3. Anthropic researcher Nicholas Carlini demonstrated the capability by having 16 agents autonomously write a 100,000-line C compiler in Rust for $20,000.
4. The feature utilizes `tmux` for split-pane visualization and is enabled via the `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` environment flag.
5. Key use cases include read-heavy parallel exploration, multi-perspective security audits, and cross-stack feature implementation (frontend/backend/db).

**评价：**
| 维度 | A | B |
|------|---|---|
| 技术细节 | 1M context, 128K output | tmux 可视化 |
| 竞争对比 | ✅ OpenAI timing | ❌ 无 |
| 使用场景 | ❌ 无具体场景 | ✅ 3个场景 |
| 独立可引用 | ✅ 都很强 | ✅ 都很强 |

📊 **平手** - 各有侧重

---

## 3️⃣ Story Spine 对比

### Background

**A:** As AI coding assistants evolved from autocomplete to autonomous agents, a fundamental limitation emerged: single-session context degradation. Long conversations caused 'context rot' where models lost track of earlier decisions...

**B:** Prior to February 2026, AI coding assistants operated primarily as 'individual contributors' or used sub-agents that were limited by a single shared context window and strict boss-to-worker reporting lines...

**评价：** A 更技术（context rot），B 更形象（individual contributor 比喻）

### Breakthrough

**A:** On February 5, 2026, Anthropic released Claude Opus 4.6 with Agent Teams—a swarm-based architecture where multiple Claude instances operate as independent teammates...

**B:** With the release of the Opus 4.6 model, Anthropic introduced 'Agent Teams' in Claude Code, a research preview that allows a Lead Agent to spawn distinct teammates...

**评价：** 相似，A 稍详细

### Mechanism

**A:** Agent Teams operates through four core components: (1) The Team Lead—primary session handling planning, decomposition, and synthesis; (2) Teammates—independent Claude Code instances with isolated contexts loading project files like CLAUDE.md; (3) Shared Task List—file-based synchronization at ~/.claude/tasks/ with state tracking and dependency management; (4) The Mailbox—inter-agent messaging via 'message' and 'broadcast' commands...

**B:** Activated via an experimental flag, the system assigns a 'Team Lead' to manage a shared task list and dependency tracking. Teammates run in parallel `tmux` panes, self-claiming tasks, using git-based file locking to prevent overwrites, and sending direct messages to one another to resolve dependencies.

**评价：** 
- A 更结构化（4 个组件分点）
- B 更实用（tmux, git locking）
- 📊 **A 胜** - 更完整

### Significance

**A:** The Carlini Experiment proved the concept at scale: 16 agents autonomously produced 100,000 lines of Rust code over two weeks, creating a C compiler that successfully builds Linux 6.9 for x86, ARM, and RISC-V...

**B:** This shifts the paradigm from 'pair programming' to managing an 'autonomous squad.' The capability was proven when a team of agents autonomously built a Linux-compatible C compiler...

**评价：** A 更具体数据，B 更好的 framing（pair → squad）

### Risks

**A:** The $20,000 price tag makes Agent Teams prohibitive for routine development—it's currently suited for high-value, complex projects only. File conflicts remain problematic when multiple agents edit the same files...

**B:** The approach is cost-prohibitive for small tasks (the compiler example cost $20k), carries risks of file edit conflicts in shared repos, and currently lacks session resumption capabilities, making it fragile for long-running operations.

**评价：** 
- B 发现了独特风险：**session resumption 问题**
- 📊 **B 胜** - 更全面的风险视角

---

## 4️⃣ FAQ 对比

### 方案 A (4 个)
1. How is Agent Teams different from subagents?
2. How much does it cost to run Agent Teams?
3. Can I use Agent Teams today?
4. How does Agent Teams compare to OpenAI Codex?

### 方案 B (3 个)
1. How are Agent Teams different from sub-agents?
2. How do I enable Agent Teams in Claude Code?
3. What was the 'C Compiler' experiment mentioned in the launch?

**评价：**
- A 有竞品对比问题（OpenAI）
- B 的问题更实用（setup 步骤）
- 📊 **A 胜** - 多 1 个，且覆盖更广

---

## 5️⃣ References 对比

### 方案 A (5 sources)
1. TechCrunch
2. Ars Technica
3. Anthropic Engineering Blog
4. Claude Code Docs
5. HyperDev (Matsuoka)

### 方案 B (5 sources)
1. Anthropic News
2. Claude Code Docs
3. Anthropic Engineering Blog
4. CameronXYZ Substack
5. **Medium (新！)**

**评价：**
- A 有更多传统科技媒体
- B 发现了 Medium 和 Substack 的独立分析
- 📊 **平手** - 不同视角

---

## 6️⃣ Diagrams 对比

### 方案 A (2 个)
1. Agent Teams Architecture - 完整架构图
2. Agent Teams vs Subagents - 对比图

### 方案 B (1 个)
1. Agent Teams Architecture Flow - 单个但更详细（包含 Git Locking）

**评价：** 📊 **A 胜** - 数量更多，有对比图

---

## 7️⃣ SEO 对比

| 字段 | A | B |
|------|---|---|
| slug | claude-code-agent-teams-opus-46-multi-agent-development | claude-code-agent-teams-opus-4-6 |
| meta_title | Claude Agent Teams: Multi-Agent AI Coding \| Opus 4.6 (52 chars ✅) | Claude Code Agent Teams: Automate Dev with Opus 4.6 \| Anthropic (64 chars ❌) |
| meta_description | ✅ 150-160 chars | ✅ 150-160 chars |

**评价：** 📊 **A 胜** - B 的 title 超长需修复

---

## 8️⃣ Localization 对比

### 方案 A
```json
{
  "zh_strategy": "adapted",
  "zh_hints": "可对比国产模型（Kimi、通义千问）尚无类似多智能体能力；强调成本效益（$20K vs 人力成本）；企业级代码库重构场景"
}
```

### 方案 B
```json
{
  "zh_strategy": "native",
  "zh_hints": "Emphasize the 'individual contributor vs. manager' organizational shift mentioned in the research. Highlight the specific cost ($20k) of the C Compiler experiment as a tangible metric of scale."
}
```

**评价：**
- A 更本地化（提到国产模型）
- B 更通用（没有中国特定内容）
- 📊 **A 胜** - 对中文内容更有帮助

---

## 📊 总评

| 维度 | 胜出 |
|------|------|
| One-liner | A |
| Key Points | 平手 |
| Story Spine | 平手 (A mechanism, B risks) |
| FAQ | A |
| References | 平手 |
| Diagrams | A |
| SEO | A |
| Localization | A |
| **速度** | **B (5.6x faster)** |
| **成本** | **B (~33% cheaper)** |

## 🎯 结论

**方案 A 内容质量更高**，但 **方案 B 效率惊人**。

### 建议

1. **日常使用：方案 B** - 速度快、成本低、质量够用
2. **高质量文章：方案 A** - 多一步但更精细
3. **混合方案：B + 微调** - Gemini 一步出 JSON，再用 Sonnet 快速补充（FAQ、diagram）

要我把这两个 narrative 都推到 GitHub 吗？
