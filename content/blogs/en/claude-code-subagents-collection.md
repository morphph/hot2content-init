---
slug: claude-code-subagents-collection
title: "Claude Code Subagents Collection — Quick Guide"
description: "A practical quick guide to Claude Code subagents collection for AI developers and teams."
keywords: ["Claude Code subagents collection", "AI guide", "how to"]
date: 2026-02-24
tier: 3
lang: en
type: blog
tags: ["quick-read", "practical"]
---

# Claude Code Subagents Collection

**TL;DR:** The VoltAgent/awesome-claude-code-subagents repository provides 100+ ready-to-use specialized agents that extend Claude Code's capabilities for specific development tasks—from code review to database migrations to security audits.

## What Are Claude Code Subagents?

Subagents are specialized AI assistants that run within Claude Code to handle specific tasks. Instead of relying on Claude's general-purpose capabilities, subagents bring domain expertise and task-specific prompts to particular workflows.

Think of them as plugins for your AI coding assistant. A security-focused subagent knows to check for OWASP vulnerabilities. A database subagent understands migration patterns. A documentation subagent follows your team's style guide.

The [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) collection (11,000+ GitHub stars) curates over 100 community-contributed subagents organized by use case.

## How Subagents Work

Claude Code's Task tool spawns subagents as isolated processes with specific capabilities. Each subagent receives:

- A specialized system prompt defining its expertise
- Access to specific tools (Bash, Read, Edit, Grep, etc.)
- A focused task description

The parent Claude session coordinates multiple subagents, combining their outputs into a cohesive result.