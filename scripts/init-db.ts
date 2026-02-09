#!/usr/bin/env npx tsx
/**
 * Initialize the LoreAI SQLite database
 * Usage: npx tsx scripts/init-db.ts
 */

import { getDb, initSchema, closeDb } from '../src/lib/db.js';

console.log('🗄️  Initializing LoreAI database...');

const db = getDb();
initSchema(db);

// Verify tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[];
console.log(`✅ Created ${tables.length} tables:`);
for (const t of tables) {
  const count = (db.prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).get() as { c: number }).c;
  console.log(`   - ${t.name} (${count} rows)`);
}

closeDb();
console.log('✅ Database ready at data/loreai.db');
