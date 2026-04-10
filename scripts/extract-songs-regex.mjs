/**
 * extract-songs-regex.mjs
 * Parses TypeScript song arrays using a robust regex approach.
 * No TypeScript compilation needed — works with plain Node.js.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SONGS_DIR = join(__dirname, '../quiz-app/src/data/songs');

const FILES = [
  { file: 'enygma.ts',     defaultArtist: 'ENYGMA' },
  { file: 'nerdhits.ts',   defaultArtist: '7MZ' },
  { file: 'records.ts',    defaultArtist: '7MZ' },
  { file: 'm4rkim.ts',     defaultArtist: 'M4RKIM' },
  { file: 'anirap.ts',     defaultArtist: 'ANIRAP' },
  { file: 'rodrigozin.ts', defaultArtist: 'RODRIGOZIN' },
  { file: 'pop.ts',        defaultArtist: 'MELANIE' },
  { file: 'daikinez.ts',   defaultArtist: 'DAIKINEZ' },
  { file: 'nishikay.ts',   defaultArtist: 'NISHIKAY' },
];

function extractField(block, key) {
  // Matches: key: 'value' or key: "value"
  const re = new RegExp(`${key}:\\s*['"]([^'"]+)['"]`);
  const m = block.match(re);
  return m ? m[1] : null;
}

function extractNumberField(block, key) {
  const re = new RegExp(`${key}:\\s*(\\d+)`);
  const m = block.match(re);
  return m ? parseInt(m[1], 10) : null;
}

function extractArrayField(block, key) {
  // Matches: key: ["a", "b"] or key: ['a', 'b']
  const re = new RegExp(`${key}:\\s*\\[([^\\]]+)\\]`);
  const m = block.match(re);
  if (!m) return null;
  const items = m[1].match(/['"]([^'"]+)['"]/g);
  return items ? items.map(s => s.replace(/['"]/g, '')) : null;
}

function parseSongFile(filePath, defaultArtist) {
  const content = readFileSync(filePath, 'utf8');
  const songs = [];
  
  // Find all object literals inside the array
  // We'll scan char by char to find balanced braces
  let depth = 0;
  let start = -1;
  let inArray = false;
  
  // Find the start of the songs array
  const arrayStart = content.indexOf('= [');
  if (arrayStart === -1) return songs;
  
  const section = content.slice(arrayStart);
  
  for (let i = 0; i < section.length; i++) {
    const ch = section[i];
    if (ch === '[' && i === 2) { inArray = true; continue; }
    if (!inArray) continue;
    
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const block = section.slice(start, i + 1);
        
        const id = extractField(block, 'id');
        const title = extractField(block, 'title');
        const youtubeId = extractField(block, 'youtubeId');
        const category = extractField(block, 'category');
        const artist = extractField(block, 'artist') || defaultArtist;
        const anime = extractField(block, 'anime');
        const duration = extractNumberField(block, 'duration');
        const introSkip = extractNumberField(block, 'introSkip');
        const outroBuffer = extractNumberField(block, 'outroBuffer');
        const searchTerms = extractArrayField(block, 'searchTerms');
        const selos = extractArrayField(block, 'selos');
        
        if (id && title && youtubeId) {
          songs.push({
            id,
            title,
            youtube_id: youtubeId,
            duration: duration || 0,
            category: category || defaultArtist,
            artist_id: artist,
            anime: anime || null,
            search_terms: searchTerms || null,
            intro_skip: introSkip || null,
            outro_buffer: outroBuffer || null,
            selos: selos || null,
            active: true,
          });
        }
        
        start = -1;
      }
    } else if (ch === ']' && depth === 0) {
      break;
    }
  }
  
  return songs;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
let allSongs = [];

for (const { file, defaultArtist } of FILES) {
  const path = join(SONGS_DIR, file);
  const songs = parseSongFile(path, defaultArtist);
  console.log(`✅ ${file}: ${songs.length} songs`);
  allSongs = allSongs.concat(songs);
}

// Deduplicate by youtube_id
const seen = new Set();
const unique = allSongs.filter(s => {
  if (seen.has(s.youtube_id)) return false;
  seen.add(s.youtube_id);
  return true;
});

console.log(`\nTotal: ${allSongs.length} | Unique: ${unique.length} | Dups: ${allSongs.length - unique.length}`);

// Count by artist
const byArtist = unique.reduce((acc, s) => {
  acc[s.artist_id] = (acc[s.artist_id] || 0) + 1;
  return acc;
}, {});
console.log('\nBy artist:');
Object.entries(byArtist).sort((a,b) => b[1]-a[1]).forEach(([a,c]) => console.log(`  ${a}: ${c}`));

// Write output
const outPath = join(__dirname, 'songs-export.json');
writeFileSync(outPath, JSON.stringify(unique, null, 2));
console.log(`\n📁 Written to scripts/songs-export.json`);
