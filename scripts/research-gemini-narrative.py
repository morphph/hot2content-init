#!/usr/bin/env python3
"""
Gemini Deep Research + Narrative (Combined)
Outputs directly in core-narrative.json format.

This is Approach B for A/B testing.
Approach A (original): research-gemini-deep.py → narrative-architect → core-narrative.json
Approach B (combined): research-gemini-narrative.py → core-narrative-gemini.json
"""

import os
import time
import json
from datetime import datetime
from pathlib import Path
from google import genai

# Load API key
api_key = os.environ.get('GEMINI_API_KEY')
if not api_key:
    env_file = Path(__file__).parent.parent / '.env'
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if line.startswith('GEMINI_API_KEY='):
                api_key = line.split('=', 1)[1].strip()
                break

if not api_key:
    print("❌ GEMINI_API_KEY not found")
    exit(1)

client = genai.Client(api_key=api_key)

# Topic to research
topic = "Claude Code Agent Teams - Anthropic's new multi-agent feature for Claude Code CLI released with Opus 4.6 in February 2026"

# Combined prompt: Research + Narrative structure
prompt = f"""
Research the following topic thoroughly using web search, then structure your findings as a JSON narrative.

TOPIC: {topic}

## Research Phase
Use web search to find:
1. What exactly is this feature and when was it announced?
2. How does it work technically? (architecture, API, configuration)
3. Key use cases and examples from official sources
4. How does it compare to alternatives?
5. Community reactions and early adoption experiences

## Output Format
Return a valid JSON object with this exact structure:

```json
{{
  "topic_id": "kebab-case-slug",
  "title": "English Title (descriptive)",
  "created_at": "{datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')}",
  "is_update": false,
  "previous_topic_id": null,
  
  "one_liner": "One compelling sentence summary (max 200 chars)",
  
  "key_points": [
    "Independently quotable point 1 - can be extracted by AI search",
    "Independently quotable point 2",
    "Independently quotable point 3",
    "Independently quotable point 4 (optional)",
    "Independently quotable point 5 (optional)"
  ],
  
  "story_spine": {{
    "background": "Context and backstory - what problem existed before this?",
    "breakthrough": "Core new information - what's the news?",
    "mechanism": "How it works technically - architecture, components",
    "significance": "Why it matters - impact on developers, industry",
    "risks": "Concerns, limitations, costs, adoption barriers"
  }},
  
  "faq": [
    {{ "question": "Most common question?", "answer": "Clear answer." }},
    {{ "question": "Second common question?", "answer": "Clear answer." }},
    {{ "question": "Third common question?", "answer": "Clear answer." }}
  ],
  
  "references": [
    {{ "title": "Source Title", "url": "https://...", "source": "Publication Name", "date": "YYYY-MM-DD" }}
  ],
  
  "diagrams": [
    {{
      "type": "mermaid",
      "title": "Diagram Title",
      "code": "graph TD\\n  A[Component]-->B[Component]"
    }}
  ],
  
  "seo": {{
    "slug": "topic-slug-with-keywords",
    "meta_title_en": "SEO Title 50-60 chars exactly | Site Name",
    "meta_description_en": "SEO description 150-160 chars exactly. Include key facts and value proposition for searchers.",
    "keywords_en": ["keyword1", "keyword2", "keyword3"],
    "keywords_zh": ["中文关键词1", "中文关键词2", "中文关键词3"]
  }},
  
  "localization": {{
    "zh_strategy": "native|adapted|global",
    "zh_hints": "Optional hints for Chinese content, or null"
  }}
}}
```

## Requirements
- Use ONLY information from web search results
- Include specific dates, versions, and technical details
- All URLs in references must be real (from your search)
- key_points should be independently quotable (imagine being extracted by AI search)
- story_spine sections should flow as a narrative arc
- seo.meta_title_en MUST be 50-60 characters
- seo.meta_description_en MUST be 150-160 characters
- At least 1 mermaid diagram showing architecture or flow
- At least 3 FAQ items covering reader's likely questions

Return ONLY the JSON object, no markdown code blocks or additional text.
"""

print("🔬 Starting Gemini Deep Research + Narrative (Approach B)...")
print(f"📝 Topic: {topic}")
print(f"⏰ Started: {datetime.now().isoformat()}")
print()

start_time = time.time()

try:
    # Start research in background
    interaction = client.interactions.create(
        agent='deep-research-pro-preview-12-2025',
        input=prompt,
        background=True
    )
    
    print(f"🆔 Interaction ID: {interaction.id}")
    print("⏳ Polling for results", end="", flush=True)
    
    # Poll for results (up to 20 minutes for combined task)
    max_wait = 1200  # 20 minutes
    poll_start = time.time()
    while True:
        interaction = client.interactions.get(interaction.id)
        if interaction.status == "completed":
            print("\n✅ Research + Narrative completed!")
            break
        elif interaction.status == "failed":
            print(f"\n❌ Research failed: {interaction.error}")
            exit(1)
        
        elapsed_poll = time.time() - poll_start
        if elapsed_poll > max_wait:
            print(f"\n⚠️ Timeout after {elapsed_poll:.0f}s")
            exit(1)
        
        print(".", end="", flush=True)
        time.sleep(10)
    
    elapsed = time.time() - start_time
    
    # Extract the output
    raw_output = interaction.outputs[-1].text if interaction.outputs else ""
    
    # Try to parse as JSON
    try:
        # Clean up potential markdown code blocks
        json_str = raw_output
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0]
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0]
        
        narrative = json.loads(json_str.strip())
        
        # Save as formatted JSON
        output_dir = Path(__file__).parent.parent / 'output'
        output_file = output_dir / 'core-narrative-gemini.json'
        
        with open(output_file, 'w') as f:
            json.dump(narrative, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 Narrative saved to: {output_file}")
        print(f"⏱️  Time taken: {elapsed:.1f} seconds")
        print(f"✅ Valid JSON with {len(narrative.get('key_points', []))} key points")
        
    except json.JSONDecodeError as e:
        print(f"\n⚠️ JSON parse error: {e}")
        print("Saving raw output for inspection...")
        
        output_dir = Path(__file__).parent.parent / 'output'
        raw_file = output_dir / 'narrative-gemini-raw.txt'
        with open(raw_file, 'w') as f:
            f.write(raw_output)
        print(f"📄 Raw output saved to: {raw_file}")

except Exception as e:
    print(f"\n❌ Error: {e}")
    exit(1)
