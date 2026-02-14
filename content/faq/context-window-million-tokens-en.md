---
title: "1 Million Token Context Window"
description: "Frequently asked questions about million-token context windows: how to use them, limitations, and best practices"
date: 2026-02-10
lang: en
slug: context-window-million-tokens
keywords:
  - "million token context window"
  - "1M context window"
  - "long context AI"
---

### What is a 1 million token context window?

A 1 million token context window means a language model can process up to 1 million tokens (roughly **750,000 words** or **7-8 full novels**) in a single interaction. This represents a massive expansion from earlier limits:

* **GPT-3 (2020)**: 4K tokens
* **GPT-4 (2023)**: 8K-128K tokens
* **Claude 3.5 (2024)**: 200K tokens
* **Claude Opus 4.6 (2026)**: **1M tokens** (beta)
* **Gemini 2.5 Pro (2026)**: **2M tokens**

In practical terms, 1M tokens lets you feed an entire codebase (50,000+ lines), a full legal contract suite, or months of conversation history into a single prompt. The model can reason about all of it simultaneously.

---

### How do I use a million-token context window effectively?

Simply stuffing tokens into the context window doesn't guarantee good results. Best practices:

1. **Structure your input**: Use clear headings, file separators, and markers so the model can navigate the content
2. **Put critical info at the start and end**: Models attend best to the beginning and end of context (the "lost in the middle" problem still exists)
3. **Use XML tags or delimiters**: `<file path="src/main.ts">...</file>` helps the model understand document boundaries
4. **Be explicit about what to focus on**: "Given the codebase above, focus on the authentication module and find security issues"
5. **Combine with prompt caching**: Cache the static context (codebase) and vary only the query — saves up to 90% on costs

Don't use the full window when you don't need it. Smaller, focused contexts often produce better results than massive, unfocused ones.

---

### What are the limitations of large context windows?

Despite the impressive size, million-token contexts have real limitations:

* **Lost in the middle**: Models can miss information placed in the middle of very long contexts. Critical details should be at the start or end.
* **Cost**: Processing 1M tokens on Claude Opus 4.6 costs ~$5 input + $25 output per request. Heavy usage adds up fast.
* **Latency**: More tokens = longer processing time. A 1M token request takes significantly longer than a 10K token request.
* **Diminishing returns**: Beyond a certain point, adding more context doesn't improve output quality and can even degrade it.
* **No true "understanding"**: The model processes tokens statistically — it doesn't deeply comprehend a million-token document the way a human would over days of study.

For many use cases, **RAG (Retrieval-Augmented Generation)** — fetching only relevant chunks — outperforms brute-force context stuffing.

---

### Million-token context vs RAG: which should I use?

Both approaches have strengths:

| | Large Context Window | RAG |
|---|---|---|
| **Best for** | Holistic analysis, cross-referencing | Precise retrieval from huge datasets |
| **Cost** | High (process everything) | Lower (process only relevant chunks) |
| **Accuracy** | May miss middle content | Depends on retrieval quality |
| **Setup** | Simple (just send tokens) | Requires vector DB, embeddings, pipeline |
| **Latency** | Higher for large inputs | Lower per query |

**Use large context when**: You need the model to understand relationships across the entire document (code review, legal analysis, research synthesis).

**Use RAG when**: You have a large corpus (>1M tokens) and need to answer specific questions from it, or when cost/latency matter.

Many production systems combine both: RAG retrieves the top-k relevant documents, then feeds them into a large context window for analysis.

---

### How much does it cost to use the full 1M context?

Using the complete 1M token context on Claude Opus 4.6:

* **Input**: 1M tokens × $5/M = **$5.00 per request**
* **Output** (128K max): 128K × $25/M = **$3.20 per request**
* **Total**: ~$8.20 per full-context request

Cost optimization strategies:

* **Prompt caching**: Cache static content, save up to **90%** on repeated input tokens
* **Batch processing**: Up to **50%** discount for non-real-time requests
* **Use smaller models for triage**: Use Haiku/Sonnet to identify relevant sections, then send only those to Opus
* **Compaction API**: For conversations, summarize older context instead of resending everything

A team doing 100 full-context requests/day would spend ~$820/day without caching, or ~$82/day with caching enabled.

---

### What can I fit in 1 million tokens?

Practical examples of what fits in 1M tokens:

* **Code**: ~50,000-70,000 lines of code (a medium-sized application)
* **Documents**: ~750,000 words (about 7-8 novels, or 3,000 pages)
* **Conversations**: ~500,000 back-and-forth messages
* **Data**: ~100,000 rows of structured CSV data
* **Mixed**: A full codebase + documentation + test suite + CI configuration

Real-world applications:

* Entire repository code review in one pass
* Full legal discovery document analysis
* Complete patient medical history review
* Semester-long conversation with an AI tutor
* Multi-document research synthesis

---

### Does the full context window work with all Claude models?

No, context window sizes vary by model:

* **Claude Opus 4.6**: 1M tokens (beta) — the only model with the full million-token window
* **Claude Sonnet 4.5**: 200K tokens
* **Claude Haiku 4**: 200K tokens

The 1M context is currently in beta and may have availability limits. For production systems, plan for graceful fallback to 200K if the 1M window is unavailable.

Note that **max output tokens** are separate from context window size. Opus 4.6 supports up to 128K output tokens, meaning the model can generate very long responses even within the 1M context.

---

### How does the Compaction API relate to context windows?

The Compaction API is a complement to large context windows, not a replacement. It enables effectively infinite conversations by summarizing older context:

* **Context window**: Fixed-size "working memory" — everything must fit at once
* **Compaction API**: Server-side summarization that compresses old conversation turns, freeing space for new ones

Workflow: As a conversation approaches the context limit, the Compaction API summarizes earlier turns into a compact representation. The model retains key information without the full verbatim history.

This is ideal for **long-running agent sessions**, chatbots, and coding workflows where conversations span days or weeks. Without compaction, you'd hit the 1M limit and lose all earlier context.

---

### Will context windows keep growing?

The trend suggests yes, but with diminishing practical returns:

* **2023**: 100K (Claude 2.1) was revolutionary
* **2024**: 200K became standard
* **2026**: 1M-2M available (Claude, Gemini)
* **2027+**: 10M+ possible, but may not be necessary

The real question isn't "how big?" but "how well does the model use the context?" Research focus is shifting toward:

* Better attention mechanisms that don't lose middle content
* More efficient architectures that reduce cost per token
* Hybrid approaches (RAG + large context) for optimal results
* Compaction and summarization for infinite effective context

For most developers, the practical limit isn't the context window size — it's the cost and latency of processing millions of tokens.
