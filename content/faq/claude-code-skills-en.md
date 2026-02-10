---
title: "Claude Code Skills — FAQ"
description: "Frequently asked questions about Claude Code Skills: what they are, how to create them, and best practices"
date: 2026-02-10
lang: en
---

### What are Claude Code Skills?

Claude Code Skills are reusable instruction sets that teach Claude Code how to perform specific tasks consistently. Think of them as custom "recipes" — you define the steps once, and Claude follows them every time.

Skills are stored as markdown files (typically in `.claude/skills/` or a project's `CLAUDE.md`) and can include:

* **Step-by-step procedures** for common workflows
* **Code patterns** and architectural conventions your team follows
* **Tool configurations** for specific environments
* **Quality checklists** that Claude applies automatically

Skills bridge the gap between generic AI assistance and team-specific expertise. Instead of re-explaining your deployment process every session, you encode it once as a skill.

---

### How do I create a Claude Code Skill?

Creating a skill involves writing a markdown file that describes the task clearly. Here's the basic process:

1. **Create a file** in `.claude/skills/` (e.g., `.claude/skills/deploy-to-staging.md`)
2. **Write clear instructions** using natural language with specific steps
3. **Include examples** of expected inputs and outputs
4. **Reference tools** Claude should use (shell commands, file operations, etc.)

A minimal skill looks like:

```markdown
# Deploy to Staging
When asked to deploy to staging:
1. Run `npm run build` and verify no errors
2. Run `npm run test` and ensure all pass
3. Execute `./scripts/deploy-staging.sh`
4. Verify deployment at https://staging.example.com
```

Skills are automatically picked up when placed in the `.claude/` directory of your project.

---

### What's the difference between Skills and CLAUDE.md?

Both configure Claude Code's behavior, but they serve different purposes:

* **CLAUDE.md**: Project-level configuration that applies to every interaction. Contains general rules, coding conventions, and project context. There's one per project (or directory).
* **Skills**: Task-specific instruction sets that activate when relevant. You can have dozens of skills covering different workflows.

Think of `CLAUDE.md` as the "constitution" and Skills as the "playbook." CLAUDE.md says "we use TypeScript and prefer functional patterns." A skill says "here's exactly how to add a new API endpoint in our system."

In practice, CLAUDE.md often references skills, and skills assume the conventions defined in CLAUDE.md.

---

### Can Skills call other Skills?

Yes, skills can reference and compose with other skills. This enables modular, DRY instruction sets:

* A "full release" skill can reference "run tests," "build," and "deploy" skills
* Skills can specify prerequisites: "First complete the 'lint-fix' skill"
* Shared utilities (like "verify CI status") can be extracted into their own skills

This composability is one of the main advantages over putting everything in a single CLAUDE.md file. As your skill library grows, you build increasingly powerful compound workflows.

---

### What are best practices for writing effective Skills?

Follow these guidelines for skills that work reliably:

1. **Be specific, not vague**: "Run `pytest -x --tb=short`" beats "run the tests"
2. **Include error handling**: Tell Claude what to do when things fail
3. **Use concrete examples**: Show expected file structures, command outputs, etc.
4. **Keep skills focused**: One skill per workflow; compose for complex tasks
5. **Version control them**: Skills belong in Git alongside your code
6. **Test iteratively**: Try the skill, observe Claude's behavior, refine the instructions
7. **Document assumptions**: State required environment variables, tools, and permissions

The most common mistake is writing skills that are too abstract. Claude performs best with precise, actionable instructions.

---

### How do Skills interact with the context window?

Skills consume tokens from Claude's context window when they're loaded. Key considerations:

* **Selective loading**: Only relevant skills are loaded per session, not the entire library
* **Size matters**: Keep individual skills under 500 lines; split large ones
* **With 1M context (Opus 4.6)**: You can load many more skills simultaneously
* **Compaction**: Long sessions may summarize earlier skill content; critical instructions should be in CLAUDE.md

For teams with 50+ skills, organize them in subdirectories (e.g., `.claude/skills/deploy/`, `.claude/skills/testing/`) so Claude can load only what's needed.

---

### Can I share Skills across projects?

Yes, there are several approaches:

* **Git submodules**: Share a `.claude/skills/` directory across repositories
* **Symlinks**: Point to a central skills directory on your machine
* **Copy**: Simply copy skill files between projects (simplest but hardest to maintain)
* **NPM packages**: Package skills as an npm module and install them

The recommended approach for teams is a shared Git repository of skills that's included as a submodule in each project. This enables versioning, code review of skill changes, and consistent behavior across codebases.

---

### Do Skills work with Agent Teams?

Yes, skills and Agent Teams are complementary features in Claude Code. When using Agent Teams:

* **Each agent can have its own skills** tailored to its role (e.g., the "reviewer" agent has code review skills, the "implementer" has coding skills)
* **Coordination skills** can define how agents hand off work
* **Shared skills** ensure consistent conventions across all agents

Agent Teams become significantly more powerful with well-defined skills, as each agent knows exactly what to do without needing human guidance at every step. This is especially useful for complex workflows like "refactor module → write tests → review → deploy."

---

### How do Skills compare to GitHub Copilot's custom instructions?

Both customize AI behavior, but Claude Code Skills are more powerful:

| Feature | Claude Code Skills | Copilot Custom Instructions |
|---------|-------------------|---------------------------|
| Scope | Full workflow automation | Code completion hints |
| Tool access | Shell, files, browser, MCP | Code editor only |
| Composability | Skills can reference other skills | Flat instruction set |
| Activation | Context-aware, selective loading | Always active |
| Complexity | Multi-step procedures | Short guidelines |

Claude Code Skills can orchestrate entire development workflows, while Copilot's instructions primarily influence code suggestions within the editor.

---

### What are some real-world Skill examples?

Here are popular skills used by development teams:

* **PR Review Skill**: Check out PR branch, run tests, review diff against team conventions, post structured feedback
* **Migration Skill**: Generate database migration, update ORM models, create rollback script, test with seed data
* **Incident Response Skill**: Check logs, identify error patterns, suggest fixes, draft postmortem
* **Onboarding Skill**: Explain project architecture, key files, development setup, and common workflows to new developers
* **Release Skill**: Bump version, update changelog, create release branch, run full test suite, tag and push

Teams report that encoding their top 10 most common workflows as skills saves 30-50% of time spent explaining context to AI assistants.
