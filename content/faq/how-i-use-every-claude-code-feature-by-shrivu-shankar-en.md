---
slug: how-i-use-every-claude-code-feature-by-shrivu-shankar
title: "How I Use Every Claude Code Feature - by Shrivu Shankar"
description: "Expert answers to How I Use Every Claude Code Feature - by Shrivu Shankar and related questions about Claude Code."
keywords: ["Claude Code", "How I Use Every Claude Code Feature - by Shrivu Shankar", "AI FAQ"]
date: 2026-02-25
tier: 3
lang: en
type: faq
tags: ["faq", "AI"]
---

# How I Use Every Claude Code Feature - by Shrivu Shankar

## What is Shrivu Shankar's guide to Claude Code features?

Shrivu Shankar's guide is a comprehensive walkthrough of Claude Code's capabilities, written from the perspective of a power user who has extensively tested the tool for both individual development and team projects. The guide covers nearly every feature Shankar uses—and notably, the ones he doesn't—providing practical insights into what actually works in production workflows.

The guide spans several key areas of Claude Code functionality:

**CLAUDE.md Files**: The foundational configuration file that provides context and instructions to Claude Code. This serves as the starting point for customizing Claude Code's behavior for specific projects or teams.

**Custom Slash Commands**: User-defined commands that extend Claude Code's built-in capabilities. These allow developers to create repeatable workflows tailored to their specific needs.

**Subagents**: One of the more advanced features, subagents allow Claude Code to dynamically spawn specialized agents for specific tasks. According to Shankar's comments, the recommended approach is to let Claude Code dynamically define subagents via the task tool, rather than putting all context in a static `subagent.md` file. This allows the main context to remain visible to Claude and other tasks while still benefiting from the isolated execution of subagents.

**Hooks**: Event-driven automations that execute in response to specific Claude Code actions, enabling more sophisticated workflows.

**GitHub Actions Integration**: Configuration for CI/CD pipelines that leverage Claude Code capabilities.

Simon Willison, a respected voice in the developer tools space, highlighted Shankar's guide as "useful, detailed" with "lots of tips for both individual Claude Code usage and configuring it for larger team projects."

### What is a CLAUDE.md file and why is it important?

A CLAUDE.md file is the primary configuration mechanism for customizing Claude Code's behavior within a project. It contains instructions, context, and guidelines that Claude Code reads and follows when working in that directory.

The file serves several purposes:

- **Project context**: Describes the codebase architecture, conventions, and important files
- **Behavioral instructions**: Specifies how Claude Code should approach tasks, what to avoid, and preferred coding styles
- **Team standards**: Defines conventions that ensure consistency across team members using Claude Code

Shankar considers CLAUDE.md foundational to effective Claude Code usage. A well-crafted CLAUDE.md file means less time spent re-explaining project context and more consistent output from Claude Code across sessions.

### How do subagents work in Claude Code?

Subagents are specialized, isolated Claude instances that handle specific subtasks. Rather than having the main Claude context do everything, you can delegate focused work to subagents that operate with their own context window.

According to Shankar's guidance in the comments section of his article, the optimal approach is to let Claude Code dynamically define subagents via the task tool. This provides two benefits:

1. The main Claude context retains visibility into what subagents are doing
2. You still get the execution benefits of isolated subagent processing

This contrasts with a purely static approach where all subagent instructions live in a separate `subagent.md` file, which can create information silos between the main agent and its subagents.

### What Claude Code features does Shankar recommend avoiding?

Shankar's guide is notable for being honest about features he doesn't use, not just the ones he does. While the specific features he avoids aren't detailed in the available sources, this transparency is valuable—knowing what a power user skips helps others avoid spending time on capabilities that may not provide sufficient value in practice.

This approach reflects a pragmatic philosophy: not every feature needs to be used. Effective Claude Code usage often comes from mastering a focused set of capabilities rather than attempting to use everything available.

### How can teams configure Claude Code for collaborative projects?

Shankar's guide addresses team configuration as a distinct topic from individual usage. Key considerations include:

- **Shared CLAUDE.md files**: Checked into version control so all team members work with consistent Claude Code behavior
- **Custom slash commands**: Standardized commands that encode team workflows and conventions
- **GitHub Actions**: CI/CD integration that applies Claude Code capabilities consistently across pull requests and automated workflows

The combination of these features allows teams to encode their development practices into Claude Code's configuration, reducing onboarding friction and ensuring consistent code quality regardless of which team member is using the tool.

### Where can I find Shrivu Shankar's original Claude Code guide?

The complete guide is available on Shankar's Substack at [blog.sshh.io/p/how-i-use-every-claude-code-feature](https://blog.sshh.io/p/how-i-use-every-claude-code-feature). The post also has an active comments section where Shankar responds to reader questions with additional implementation details and clarifications.

Simon Willison's commentary on the guide, which provides additional context on why the guide is valuable, can be found at [simonwillison.net](https://simonwillison.net/2025/Nov/2/how-i-use-every-claude-code-feature/).