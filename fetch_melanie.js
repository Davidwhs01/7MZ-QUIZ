const https = require('https');
const fs = require('fs');

const PLAYLIST_ID = 'PLb4rrihfzrq3s2Tx2f7iGsnvyimUS1bPh';

function extractVideos(obj, results) {
  if (!obj) return;
  if (Array.isArray(obj)) {
    obj.forEach(x => extractVideos(x, results));
  } else if (typeof obj === 'object') {
    if (obj.playlistVideoRenderer) {
      const title = obj.playlistVideoRenderer.title?.runs?.[0]?.text;
      const videoId = obj.playlistVideoRenderer.videoId;
      if (title && videoId) results.push({ title, videoId });
    } else {
      Object.values(obj).forEach(x => extractVideos(x, results));
    }
  }
}

console.log('Fetching playlist:', PLAYLIST_ID);

https.get(`https://www.youtube.com/playlist?list=${PLAYLIST_ID}`, (res) => {
  let rawData = '';
  res.on('data', (chunk) => { rawData += chunk; });
  res.on('end', () => {
    const match = rawData.match(/var ytInitialData = ({.*?});<\/script>/);
    if (match) {
      const data = JSON.parse(match[1]);
      const results = [];
      extractVideos(data, results);
      console.log(`Found ${results.length} videos`);
      if (results.length > 0) {
        fs.writeFileSync('melanie_playlist.json', JSON.stringify(results, null, 2));
        console.log('Saved to melanie_playlist.json');
      }
    } else {
      console.log('ytInitialData not found. Trying alternative method...');
      // Try finding in other places
      const altMatch = rawData.match(/ytInitialData\s*=\s*({.*?});/s);
      if (altMatch) {
        try {
          const data = JSON.parse(altMatch[1]);
          const results = [];
          extractVideos(data, results);
          console.log(`Found ${results.length} videos (alt method)`);
          if (results.length > 0) {
            fs.writeFileSync('melanie_playlist.json', JSON.stringify(results, null, 2));
            console.log('Saved to melanie_playlist.json');
          }
        } catch(e) {
          console.log('Parse error:', e.message);
        }
      }
    }
  });
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});