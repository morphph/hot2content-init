/**
 * Shared Claude CLI helper
 *
 * Routes Sonnet/Opus calls through `claude` CLI (free on Max Plan).
 * Modeled after the proven pattern in scripts/agent-filter.ts.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export interface CLIOptions {
  model?: 'claude-sonnet-4-6' | 'claude-opus-4-6';
  timeoutMs?: number;
  maxBuffer?: number;
}

const DEFAULTS: Required<CLIOptions> = {
  model: 'claude-sonnet-4-6',
  timeoutMs: 3 * 60 * 1000,
  maxBuffer: 10 * 1024 * 1024,
};

export function callCLI(prompt: string, options?: CLIOptions): string {
  const opts = { ...DEFAULTS, ...options };
  const tmp = path.join('/tmp', `.claude-cli-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`);
  fs.writeFileSync(tmp, prompt);
  try {
    const result = execSync(
      `cat "${tmp}" | claude --model ${opts.model} --output-format text --max-turns 1 --print`,
      {
        encoding: 'utf-8',
        timeout: opts.timeoutMs,
        maxBuffer: opts.maxBuffer,
        env: { ...process.env, HOME: process.env.HOME || '/home/ubuntu' },
        cwd: process.cwd(),
      }
    );
    return result.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').trim();
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
}

export async function callSonnet(prompt: string, opts?: Omit<CLIOptions, 'model'>): Promise<string> {
  return callCLI(prompt, { ...opts, model: 'claude-sonnet-4-6' });
}

export async function callOpus(prompt: string, opts?: Omit<CLIOptions, 'model'>): Promise<string> {
  return callCLI(prompt, { ...opts, model: 'claude-opus-4-6' });
}
