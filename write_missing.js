const fs = require('fs');
const readJsonL = (file) => {
    let content = fs.readFileSync(file);
    if (content[0] === 0xFF && content[1] === 0xFE) content = content.toString('utf16le');
    else content = content.toString('utf8');
    return content.trim().split('\n').filter(Boolean).map(JSON.parse);
};
const nerdhits = readJsonL('nerdhits_playlist.jsonl');
const records = readJsonL('records_playlist.jsonl');
const allYtVideos = [...nerdhits.map(v=>({ ...v, cat: 'NERD HITS'})), ...records.map(v=>({...v, cat: '7MZ RECORDS'}))];
const code = fs.readFileSync('quiz-app/src/data/songs.ts', 'utf8');
const regex = /{ id: [\"\']([^\"\']+)[\"\'],? ?title: [\"\']([^\"\']+)[\"\'].*?youtubeId: [\"\']([^\"\']+)[\"\'].*?category: [\"\']([^\"\']+)[\"\']/g;
const db = []; let match;
while ((match = regex.exec(code)) !== null) db.push({ ytId: match[3] });
const toAdd = [];
allYtVideos.forEach(ytVideo => {
   if (!db.find(d => d.ytId === ytVideo.id)) {
      toAdd.push({ title: ytVideo.title, id: ytVideo.id, cat: ytVideo.cat });
   }
});
fs.writeFileSync('missing.txt', toAdd.map(v => v.id + ' : ' + v.title).join('\n'));
