---
slug: obsidian-agent-skills
title: "Obsidian Agent Skills — Teach Your AI to Use Markdown Vaults"
description: "A practical guide to obsidian-skills: enable Claude Code, OpenCode, and other AI agents to work directly with your Obsidian vault."
keywords: ["Obsidian agent skills", "Claude Code Obsidian", "AI agent markdown", "obsidian-skills"]
date: 2026-02-28
tier: 3
lang: en
type: blog
tags: ["quick-read", "practical", "tools"]
hreflang_zh: /zh/blog/obsidian-agent-skills
---

# Obsidian Agent Skills — Teach Your AI to Use Markdown Vaults

**TL;DR:** The obsidian-skills repository (11.5k GitHub stars) provides plug-and-play agent skills that let Claude Code, OpenCode, and other AI agents understand Obsidian-flavored Markdown, JSON Canvas, Bases, and CLI operations—making your vault a first-class citizen in agentic workflows.

## What Are Obsidian Agent Skills?

Kepano's [obsidian-skills](https://github.com/kepano/obsidian-skills) repository packages five specialized capabilities that teach AI coding agents how to work with Obsidian's ecosystem. These skills follow the emerging Agent Skills specification, meaning they work across multiple platforms including Claude Code and OpenCode.

Think of them as instruction manuals written for AI. When you add these skills to your agent's context, it learns the syntax rules for wikilinks, callouts, properties, and other Obsidian-specific features that would otherwise confuse a general-purpose LLM.

**Obsidian-skills Key Facts:**
- GitHub stars: 11,500+
- License: MIT
- Active contributors: 12
- Compatible with: Claude Code, OpenCode, Skills marketplace

## The Five Skills Explained

| Skill | What It Does |
|-------|--------------|
| `obsidian-markdown` | Handles Obsidian-flavored Markdown including `[[wikilinks]]`, `![[embeds]]`, callouts, and YAML properties |
| `obsidian-bases` | Creates and edits Bases files with views, filters, formulas, and summary calculations |
| `json-canvas` | Manipulates JSON Canvas files—nodes, edges, groups, and spatial connections |
| `obsidian-cli` | Interacts with vaults through the Obsidian CLI for plugin and theme development |
| `defuddle` | Extracts clean markdown from web pages, stripping clutter to preserve tokens |

The `defuddle` skill deserves special mention. When your agent needs to ingest web content into your vault, it converts messy HTML into clean markdown without wasting context window on navigation menus and ads.

## Installation Methods

### Option 1: Skills Marketplace (Recommended)

If your agent platform supports the Skills marketplace: