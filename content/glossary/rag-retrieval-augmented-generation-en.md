---
term: "RAG (Retrieval-Augmented Generation)"
slug: rag-retrieval-augmented-generation
lang: en
category: LLM Fundamentals
definition: "A technique that enhances LLM responses by retrieving relevant information from external knowledge bases before generating an answer, reducing hallucinations and enabling access to up-to-date or private data."
related: [context-window, hallucination]
date: 2026-02-10
source_topic: rag
---

## What is RAG?

RAG (Retrieval-Augmented Generation) is an architecture pattern that combines information retrieval with text generation. Instead of relying solely on a model's training data, RAG fetches relevant documents from an external knowledge base and includes them in the prompt, giving the model access to specific, current, or private information.

The basic RAG pipeline: **Query → Retrieve relevant documents → Augment prompt with documents → Generate response**

## How It Works

A typical RAG system has three components:

- **Embedding model**: Converts documents and queries into vector representations
- **Vector database**: Stores document embeddings for fast similarity search (e.g., Pinecone, Weaviate, pgvector)
- **LLM**: Generates answers using the retrieved context

When a user asks a question: (1) the query is embedded, (2) similar documents are retrieved from the vector store, (3) retrieved documents are inserted into the prompt, (4) the LLM generates an answer grounded in those documents.

## Why It Matters

RAG addresses fundamental LLM limitations:

- **Knowledge cutoff**: Models only know what was in their training data. RAG provides access to current information.
- **Hallucination reduction**: Grounding responses in retrieved documents significantly reduces fabricated answers.
- **Private data**: RAG enables LLMs to answer questions about proprietary documents without fine-tuning.
- **Cost efficiency**: Cheaper than fine-tuning or using massive context windows for large document collections.
- **Auditability**: You can trace which documents informed each answer.

In 2026, with context windows reaching 1-2M tokens, the relationship between RAG and large context has evolved. For smaller corpora (<1M tokens), direct context injection may outperform RAG. For larger collections, RAG remains essential. Many systems use hybrid approaches — RAG retrieves candidates, then a large context window processes them holistically.

## Related Terms

- **Context Window**: The alternative to RAG — fitting all relevant data directly in the prompt
- **Hallucination**: The problem RAG helps mitigate by grounding responses in source documents
- **Fine-tuning**: Another approach to customizing LLM behavior, complementary to RAG
