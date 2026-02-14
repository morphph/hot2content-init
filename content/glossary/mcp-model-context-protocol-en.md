---
term: "MCP (Model Context Protocol)"
slug: mcp-model-context-protocol
lang: en
category: AI Infrastructure
definition: "An open protocol that standardizes how AI models connect to external tools, data sources, and services, enabling agents to interact with the real world beyond text generation."
related: [function-calling, agentic-coding, agent-teams]
date: 2026-02-10
source_topic: mcp-protocol
keywords:
  - "Model Context Protocol"
  - "MCP"
  - "AI tool integration"
---

## What is MCP (Model Context Protocol)?

MCP (Model Context Protocol) is an open standard developed by Anthropic that defines how AI models communicate with external tools and data sources. Think of it as a "USB-C for AI" — a universal connector that lets any AI model talk to any tool through a standardized interface.

Before MCP, every AI tool integration required custom code. If you wanted Claude to access your database, you'd write a custom integration. If you wanted it to use GitHub, another custom integration. MCP replaces this with a single protocol that any tool provider can implement.

## How It Works

MCP uses a client-server architecture:

- **MCP Client**: The AI application (e.g., Claude Code, Cursor) that needs to access external tools
- **MCP Server**: A lightweight service that exposes a tool's capabilities (e.g., a GitHub MCP server, a database MCP server)
- **Protocol**: JSON-RPC based communication defining tool discovery, invocation, and result handling

When an AI agent needs to use a tool, it discovers available MCP servers, queries their capabilities, and invokes functions through the standardized protocol. The agent doesn't need to know the implementation details — just the tool's interface.

## Why It Matters

MCP is transforming the AI tools ecosystem in 2026:

- **Interoperability**: A tool built for Claude works with any MCP-compatible model (GPT, Gemini, etc.)
- **Ecosystem growth**: Developers build one MCP server, and it works everywhere — reducing fragmentation
- **Agent capabilities**: MCP enables agents to interact with databases, APIs, cloud services, browsers, and more
- **Security**: The protocol includes permission models and sandboxing, giving users control over what tools agents can access
- **Composability**: Agents can connect to multiple MCP servers simultaneously, combining capabilities dynamically

Major MCP servers available in 2026 include GitHub, PostgreSQL, Slack, Google Drive, AWS, and hundreds of community-built integrations. MCP has become the de facto standard for AI tool connectivity.

## Related Terms

- **Function Calling**: The model-level capability to invoke structured functions; MCP standardizes this across tools
- **Agentic Coding**: Development paradigm where agents use tools (via MCP) to autonomously complete tasks
- **Agent Teams**: Multiple agents can each connect to different MCP servers for specialized capabilities
