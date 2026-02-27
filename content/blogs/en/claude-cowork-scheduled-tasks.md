---
slug: claude-cowork-scheduled-tasks
title: "Claude Cowork scheduled tasks — Quick Guide"
description: "A practical quick guide to Claude Cowork scheduled tasks for AI developers and teams."
keywords: ["Claude Cowork scheduled tasks", "AI guide", "how to"]
date: 2026-02-27
tier: 3
lang: en
type: blog
tags: ["quick-read", "practical"]
---

# Claude Cowork scheduled tasks

**TL;DR:** Claude Cowork now supports scheduled tasks, letting you automate recurring work like morning briefs, calendar management, and weekly reports without manual triggering.

## What's new

Anthropic shipped scheduled tasks for Cowork this week. The feature does exactly what you'd expect: set a time, define what Claude should do, and it runs automatically on your schedule.

Felix Rieseberg, who works on Claude Code, shared his personal use case: "I have Cowork check my calendar every morning and automatically fix conflicts - with clear instructions how to do it."

The official Claude account highlighted three primary use cases:
- Morning briefs
- Weekly spreadsheet updates
- Friday team presentations

## How scheduled tasks work

Cowork tasks already let Claude work autonomously on longer jobs in the background. Scheduled tasks extend this by adding a trigger mechanism—instead of manually starting a task, you define when it should run.

The task executes with the same capabilities as a regular Cowork session: file access, tool use, and multi-step reasoning. The difference is purely in initiation.

## Setting up a scheduled task

Navigate to Cowork in Claude and create a new task. You'll see an option to schedule it rather than run immediately.

Define three things:

**1. The schedule**
Pick from common intervals (daily, weekly, monthly) or set custom times. Timezone handling appears to follow your account settings.

**2. The task description**
Write clear instructions for what Claude should accomplish. Be specific about:
- What to check or analyze
- What actions to take
- How to handle edge cases
- Where to output results

**3. The context**
Attach relevant files, connect to integrations, or reference previous conversations that provide necessary background.

## Practical examples

### Morning calendar audit