// write-batch-sql.mjs
import { readFileSync, writeFileSync } from 'fs';
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
function toRow(s) {
  return '(' + [
    esc(s.id), esc(s.title), esc(s.youtube_id),
    s.duration || 0, esc(s.category), esc(s.artist_id),
    esc(s.anime), arr(s.search_terms),
    (s.intro_skip != null ? s.intro_skip : 'NULL'),
    (s.outro_buffer != null ? s.outro_buffer : 'NULL'),
    arr(s.selos), 'true'
  ].join(',') + ')';
}

const BATCH = 100;
for (let i = 0; i < songs.length; i += BATCH) {
  const batch = songs.slice(i, i + BATCH);
  const sql = `INSERT INTO public.songs (id,title,youtube_id,duration,category,artist_id,anime,search_terms,intro_skip,outro_buffer,selos,active) VALUES\n`
    + batch.map(toRow).join(',\n')
    + `\nON CONFLICT (youtube_id) DO NOTHING;`;
  const idx = String(Math.floor(i/BATCH)).padStart(2,'0');
  writeFileSync(join(__dirname, `batch_${idx}.sql`), sql, 'utf8');
}
console.log(`Written ${Math.ceil(songs.length/BATCH)} batch SQL files`);
