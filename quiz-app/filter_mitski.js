const fs = require('fs');

const rawData = JSON.parse(fs.readFileSync('mitskileaks_all_videos.json', 'utf8'));

const BANNED_TERMS = [
  'Behind The',
  'Behind the',
  'Vevo Footnotes',
  'ASMR',
  'Trailer',
  'Making of'
];

function getBaseName(title) {
  // Remove "Mitski - " or "Mitski: "
  let base = title.replace(/^Mitski\s*[-:]\s*/i, '');
  
  // Normaliza aspas (transforma aspa curva ’ em reta ')
  base = base.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  
  // Clean up any double quotes if it was like '"Bella Ciao" (English Cover)'
  base = base.replace(/^"|"$/g, '');
  
  // Remove anything after a pipe | 
  base = base.replace(/\s*\|.*/g, '').trim();

  // Remove content in parenthesis or brackets at the end
  base = base.replace(/\s*[\[\(].*?[\]\)]\s*$/g, '').trim();
  
  return base;
}

function getPriority(title) {
  const t = title.toLowerCase();
  if (t.includes('official video') || t.includes('official film clip')) return 100;
  if (t.includes('official audio')) return 90;
  if (t.includes('official lyric video')) return 80;
  if (t.includes('lyric video')) {
    // If it's a translated lyric video, it's lower priority
    if (/(spanish|portuguese|japanese|thai|malay|korean|bahasa|vietnamese|歌詞和訳リリックビデオ)/.test(t)) {
      return 10;
    }
    // English or generic lyric video
    return 50;
  }
  if (t.includes('live')) return 5;
  if (t.includes('cover')) return 40;
  return 30; // Default
}

const uniqueSongs = {};

for (const video of rawData) {
  // Check banned terms
  if (BANNED_TERMS.some(bt => video.title.toLowerCase().includes(bt.toLowerCase()))) {
    continue;
  }

  const baseName = getBaseName(video.title);
  const priority = getPriority(video.title);

  if (!uniqueSongs[baseName] || priority > uniqueSongs[baseName].priority) {
    uniqueSongs[baseName] = {
      ...video,
      priority,
      baseName
    };
  }
}

const finalVideos = Object.values(uniqueSongs)
  .sort((a, b) => a.baseName.localeCompare(b.baseName))
  .map(v => {
    return `  { id: "mitski-${v.videoId}", title: ${JSON.stringify(v.title)}, youtubeId: "${v.videoId}", duration: 0, category: 'POP', artist: 'MITSKI' },`;
  });

console.log(`Total original: ${rawData.length}`);
console.log(`Total filtrados (únicas): ${finalVideos.length}`);

fs.writeFileSync('mitskileaks_filtered.txt', finalVideos.join('\n'));
console.log('Salvo em mitskileaks_filtered.txt');
