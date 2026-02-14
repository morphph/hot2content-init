---
term: "Chain of Thought (CoT)"
slug: chain-of-thought
lang: en
category: Prompting Techniques
definition: "A prompting strategy where the model is encouraged to break down complex problems into intermediate reasoning steps before arriving at a final answer, significantly improving accuracy on logic, math, and multi-step tasks."
related: [prompt-engineering, adaptive-thinking, hallucination]
date: 2026-02-10
source_topic: chain-of-thought
keywords:
  - "chain of thought"
  - "CoT prompting"
  - "AI reasoning"
---

## What is Chain of Thought?

Chain of Thought (CoT) is a prompting technique that encourages large language models to show their reasoning process step by step, rather than jumping directly to an answer. By explicitly working through intermediate steps, models produce significantly more accurate results on tasks involving arithmetic, logic, commonsense reasoning, and complex problem-solving.

The concept was popularized by Google researchers in 2022 and has since become a foundational technique in prompt engineering. In 2026, CoT has evolved from a manual prompting trick into a built-in capability of frontier models — Claude's "Adaptive Thinking" and OpenAI's o-series models both use internal chain-of-thought reasoning automatically.

## How It Works

There are several ways to elicit chain-of-thought reasoning:

- **Zero-shot CoT**: Simply adding "Let's think step by step" to a prompt can trigger reasoning behavior
- **Few-shot CoT**: Providing examples that include step-by-step reasoning teaches the model the expected format
- **Automatic CoT**: Modern models like Claude Opus 4.6 can internally decide when to engage deeper reasoning through features like Adaptive Thinking
- **Self-consistency**: Generating multiple chains of thought and selecting the most common answer improves reliability

For example, instead of asking "What is 47 × 83?", a CoT prompt might lead the model to decompose: "47 × 83 = 47 × 80 + 47 × 3 = 3760 + 141 = 3901" — arriving at the correct answer through visible steps.

## Why It Matters

Chain of thought has transformed how we use LLMs:

- **Accuracy**: CoT can improve performance on math and reasoning benchmarks by 20-40% compared to direct answering
- **Transparency**: Step-by-step reasoning makes model outputs auditable — you can identify where reasoning goes wrong
- **Reduced hallucination**: Breaking problems into steps reduces the chance of fabricating a plausible-sounding but wrong answer
- **Complex tasks**: Multi-step planning, code debugging, and scientific analysis all benefit from explicit reasoning chains
- **Trust**: Users can verify each reasoning step, building confidence in the final answer

In 2026, the distinction between "thinking" and "non-thinking" models has become a key product differentiator, with extended thinking budgets directly correlated to performance on hard problems.

## Related Terms

- **Adaptive Thinking**: Claude's built-in chain-of-thought system that dynamically allocates reasoning effort
- **Prompt Engineering**: CoT is one of the most impactful prompt engineering techniques
- **Hallucination**: CoT helps reduce hallucinations by enforcing logical consistency
