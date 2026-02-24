---
slug: how-claude-code-is-built-by-gergely-orosz
title: "How Claude Code is built - by Gergely Orosz"
description: "Expert answers to How Claude Code is built - by Gergely Orosz and related questions about Claude Code."
keywords: ["Claude Code", "How Claude Code is built - by Gergely Orosz", "AI FAQ"]
date: 2026-02-24
tier: 3
lang: en
type: faq
tags: ["faq", "AI"]
---

# How Claude Code is built - by Gergely Orosz

## What did Gergely Orosz reveal about how Claude Code is built?

Gergely Orosz, author of The Pragmatic Engineer newsletter, conducted an exclusive deep-dive with two founding engineers of the Claude Code team at Anthropic. The resulting article provides a rare look into how one of the most popular AI developer tools is built internally.

The most striking revelation: **Claude Code writes approximately 90% of its own code**. This isn't marketing speak—it's how the team actually operates day-to-day. Engineers on the team average around 5 pull requests per day, and PR output per engineer increased by 67% even as the team doubled in size over the past year. This productivity pattern defies traditional engineering scaling laws, where adding developers typically reduces per-capita output due to coordination overhead.

According to Orosz, the Claude Code team works "totally different than I'm used to seeing engineering teams." The key differences include:

- **Faster prototyping**: Ideas move from concept to working code in hours, not days
- **Faster shipping**: Features reach users rapidly with shorter feedback loops
- **Bolder technical choices**: The team made unconventional decisions like "vibe coding" their markdown renderer
- **AI-first everything**: Claude assists with code writing, code review, debugging, and documentation

Orosz described the experience as "a peek into the future," noting that it helped him understand why Anthropic CEO Dario Amodei predicted that 90% of code would be written by AI. The team represents a working example of that future—not as a distant possibility, but as current practice.

The article stands out because Anthropic rarely provides this level of technical transparency. For developers and engineering managers, it offers concrete evidence of how AI-augmented development changes team dynamics, productivity metrics, and engineering culture.

### How does the Claude Code team's productivity compare to traditional engineering teams?

The numbers are stark. Claude Code engineers produce approximately 5 PRs per day on average. For context, many traditional engineering teams consider 1-2 PRs per day a healthy pace for senior engineers, accounting for code review, meetings, and planning overhead.

More significantly, the team's PR output per engineer grew by 67% while simultaneously doubling headcount. In conventional software engineering, Brooks's Law suggests adding people to a project often slows it down due to increased communication complexity. The Claude Code team appears to have inverted this pattern.

This productivity boost comes from Claude handling the mechanical aspects of coding—boilerplate, repetitive patterns, test scaffolding—while engineers focus on architecture decisions, edge cases, and product direction. The 90% AI-written code figure doesn't mean engineers are passive; rather, they operate as directors and reviewers rather than typists.

### What unconventional technical decisions has the Claude Code team made?

Orosz specifically highlighted the team's "vibe code markdown renderer" as an example of bold technical choices. Rather than using established markdown parsing libraries with extensive edge-case handling, the team built something that works well for their specific use cases, prioritizing speed and iteration over comprehensiveness.

This approach reflects a broader philosophy: when AI can generate and modify code quickly, the cost of experimentation drops dramatically. Building a custom solution that might need revision later becomes less risky than carefully selecting and integrating third-party dependencies. The team can afford to be wrong faster and correct course with minimal penalty.

### What does Claude Code's development approach mean for the future of software engineering?

The Claude Code team serves as a case study for AI-native development practices. If their patterns generalize, several shifts seem likely:

**Smaller teams, larger output**: A team of 10 AI-augmented engineers might match the output of 30-40 engineers working traditionally. This changes hiring strategies and team structures.

**Different skill emphasis**: Code typing speed and syntax memorization matter less. System design, prompt engineering, and code review become primary skills.

**Faster iteration cycles**: With AI handling implementation details, the bottleneck shifts to decision-making and user feedback. Teams can test more ideas in the same timeframe.

**Changed metrics**: Lines of code and even PR counts become less meaningful. Impact per engineer and decision quality matter more.

### How can engineering teams adopt similar practices?

Start with high-leverage, low-risk applications. Use AI coding assistants for test generation, documentation, and boilerplate code first. As confidence builds, expand to feature implementation with careful code review.

The Claude Code team's success depends on strong engineering judgment—knowing when to accept AI suggestions and when to reject them. Teams need senior engineers who can evaluate AI-generated code for correctness, security, and maintainability. Without that expertise, high-velocity AI-assisted development can introduce technical debt faster than it delivers value.

Measure outcomes, not activity. Track bugs shipped, user satisfaction, and feature delivery rather than PRs merged. The goal is better software faster, not more git commits.