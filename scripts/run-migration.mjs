/**
 * run-migration.mjs
 * Reads all batch SQL files and inserts them into Supabase using the REST API.
 * Uses the service role key from environment.
 * 
 * Usage:
 *   $env:SUPABASE_SERVICE_ROLE_KEY="your-key-here"
 *   node scripts/run-migration.mjs
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://tnupyzzfswesfyuwrkzz.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY first.');
  process.exit(1);
}

const batches = readdirSync(__dirname)
  .filter(f => f.match(/^batch_\d+\.sql$/))
  .sort();

console.log(`Found ${batches.length} batch files`);

let totalOk = 0;
let totalErr = 0;

for (const batchFile of batches) {
  const sql = readFileSync(join(__dirname, batchFile), 'utf8');
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
    },
    body: JSON.stringify({ sql }),
  });

  // Fallback: use the pg query endpoint
  const res2 = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (res2.ok) {
    totalOk++;
    process.stdout.write(`\r✅ ${batchFile} ok (${totalOk}/${batches.length})`);
  } else {
    const err = await res2.text();
    console.error(`\n❌ ${batchFile}:`, err.slice(0, 150));
    totalErr++;
  }
}

console.log(`\n\nDone: ${totalOk} ok, ${totalErr} errors`);
