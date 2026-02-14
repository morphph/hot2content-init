---
term: "Token"
slug: token
lang: en
category: LLM Fundamentals
definition: "The basic unit of text that language models process — a subword piece that may be a complete word, part of a word, or a punctuation mark. Models read, reason about, and generate text one token at a time."
related: [context-window, prompt-engineering]
date: 2026-02-10
source_topic: token
keywords:
  - "token"
  - "tokenization"
  - "LLM tokens"
---

## What is a Token?

A token is the fundamental unit of text processing in large language models. When you send text to an LLM, it's first split into tokens — subword pieces that the model can process. A token might be a whole word ("hello"), part of a word ("un" + "believ" + "able"), a number ("42"), or punctuation (",").

As a rough approximation: **1 token ≈ 0.75 English words**, or equivalently, **1,000 tokens ≈ 750 words**. For Chinese text, each character is typically 1-2 tokens.

## How Tokenization Works

Models use tokenizers (like BPE — Byte Pair Encoding) to convert text into tokens:

- **Common words** become single tokens: "the", "and", "code" → 1 token each
- **Uncommon words** are split: "tokenization" → "token" + "ization" (2 tokens)
- **Numbers** are often split digit by digit: "12345" → multiple tokens
- **Code** can be token-heavy: variable names, syntax, and whitespace all consume tokens
- **Different languages** have different token efficiencies: English is typically more efficient than CJK languages

Each model family has its own tokenizer, so the exact token count for the same text varies between Claude, GPT, and Gemini.

## Why It Matters

Tokens are the currency of LLM interactions:

- **Context window**: Measured in tokens (e.g., Claude Opus 4.6's 1M token window)
- **Pricing**: APIs charge per token (Claude Opus 4.6: $5/M input tokens, $25/M output tokens)
- **Latency**: More tokens = longer generation time (models generate ~50-150 tokens/second)
- **Quality**: The number of tokens in your prompt affects how well the model understands your request

Understanding tokens helps you estimate costs, optimize prompts, and stay within context limits. For developers working with LLM APIs, token counting is a daily consideration — it directly impacts both cost and performance.

## Related Terms

- **Context Window**: The maximum number of tokens a model can process at once
- **Prompt Engineering**: Optimizing prompts (in tokens) for better model outputs
- **BPE (Byte Pair Encoding)**: The most common tokenization algorithm used by modern LLMs
