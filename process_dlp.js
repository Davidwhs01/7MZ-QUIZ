const fs = require('fs');

const lines = fs.readFileSync('enygma_all_raw.jsonl', 'utf16le').split('\n').filter(Boolean);

let out = `  // --- ENYGMA UPLOADS (ALL SONGS) ---\n`;

lines.forEach(line => {
    line = line.trim();
    if(!line) return;
    
    // Removing any possible leftover BOM characters:
    if (line.charCodeAt(0) === 0xFEFF) {
        line = line.slice(1);
    }
    
    let r;
    try {
        r = JSON.parse(line);
    } catch (e) {
        console.warn("Failed to parse line:", line.substring(0, 50));
        return;
    }

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

    let dur = r.duration || 0;

    out += `  { id: "enygma-${r.id}", title: "${cleanTitle}", youtubeId: "${r.id}", duration: ${dur}, category: 'ENYGMA'${animeStr}, searchTerms: ${JSON.stringify(terms)} },\n`;
});

fs.writeFileSync('enygma_all_formatted.txt', out);
console.log("Formatado e salvo em enygma_all_formatted.txt!");
