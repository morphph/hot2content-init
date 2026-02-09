---
term: "Context Window"
slug: context-window
lang: en
category: LLM Fundamentals
definition: "The maximum number of tokens (words/subwords) a language model can process in a single interaction, determining how much text it can 'see' at once."
related: [agent-teams, adaptive-thinking]
date: 2026-02-09
source_topic: claude-opus-context-window
---

## What is a Context Window?

A context window defines the upper limit of text a large language model (LLM) can read and reason about in one go. Think of it as the model's working memory — everything within the window is visible; everything outside is forgotten.

As of February 2026, context windows have expanded dramatically. **Claude Opus 4.6** offers a **1 million token** context window in beta (up from 200K), while most GPT-5 series models operate at **128K-256K tokens**. A million tokens is roughly equivalent to **7-8 full-length novels** or an entire medium-sized codebase.

## How It Works

When you send a prompt to an LLM, the model processes all tokens within its context window using self-attention mechanisms:

- **Input tokens**: Your prompt, system instructions, and any provided documents
- **Output tokens**: The model's response, generated one token at a time
- **Total budget**: Input + output must fit within the context window
- **Attention computation**: Each token attends to every other token, making cost scale quadratically with window size

Larger context windows enable processing entire documents, codebases, or long conversation histories without summarization or chunking.

## Why It Matters

Context window size directly impacts what AI can accomplish:

- **Code review**: A 1M token window can hold an entire repository, enabling holistic analysis instead of file-by-file review
- **Document analysis**: Legal contracts, research papers, and financial reports can be processed whole
- **Long conversations**: Extended back-and-forth interactions without losing earlier context

However, larger isn't always better. Research shows models can struggle with information in the **middle** of very long contexts (the "lost in the middle" problem). Additionally, processing full context windows is expensive — **Claude Opus 4.6** with 1M tokens costs significantly more per request than shorter interactions.

The **Compaction API**, introduced alongside Claude Opus 4.6, offers an alternative: server-side context summarization that enables effectively infinite conversations without hitting window limits.

## Related Terms

- **Token**: The basic unit of text processing in LLMs
- **Compaction API**: Server-side context summarization for long conversations
- **RAG (Retrieval-Augmented Generation)**: An alternative to large context windows that retrieves relevant chunks on demand
