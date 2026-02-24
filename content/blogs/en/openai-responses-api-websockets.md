---
slug: openai-responses-api-websockets
title: "OpenAI Responses API WebSockets — Quick Guide"
description: "A practical quick guide to OpenAI Responses API WebSockets for AI developers and teams."
keywords: ["OpenAI Responses API WebSockets", "AI guide", "how to"]
date: 2026-02-24
tier: 3
lang: en
type: blog
tags: ["quick-read", "practical"]
---

# OpenAI Responses API WebSockets

**TL;DR:** OpenAI now supports WebSockets for the Responses API, enabling persistent connections for low-latency agent interactions with heavy tool calling — update to `openai-python` v2.22.0 to use it.

## What Changed

On February 23, 2026, OpenAI released WebSocket support for the Responses API. The [openai-python v2.22.0 release](https://github.com/openai/openai-python/compare/v2.21.0...v2.22.0) includes this feature, and the official [@OpenAIDevs announcement](https://twitter.com/OpenAIDevs) describes it as "built for low-latency, long-running agents with heavy tool calls."

This matters because the standard HTTP request/response pattern creates overhead when your agent needs to make dozens of tool calls in a single session. Each round trip adds latency. WebSockets maintain a persistent connection, eliminating that overhead.

## When to Use WebSockets vs HTTP

**Use WebSockets when:**
- Your agent makes 5+ tool calls per session
- You need sub-second response times for interactive applications
- You're building long-running agent sessions (minutes, not seconds)
- Your agent handles real-time data streams

**Stick with HTTP when:**
- Simple single-turn completions
- Batch processing where latency doesn't matter
- Serverless functions with cold starts (WebSocket connections need warmup)
- You're behind proxies that don't support WebSockets

## Getting Started

### 1. Update Your SDK