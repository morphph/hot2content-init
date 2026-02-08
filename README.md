# 🐱 Hot2Content

AI-powered content engine that transforms trending AI/tech topics into high-quality bilingual blog posts.

**Topic → Deep Research → Core Narrative → EN Blog (Claude) + ZH Blog (Kimi) → SEO Review**

🌐 **Live:** [loreai.dev](https://www.loreai.dev)

## Quick Start

```bash
# Install dependencies
npm install

# Set environment variables
export GEMINI_API_KEY=xxx
export KIMI_API_KEY=xxx
export TWITTER_API_KEY=xxx

# Run pipeline (in Claude Code)
/hot2content "Claude Code Agent Teams"    # keyword mode
/hot2content https://example.com/article  # URL mode
/hot2content                              # auto-detect mode
/hot2content-scout                        # discovery only
```

## Architecture

See [PRD.md](PRD.md) for full specification.

## License

Private
