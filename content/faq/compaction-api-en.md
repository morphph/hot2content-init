---
title: "Compaction API"
description: "Frequently asked questions about the Compaction API: what it is, when to use it, and how it compares to context windows"
date: 2026-02-10
lang: en
---

### What is the Compaction API?

The Compaction API is a feature introduced with Claude Opus 4.6 that enables effectively infinite conversations through server-side context summarization. When a conversation approaches the context window limit, the API compresses older turns into a compact summary while preserving key information.

How it works:
1. You send conversation history as usual
2. When the history nears the context limit, the API summarizes older turns
3. The summarized context replaces the full history
4. New messages are added to the compacted context
5. The model retains essential information without the verbatim transcript

This solves the fundamental problem of fixed-size context windows: without compaction, long conversations simply hit the limit and lose all earlier context.

---

### When should I use the Compaction API?

Use the Compaction API when:

* **Long coding sessions**: Agent workflows that span hours or days
* **Persistent chatbots**: Customer support or assistant bots with ongoing conversations
* **Iterative development**: Extended back-and-forth refinement of code or documents
* **Research sessions**: Long analytical conversations building on earlier findings

Don't use it when:
* **Short interactions**: If your conversation fits within the context window, compaction adds unnecessary overhead
* **Exact recall matters**: Compaction summarizes — if you need verbatim recall of early messages, keep the full history
* **Structured data**: If early context is structured data (tables, configs), summarization may lose precision

The sweet spot is conversations that would otherwise exceed the context window, where approximate recall of earlier turns is sufficient.

---

### Compaction API vs large context window: which should I use?

They're complementary, not competing:

| | Large Context Window | Compaction API |
|---|---|---|
| **Approach** | Fit everything in memory at once | Summarize old context to make room |
| **Cost** | Grows linearly with history length | Stays bounded as history grows |
| **Information loss** | None (full verbatim) | Some (summarized) |
| **Best for** | Conversations < 1M tokens | Conversations > 1M tokens |
| **Latency** | Increases with history | Stays relatively constant |

**Optimal strategy**: Use the full context window until you approach the limit, then engage compaction. This gives you maximum fidelity for recent context and summarized recall for older context.

For Claude Opus 4.6 with 1M tokens, this means your first ~750K tokens of conversation are verbatim, and older turns get compacted.

---

### How does compaction affect the quality of responses?

Compaction introduces a trade-off between context length and information fidelity:

* **What's preserved well**: Key decisions, important facts, user preferences, main topics, code architecture decisions
* **What may be lost**: Exact wording, minor details, nuanced discussion points, specific numbers mentioned early in conversation
* **What's always preserved**: The most recent turns (these are never compacted)

In practice, quality degradation is minimal for most use cases. The compaction model is designed to identify and retain the most important information. However, if a critical detail from turn #5 of a 500-turn conversation is needed, it might not be captured perfectly.

Mitigation: For critical information you want to persist, explicitly re-state it or store it in a file/document rather than relying on conversation context.

---

### How much does the Compaction API cost?

The Compaction API cost has two components:

1. **Compaction calls**: Processing tokens through the summarization model (cost varies by implementation)
2. **Reduced ongoing costs**: After compaction, each subsequent API call processes fewer input tokens

Net effect for long conversations:
* **Without compaction**: Cost increases linearly with conversation length. A 2M token conversation would require multiple expensive calls.
* **With compaction**: Cost stays bounded. After compaction, you process ~200K-500K tokens per call regardless of total conversation length.

For conversations exceeding 1M tokens, compaction typically **saves 50-80%** compared to approaches that truncate or restart context.

---

### Can I control what the Compaction API preserves?

Yes, you can guide compaction behavior:

* **System prompts are never compacted**: Your system instructions remain intact
* **Pinned messages**: Mark specific messages as important to preserve verbatim
* **Compaction instructions**: Include guidance in your system prompt about what information is most important to retain
* **Custom summarization**: For advanced use cases, you can implement your own compaction logic and pass the summary as context

Example system prompt guidance:
```
When compacting context, always preserve:
- User's name and preferences
- Key architectural decisions
- File paths and function names discussed
- Error messages and their resolutions
```

---

### How does the Compaction API compare to manual summarization?

| | Compaction API | Manual Summarization |
|---|---|---|
| **Effort** | Automatic | Requires custom code |
| **Quality** | Good general-purpose | Can be tailored to domain |
| **Control** | Guided by system prompt | Full control over what's kept |
| **Cost** | Built into API pricing | Separate summarization calls |
| **Consistency** | Standardized | Varies by implementation |

For most applications, the Compaction API is sufficient. Manual summarization is worth the effort when:
* You have domain-specific requirements for what to preserve
* You need structured summaries (not free-text)
* You want to integrate with external memory systems (databases, vector stores)

---

### Does the Compaction API work with Agent Teams?

Yes, and it's particularly valuable for Agent Teams:

* **Long-running agents**: Individual agents in a team may run for hours; compaction keeps their context manageable
* **Agent handoffs**: When one agent hands off to another, compacted context can serve as a briefing document
* **Lead agent context**: The coordinating agent accumulates status updates from all workers; compaction prevents context overflow

Without compaction, Agent Teams working on complex projects would frequently hit context limits, requiring restarts that lose accumulated knowledge. Compaction enables truly persistent agent workflows.

---

### What are alternatives to the Compaction API?

If you're not using Claude's Compaction API, alternatives include:

* **RAG-based memory**: Store conversation turns in a vector database, retrieve relevant ones per query
* **Sliding window**: Keep only the last N turns, discard older ones (crude but simple)
* **Manual summarization**: Periodically call the LLM to summarize conversation history
* **External memory**: Store important facts in a database or file, reference as needed
* **Hybrid**: Combine sliding window with periodic summarization checkpoints

Each approach has trade-offs. The Compaction API's advantage is being built-in, automatic, and optimized for Claude's architecture. The main reason to use alternatives is if you need cross-model compatibility or specialized memory structures.

---

### How do I implement the Compaction API in my application?

Integration is straightforward with the Claude API:

1. **Enable compaction** in your API configuration
2. **Send messages normally** — the API handles compaction automatically when needed
3. **Monitor compaction events** — the API returns metadata when compaction occurs
4. **Handle gracefully** — your application should expect that very old context may be summarized

Key implementation considerations:
* Set compaction thresholds based on your use case (e.g., compact at 80% of context limit)
* Log compaction events for debugging
* Test with long conversations to verify important information survives compaction
* Consider storing critical data externally rather than relying solely on conversation context

The Compaction API handles the complexity of summarization — your application just needs to send and receive messages as usual.
