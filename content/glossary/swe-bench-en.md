---
term: "SWE-Bench"
slug: swe-bench
lang: en
category: Benchmarks
definition: "A benchmark that evaluates AI coding agents by testing their ability to resolve real GitHub issues from popular open-source repositories."
related: [agentic-coding, context-window]
date: 2026-02-10
source_topic: swe-bench-benchmark
keywords:
  - "SWE-bench"
  - "software engineering benchmark"
  - "AI coding benchmark"
---

## What is SWE-Bench?

SWE-Bench (Software Engineering Benchmark) is an evaluation framework created by Princeton researchers that tests AI models on their ability to solve real-world software engineering tasks. Unlike synthetic coding benchmarks, SWE-Bench uses actual GitHub issues and pull requests from popular open-source projects like Django, Flask, scikit-learn, and sympy.

Each task provides the model with a repository snapshot and an issue description. The model must produce a code patch that resolves the issue and passes the project's test suite. This makes SWE-Bench one of the most realistic measures of AI coding ability.

## Variants

As of 2026, SWE-Bench has several variants:

- **SWE-Bench (Original)**: 2,294 tasks from 12 Python repositories. Early baseline.
- **SWE-Bench Verified**: A human-verified subset ensuring tasks are solvable and tests are meaningful. Claude Opus 4.6 leads at **80.8%**, GPT-5.3 Codex at **80.0%**.
- **SWE-Bench Pro**: A harder variant with more complex, multi-file issues. GPT-5.3 Codex leads at **56.8%**.
- **SWE-Bench Multimodal**: Includes tasks requiring understanding of screenshots and UI (introduced 2025).

## Why It Matters

SWE-Bench has become the primary yardstick for AI coding agents because:

- **Realistic**: Tests on actual software projects, not toy problems
- **End-to-end**: Models must understand codebases, write patches, and satisfy tests
- **Standardized**: Consistent evaluation across models and tools
- **Progressive difficulty**: Variants allow tracking improvement over time

However, critics note that SWE-Bench tasks are biased toward Python, may not reflect enterprise codebases, and high scores don't guarantee good performance on your specific project. It's a useful signal, not the complete picture.

## Related Terms

- **Terminal-Bench 2.0**: Benchmark testing terminal/CLI tool usage (GPT-5.3 Codex leads at 77.3%)
- **HumanEval**: Older function-level code generation benchmark
- **Agentic Coding**: The development paradigm SWE-Bench measures
