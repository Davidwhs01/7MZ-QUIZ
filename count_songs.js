const fs = require('fs');
const songsCode = fs.readFileSync('quiz-app/src/data/songs.ts', 'utf8');

const registeredSongs = [];
const regex = /{ id: [\"\']([^\"\']+)[\"\'].*?youtubeId: [\"\']([^\"\']+)[\"\'].*?category: [\"\']([^\"\']+)[\"\']/g;
let match;
while ((match = regex.exec(songsCode)) !== null) {
  registeredSongs.push({ id: match[1], ytId: match[2], category: match[3] });
}

console.log('-- Análise das Músicas no Banco --');
console.log('Total Nerd Hits: ', registeredSongs.filter(s => s.category === 'NERD HITS').length);
console.log('Total 7MZ RECORDS: ', registeredSongs.filter(s => s.category === '7MZ RECORDS').length);
console.log('Total Geral: ', registeredSongs.length);
