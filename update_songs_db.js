const fs = require('fs');
const path = require('path');

const songsFile = path.join(__dirname, 'quiz-app/src/data/songs.ts');
let songsCode = fs.readFileSync(songsFile, 'utf8');
const playlist = JSON.parse(fs.readFileSync('playlist_full.json', 'utf8'));

// 1. Obter todos os youtubeIds já registrados para não haver duplicatas
const existingIds = [];
const regex = /youtubeId:\s*['\"]([^'\"]+)['\"]/g;
let match;
while ((match = regex.exec(songsCode)) !== null) {
  existingIds.push(match[1]);
}

// 2. Modificar a categoria de Itadori para '7MZ RECORDS' se ainda for NERD HITS
songsCode = songsCode.replace(
  /({[^}]+id:\s*[\"']itadori[\"'][^}]+category:\s*[\"'])NERD HITS([\"'])/,
  '$17MZ RECORDS$2'
);

// 3. Montar as novas faixas
const newTracks = [];
const slugify = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const idsGen = new Set();
// Existing IDs matching the object keys
const idRegex = /id:\s*['\"]([^'\"]+)['\"]/g;
while ((match = idRegex.exec(songsCode)) !== null) {
  idsGen.add(match[1]);
}

playlist.forEach(item => {
  if (existingIds.includes(item.videoId)) return;
  
  // Limpar os numeros iniciais (ex: "8. Gabriel Rodrigues" -> "Gabriel Rodrigues", "5. 4. Lucas..." -> "Lucas")
  let cleanTitle = item.title.replace(/^(\d+\.\s*)+/, '').trim();
  
  // Gerar um id unico
  let baseId = slugify(cleanTitle.split('-')[1] || cleanTitle.split('-')[0] || 'track').substring(0, 25);
  // Remove [prod ...]
  baseId = baseId.replace(/-prod.*/, '');
  
  if (baseId.length < 2) baseId = 'track-' + item.videoId.toLowerCase();
  
  let finalId = baseId;
  let counter = 2;
  while (idsGen.has(finalId)) {
    finalId = `${baseId}-${counter}`;
    counter++;
  }
  idsGen.add(finalId);
  
  // Search terms
  let terms = [ ...cleanTitle.replace(/\[.*?\]/g, '').replace(/[\(\)-]/g, ' ').split(/\s+/).filter(w => w.length > 2) ];
  // Remove duplicate terms and make lower
  terms = [...new Set(terms.map(w => slugify(w)))];

  const objStr = `  { id: "${finalId}", title: "${cleanTitle}", youtubeId: "${item.videoId}", duration: 0, category: '7MZ RECORDS', searchTerms: ${JSON.stringify(terms)} },`;
  newTracks.push(objStr);
});

// 4. Inserir no final do array songs (logo antes de "];")
const insertIndex = songsCode.lastIndexOf('];');
if (insertIndex !== -1 && newTracks.length > 0) {
  // Add a comment to mark the new insertion block
  const insertionBlock = "\n  // --- 7MZ Records Solos & EPs ---\n" + newTracks.join('\n') + "\n";
  songsCode = songsCode.slice(0, insertIndex) + insertionBlock + songsCode.slice(insertIndex);
  
  fs.writeFileSync(songsFile, songsCode);
  console.log(`Updated songs.ts: Modified Itadori and added ${newTracks.length} new tracks.`);
} else if (newTracks.length === 0) {
  console.log('No new tracks to add. Everything is up to date.');
  fs.writeFileSync(songsFile, songsCode); // In case Itadori was modified
} else {
  console.log('Could not find the end of songs array "];". File unchanged.');
}
