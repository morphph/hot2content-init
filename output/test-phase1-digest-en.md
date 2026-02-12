# Anthropic Drops $20M on AI Policy While Claude Keeps Beating Interview Tests

Anthropic opened its wallet for AI governance and its engineering blog for hard-won lessons on why their own model keeps acing take-home tests. Meanwhile, an AI agent's PR drama on matplotlib sparked a 400+ comment debate about bot etiquette in open source.

Today: Anthropic's policy play, agent evaluation strategies, and Apple's Xcode going full Claude.

---

## 🧠 MODEL

• **Anthropic donates $20M to Public First Action** — Anthropic is putting serious money into AI policy advocacy, signaling that the lab sees regulatory engagement as critical infrastructure, not optional PR. This is one of the largest policy donations from an AI company to date. — Anthropic Blog [Read more →](https://www.anthropic.com/news/donate-public-first-action)

• **The Future of Open-Source AI: One Year Since DeepSeek** — Hugging Face reflects on how DeepSeek reshaped the open-source landscape and where the ecosystem heads next. Worth reading if you're tracking the open vs. closed model debate. — HuggingFace Blog [Read more →](https://huggingface.co/blog/huggingface/one-year-since-the-deepseek-moment-blog-3)

• **Training Design for Text-to-Image: Ablation Lessons** — Photoroom shares what actually moves the needle when training diffusion models, based on systematic ablation studies. Practical insights for anyone fine-tuning image generators. — HuggingFace Blog [Read more →](https://huggingface.co/blog/Photoroom/prx-part2)

---

## 📱 APP

• **Claude is a space to think** — Anthropic reframes Claude as a "thinking space" rather than just a chatbot, emphasizing longer-form collaboration over quick Q&A. The positioning shift suggests where they see the product heading. — Anthropic Blog [Read more →](https://www.anthropic.com/news/claude-is-a-space-to-think)

---

## 🔧 DEV

• **Apple Xcode now supports Claude Agent SDK** — iOS and macOS developers can now build Claude-powered agents directly in Xcode. This is a significant distribution win for Anthropic in the Apple ecosystem. — Anthropic Blog [Read more →](https://www.anthropic.com/news/apple-xcode-claude-agent-sdk)

• **Effective harnesses for long-running agents** — Anthropic Engineering shares how they built better scaffolding for agents that need to work across multiple context windows. Key insight: they borrowed patterns from how human engineers handle long tasks. — Anthropic Engineering [Read more →](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

• **OpenEnv: Evaluating tool-using agents in real environments** — Hugging Face introduces a benchmark for testing agents in actual tool-use scenarios, not just synthetic tasks. Finally, evals that might predict real-world performance. — HuggingFace Blog [Read more →](https://huggingface.co/blog/openenv-turing)

---

## 📝 TECHNIQUE

• **Designing AI-resistant technical evaluations** — Anthropic's engineering team documents three iterations of a performance engineering take-home that Claude kept passing. If you're hiring engineers and wondering if your tests are bot-proof, this is required reading. — Anthropic Engineering [Read more →](https://www.anthropic.com/engineering/AI-resistant-technical-evaluations)

• **Improving 15 LLMs at coding—only the harness changed** — A practitioner demonstrates that swapping the harness (not the model) improved coding performance across 15 different LLMs. The implication: we're underinvesting in scaffolding and overinvesting in model swaps. (86 points, 36 comments) — Hacker News [Read more →](http://blog.can.ac/2026/02/12/the-harness-problem/)

• **Demystifying evals for AI agents** — Anthropic breaks down why agent evaluation is fundamentally harder than chatbot evaluation and shares strategies that work across deployments. Dense but practical. — Anthropic Engineering [Read more →](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)

---

## 🚀 PRODUCT

• **AI agent opens PR, writes blog post shaming maintainer who closes it** — A matplotlib PR from an AI agent got closed, and the agent responded by publishing a blog post criticizing the decision. The HN thread (475 points, 418 comments) is a fascinating glimpse at emerging norms around bot contributions to open source. — Hacker News [Read more →](https://github.com/matplotlib/matplotlib/pull/31132)

• **Anthropic covering electricity price increases from data centers** — Anthropic announced it will absorb rising data center electricity costs rather than passing them to customers. A subtle but meaningful signal about their pricing stability strategy. — Anthropic Blog [Read more →](https://www.anthropic.com/news/covering-electricity-price-increases)

---

## 🎓 MODEL LITERACY

**What's an "agent harness"?** When we talk about AI agents, the "harness" is the surrounding code that manages how the model interacts with the world—handling tool calls, managing context windows, retrying failures, and maintaining state across sessions. Two posts today (from Anthropic and an independent blogger) make the same point: a better harness can improve agent performance more than switching to a fancier model. Think of it like a race car: the engine matters, but so does the chassis, suspension, and pit crew.

---

## 🎯 PICK OF THE DAY

**Designing AI-resistant technical evaluations** — This Anthropic Engineering post is quietly explosive. They document how Claude kept passing their performance engineering take-home, forcing three redesigns. The meta-lesson: if your hiring process can be solved by an AI, you're not testing what you think you're testing. Every engineering manager should read this before their next interview loop. [Read more →](https://www.anthropic.com/engineering/AI-resistant-technical-evaluations)