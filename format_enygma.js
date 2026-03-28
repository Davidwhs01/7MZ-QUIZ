const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('enygma_raw.json', 'utf8'));

let out = `  // --- ENYGMA UPLOADS ---\n`;

raw.forEach(r => {
    let cleanTitle = r.title.replace(/"/g, "'");
    
    let animeStr = "";
    let animeMatch = r.title.match(/\|.*?\((.*?)\).*?\|/);
    if(animeMatch) {
       animeStr = `, anime: "${animeMatch[1].replace(/"/g, "'")}"`;
    } else {
       let m = r.title.match(/\((.*?)\)/);
       if(m) animeStr = `, anime: "${m[1].replace(/"/g, "'")}"`;
    }

    let normalized = r.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    let terms = normalized
       .replace(/[^a-z0-9\s]/g, ' ')
       .split(' ')
       .filter(w => w.length >= 3 && w !== 'enygma' && w !== 'feat' && w !== 'music')
       .filter((v, i, a) => a.indexOf(v) === i) // unique
       .slice(0, 8); // top 8 keywords

    out += `  { id: "enygma-${r.videoId}", title: "${cleanTitle}", youtubeId: "${r.videoId}", duration: 0, category: 'ENYGMA'${animeStr}, searchTerms: ${JSON.stringify(terms)} },\n`;
});

fs.writeFileSync('enygma_formatted.txt', out);
console.log("Formatado e salvo em enygma_formatted.txt");
