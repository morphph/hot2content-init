#!/usr/bin/env python3
"""
Gemini Deep Research API - Real Implementation
Uses the Interactions API with deep-research agent for actual web search.
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
    # Try loading from .env
    from pathlib import Path
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
topic = "OpenAI testing ads in ChatGPT - implications for AI monetization and user experience in 2026"

prompt = f"""
Research the following topic thoroughly using web search:

TOPIC: {topic}

This research will be used to write a tech blog article for developers and AI practitioners. Include direct quotes from key people involved.

Focus on:
1. What exactly happened and when? (timeline, key dates)
2. Technical details (how it works, architecture, specs)
3. Key players and their direct quotes
4. Market context and competitive landscape
5. Community reactions and early adoption experiences

Requirements:
- Use ONLY information from web search results
- Include specific dates, versions, and technical details
- Cite all sources with URLs and exact dates
- If information is not found via search, explicitly state that

Format as a structured research report with clear sections.
"""

print("🔬 Starting Gemini Deep Research...")
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
    
    # Poll for results (up to 15 minutes)
    max_wait = 900  # 15 minutes
    poll_start = time.time()
    while True:
        interaction = client.interactions.get(interaction.id)
        if interaction.status == "completed":
            print("\n✅ Research completed!")
            break
        elif interaction.status == "failed":
            print(f"\n❌ Research failed: {interaction.error}")
            exit(1)
        
        elapsed_poll = time.time() - poll_start
        if elapsed_poll > max_wait:
            print(f"\n⚠️ Timeout after {elapsed_poll:.0f}s - saving interaction ID for later")
            print(f"   Interaction ID: {interaction.id}")
            print(f"   Status: {interaction.status}")
            exit(1)
        
        print(".", end="", flush=True)
        time.sleep(10)
    
    elapsed = time.time() - start_time
    
    # Extract the report
    report = interaction.outputs[-1].text if interaction.outputs else "No output"
    
    # Save results
    output_dir = Path(__file__).parent.parent / 'output'
    output_file = output_dir / 'research-gemini-deep.md'
    
    with open(output_file, 'w') as f:
        f.write(f"# Gemini Deep Research Report\n\n")
        f.write(f"**Topic:** {topic}\n\n")
        f.write(f"**Generated:** {datetime.now().isoformat()}\n\n")
        f.write(f"**Time taken:** {elapsed:.1f} seconds\n\n")
        f.write(f"**Method:** Gemini Deep Research API (deep-research-pro-preview-12-2025)\n\n")
        f.write("---\n\n")
        f.write(report)
    
    print(f"\n📄 Report saved to: {output_file}")
    print(f"⏱️  Time taken: {elapsed:.1f} seconds")
    print(f"📊 Report length: {len(report)} characters")

except Exception as e:
    print(f"\n❌ Error: {e}")
    exit(1)
