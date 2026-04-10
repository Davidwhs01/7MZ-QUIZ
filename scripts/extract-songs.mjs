/**
 * extract-songs.mjs
 * Uses ts-node/esbuild to properly load TypeScript song files and extract data.
 * Outputs a clean JSON with all songs for the migration script.
 * 
 * Run: node scripts/extract-songs.mjs
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '../quiz-app/src');

// We'll use a temp TS file that imports everything and writes JSON
const tempScript = `
import { enygmaSongs } from './data/songs/enygma';
import { nerdHitsSongs } from './data/songs/nerdhits';
import { recordsSongs } from './data/songs/records';
import { m4rkimSongs } from './data/songs/m4rkim';
import { anirapSongs } from './data/songs/anirap';
import { rodrigozinSongs } from './data/songs/rodrigozin';
import { popSongs } from './data/songs/pop';
import { daikinezSongs } from './data/songs/daikinez';
import { nishikaySongs } from './data/songs/nishikay';
import { writeFileSync } from 'fs';

const allSongs = [
  ...enygmaSongs,
  ...nerdHitsSongs,
  ...recordsSongs,
  ...m4rkimSongs,
  ...anirapSongs,
  ...rodrigozinSongs,
  ...popSongs,
  ...daikinezSongs,
  ...nishikaySongs,
];

writeFileSync('scripts/songs-export.json', JSON.stringify(allSongs, null, 2));
console.log('Exported: ' + allSongs.length + ' songs');
`;

const tempPath = join(SRC, '_extract_temp.ts');
writeFileSync(tempPath, tempScript);

try {
  // Run with tsx (fast TS runner)
  execSync(`npx tsx ${tempPath}`, {
    cwd: join(__dirname, '../quiz-app'),
    stdio: 'inherit',
  });
} finally {
  // Clean up temp file
  try { execSync(`del "${tempPath.replace(/\//g, '\\')}"`); } catch (_) {}
}

console.log('✅ songs-export.json written to scripts/');
