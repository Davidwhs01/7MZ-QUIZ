/**
 * migrate-songs-to-supabase.mjs
 * Reads all song data from the TS source files and inserts into Supabase.
 * Run: node scripts/migrate-songs-to-supabase.mjs
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tnupyzzfswesfyuwrkzz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌  Set SUPABASE_SERVICE_ROLE_KEY env var before running.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Parse TS file into raw song objects ─────────────────────────────────────
function parseTsSongFile(filePath, artistId) {
  const raw = readFileSync(filePath, 'utf8');

  // Extract objects inside the exported array
  const objects = [];
  // Match each { id: ..., title: ..., youtubeId: ..., ... } block
  const regex = /\{([^{}]+)\}/g;
  let match;

  while ((match = regex.exec(raw)) !== null) {
    const block = '{' + match[1] + '}';
    try {
      // Replace JS key: value syntax → JSON "key": value
      const json = block
        // Remove trailing commas before }
        .replace(/,\s*\}/g, '}')
        // Remove single-line comments
        .replace(/\/\/[^\n]*/g, '')
        // Add quotes around unquoted keys
        .replace(/(\b\w+\b)\s*:/g, '"$1":')
        // Replace single quotes around values with double quotes
        .replace(/:\s*'([^']*)'/g, (_, v) => ': "' + v.replace(/"/g, '\\"') + '"')
        // Handle arrays like ['a','b']
        .replace(/\[\s*'([^']+)'\s*\]/g, (_, v) => '["' + v + '"]')
        .replace(/,\s*'([^']+)'\s*\]/g, (_, v) => ', "' + v + '"]')
        .replace(/\[\s*'([^']+)',\s*'([^']+)'\s*\]/g, (_, a, b) => '["' + a + '", "' + b + '"]');

      const obj = JSON.parse(json);
      if (obj.id && obj.youtubeId && obj.title) {
        objects.push({
          id: obj.id,
          title: obj.title,
          youtube_id: obj.youtubeId,
          duration: obj.duration || 0,
          category: obj.category || artistId,
          artist_id: artistId,
          anime: obj.anime || null,
          search_terms: obj.searchTerms || null,
          intro_skip: obj.introSkip || null,
          outro_buffer: obj.outroBuffer || null,
          selos: obj.selos || null,
          active: true,
        });
      }
    } catch (_) {
      // Skip malformed blocks
    }
  }

  return objects;
}

// ─── Files to process ────────────────────────────────────────────────────────
const songDir = join(__dirname, '../quiz-app/src/data/songs');

const files = [
  { file: 'enygma.ts',     artistId: 'ENYGMA' },
  { file: 'nerdhits.ts',   artistId: '7MZ' },
  { file: 'records.ts',    artistId: '7MZ' },
  { file: 'm4rkim.ts',     artistId: 'M4RKIM' },
  { file: 'anirap.ts',     artistId: 'ANIRAP' },
  { file: 'rodrigozin.ts', artistId: 'RODRIGOZIN' },
  { file: 'pop.ts',        artistId: null }, // mixed — detect from data
  { file: 'daikinez.ts',   artistId: 'DAIKINEZ' },
  { file: 'nishikay.ts',   artistId: 'NISHIKAY' },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  let allSongs = [];

  for (const { file, artistId } of files) {
    const path = join(songDir, file);
    let songs = parseTsSongFile(path, artistId);

    // For pop.ts: artist_id is embedded in each record's artist field
    if (!artistId) {
      const raw = readFileSync(path, 'utf8');
      const regex = /\{([^{}]+)\}/g;
      songs = [];
      let m;
      while ((m = regex.exec(raw)) !== null) {
        const block = '{' + m[1] + '}';
        try {
          const json = block
            .replace(/,\s*\}/g, '}')
            .replace(/\/\/[^\n]*/g, '')
            .replace(/(\b\w+\b)\s*:/g, '"$1":')
            .replace(/:\s*'([^']*)'/g, (_, v) => ': "' + v.replace(/"/g, '\\"') + '"')
            .replace(/\[\s*'([^']+)'\s*\]/g, (_, v) => '["' + v + '"]');
          const obj = JSON.parse(json);
          if (obj.id && obj.youtubeId && obj.title) {
            songs.push({
              id: obj.id,
              title: obj.title,
              youtube_id: obj.youtubeId,
              duration: obj.duration || 0,
              category: obj.category || 'POP',
              artist_id: obj.artist || 'MELANIE',
              anime: obj.anime || null,
              search_terms: obj.searchTerms || null,
              intro_skip: obj.introSkip || null,
              outro_buffer: obj.outroBuffer || null,
              selos: obj.selos || null,
              active: true,
            });
          }
        } catch (_) {}
      }
    }

    console.log(`📄 ${file}: ${songs.length} songs parsed`);
    allSongs = allSongs.concat(songs);
  }

  // Deduplicate by youtube_id
  const seen = new Set();
  const unique = allSongs.filter(s => {
    if (seen.has(s.youtube_id)) return false;
    seen.add(s.youtube_id);
    return true;
  });

  console.log(`\n🎵 Total: ${allSongs.length} | Unique: ${unique.length} | Dups removed: ${allSongs.length - unique.length}`);

  // Insert in batches of 100
  const BATCH = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);
    const { error } = await supabase
      .from('songs')
      .upsert(batch, { onConflict: 'youtube_id', ignoreDuplicates: true });

    if (error) {
      console.error(`❌ Batch ${i}-${i + BATCH}:`, error.message);
      errors++;
    } else {
      inserted += batch.length;
      process.stdout.write(`\r✅ ${inserted}/${unique.length} inserted...`);
    }
  }

  console.log(`\n\n🏁 Done! ${inserted} inserted, ${errors} batch errors.`);

  // Verify
  const { count } = await supabase.from('songs').select('*', { count: 'exact', head: true });
  console.log(`📊 songs table now has ${count} rows.`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
