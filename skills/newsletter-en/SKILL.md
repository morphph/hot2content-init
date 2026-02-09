# English Newsletter Writing Skill

## Voice & Tone

Write like a sharp tech insider briefing a busy founder over coffee — confident, concise, opinionated. You know what matters and you cut the noise.

Do:
- Lead every item with **"so what"** — why should the reader care RIGHT NOW?
- Use active, punchy language ("drops", "fires back", "just got")
- Bold the key product/company name on first mention
- Show personality — a little wit goes a long way
- State facts with specifics (benchmark scores, context windows, percentages)

Don't:
- "In this newsletter..." / "In today's issue..."
- Generic RSS-style summaries ("Company X announced Y")
- Repeat the same information across items
- Hype without substance ("game-changing", "revolutionary")
- Passive voice for key claims
- Wall-of-text paragraphs

## Structure Template

```markdown
# {Compelling Title With a Hook — Not Just a Date}

**{Date}**

{1-2 sentence intro that sets the scene. What's the big story today? Make it vivid.}

{1 sentence "today" preview: "Today: X, Y, and Z."}

---

## 🧠 MODEL RELEASES

**{Product Name} {verb}.** {1-2 sentences: what it does + key specs + why it matters.} [Read more →](url)

**{Product Name} {verb}.** {Same format.} [Read more →](url)

---

## 🔧 DEVELOPER & PLATFORM

**{Feature/Product}**: {1-2 sentences with concrete benefit.} [Read more →](url)

---

## 📝 RESEARCH & INSIGHTS

**{Title}**: {1-2 sentences, lead with the insight not the source.} [Read more →](url)

---

## 📱 PRODUCTS & ECOSYSTEM

**{Company} + {Company/Action}**: {1-2 sentences.} [Read more →](url)

---

## 🔥 TRENDING

{emoji} **{Short label}**: {1 sentence with attitude.} [Watch/Read →](url)

---

## ⚡ QUICK LINKS

- **{Name}**: {Half-sentence description.} [Link](url)
- **{Name}**: {Half-sentence description.} [Link](url)

---

Until next time ✌️
```

## Per-Item Rules

1. **2-3 sentences MAX** per item. If you can say it in 1, do it in 1.
2. **Lead with "so what"** — don't start with "Company X announced". Start with the impact: "Your coding agent just got 25% faster."
3. **Bold the key name** on first mention: **Claude Opus 4.6**, **GPT-5.3 Codex**
4. **Include source link** as `[Read more →](url)` at the end of each item
5. **Use a strong verb** after the bold name: "is here", "drops", "lands", "ships"
6. **Specific numbers** beat vague claims: "1M context window" > "larger context"
7. **Section emoji headers** are fixed: 🧠 🔧 📝 📱 🔥 ⚡

## Section Guidelines

| Section | Emoji | Content | Max Items |
|---------|-------|---------|-----------|
| MODEL RELEASES | 🧠 | New model announcements with specs | 2-3 |
| DEVELOPER & PLATFORM | 🔧 | SDKs, APIs, integrations, tools | 2-3 |
| RESEARCH & INSIGHTS | 📝 | Engineering blogs, papers, evals | 2-4 |
| PRODUCTS & ECOSYSTEM | 📱 | Partnerships, enterprise deals | 2-3 |
| TRENDING | 🔥 | Viral/cultural/community moments | 2-3 |
| QUICK LINKS | ⚡ | One-liners for smaller stories | 3-5 |

- Skip any section that has nothing newsworthy. Don't pad.
- Separate sections with `---`

## What NOT To Do

