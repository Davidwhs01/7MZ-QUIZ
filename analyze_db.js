const fs = require('fs');

const readJsonL = (file) => {
    let content = fs.readFileSync(file);
    // Remove BOM and decode UTF-16 LE if needed
    if (content[0] === 0xFF && content[1] === 0xFE) {
        content = content.toString('utf16le');
    } else {
        content = content.toString('utf8');
    }
    return content.trim().split('\n').filter(Boolean).map(JSON.parse);
};

const nerdhits = readJsonL('nerdhits_playlist.jsonl');
const records = readJsonL('records_playlist.jsonl');

console.log(`Nerd Hits YT size: ${nerdhits.length}`);
console.log(`Records YT size: ${records.length}`);

const extractRegistered = () => {
  const code = fs.readFileSync('quiz-app/src/data/songs.ts', 'utf8');
  const arr = [];
  const regex = /{ id: [\"\']([^\"\']+)[\"\'],? ?title: [\"\']([^\"\']+)[\"\'].*?youtubeId: [\"\']([^\"\']+)[\"\'].*?category: [\"\']([^\"\']+)[\"\']/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
     arr.push({ id: match[1], title: match[2], ytId: match[3], category: match[4] });
  }
  return arr;
}
const db = extractRegistered();
console.log(`DB Total size: ${db.length}`);

// Analysis what to add, delete, update
const allYtVideos = [...nerdhits.map(v=>({ ...v, cat: 'NERD HITS'})), ...records.map(v=>({...v, cat: '7MZ RECORDS'}))];

let toAdd = [];
let toRemove = [];

// Explicit overrides per user
allYtVideos.forEach(ytVideo => {
   const inDbInfo = db.find(d => d.ytId === ytVideo.id);
   
   let targetCategory = ytVideo.cat;
   
   const lowerTitle = ytVideo.title.toLowerCase();
   if (lowerTitle.includes('mahito') || lowerTitle.includes('geto')) targetCategory = 'NERD HITS';
   if (lowerTitle.includes('itadori') || lowerTitle.includes('sukuna')) targetCategory = '7MZ RECORDS';

   if (!inDbInfo) {
      toAdd.push({ title: ytVideo.title, ytId: ytVideo.id, targetCategory });
   }
});

let missingNerd = toAdd.filter(x => x.targetCategory === 'NERD HITS').length;
let missingRecords = toAdd.filter(x => x.targetCategory === '7MZ RECORDS').length;

console.log(`Missing from DB: ${toAdd.length} (Nerd: ${missingNerd}, Records: ${missingRecords})`);

db.forEach(dbItem => {
   const inYtInfo = allYtVideos.find(y => y.id === dbItem.ytId);
   if (!inYtInfo) {
      toRemove.push(dbItem);
   }
});
console.log(`In DB but NOT target playlists: ${toRemove.length}`);
