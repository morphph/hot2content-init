/**
 * Shared Gemini Flash API helper
 *
 * Used by: extract-faq.ts, extract-glossary.ts, extract-compare.ts, generate-tier2.ts
 * NOT used by: daily-scout.ts (has a more complex implementation)
 */

import 'dotenv/config';

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export interface GeminiOptions {
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
}

const DEFAULT_OPTIONS: Required<GeminiOptions> = {
  temperature: 0.4,
  maxOutputTokens: 8000,
  model: 'gemini-2.0-flash',
};

export async function callGemini(prompt: string, options?: GeminiOptions): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not set');
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: opts.temperature,
          maxOutputTokens: opts.maxOutputTokens,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json() as any;
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
