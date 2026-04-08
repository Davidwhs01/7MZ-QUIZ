const fs = require('fs');
const txt = fs.readFileSync('mitskileaks_filtered.txt', 'utf8');
const content = fs.readFileSync('src/data/songs.ts', 'utf8');

const searchString = "591:\n];\n\nexport function getRandomSong".split('\n').slice(1).join('\n');

if (content.includes('];\r\n\r\nexport function getRandomSong')) {
   fs.writeFileSync('src/data/songs.ts', content.replace('];\r\n\r\nexport function getRandomSong', "\n  // --- MITSKI UPLOADS (ALL POP SONGS) ---\n" + txt + "\n];\r\n\r\nexport function getRandomSong"));
   console.log("INJECTED WITH CRLF!");
} else if (content.includes('];\n\nexport function getRandomSong')) {
   fs.writeFileSync('src/data/songs.ts', content.replace('];\n\nexport function getRandomSong', "\n  // --- MITSKI UPLOADS (ALL POP SONGS) ---\n" + txt + "\n];\n\nexport function getRandomSong"));
   console.log("INJECTED WITH LF!");
} else {
   console.log("MARKER NOT FOUND! Cannot inject.");
}
