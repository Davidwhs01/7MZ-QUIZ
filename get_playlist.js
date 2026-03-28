const https = require('https');
const fs = require('fs');

https.get('https://www.youtube.com/playlist?list=PL-BkHM-E3ctUkVWOJOFNpgOtPAju3LPDR', (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        const match = rawData.match(/var ytInitialData = ({.*?});<\/script>/);
        if (match) {
            const data = JSON.parse(match[1]);
            const items = data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents;
            if (items) {
                let out = [];
                items.forEach((item, index) => {
                    const title = item?.playlistVideoRenderer?.title?.runs?.[0]?.text;
                    if (title) {
                        out.push(`${index + 1}. ${title}`);
                    }
                });
                fs.writeFileSync('playlist_titles.txt', out.join('\n'));
                console.log(`Saved ${out.length} titles to playlist_titles.txt`);
            } else {
                console.log("No items found in ytInitialData path.");
            }
        } else {
            console.log("ytInitialData not found.");
        }
    });
}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
});
