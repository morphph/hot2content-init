---
slug: claude-cowork-scheduled-tasks-automation
title: "Claude Cowork Scheduled Tasks Automation — Quick Guide"
description: "A practical quick guide to Claude Cowork scheduled tasks automation for AI developers and teams."
keywords: ["Claude Cowork scheduled tasks automation", "AI guide", "how to"]
date: 2026-02-26
tier: 3
lang: en
type: blog
tags: ["quick-read", "practical"]
---

# Claude Cowork Scheduled Tasks Automation

**TL;DR:** Claude Cowork now supports scheduled tasks, letting you automate recurring AI workflows like morning briefs, weekly reports, and calendar management without manual intervention.

## What's New

Anthropic rolled out scheduled tasks for Claude Cowork on February 26, 2026. The feature allows Claude to execute predefined tasks at specific times automatically—think cron jobs, but with an AI agent handling the actual work.

As announced by the Claude team: "Claude can now complete recurring tasks at specific times automatically: a morning brief, weekly spreadsheet updates, Friday team presentations."

## Why This Matters

Before this update, Cowork tasks required manual triggering. You'd open the interface, describe what you wanted, and wait for completion. Useful, but not scalable for repetitive workflows.

Scheduled tasks change this equation. Set it once, and Claude handles the rest. This is particularly valuable for:

- **Daily operational tasks** that follow consistent patterns
- **Recurring reports** that pull from the same data sources
- **Time-sensitive workflows** that need to complete before you start work

## Practical Use Cases

### Morning Calendar Audit

Felix Rieseberg, who works on Claude Code, shared his setup: "I have Cowork check my calendar every morning and automatically fix conflicts—with clear instructions how to do it."

This is a straightforward but high-value automation. Instead of manually scanning your calendar each morning, Claude reviews your schedule, identifies double-bookings or back-to-back meetings without buffer time, and either resolves them directly or flags them for your review.

### Weekly Data Updates

If your team maintains spreadsheets or dashboards that need regular updates, scheduled tasks can handle the refresh cycle. Point Claude at your data sources, define the update logic, and schedule it to run every Monday morning before standup.

### Automated Briefings

Generate daily or weekly summaries from multiple sources. Claude can pull from your project management tool, communication channels, and documentation to compile a status update that's waiting in your inbox when you arrive.

### Friday Presentations

Teams that do weekly reviews can automate slide deck preparation. Claude pulls metrics from your analytics, summarizes completed work from your task tracker, and generates a draft presentation ready for final review.

## How to Set Up Scheduled Tasks

While Anthropic hasn't published detailed documentation at launch, the workflow follows a predictable pattern based on how Cowork operates:

### Step 1: Define Your Task

Write clear instructions for what Claude should accomplish. Be specific about:

- What data sources to access
- What actions to take
- What output format you need
- Any conditions or edge cases to handle

**Example task definition:**