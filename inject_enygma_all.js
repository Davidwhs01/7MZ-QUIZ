const fs = require('fs');

const songsPath = 'quiz-app/src/data/songs.ts';
let songsFile = fs.readFileSync(songsPath, 'utf8');

const newEnygmaStr = fs.readFileSync('enygma_all_formatted.txt', 'utf8');

const startIndex = songsFile.indexOf('// --- ENYGMA UPLOADS ---');
const endIndex = songsFile.indexOf('{ id: "draken"');

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find markers to replace.");
    process.exit(1);
}

const before = songsFile.substring(0, startIndex);
const after = songsFile.substring(endIndex);

const newFileContent = before + newEnygmaStr + '\n  ' + after;

fs.writeFileSync(songsPath, newFileContent, 'utf8');
console.log("songs.ts updated with all Enygma songs successfully!");
