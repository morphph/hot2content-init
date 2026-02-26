---
slug: whats-new-in-claude-4-6
title: "What's new in Claude 4.6"
description: "Expert answers to What's new in Claude 4.6 and related questions about Claude Opus 4.6."
keywords: ["Claude Opus 4.6", "What's new in Claude 4.6", "AI FAQ"]
date: 2026-02-26
tier: 3
lang: en
type: faq
tags: ["faq", "AI"]
---

# What's new in Claude 4.6

## Claude Opus 4.6 brings expanded context, agent teams, and sustained reasoning

Claude Opus 4.6 represents Anthropic's latest advancement in expert-level reasoning capabilities. The release introduces several significant features designed for developers working on complex, long-running tasks.

**Context window expansion**: Opus 4.6 supports a 200K context window at launch, with a 1M token context window available in beta. This expanded context allows the model to process substantially larger codebases, documents, and conversation histories in a single interaction.

**Increased output capacity**: The maximum output has been raised to 128K tokens, enabling Claude to generate longer responses without truncation—particularly useful for code generation, detailed analysis, and comprehensive documentation tasks.

**Agent teams in Claude Code**: One of the most notable additions is the ability to assemble agent teams within Claude Code. Multiple agents can now collaborate on tasks together, allowing for more sophisticated workflows where different agents handle specialized subtasks.

**Context compaction**: On the API side, Claude can now use compaction to summarize its own context during extended sessions. This feature enables longer-running tasks without hitting context limits, as the model intelligently compresses earlier conversation history while preserving essential information.

**Extended thinking**: Opus 4.6 includes extended thinking capabilities, allowing the model to work through complex problems with more deliberate reasoning chains before producing a final answer.

According to real-world testing shared on Reddit, Opus 4.6 won approximately 90% of long workflow comparisons. However, users report that for short prompts or simple tasks, the difference from previous versions may not be immediately apparent. The optimizations specifically target sustained reasoning and large context scenarios.

Opus 4.6 maintains compatibility with all existing Claude API features, so developers can adopt it without rewriting their integration code.

### How does the 1M token context window work in Claude Opus 4.6?

The 1M token context window is currently available in beta for Opus 4.6. This represents roughly 750,000 words or the equivalent of several novels worth of text that can be processed in a single prompt.

For practical purposes, this enables developers to:

- Analyze entire codebases (hundreds of files) in one request
- Process lengthy legal documents, research papers, or technical specifications without chunking
- Maintain extensive conversation histories for complex multi-turn interactions

The standard 200K context window remains the default at launch. The 1M beta requires opting in through the API configuration. Keep in mind that larger contexts increase processing time and cost, so the expanded window is best reserved for tasks that genuinely require it.

### What are agent teams in Claude Code?

Agent teams allow multiple Claude agents to work on tasks collaboratively within Claude Code. Rather than a single agent handling an entire workflow, you can now assemble specialized agents that divide responsibilities.

For example, one agent might focus on code review while another handles documentation generation, and a third manages testing. These agents coordinate their work, passing context and results between each other.

This architecture is particularly valuable for complex software engineering tasks where different aspects benefit from focused attention. The agents share context but maintain their specialized roles, mimicking how human development teams operate with distinct responsibilities.

### What is context compaction and why does it matter?

Context compaction is a new API feature that allows Claude to summarize its own conversation history during long-running tasks. As a session extends and approaches context limits, Claude can compress earlier portions while preserving the essential information needed to continue working.

This matters for:

- Long coding sessions that would otherwise hit the context ceiling
- Multi-step research tasks requiring extended back-and-forth
- Agent workflows where accumulated context would normally force a restart

Without compaction, developers had to manually manage context windows by truncating history or splitting tasks. Compaction automates this process intelligently, enabling truly continuous work sessions.

### Is Claude Opus 4.6 available on AWS Bedrock?

According to AWS's weekly roundup from February 23, 2026, Claude Sonnet 4.6 is available in Amazon Bedrock. The announcement specifically mentions Sonnet 4.6, which suggests the Sonnet tier of the 4.6 family is deployed on AWS infrastructure.

For Opus 4.6 availability on Bedrock, check the current AWS Bedrock model catalog, as enterprise deployment timelines for the Opus tier may differ from the Sonnet release.

### When should I use Claude Opus 4.6 versus earlier models?

Opus 4.6 is optimized for sustained reasoning and large context scenarios. Based on user testing, it excels when:

- Tasks involve complex, multi-step workflows
- You need to process large documents or codebases
- Extended reasoning chains improve output quality
- Sessions run long enough to benefit from context compaction

For short, simple prompts, the performance difference may not be noticeable. Earlier models may still be more cost-effective for quick queries or high-volume, low-complexity tasks. Choose Opus 4.6 when task complexity and context size justify the additional capability.