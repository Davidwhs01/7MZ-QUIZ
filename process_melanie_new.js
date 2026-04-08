const fs = require('fs');
const path = require('path');

const songsFile = path.join(__dirname, 'quiz-app/src/data/songs.ts');
const playlistFile = path.join(__dirname, 'melanie_playlist.json');
const outputFile = path.join(__dirname, 'melanie_new_songs.ts');

const songsCode = fs.readFileSync(songsFile, 'utf8');
const playlist = JSON.parse(fs.readFileSync(playlistFile, 'utf8'));

// 1. Get all youtubeIds already registered
const existingIds = [];
const idRegex = /youtubeId:\s*['\"]([^'\"]+)['\"]/g;
let match;
while ((match = idRegex.exec(songsCode)) !== null) {
  existingIds.push(match[1]);
}

// 2. Slugify for IDs
const slugify = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const newTracks = [];
playlist.forEach(item => {
  if (existingIds.includes(item.videoId)) return;
  
  // Format search terms
  let terms = item.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 2);
  
  const idPrefix = 'melanie-';
  const songId = idPrefix + item.videoId;

  const objStr = `  { id: "${songId}", title: "${item.title}", youtubeId: "${item.videoId}", duration: 0, category: 'POP', artist: 'MELANIE', searchTerms: ${JSON.stringify(terms)} },`;
  newTracks.push(objStr);
});

// 3. Write to temporary file
const fileContent = `import { Song } from "./quiz-app/src/data/songs";\n\n// --- NEW MELANIE SONGS EXTRACTED --- \nexport const newMelanieSongs = [\n${newTracks.join('\n')}\n];\n`;

fs.writeFileSync(outputFile, fileContent);
console.log(`Generated melanie_new_songs.ts with ${newTracks.length} new tracks.`);
