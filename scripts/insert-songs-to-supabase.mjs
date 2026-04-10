/**
 * insert-songs-to-supabase.mjs
 * Reads songs-export.json and inserts all songs into Supabase.
 * Loads SUPABASE_SERVICE_ROLE_KEY from quiz-app/.env.local automatically.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = join(__dirname, '../quiz-app/.env.local');
const envContent = readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l.includes('='))
    .map(l => [l.split('=')[0].trim(), l.split('=').slice(1).join('=').trim()])
);

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!KEY || KEY.length < 10) {
  console.error('❌  SUPABASE_SERVICE_ROLE_KEY not set in quiz-app/.env.local');
  process.exit(1);
}

console.log(`✅ Loaded key from .env.local`);
console.log(`🌐 URL: ${SUPABASE_URL}`);

const songs = JSON.parse(readFileSync(join(__dirname, 'songs-export.json'), 'utf8'));
console.log(`📦 ${songs.length} songs to insert\n`);

const BATCH = 200;
let inserted = 0;
let errors = 0;

for (let i = 0; i < songs.length; i += BATCH) {
  const batch = songs.slice(i, i + BATCH);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/songs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Prefer': 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify(batch),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`\n❌ Batch ${i / BATCH + 1} failed:`, err.slice(0, 300));
    errors++;
  } else {
    inserted += batch.length;
    process.stdout.write(`\r✅ Sent ${inserted}/${songs.length} songs...`);
  }
}

// Final count from Supabase
console.log('\n\n🔍 Verifying count...');
const countRes = await fetch(`${SUPABASE_URL}/rest/v1/songs?select=count`, {
  headers: {
    'apikey': KEY,
    'Authorization': `Bearer ${KEY}`,
    'Prefer': 'count=exact',
    'Range': '0-0',
  },
});

const range = countRes.headers.get('content-range');
const total = range ? range.split('/')[1] : '?';

console.log(`📊 songs table: ${total} rows in Supabase`);
console.log(`🏁 Done! ${errors} errors.`);
