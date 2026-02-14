---
term: "Adaptive Thinking"
slug: adaptive-thinking
lang: en
category: AI Reasoning
definition: "A reasoning mode in advanced AI models that dynamically adjusts computational effort based on task complexity, replacing fixed extended thinking with flexible effort levels."
related: [context-window, agent-teams]
date: 2026-02-09
source_topic: claude-opus-adaptive-thinking
keywords:
  - "adaptive thinking AI"
  - "Claude adaptive thinking"
  - "AI reasoning modes"
---

## What is Adaptive Thinking?

Adaptive Thinking is Anthropic's reasoning system introduced with **Claude Opus 4.6** in February 2026. It replaces the previous "extended thinking" mode with a more flexible approach: instead of a binary on/off toggle, developers can set effort levels — **low, medium, high, or max** — allowing the model to allocate computational resources proportional to task difficulty.

## How It Works

Under the hood, Adaptive Thinking controls how many internal reasoning steps the model performs before generating its response:

- **Low effort**: Quick responses for simple tasks — greetings, formatting, straightforward lookups. Minimal chain-of-thought.
- **Medium effort**: Standard reasoning for typical questions — summaries, explanations, moderate code generation.
- **High effort**: Deep analysis for complex problems — multi-step math, architectural decisions, nuanced comparisons.
- **Max effort**: Exhaustive reasoning for the hardest tasks — novel research questions, complex debugging, competition-level problems.

The key innovation is that the model can also **self-regulate** within a given effort level. If a "high effort" task turns out to be simpler than expected, the model may use fewer reasoning steps than the maximum allowed, saving tokens and latency.

## Why It Matters

Adaptive Thinking addresses a core tradeoff in AI systems: **cost vs. quality**. Extended thinking dramatically improves performance on hard tasks but wastes resources on easy ones. Before Adaptive Thinking, developers had to choose between always-on deep reasoning (expensive, slow) or never using it (cheaper but less capable).

The practical impact is significant:

- **Cost reduction**: Simple queries at "low" effort use **60-80% fewer tokens** than max effort
- **Latency improvement**: Low-effort responses return in under a second vs. 10-30 seconds for max
- **Better benchmarks**: On **Humanity's Last Exam**, Claude Opus 4.6 with max adaptive thinking scored **53.1%**, leading all frontier models
- **Developer control**: API users can tune effort per request, optimizing cost for their specific use case

This is particularly valuable for applications that handle diverse query types — a coding assistant that needs deep reasoning for architecture questions but quick responses for syntax lookups.

## Related Terms

- **Chain-of-Thought (CoT)**: The underlying technique where models reason step-by-step before answering
- **Extended Thinking**: The predecessor to Adaptive Thinking, offering only on/off reasoning
- **Token Budget**: The maximum tokens allocated for reasoning steps
