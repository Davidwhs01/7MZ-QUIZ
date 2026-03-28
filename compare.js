const fs = require('fs');
const playlistRaw = fs.readFileSync('playlist_titles.txt', 'utf8').split('\n').filter(Boolean);
const songsContent = fs.readFileSync('quiz-app/src/data/songs.ts', 'utf8');

// Parse current DB
const registeredSongs = [];
const regex = /{ id: [\"\']([^\"\']+)[\"\'].*?title: [\"\']([^\"\']+)[\"\'].*?category: [\"\']([^\"\']+)[\"\']/g;
let match;
while ((match = regex.exec(songsContent)) !== null) {
  registeredSongs.push({ id: match[1], title: match[2], category: match[3] });
}

console.log('--- COMPARAÇÃO DE MÚSICAS ---');

const foundList = [];
const missingList = [];

playlistRaw.forEach((pTitleLine, idx) => {
  // e.g. "1. 7 Minutoz - RAGNAROK" -> "RAGNAROK"
  // e.g. "17. GATO PRETO - Lucas A.R.T...."
  let cleanTitle = pTitleLine.replace(/^\d+\.\s*/, '').toLowerCase(); // Remove numbering
  
  // Try to find
  const found = registeredSongs.filter(rs => {
    const rsNorm = rs.title.toLowerCase();
    
    // Simplest match:
    // Does the registered title exist inside the playlist title? (e.g. "Ragnarok" inside "1. 7 Minutoz - RAGNAROK")
    // Does the playlist title exist inside the registered title?
    if (cleanTitle.includes(rsNorm) || rsNorm.includes(cleanTitle)) return true;
    
    // Or we split by '-' and check the right side
    const pParts = cleanTitle.split('-');
    if (pParts.length > 1) {
        let pRight = pParts[1].trim();
        // remove [Prod. ...] from right
        pRight = pRight.replace(/\[prod.*\]/, '').trim();
        
        let rParts = rsNorm.split('-');
        let rLeft = rParts[0].trim();
        let rRight = rParts.length > 1 ? rParts[1].trim() : rParts[0];
        
        if (pRight.includes(rsNorm) || rsNorm.includes(pRight) || pRight === rLeft || pRight === rRight) return true;
    }

    return false;
  });

  if (found.length > 0) {
    foundList.push({ playlist: pTitleLine, registered: found });
  } else {
    missingList.push(pTitleLine);
  }
});

fs.writeFileSync('compare_results.json', JSON.stringify({ foundList, missingList }, null, 2));
console.log(`Encontradas: ${foundList.length}. Faltando: ${missingList.length}. Registros Salvos em compare_results.json`);
