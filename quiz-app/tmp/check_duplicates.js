const fs = require('fs');
const path = require('path');

const songsPath = 'src/data/songs.ts';
const content = fs.readFileSync(songsPath, 'utf8');

const mitskiSongs = [];
const lines = content.split('\n');

lines.forEach((line, index) => {
    if (line.includes("artist: 'MITSKI'")) {
        const titleMatch = line.match(/title: "(.*?)"/);
        const idMatch = line.match(/id: "(.*?)"/);
        if (titleMatch && idMatch) {
            mitskiSongs.push({
                index: index + 1,
                title: titleMatch[1],
                id: idMatch[1]
            });
        }
    }
});

function normalize(title) {
    return title
        .replace(/^Mitski (?:-|–) /i, '')
        .replace(/ \(Official.*?\)/ig, '')
        .replace(/ \(English Lyric Video\)/ig, '')
        .replace(/^Mitski: /i, '')
        .replace(/ – /g, ' - ')
        .replace(/ - /g, ' ')
        .trim()
        .toLowerCase();
}

const groups = {};
mitskiSongs.forEach(song => {
    const norm = normalize(song.title);
    if (!groups[norm]) groups[norm] = [];
    groups[norm].push(song);
});

console.log('--- Relatório de Possíveis Duplicatas (Mitski) ---');
let found = false;
for (const [norm, songs] of Object.entries(groups)) {
    if (songs.length > 1) {
        found = true;
        console.log(`\nMusica base: "${norm}"`);
        songs.forEach(s => {
            console.log(`  - [Linha ${s.index}] ${s.title} (ID: ${s.id})`);
        });
    }
}

if (!found) {
    console.log('\nNenhuma duplicata óbvia encontrada (além da que já removemos).');
}
