const https = require('https');
const fs = require('fs');

const CHANNEL_URL = 'https://www.youtube.com/@Enygma_Music/videos';

function extractVideos(obj, results) {
  if (!obj) return;
  if (Array.isArray(obj)) {
    obj.forEach(x => extractVideos(x, results));
  } else if (typeof obj === 'object') {
    if (obj.videoRenderer) {
       const title = obj.videoRenderer.title?.runs?.[0]?.text;
       const videoId = obj.videoRenderer.videoId;
       if (title && videoId) results.push({title, videoId});
    } else {
       Object.values(obj).forEach(x => extractVideos(x, results));
    }
  }
}

console.log(`Buscando vídeos no canal: ${CHANNEL_URL}...`);

https.get(CHANNEL_URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' // Avoid bot detection
  }
}, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        const match = rawData.match(/var ytInitialData = ({.*?});<\/script>/);
        if (match) {
            const data = JSON.parse(match[1]);
            const results = [];
            // To avoid duplicate recommendations from sidebar, limit scope if possible
            // But doing a general extractVideos within ytInitialData works fine for typical channel tab
            extractVideos(data, results);
            
            // Channel tabs have duplicate videoRenderers in the JSON response sometimes, let's unique them
            const uniqueResults = [];
            const seen = new Set();
            for (const item of results) {
               if (!seen.has(item.videoId)) {
                  seen.add(item.videoId);
                  uniqueResults.push(item);
               }
            }

            console.log(`Sucesso: ${uniqueResults.length} músicas do Enygma encontradas!`);
            if (uniqueResults.length > 0) {
                fs.writeFileSync('enygma_raw.json', JSON.stringify(uniqueResults, null, 2));
                console.log("Salvo em 'enygma_raw.json'");
            }
        } else {
            console.log("ytInitialData não encontrado na página.");
        }
    });
}).on('error', (e) => {
    console.error(`Ocorreu um erro: ${e.message}`);
});
