---
term: "Hallucination"
slug: hallucination
lang: en
category: LLM Fundamentals
definition: "When an AI model generates information that sounds plausible but is factually incorrect, fabricated, or unsupported by its training data — confidently presenting fiction as fact."
related: [rag-retrieval-augmented-generation, prompt-engineering, fine-tuning]
date: 2026-02-10
source_topic: hallucination
keywords:
  - "AI hallucination"
  - "model hallucination"
  - "AI accuracy"
---

## What is AI Hallucination?

AI hallucination occurs when a large language model generates text that is factually wrong, entirely fabricated, or not grounded in reality — while presenting it with the same confidence as accurate information. The term draws an analogy to human hallucinations: the model "sees" something that isn't there.

Common examples include citing academic papers that don't exist, inventing statistics, fabricating historical events, or generating plausible-sounding but incorrect code. The danger lies in how convincing these outputs appear — they follow proper grammar, use appropriate jargon, and maintain logical structure, making them difficult to spot without verification.

## Why Do Models Hallucinate?

Hallucinations stem from how LLMs work at a fundamental level:

- **Next-token prediction**: Models are trained to predict the most likely next token, not to verify truth. They optimize for plausibility, not accuracy
- **Training data gaps**: When a model encounters a topic with sparse training data, it fills gaps with statistically plausible (but invented) details
- **Sycophancy**: Models may generate answers that seem helpful rather than admitting uncertainty
- **Distributional patterns**: The model may blend information from different contexts, creating chimeric facts that combine real elements in false ways
- **No world model**: LLMs don't have a verified knowledge base to check against — they work purely from learned statistical patterns

## Mitigation Strategies

The AI industry has developed several approaches to reduce hallucinations in 2026:

- **RAG (Retrieval-Augmented Generation)**: Ground model responses in retrieved documents, giving the model verified source material
- **Citations and sourcing**: Models like Claude can cite specific passages, making verification possible
- **Constitutional AI and RLHF**: Training models to express uncertainty and say "I don't know" when appropriate
- **Tool use**: Letting models query databases, search engines, or calculators rather than generating facts from memory
- **Chain-of-thought reasoning**: Step-by-step reasoning reduces logical errors and fabrication
- **Evaluation frameworks**: Automated fact-checking pipelines that verify model outputs against trusted sources

Despite progress, hallucination remains one of the most significant challenges in deploying LLMs for high-stakes applications like healthcare, legal, and financial services.

## Related Terms

- **RAG**: Retrieval-Augmented Generation, a primary technique for grounding outputs in real data
- **Prompt Engineering**: Careful prompting can reduce hallucination rates
- **Fine-Tuning**: Domain-specific fine-tuning can improve factual accuracy in specialized areas