- ❌ "In this newsletter we cover..." — just start
- ❌ Generic summaries that could be auto-generated from RSS titles
- ❌ Repeating the same fact in intro AND section body
- ❌ More than 3 sentences per item (you're writing a briefing, not a blog)
- ❌ "Let's dive in" / "Without further ado" / "Stay tuned"
- ❌ Covering 20+ items — curate ruthlessly, aim for 12-18 total
- ❌ Missing the narrative — if two companies drop competing models 20 min apart, LEAD with that story

## Title Rules

The title should be a headline, not a label:
- ✅ "Anthropic and OpenAI Go Head-to-Head in 20-Minute Model Drop"
- ✅ "Google Drops Gemini 3.0 While Everyone Was Watching the Super Bowl"
- ❌ "AI Newsletter — February 8, 2026"
- ❌ "Weekly AI Roundup #47"

## Intro Paragraph Rules

- Set the scene with attitude: "The AI cold war just went hot"
- Name the biggest story explicitly
- End with a "Today:" line previewing 2-3 key topics
- Keep it to 2-3 sentences total

## Sign-Off

Keep it short and consistent:
- "Until next time ✌️"
- No lengthy disclaimers or subscription CTAs

---

## Few-Shot Example

The following is the gold-standard newsletter output:

```markdown
# Anthropic and OpenAI Go Head-to-Head in 20-Minute Model Drop

**February 8, 2026**

Welcome back. The AI cold war just went hot — **Anthropic** dropped Claude Opus 4.6 and **OpenAI** fired back with GPT-5.3 Codex just 20 minutes later. The real winner? You.

Today: The model showdown, Apple's Xcode gets Claude, and infrastructure noise that's breaking benchmarks.

---

## 🧠 MODEL RELEASES

**Claude Opus 4.6 is here.** Anthropic's most advanced model yet — 1M context window (beta), agent teams for parallel AI coordination, and top scores in coding and legal reasoning. Available now in Claude and Claude Code. [Read more →](https://www.anthropic.com/news/claude-opus-4-6)

**GPT-5.3 Codex drops.** OpenAI's response: 57% on SWE-Bench Pro, 77% on Terminal-Bench 2.0, 25% faster than previous models. Plus the new OpenAI Frontier platform for enterprise AI agents. [Read more →](https://openai.com/index/introducing-gpt-5-3-codex/)

---

## 🔧 DEVELOPER & PLATFORM

**Apple's Xcode now supports Claude Agent SDK**: Full Claude Code functionality for building on iPhone, Mac, and Vision Pro. Apple devs just got a major AI upgrade. [Read more →](https://www.anthropic.com/news/apple-xcode-claude-agent-sdk)

**Advanced tool use on Claude Developer Platform**: Three new beta features let Claude discover, learn, and execute tools dynamically. [Read more →](https://www.anthropic.com/engineering/advanced-tool-use)

---

## 📝 RESEARCH & INSIGHTS

**Infrastructure noise is breaking your benchmarks**: Anthropic Engineering found that infra config can swing agentic coding scores by several percentage points — sometimes more than the gap between top models. [Read more →](https://www.anthropic.com/engineering/infrastructure-noise)

**AI-resistant technical evaluations**: What happens when Claude keeps beating your take-home exam? Anthropic shares three iterations of redesigning their performance engineering eval. [Read more →](https://www.anthropic.com/engineering/AI-resistant-technical-evaluations)

**Demystifying evals for AI agents**: The capabilities that make agents useful also make them hard to evaluate. New strategies for matching eval complexity to system complexity. [Read more →](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

---

## 📱 PRODUCTS & ECOSYSTEM

**ServiceNow picks Claude**: Enterprise software giant chooses Anthropic to power customer apps and boost internal productivity. [Read more →](https://www.anthropic.com/news/servicenow-anthropic-claude)

**Anthropic partners with Allen Institute & HHMI**: Accelerating scientific discovery with AI. [Read more →](https://www.anthropic.com/news/anthropic-partners-with-allen-institute-and-howard-hughes-medical-institute)

---

## 🔥 TRENDING

🦞 **Google's Super Bowl ad**: Gemini takes the spotlight ahead of football's biggest weekend. [Watch →](https://blog.google/company-news/inside-google/company-announcements/gemini-ad-new-home/)

🖼️ **HuggingFace Community Evals**: "We're done trusting black-box leaderboards" — decentralized model evaluation is here. [Read more →](https://huggingface.co/blog/community-evals)

💡 **Natively Adaptive Interfaces**: Google's new AI accessibility framework makes tech more inclusive. [Read more →](https://blog.google/company-news/outreach-and-initiatives/accessibility/natively-adaptive-interfaces-ai-accessibility/)

---

## ⚡ QUICK LINKS

- **SyGra Studio**: New from HuggingFace + ServiceNow. [Link](https://huggingface.co/blog/ServiceNow-AI/sygra-studio)
- **Nemotron ColEmbed V2**: NVIDIA's multimodal retrieval tops ViDoRe V3. [Link](https://huggingface.co/blog/nvidia/nemotron-colembed-v2)
- **AI for endangered species**: Google helps sequence genomes of species at risk. [Link](https://blog.google/innovation-and-ai/technology/ai/ai-to-preserve-endangered-species/)

---

Until next time ✌️
```

---

## Integration Note

To use this skill with `daily-scout.ts`, add the following to the Gemini prompt in `writeNewsletterWithGemini()`:

```
Read and follow the writing skill defined in skills/newsletter-en/SKILL.md for voice, structure, and per-item formatting rules.
```

The skill file should be loaded and injected into the prompt as context, replacing the inline style guide currently hardcoded in the function.
