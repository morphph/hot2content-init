---
slug: claude-code-figma-mcp-integration
title: "Claude Code Figma MCP integration — Frequently Asked Questions"
description: "Answers to the most common questions about Claude Code Figma MCP integration in AI."
keywords: ["Claude Code Figma MCP integration", "Claude Code Figma MCP integration FAQ", "AI FAQ"]
date: 2026-02-18
tier: 3
lang: en
type: faq
tags: ["faq", "AI"]
---

# Claude Code Figma MCP integration: Frequently Asked Questions

### What is the Claude Code Figma MCP integration and how does it work?

The Claude Code Figma MCP integration connects Anthropic's Claude Code terminal-based AI coding assistant with Figma's design platform through the Model Context Protocol (MCP). This integration allows developers to push working code prototypes directly from their terminal into Figma canvases.

The workflow operates bidirectionally. You can build functional components in code using Claude Code, then export them to Figma for visual iteration. Designers can explore multiple versions of a component on the canvas while developers continue refining the codebase. The MCP server handles the translation between code representations and Figma's design system.

To set it up, you install the Figma MCP server and configure it within your Claude Code environment. Once connected, commands like pushing a React component to a specific Figma file become available directly from your coding session.

### How do I install and configure the Figma MCP server for Claude Code?

Installation requires Node.js and access to both Claude Code and a Figma account with API access. Start by installing the Figma MCP server package from npm or the official repository. You'll need to generate a Figma personal access token from your account settings.

Configure the MCP server by adding it to your Claude Code settings file (typically `.claude/settings.json` or through the `/mcp` command). The configuration includes your Figma access token and optionally a default team or project ID.

Example configuration: