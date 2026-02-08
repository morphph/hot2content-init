#!/usr/bin/env tsx
/**
 * Core Narrative JSON Schema Validator
 *
 * Validates output/core-narrative.json against the schema defined in PRD section 7.
 * Usage: npx tsx scripts/validate-narrative.ts [path/to/file.json]
 */

import { z } from 'zod';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

// Core Narrative Schema (PRD Section 7)
const ReferenceSchema = z.object({
  title: z.string().min(1, 'Reference title cannot be empty'),
  url: z.string().url('Reference URL must be valid'),
  source: z.string().min(1, 'Reference source cannot be empty'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Reference date must be YYYY-MM-DD'),
});

const FAQSchema = z.object({
  question: z.string().min(1, 'FAQ question cannot be empty'),
  answer: z.string().min(1, 'FAQ answer cannot be empty'),
});

const DiagramSchema = z.object({
  type: z.literal('mermaid'),
  title: z.string().min(1, 'Diagram title cannot be empty'),
  code: z.string().min(1, 'Diagram code cannot be empty'),
});

const StorySpineSchema = z.object({
  background: z.string().min(1, 'Story spine background cannot be empty'),
  breakthrough: z.string().min(1, 'Story spine breakthrough cannot be empty'),
  mechanism: z.string().min(1, 'Story spine mechanism cannot be empty'),
  significance: z.string().min(1, 'Story spine significance cannot be empty'),
  risks: z.string().min(1, 'Story spine risks cannot be empty'),
});

const SEOSchema = z.object({
  slug: z.string()
    .min(1, 'SEO slug cannot be empty')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'SEO slug must be kebab-case'),
  meta_title_en: z.string()
    .min(50, 'meta_title_en must be 50-60 characters')
    .max(60, 'meta_title_en must be 50-60 characters'),
  meta_description_en: z.string()
    .min(150, 'meta_description_en must be 150-160 characters')
    .max(160, 'meta_description_en must be 150-160 characters'),
  keywords_en: z.array(z.string().min(1))
    .min(3, 'keywords_en must have 3-5 keywords')
    .max(5, 'keywords_en must have 3-5 keywords'),
  keywords_zh: z.array(z.string().min(1))
    .min(3, 'keywords_zh must have 3-5 keywords')
    .max(5, 'keywords_zh must have 3-5 keywords'),
});

const CoreNarrativeSchema = z.object({
  topic_id: z.string()
    .min(1, 'topic_id cannot be empty')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'topic_id must be kebab-case'),
  title: z.string().min(1, 'title cannot be empty'),
  created_at: z.string().datetime('created_at must be ISO 8601 format'),
  is_update: z.boolean(),
  previous_topic_id: z.string().nullable(),
  one_liner: z.string().min(1, 'one_liner cannot be empty'),
  key_points: z.array(z.string().min(1))
    .min(3, 'key_points must have at least 3 items')
    .max(5, 'key_points should have 3-5 items'),
  story_spine: StorySpineSchema,
  faq: z.array(FAQSchema).min(3, 'faq must have at least 3 items'),
  references: z.array(ReferenceSchema).min(1, 'references must have at least 1 item'),
  diagrams: z.array(DiagramSchema).min(1, 'diagrams must have at least 1 item'),
  seo: SEOSchema,
});

type CoreNarrative = z.infer<typeof CoreNarrativeSchema>;

function main() {
  // Get file path from args or use default
  const args = process.argv.slice(2);
  const filePath = args[0] || 'output/core-narrative.json';
  const resolvedPath = resolve(process.cwd(), filePath);

  console.log(`\n Validating: ${resolvedPath}\n`);

  try {
    // Read and parse JSON
    const content = readFileSync(resolvedPath, 'utf-8');
    const data = JSON.parse(content);

    // Validate with Zod
    const result = CoreNarrativeSchema.safeParse(data);

    if (result.success) {
      console.log('Core Narrative validation PASSED\n');
      console.log('Summary:');
      console.log(`  - Topic ID: ${result.data.topic_id}`);
      console.log(`  - Title: ${result.data.title}`);
      console.log(`  - Key Points: ${result.data.key_points.length}`);
      console.log(`  - FAQ Items: ${result.data.faq.length}`);
      console.log(`  - References: ${result.data.references.length}`);
      console.log(`  - Diagrams: ${result.data.diagrams.length}`);
      console.log(`  - Is Update: ${result.data.is_update}`);
      // localization field removed - no special China angle needed
      console.log();
      process.exit(0);
    } else {
      console.log('Core Narrative validation FAILED\n');
      console.log('Errors:');
      result.error.errors.forEach((err) => {
        const path = err.path.length > 0 ? err.path.join('.') : 'root';
        console.log(`  - ${path}: ${err.message}`);
      });
      console.log();
      process.exit(1);
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.log('Invalid JSON format\n');
      console.log(`Error: ${error.message}\n`);
    } else if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('File not found\n');
      console.log(`Path: ${resolvedPath}\n`);
    } else {
      console.log('Unexpected error\n');
      console.log(error);
      console.log();
    }
    process.exit(1);
  }
}

// Run main directly (ESM compatible)
main();

export { CoreNarrativeSchema, CoreNarrative };
