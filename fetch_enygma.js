const https = require('https');
const fs = require('fs');

const PLAYLIST_URL = process.argv[2];

if (!PLAYLIST_URL) {
    console.error("ERRO: Você precisa fornecer a URL da playlist!");
    console.error("Exemplo: node fetch_enygma.js https://www.youtube.com/playlist?list=ID_DA_PLAYLIST");
    process.exit(1);
}

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

console.log(`Buscando músicas na playlist: ${PLAYLIST_URL}...`);

https.get(PLAYLIST_URL, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        const match = rawData.match(/var ytInitialData = ({.*?});<\/script>/);
        if (match) {
            const data = JSON.parse(match[1]);
            const results = [];
            extractVideos(data, results);
            console.log(`Sucesso: ${results.length} músicas do Enygma encontradas!`);
            if (results.length > 0) {
                fs.writeFileSync('enygma_raw.json', JSON.stringify(results, null, 2));
                console.log("Salvo em 'enygma_raw.json'");
            }
        } else {
            console.log("ytInitialData não encontrado na página. A playlist é pública?");
        }
    });
}).on('error', (e) => {
    console.error(`Ocorreu um erro: ${e.message}`);
});
