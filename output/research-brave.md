# Brave Search + Web Fetch Research Report

**Topic:** Claude Code Agent Teams - Anthropic's new multi-agent feature for Claude Code CLI released with Opus 4.6 in February 2026

**Generated:** 2026-02-07T22:24:00Z

**Time taken:** ~30 seconds

**Method:** Brave Search API + Direct Web Fetch (via Clawdbot)

**Sources searched:** 1 query (rate limited), 10 results, 3 sources fetched

---

## Executive Summary

Claude Code Agent Teams is a **brand new feature** announced February 5, 2026 alongside Claude Opus 4.6. It enables multiple Claude Code CLI instances to work **in parallel** on a shared codebase with autonomous coordination.

Key facts:
- **Release date:** February 5, 2026
- **Part of:** Claude Opus 4.6 launch
- **Status:** Research preview
- **Enable:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- **Proof of concept:** 16 agents built a 100,000-line C compiler that can compile Linux kernel

---

## What Are Agent Teams?

From the search results and fetched sources:

### Architecture
- One **lead session** coordinates the work
- Multiple **teammate sessions** run independently with their own context windows
- **Shared task list** that agents can assign themselves work from
- **Direct agent-to-agent communication** for coordination
- Parallel execution on tasks like codebase reviews

### Key Difference from Subagents
- Subagents work within a single session and return results to parent
- Agent Teams are **independent Claude Code sessions** that communicate directly

### Configuration
```
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

---

## The C Compiler Experiment

Anthropic researcher Nicholas Carlini stress-tested Agent Teams:

- **16 parallel agents** tasked with building a C compiler from scratch
- **~2,000 Claude Code sessions** over two weeks
- **$20,000** in API costs
- **100,000 lines** of Rust code produced
- Successfully compiles **Linux 6.9** on x86, ARM, and RISC-V
- **99% pass rate** on GCC torture tests
- Can compile and run **Doom**

Each Claude instance ran in its own Docker container, cloning a shared Git repo, claiming tasks by writing lock files, and pushing completed code upstream. No human orchestration.

---

## Opus 4.6 Context

Agent Teams is part of the broader Opus 4.6 release:

- **1M token context window** (first for Opus-class models)
- **Context compaction** for long-running sessions
- **Adaptive thinking** with effort controls (low/medium/high/max)
- Same pricing as Opus 4.5: $5 input / $25 output per million tokens
- Available on: Claude.ai, API, Claude Code, GitHub Copilot, AWS Bedrock

---

## Competitive Context

OpenAI released GPT-5.3 Codex **27 minutes** after Opus 4.6's announcement, also featuring multi-agent capabilities. The AI coding assistant space is now focused on autonomous, multi-agent workflows.

---

## Sources

1. **TechCrunch** - "Anthropic releases Opus 4.6 with new 'agent teams'" (Feb 5, 2026)
   https://techcrunch.com/2026/02/05/anthropic-releases-opus-4-6-with-new-agent-teams/

2. **Ars Technica** - "Sixteen Claude AI agents working together created a new C compiler" (Feb 6, 2026)
   https://arstechnica.com/ai/2026/02/sixteen-claude-ai-agents-working-together-created-a-new-c-compiler/

3. **HyperDev by Robert Matsuoka** - "Breaking: Opus 4.6 and Agent Teams" (Feb 5, 2026)
   https://hyperdev.matsuoka.com/p/article-opus-46-and-agent-teams

4. **Official Anthropic Blog** - "Building a C compiler with a team of parallel Claudes" (Feb 5, 2026)
   https://www.anthropic.com/engineering/building-c-compiler

5. **Official Docs** - Agent Teams documentation
   https://code.claude.com/docs/en/agent-teams

---

## Key Findings vs Original Research Report

| Aspect | Wrong (Original Report) | Correct (This Report) |
|--------|------------------------|----------------------|
| Feature | Claude 3.5 Sonnet + Artifacts | Claude Code Agent Teams with Opus 4.6 |
| Date | June 2024 | February 5, 2026 |
| What it is | Human-AI collaboration paradigm | Multi-agent CLI parallel execution |
| How it works | Real-time workspace | Multiple Claude instances in Docker containers |
| Key example | None specific | C compiler with 16 agents |

---

## Research Quality Assessment

✅ **Accurate dates and versions**
✅ **Correct technical details**
✅ **Real sources with URLs**
✅ **Specific examples (C compiler)**
✅ **Competitive context (OpenAI timing)**
