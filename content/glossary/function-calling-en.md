---
term: "Function Calling / Tool Use"
slug: function-calling
lang: en
category: AI Infrastructure
definition: "A capability that allows LLMs to invoke external functions and tools by generating structured JSON outputs that specify which function to call and with what parameters, enabling models to interact with APIs, databases, and real-world systems."
related: [mcp-model-context-protocol, agentic-coding, agent-teams]
date: 2026-02-10
source_topic: function-calling
---

## What is Function Calling?

Function calling (also called tool use) is a capability that lets large language models go beyond text generation by invoking external tools and functions. Instead of just producing natural language, the model can output structured requests — typically JSON — specifying a function name and parameters. The application then executes the function and feeds the result back to the model.

For example, when asked "What's the weather in Tokyo?", a model with function calling can generate a structured call like `get_weather(location="Tokyo")`, receive the real-time data, and then formulate a natural language response with accurate, current information.

## How It Works

The function calling workflow follows a clear pattern:

1. **Tool definition**: The developer provides the model with a list of available functions, each described with a name, description, and parameter schema
2. **Model decision**: Based on the user's query, the model decides whether to call a function (and which one) or respond directly
3. **Structured output**: The model generates a JSON object specifying the function and arguments
4. **Execution**: The application executes the function call (API request, database query, calculation, etc.)
5. **Result integration**: The function result is sent back to the model, which incorporates it into a final response

Modern models can call multiple functions in sequence (chaining) or in parallel, enabling complex multi-step workflows.

## Why It Matters

Function calling is the foundation of agentic AI in 2026:

- **Real-time data**: Models can access current information instead of relying on training data cutoffs
- **Action taking**: AI agents can send emails, create files, update databases, and control systems
- **Accuracy**: Calculations, lookups, and data retrieval are handled by reliable tools rather than model generation
- **Composability**: By combining multiple tools, models can handle arbitrarily complex tasks
- **MCP integration**: The Model Context Protocol standardizes tool interfaces, making function calling interoperable across models and providers

Every major AI platform — Claude, GPT, Gemini — supports function calling natively, and it has become the primary mechanism through which AI agents interact with the world.

## Related Terms

- **MCP (Model Context Protocol)**: The open standard that standardizes function calling interfaces across tools and models
- **Agentic Coding**: Development paradigm built on function calling for autonomous task completion
- **Agent Teams**: Multiple agents using function calling to collaborate on complex workflows
