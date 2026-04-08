const fs = require('fs');
const path = require('path');

const songsFile = path.join(__dirname, 'quiz-app/src/data/songs.ts');
const playlists = [
  { file: 'rodrigo_geeks.json', category: 'GEEKS' },
  { file: 'rodrigo_aut1.json', category: 'AUTORAIS' },
  { file: 'rodrigo_aut2.json', category: 'AUTORAIS' },
  { file: 'rodrigo_aut3.json', category: 'AUTORAIS' }
];

const songsCode = fs.readFileSync(songsFile, 'utf8');

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

playlists.forEach(p => {
  if (!fs.existsSync(p.file)) {
    console.log(`File ${p.file} not found, skipping...`);
    return;
  }
  
  const playlist = JSON.parse(fs.readFileSync(p.file, 'utf8'));
  console.log(`Processing ${p.file}: ${playlist.length} videos, category: ${p.category}`);
  
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
    
    const idPrefix = 'rodrigozin-';
    const songId = idPrefix + item.videoId;

    const objStr = `  { id: "${songId}", title: "${item.title.replace(/"/g, '\\"')}", youtubeId: "${item.videoId}", duration: 0, category: '${p.category}', artist: 'RODRIGOZIN', searchTerms: ${JSON.stringify(terms)} },`;
    newTracks.push(objStr);
  });
});

// 3. Write output
const outputFile = path.join(__dirname, 'rodrigozin_songs.ts');
const fileContent = `// --- NEW RODRIGOZIN SONGS ---\n// Total: ${newTracks.length} tracks\nexport const rodrigozinSongs = [\n${newTracks.join('\n')}\n];\n`;

fs.writeFileSync(outputFile, fileContent);
console.log(`Generated rodrigozin_songs.ts with ${newTracks.length} new tracks.`);

// 4. Print for copy-paste
console.log('\n--- COPY BELOW THIS LINE ---\n');
console.log(newTracks.join('\n'));