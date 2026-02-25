---
slug: swe-bench-pro-vs-verified-deprecation
title: "SWE-bench Pro vs Verified deprecation — Frequently Asked Questions"
description: "Answers to the most common questions about SWE-bench Pro vs Verified deprecation in AI."
keywords: ["SWE-bench Pro vs Verified deprecation", "SWE-bench Pro vs Verified deprecation FAQ", "AI FAQ"]
date: 2026-02-25
tier: 3
lang: en
type: faq
tags: ["faq", "AI"]
---

# SWE-bench Pro vs Verified deprecation: Frequently Asked Questions

### What is SWE-bench and why does it matter for evaluating coding AI?

SWE-bench is a benchmark designed to test AI systems on real-world software engineering tasks. Rather than synthetic coding puzzles, it uses actual GitHub issues and pull requests from popular open-source Python repositories. Models must read issue descriptions, understand codebases, and generate patches that pass existing test suites.

The benchmark matters because it measures practical coding ability—the kind enterprises care about when deploying AI coding assistants. A model scoring well on SWE-bench can theoretically help developers fix bugs, implement features, and navigate unfamiliar codebases. As frontier models like GPT-4.5, Claude Opus 4, and Gemini 2.5 Pro compete for enterprise contracts, SWE-bench scores have become a key differentiator in marketing materials and procurement decisions.

### What is the difference between SWE-bench Verified and SWE-bench Pro?

SWE-bench Verified was a curated subset of 500 problems from the original SWE-bench dataset. The curation process involved human reviewers checking that problems were solvable, unambiguous, and had reliable test coverage. It became the de facto standard for comparing frontier coding models throughout 2025.

SWE-bench Pro represents a new generation of the benchmark with several key changes. It includes harder problems that better differentiate between top-performing models. The test set is larger and more diverse, covering additional repositories and problem types. Critically, it addresses contamination concerns—as models trained on internet-scale data may have seen SWE-bench Verified solutions during training. SWE-bench Pro uses more recent issues and applies stricter anti-contamination measures.

### Why is OpenAI recommending SWE-bench Pro over Verified?

OpenAI announced in February 2026 that it now recommends reporting SWE-bench Pro scores instead of SWE-bench Verified. The primary driver is benchmark saturation. Frontier models have reached scores above 70% on Verified, compressing the useful range for differentiation. When multiple models cluster around similar high scores, the benchmark loses discriminative power.

There are also concerns about data contamination. SWE-bench Verified problems have been publicly available since late 2023, meaning newer models may have inadvertently trained on solutions or similar code patterns. SWE-bench Pro uses fresher data with stricter holdout procedures. OpenAI indicated they're working with the broader AI industry to establish stronger coding evaluation standards, suggesting this transition reflects an emerging consensus rather than a unilateral decision.

### Is SWE-bench Verified officially deprecated?

The benchmark hasn't been formally deprecated by its creators at Princeton NLP, but the practical effect of OpenAI's recommendation is similar. When a leading AI lab stops reporting a metric, others typically follow to maintain apples-to-apples comparisons. Anthropic, Google DeepMind, and other major players are expected to shift their public reporting to SWE-bench Pro.

This doesn't mean Verified scores become meaningless overnight. Historical comparisons using Verified remain valid, and researchers may continue running evaluations for continuity. However, for new model releases and forward-looking benchmarking, Pro will likely become the standard reference point. Organizations relying on SWE-bench scores for procurement decisions should update their evaluation criteria accordingly.

### How do existing model scores on Verified compare to Pro?

Direct score comparisons between Verified and Pro are not meaningful because the problem sets differ in difficulty and composition. A model scoring 65% on Verified might score 40-50% on Pro—not because it regressed, but because Pro problems are harder.

Early indications suggest Pro scores run approximately 15-25 percentage points lower than Verified for the same model. This recalibrates expectations and provides more headroom for future improvements. For procurement or technical evaluation, treat Pro scores as a fresh baseline rather than expecting parity with Verified numbers. The relative ordering of models may also shift somewhat, as harder benchmarks can expose different capability profiles.

### What should enterprises do about existing AI coding tool evaluations?

Organizations that recently evaluated coding assistants using SWE-bench Verified should consider re-running evaluations with Pro for future decisions. Existing contracts and deployments don't need immediate action—your tools didn't suddenly become worse. The benchmark change reflects measurement improvements, not capability changes.

For ongoing evaluations, request SWE-bench Pro scores from vendors. If vendors only provide Verified scores, ask about their Pro evaluation timeline. Be cautious about comparing Verified scores from one vendor against Pro scores from another. Additionally, remember that benchmarks are one input among many. Production performance, integration quality, security posture, and user experience often matter more than percentage-point differences on any single benchmark.

### Does this affect how I should interpret AI coding benchmark claims?

Yes—this transition highlights why benchmark literacy matters. Any single number oversimplifies AI capability. When reviewing benchmark claims, consider: Is this the most current version? What's the contamination risk? How does problem difficulty compare to your actual use cases?

SWE-bench tests Python repositories specifically, so scores may not predict performance on JavaScript, Rust, or proprietary codebases. The benchmark emphasizes bug fixes over feature development. Real-world coding involves ambiguity, clarifying requirements, and collaboration—none of which SWE-bench measures. Use benchmarks as rough filters rather than definitive rankings. Pilot programs with your actual codebase remain the most reliable evaluation method.

### Are there alternatives to SWE-bench for evaluating coding AI?

Several benchmarks complement SWE-bench. HumanEval and MBPP test function-level code generation but are largely saturated for frontier models. LiveCodeBench uses competition programming problems with temporal holdouts to reduce contamination. CodeContests from DeepMind evaluates algorithmic problem-solving.

For practical evaluation, consider domain-specific benchmarks closer to your use case. Enterprise security teams might prioritize vulnerability detection benchmarks. Teams working with specific frameworks can construct internal test suites. The Aider leaderboard tracks real-world editing performance across multiple benchmarks. No single benchmark captures "coding ability" comprehensively—a portfolio approach provides more robust signal.

### Will SWE-bench Pro also become saturated eventually?

Almost certainly. Benchmark saturation follows a predictable pattern: a challenging test differentiates models initially, research focuses on improving performance, scores climb, and eventually the benchmark loses discriminative power. SWE-bench Verified took roughly 18-24 months to saturate after becoming popular.

Pro buys time by raising difficulty, but the fundamental dynamic remains. The AI evaluation community is exploring alternatives including live benchmarks with continuously refreshed problems, private held-out test sets, and capability evaluations that resist training-time optimization. Expect Pro to remain useful through 2026-2027, with successor benchmarks likely emerging as frontier models continue improving.

### How should AI researchers respond to this benchmark transition?

Researchers should report both Verified and Pro scores during the transition period to maintain comparability with prior work while establishing Pro baselines. When writing papers, clearly label which version you used and note that direct cross-version comparisons are inappropriate.

For teams developing coding agents, this is an opportunity to stress-test on harder problems. If your approach performed well on Verified through overfitting to its problem distribution, Pro will expose that. Consider contributing to the broader evaluation ecosystem—proposing new benchmarks, identifying weaknesses in existing ones, or publishing analyses of what current benchmarks miss. The community benefits from diverse evaluation approaches rather than over-indexing on any single metric.