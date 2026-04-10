// generate-sql.mjs
// Reads songs-export.json and writes chunked SQL INSERT files
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const songs = JSON.parse(readFileSync(join(__dirname, 'songs-export.json'), 'utf8'));

function esc(v) {
  if (v === null || v === undefined) return 'NULL';
  return "'" + String(v).replace(/'/g, "''") + "'";
}

function arr(v) {
  if (!v || v.length === 0) return 'NULL';
  return 'ARRAY[' + v.map(x => esc(x)).join(',') + ']';
}

// Write one big SQL file (MCP can handle it)
const rows = songs.map(s =>
  '(' + [
    esc(s.id),
    esc(s.title),
    esc(s.youtube_id),
    s.duration || 0,
    esc(s.category),
    esc(s.artist_id),
    esc(s.anime),
    arr(s.search_terms),
    s.intro_skip !== null && s.intro_skip !== undefined ? s.intro_skip : 'NULL',
    s.outro_buffer !== null && s.outro_buffer !== undefined ? s.outro_buffer : 'NULL',
    arr(s.selos),
    'true'
  ].join(',') + ')'
).join(',\n');

const sql = `INSERT INTO public.songs (id,title,youtube_id,duration,category,artist_id,anime,search_terms,intro_skip,outro_buffer,selos,active) VALUES\n${rows}\nON CONFLICT (youtube_id) DO NOTHING;`;

writeFileSync(join(__dirname, 'all-songs-insert.sql'), sql);
console.log(`Written all-songs-insert.sql (${songs.length} songs, ${(sql.length/1024).toFixed(0)} KB)`);
