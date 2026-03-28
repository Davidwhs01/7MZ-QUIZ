const https = require('https');
const fs = require('fs');

function extractVideos(obj, results) {
  if (!obj) return;
  if (Array.isArray(obj)) {
    obj.forEach(x => extractVideos(x, results));
  } else if (typeof obj === 'object') {
    if (obj.playlistVideoRenderer) {
       const title = obj.playlistVideoRenderer.title?.runs?.[0]?.text;
       const videoId = obj.playlistVideoRenderer.videoId;
       if (title && videoId) results.push({title, videoId});
    } else {
       Object.values(obj).forEach(x => extractVideos(x, results));
    }
  }
}

https.get('https://www.youtube.com/playlist?list=PL-BkHM-E3ctUkVWOJOFNpgOtPAju3LPDR', (res) => {
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
                fs.writeFileSync('playlist_full.json', JSON.stringify(results, null, 2));
            }
        } else {
            console.log("ytInitialData not found.");
        }
    });
}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
});
