const https = require('https');
const fs = require('fs');
const path = require('path');

// Usage: node fetch_durations.js <YOUTUBE_API_KEY>
// Gets duration for all songs where duration === 0 and updates songs.ts

const API_KEY = process.argv[2];
if (!API_KEY) {
  console.error('Usage: node fetch_durations.js <YOUTUBE_API_KEY>');
  console.error('Get a key at: https://console.cloud.google.com/apis/credentials');
  process.exit(1);
}

const songsPath = path.join(__dirname, 'quiz-app', 'src', 'data', 'songs.ts');
const content = fs.readFileSync(songsPath, 'utf-8');

// Extract all songs with duration: 0
const zeroDurationRegex = /\{\s*id:\s*"([^"]+)",\s*title:\s*"[^"]*",\s*youtubeId:\s*"([^"]+)",\s*duration:\s*0/g;
const matches = [];
let m;
while ((m = zeroDurationRegex.exec(content)) !== null) {
  matches.push({ id: m[1], youtubeId: m[2] });
}

console.log(`Found ${matches.length} songs with duration: 0`);

if (matches.length === 0) {
  console.log('Nothing to update.');
  process.exit(0);
}

// YouTube API allows max 50 IDs per request
function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function parseISO8601Duration(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function fetchBatch(ids) {
  return new Promise((resolve, reject) => {
    const idString = ids.join(',');
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${idString}&key=${API_KEY}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(json.error.message));
            return;
          }
          const durations = {};
          for (const item of (json.items || [])) {
            durations[item.id] = parseISO8601Duration(item.contentDetails.duration);
          }
          resolve(durations);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const batches = chunk(matches, 50);
  const allDurations = {};

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const ids = batch.map(s => s.youtubeId);
    console.log(`Fetching batch ${i + 1}/${batches.length} (${ids.length} videos)...`);

    try {
      const durations = await fetchBatch(ids);
      Object.assign(allDurations, durations);
    } catch (e) {
      console.error(`Error fetching batch ${i + 1}:`, e.message);
    }

    // Rate limit: wait 100ms between batches
    if (i < batches.length - 1) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  console.log(`Got durations for ${Object.keys(allDurations).length} videos`);

  // Replace duration: 0 with real durations in songs.ts
  let updated = content;
  let replaceCount = 0;

  for (const song of matches) {
    const dur = allDurations[song.youtubeId];
    if (dur && dur > 0) {
      // Find the exact line and replace
      const pattern = new RegExp(
        `(id:\\s*"${song.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^}]*?duration:\\s*)0(\\s*,)`,
      );
      if (pattern.test(updated)) {
        updated = updated.replace(pattern, `$1${dur}$2`);
        replaceCount++;
      }
    } else {
      console.warn(`  No duration found for: ${song.id} (${song.youtubeId})`);
    }
  }

  fs.writeFileSync(songsPath, updated, 'utf-8');
  console.log(`\nUpdated ${replaceCount}/${matches.length} songs in songs.ts`);

  if (replaceCount < matches.length) {
    console.log(`${matches.length - replaceCount} songs could not be updated (video may be private/deleted)`);
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
