#!/usr/bin/env tsx
/**
 * Gemini 2.5 Pro Deep Research API Caller
 *
 * Reads topic from input/topic.json, performs deep research using Gemini 2.5 Pro,
 * and outputs a comprehensive research report to output/research-report.md.
 *
 * Usage: npx tsx scripts/gemini-research.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface TopicInput {
  topic: string;
  url?: string;
  mode?: 'auto' | 'manual' | 'url';
}

interface ResearchOptions {
  topic: string;
  depth?: 'standard' | 'deep';
  maxSources?: number;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message: string;
    code?: number;
  };
}

class GeminiResearcher {
  private apiKey: string;
  private apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Perform deep research on a topic using Gemini 2.5 Pro
   */
  async research(options: ResearchOptions): Promise<string> {
    const { topic, depth = 'deep', maxSources = 20 } = options;

    console.log(`🔬 Starting deep research on: "${topic}"`);
    console.log(`   Depth: ${depth}, Max Sources: ${maxSources}\n`);

    // Construct the deep research prompt
    const researchPrompt = this.buildResearchPrompt(topic, depth, maxSources);

    try {
      const response = await this.callGeminiAPI(researchPrompt);
      console.log('✅ Research completed successfully\n');
      return response;
    } catch (error) {
      throw new Error(`Research failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Build a comprehensive research prompt
   */
  private buildResearchPrompt(topic: string, depth: string, maxSources: number): string {
    return `You are a deep research AI assistant. Perform comprehensive research on the following topic and provide a detailed research report.

TOPIC: ${topic}

RESEARCH REQUIREMENTS:
- Depth: ${depth === 'deep' ? 'Comprehensive, multi-faceted analysis' : 'Standard overview'}
- Target Sources: ${maxSources} authoritative sources
- Focus Areas:
  1. Background & Context: Historical development and current landscape
  2. Key Developments: Recent breakthroughs, innovations, or significant events
  3. Technical Details: How it works, underlying mechanisms, architecture
  4. Significance & Impact: Why it matters, who it affects, potential implications
  5. Challenges & Risks: Limitations, concerns, potential downsides
  6. Expert Perspectives: What industry experts, researchers, and thought leaders are saying
  7. Future Outlook: Predicted developments, trends, and potential evolution
  8. China Angle: Specific relevance to China market, regulations, or developments (if applicable)

OUTPUT FORMAT:
Please structure your research report as a comprehensive markdown document with the following sections:

# ${topic}

## Executive Summary
[3-5 paragraph overview of key findings]

## Background & Context
[Detailed background information, historical development, current landscape]

## Key Developments
[Recent breakthroughs, innovations, significant events with dates]

## Technical Deep Dive
[How it works, mechanisms, architecture, technical details]

## Significance & Impact
[Why it matters, stakeholder impact, broader implications]

## Challenges & Risks
[Known limitations, concerns, potential problems, criticism]

## Expert Perspectives
[What experts are saying, diverse viewpoints, analysis]

## China Angle
[Relevance to China: local developments, regulations, market dynamics, unique aspects]
[If not applicable, state "Not applicable" or provide minimal context]

## Future Outlook
[Predictions, trends, potential evolution, timeline]

## Key Takeaways
- [Bullet point 1]
- [Bullet point 2]
- [Bullet point 3]
- [Bullet point 4]
- [Bullet point 5]

## Sources & References
[List all sources with:
- Title
- Source/Publisher
- Date (YYYY-MM-DD format)
- URL
- Brief relevance note]

QUALITY STANDARDS:
- Cite specific facts, figures, dates, and quotes
- Include diverse perspectives and viewpoints
- Prioritize recent information (last 6-12 months when possible)
- Distinguish between confirmed facts and speculation
- Flag any claims that lack strong sourcing
- Use clear, accessible language while maintaining technical accuracy
- Minimum 2500 words, target 3500-5000 words

Begin your deep research now.`;
  }

  /**
   * Call Gemini 2.5 Pro API
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    const url = `${this.apiEndpoint}?key=${this.apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    };

    console.log('📡 Calling Gemini 2.5 Pro API...');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed (${response.status}): ${errorText}`);
    }

    const data: GeminiResponse = await response.json();

    // Handle API errors
    if (data.error) {
      throw new Error(`Gemini API error: ${data.error.message}`);
    }

    // Extract text from response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No text content in API response');
    }

    return text;
  }
}

/**
 * Load environment variables from .env file
 */
function loadEnv(): Map<string, string> {
  const envPath = path.join(process.cwd(), '.env');
  const envVars = new Map<string, string>();

  if (!fs.existsSync(envPath)) {
    console.warn('⚠️  Warning: .env file not found');
    return envVars;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars.set(key.trim(), valueParts.join('=').trim());
      }
    }
  }

  return envVars;
}

/**
 * Main execution function
 */
async function main() {
  console.log('\n🔬 Gemini 2.5 Pro Deep Research\n');
  console.log('='.repeat(60) + '\n');

  // Load environment variables
  const env = loadEnv();
  const apiKey = env.get('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: GEMINI_API_KEY not found in .env file or environment');
    console.error('   Please add GEMINI_API_KEY=your_api_key to .env file\n');
    process.exit(1);
  }

  // Read topic from input/topic.json
  const topicPath = path.join(process.cwd(), 'input', 'topic.json');

  if (!fs.existsSync(topicPath)) {
    console.error(`❌ Error: Topic file not found: ${topicPath}`);
    console.error('   Please create input/topic.json with format:');
    console.error('   { "topic": "Your research topic here" }\n');
    process.exit(1);
  }

  let topicInput: TopicInput;
  try {
    const topicContent = fs.readFileSync(topicPath, 'utf-8');
    topicInput = JSON.parse(topicContent);
  } catch (error) {
    console.error(`❌ Error parsing topic.json: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }

  if (!topicInput.topic || typeof topicInput.topic !== 'string') {
    console.error('❌ Error: Invalid topic format in topic.json');
    console.error('   Expected: { "topic": "Your research topic" }\n');
    process.exit(1);
  }

  console.log(`📝 Topic: ${topicInput.topic}`);
  if (topicInput.url) {
    console.log(`🔗 URL: ${topicInput.url}`);
  }
  console.log('');

  // Perform research
  const researcher = new GeminiResearcher(apiKey);

  let researchReport: string;
  try {
    researchReport = await researcher.research({
      topic: topicInput.topic,
      depth: 'deep',
      maxSources: 20
    });
  } catch (error) {
    console.error(`❌ Research failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }

  // Ensure output directory exists
  const outputDir = path.join(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write research report to output/research-report.md
  const outputPath = path.join(outputDir, 'research-report.md');
  fs.writeFileSync(outputPath, researchReport, 'utf-8');

  console.log(`✅ Research report saved to: ${outputPath}`);
  console.log(`📄 Report size: ${(researchReport.length / 1024).toFixed(2)} KB`);
  console.log(`📊 Word count: ~${researchReport.split(/\s+/).length} words\n`);
  console.log('='.repeat(60));
  console.log('✅ Research completed successfully!\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(`\n❌ Fatal error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}

export { GeminiResearcher, ResearchOptions, TopicInput };
