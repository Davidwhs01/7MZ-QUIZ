const https = require('https');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'channels.json');
const SONGS_TS_PATH = path.join(__dirname, 'quiz-app', 'src', 'data', 'songs.ts');

// ─── Helpers ───────────────────────────────────────────────

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return { channels: [] };
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseHandle(input) {
  // Accept: @Name, Name, https://youtube.com/@Name, https://youtube.com/channel/UCxxx, etc
  input = input.trim();
  if (input.includes('youtube.com')) {
    const atMatch = input.match(/@([A-Za-z0-9_.-]+)/);
    if (atMatch) return { handle: atMatch[1], type: 'handle' };
    const chMatch = input.match(/channel\/(UC[A-Za-z0-9_-]+)/);
    if (chMatch) return { handle: chMatch[1], type: 'channelId' };
    const userMatch = input.match(/user\/([A-Za-z0-9_.-]+)/);
    if (userMatch) return { handle: userMatch[1], type: 'user' };
  }
  const clean = input.replace(/^@/, '');
  return { handle: clean, type: 'handle' };
}

// ─── HTTP Fetching ─────────────────────────────────────────

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchPage(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function fetchContinuation(token) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      context: { client: { clientName: 'WEB', clientVersion: '2.20240101.00.00' } },
      continuation: token
    });
    const req = https.request({
      hostname: 'www.youtube.com',
      path: '/youtubei/v1/browse?prettyPrint=false',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Length': Buffer.byteLength(postData),
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ─── YouTube Data Extraction ───────────────────────────────

function extractVideos(obj, results) {
  if (!obj) return;
  if (Array.isArray(obj)) {
    obj.forEach(x => extractVideos(x, results));
  } else if (typeof obj === 'object') {
    if (obj.videoRenderer) {
      const title = obj.videoRenderer.title?.runs?.[0]?.text || obj.videoRenderer.title?.simpleText;
      const videoId = obj.videoRenderer.videoId;
      if (title && videoId) results.push({ title, videoId });
    } else if (obj.richItemRenderer?.content?.videoRenderer) {
      const vr = obj.richItemRenderer.content.videoRenderer;
      const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText;
      const videoId = vr.videoId;
      if (title && videoId) results.push({ title, videoId });
    } else {
      Object.values(obj).forEach(x => extractVideos(x, results));
    }
  }
}

function extractContinuationToken(obj) {
  if (!obj || typeof obj !== 'object') return null;
  if (obj.continuationEndpoint?.continuationCommand?.token) return obj.continuationEndpoint.continuationCommand.token;
  if (obj.continuationCommand?.token) return obj.continuationCommand.token;
  if (obj.reloadContinuationData?.continuation) return obj.reloadContinuationData.continuation;
  for (const value of Object.values(obj)) {
    if (typeof value === 'object' && value !== null) {
      const token = extractContinuationToken(value);
      if (token) return token;
    }
  }
  return null;
}

function extractChannelInfo(html) {
  const info = { profileImage: '', bannerImage: '', subscriberCount: '' };

  // Profile image (avatar)
  const avatarMatch = html.match(/"avatar":\s*\{[^}]*"thumbnails":\s*\[([^\]]+)\]/);
  if (avatarMatch) {
    const urlMatch = avatarMatch[1].match(/"url":\s*"([^"]+)"/);
    if (urlMatch) info.profileImage = urlMatch[1].replace(/\\u0026/g, '&');
  }

  // Banner image
  const bannerMatch = html.match(/"banner":\s*\{[^}]*"thumbnails":\s*\[([^\]]+)\]/);
  if (bannerMatch) {
    const urlMatch = bannerMatch[1].match(/"url":\s*"([^"]+)"/);
    if (urlMatch) info.bannerImage = urlMatch[1].replace(/\\u0026/g, '&');
  }

  // Subscriber count (approximate)
  const subMatch = html.match(/"subscriberCountText":\s*\{[^}]*"simpleText":\s*"([^"]+)"/);
  if (subMatch) info.subscriberCount = subMatch[1];

  return info;
}

async function scrapeAllVideos(handle, handleType) {
  const url = handleType === 'channelId'
    ? `https://www.youtube.com/channel/${handle}/videos`
    : `https://www.youtube.com/@${handle}/videos`;

  console.log(`  Buscando: ${url}`);

  const html = await fetchPage(url);
  const match = html.match(/var ytInitialData = ({.*?});<\/script>/s);
  if (!match) throw new Error(`Não foi possível carregar o canal`);

  const initialData = JSON.parse(match[1]);
  const channelInfo = extractChannelInfo(html);

  const allVideos = [];
  const seen = new Set();

  // Initial page
  const initial = [];
  extractVideos(initialData, initial);
  for (const v of initial) {
    if (!seen.has(v.videoId)) { seen.add(v.videoId); allVideos.push(v); }
  }
  console.log(`  Página 1: ${allVideos.length} vídeos`);

  // Continuation pages
  let token = extractContinuationToken(initialData);
  let pageNum = 1;

  while (token) {
    pageNum++;
    await sleep(600);
    const data = await fetchContinuation(token);
    if (!data) break;

    const pageVideos = [];
    extractVideos(data, pageVideos);

    let newCount = 0;
    for (const v of pageVideos) {
      if (!seen.has(v.videoId)) { seen.add(v.videoId); allVideos.push(v); newCount++; }
    }
    console.log(`  Página ${pageNum}: ${pageVideos.length} vídeos (${newCount} novos)`);
    if (newCount === 0) break;
    token = extractContinuationToken(data);
  }

  return { videos: allVideos, channelInfo };
}

// ─── songs.ts Manipulation ─────────────────────────────────

function getExistingVideoIdsForArtist(artist) {
  const content = fs.readFileSync(SONGS_TS_PATH, 'utf8');
  const ids = new Set();
  const lines = content.split('\n');
  let inBlock = false;
  let blockArtist = '';

  for (const line of lines) {
    if (line.includes('{ id:')) inBlock = true;
    if (inBlock && line.includes(`artist: '${artist}'`)) blockArtist = artist;
    if (inBlock && line.includes('youtubeId:')) {
      const m = line.match(/youtubeId:\s*"([^"]+)"/);
      if (m && blockArtist === artist) ids.add(m[1]);
    }
    if (line.includes('},') || (line.trim() === '}' && inBlock)) {
      inBlock = false;
      blockArtist = '';
    }
  }
  return ids;
}

// ─── Filters ───────────────────────────────────────────────

const MAX_DURATION_SECONDS = 13 * 60; // 13 minutes
const TITLE_BLACKLIST = [
  'shorts', '#shorts', 'short', 'ao vivo', 'live', 'vlog',
  'behind the scenes', 'bastidores', 'reacao', 'reaction',
  'respondendo', 'q&a', 'podcast', 'talk', 'entrevista',
  'review', 'analise', 'tier list', 'ranking',
];

function isMusicVideo(video) {
  const title = (video.title || '').toLowerCase();

  // Skip videos with blacklisted terms
  for (const term of TITLE_BLACKLIST) {
    if (title.includes(term)) return false;
  }

  // Skip videos that look like shorts (usually very short titles with hashtags)
  if (title.match(/^#\w+\s/) && title.length < 50) return false;

  return true;
}

function generateSongEntry(video, channel) {
  const id = `${channel.artist.toLowerCase()}-${video.videoId}`;
  const title = video.title
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ');
  return `  { id: "${id}", title: "${title}", youtubeId: "${video.videoId}", duration: 0, category: '${channel.category}', artist: '${channel.artist}' }`;
}

function injectSongs(entries, channel) {
  const content = fs.readFileSync(SONGS_TS_PATH, 'utf8');
  const categoryStr = `category: '${channel.category}'`;

  // Find the last occurrence of this category in the file
  let lastIndex = -1;
  let searchFrom = 0;
  while (true) {
    const idx = content.indexOf(categoryStr, searchFrom);
    if (idx === -1) break;
    lastIndex = idx;
    searchFrom = idx + 1;
  }

  if (lastIndex === -1) {
    // Category doesn't exist yet, insert before the last ];
    const arrEnd = content.lastIndexOf('];');
    if (arrEnd === -1) { console.error('  songs.ts: não encontrou ]; final'); return false; }
    const block = `\n  // --- ${channel.artist} ---\n` + entries.join(',\n') + ',\n';
    const updated = content.slice(0, arrEnd) + block + content.slice(arrEnd);
    fs.writeFileSync(SONGS_TS_PATH, updated, 'utf8');
    return true;
  }

  // Find the closing "}," of that last entry
  const closingIdx = content.indexOf('},', lastIndex);
  if (closingIdx === -1) { console.error('  songs.ts: nao encontrou fechamento'); return false; }
  const insertPoint = closingIdx + 2; // after "},"

  const block = '\n' + entries.join(',\n') + ',';
  const updated = content.slice(0, insertPoint) + block + content.slice(insertPoint);
  fs.writeFileSync(SONGS_TS_PATH, updated, 'utf8');
  return true;
}

// ─── Commands ──────────────────────────────────────────────

async function cmdAdd(input, options) {
  const parsed = parseHandle(input);
  const handle = parsed.handle;
  console.log(`\n=== Cadastrando canal: @${handle} ===\n`);

  const config = loadConfig();
  if (config.channels.find(c => c.handle === handle)) {
    console.log(`  Canal @${handle} já cadastrado. Use "sync" para atualizar.`);
    return;
  }

  // Scrape all videos + channel info
  const { videos, channelInfo } = await scrapeAllVideos(handle, parsed.type);
  console.log(`\n  Total encontrado: ${videos.length} vídeos`);
  if (channelInfo.subscriberCount) console.log(`  Inscritos: ${channelInfo.subscriberCount}`);

  const channel = {
    handle,
    handleType: parsed.type,
    displayName: options.name || handle,
    artist: (options.artist || handle).toUpperCase(),
    category: (options.category || options.artist || handle).toUpperCase(),
    profileImage: options.profile || channelInfo.profileImage || '',
    bannerImage: options.banner || channelInfo.bannerImage || '',
    subscriberCount: channelInfo.subscriberCount || '',
    addedAt: new Date().toISOString().split('T')[0],
    lastSync: new Date().toISOString(),
    totalVideos: videos.length,
  };

  // Save raw data
  const rawPath = path.join(__dirname, `${handle.toLowerCase()}_all_videos.json`);
  fs.writeFileSync(rawPath, JSON.stringify(videos, null, 2));

  // Filter out videos already in songs.ts
  const existingIds = getExistingVideoIdsForArtist(channel.artist);
  const newVideos = videos.filter(v => !existingIds.has(v.videoId));

  if (existingIds.size > 0) {
    console.log(`  Já existentes no songs.ts: ${existingIds.size}`);
    console.log(`  Novas para adicionar: ${newVideos.length}`);
  }

  if (newVideos.length > 0) {
    const entries = newVideos.map(v => generateSongEntry(v, channel));
    const formattedPath = path.join(__dirname, `${handle.toLowerCase()}_formatted.txt`);
    fs.writeFileSync(formattedPath, entries.join(',\n') + ',');

    const injected = injectSongs(entries, channel);
    if (injected) {
      console.log(`  ${newVideos.length} músicas adicionadas ao songs.ts!`);
    }
  }

  config.channels.push(channel);
  saveConfig(config);

  console.log(`\n  Canal @${handle} cadastrado com sucesso!`);
  console.log(`  Artista: ${channel.artist} | Categoria: ${channel.category}`);
  console.log(`  Imagem: ${channel.profileImage ? 'OK' : '(nenhuma)'}`);
  console.log(`  Músicas no canal: ${videos.length} | Adicionadas: ${newVideos.length}`);
  console.log('');
}

async function cmdSync(handle) {
  const config = loadConfig();
  const channels = handle
    ? config.channels.filter(c => c.handle === handle)
    : config.channels;

  if (channels.length === 0) {
    console.log(handle ? `Canal @${handle} não cadastrado.` : 'Nenhum canal cadastrado.');
    return;
  }

  for (const channel of channels) {
    console.log(`\n=== Sync: @${channel.handle} (${channel.displayName}) ===\n`);

    const existingIds = getExistingVideoIdsForArtist(channel.artist);
    console.log(`  No songs.ts: ${existingIds.size} músicas`);

    const { videos } = await scrapeAllVideos(channel.handle, channel.handleType || 'handle');
    console.log(`  No canal: ${videos.length} vídeos`);

    const newVideos = videos.filter(v => !existingIds.has(v.videoId));
    console.log(`  Novas: ${newVideos.length}`);

    if (newVideos.length === 0) {
      console.log('  Nenhuma música nova.');
    } else {
      const entries = newVideos.map(v => generateSongEntry(v, channel));
      const injected = injectSongs(entries, channel);
      if (injected) {
        console.log(`  ${newVideos.length} músicas adicionadas ao songs.ts!`);
        newVideos.forEach(v => console.log(`    + ${v.title}`));
      }
    }

    channel.lastSync = new Date().toISOString();
    channel.totalVideos = videos.length;
    saveConfig(config);
  }

  console.log('\n  Sync concluído!\n');
}

function cmdList() {
  const config = loadConfig();
  if (config.channels.length === 0) {
    console.log('Nenhum canal cadastrado.');
    console.log('Uso: node manage_channels.js add <handle ou URL>');
    return;
  }
  console.log('\n=== Canais Cadastrados ===\n');
  for (const ch of config.channels) {
    const existing = getExistingVideoIdsForArtist(ch.artist);
    console.log(`  @${ch.handle} (${ch.displayName})`);
    console.log(`    Artista: ${ch.artist} | Categoria: ${ch.category}`);
    console.log(`    Imagem: ${ch.profileImage ? 'OK' : 'nenhuma'}`);
    console.log(`    Canal: ${ch.totalVideos} vídeos | songs.ts: ${existing.size}`);
    console.log(`    Último sync: ${ch.lastSync || 'nunca'}`);
    console.log('');
  }
}

// ─── CLI ───────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
Gerenciador de Canais - 7MZ Quiz

Comandos:
  node manage_channels.js add <handle ou URL> [opções]   Cadastra canal
  node manage_channels.js sync [handle]                   Atualiza músicas novas
  node manage_channels.js list                            Lista canais

Opções do add:
  --name "Nome"            Nome de exibição
  --artist "ARTISTA"       Nome do artista (default: handle em maiúsculas)
  --category "CATEGORIA"   Categoria no songs.ts (default: artista)
  --profile "url"          Imagem de perfil (URL)
  --banner "url"           Banner (URL)

Exemplos:
  node manage_channels.js add Enygma_Music
  node manage_channels.js add https://youtube.com/@Enygma_Music --artist "ENYGMA" --category "ENYGMA"
  node manage_channels.js sync
  node manage_channels.js sync Enygma_Music
  node manage_channels.js list
`);
    return;
  }

  // Parse options from remaining args
  const options = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      options[key] = args[++i] || '';
    }
  }

  switch (command) {
    case 'add': {
      const input = args.find(a => !a.startsWith('--') && a !== 'add');
      if (!input) { console.error('Uso: node manage_channels.js add <handle ou URL>'); process.exit(1); }
      await cmdAdd(input, options);
      break;
    }
    case 'sync': {
      const handle = args.find(a => !a.startsWith('--') && a !== 'sync');
      await cmdSync(handle);
      break;
    }
    case 'list':
      cmdList();
      break;
    default:
      console.error(`Comando desconhecido: ${command}`);
      process.exit(1);
  }
}

main().catch(e => { console.error('Erro:', e.message); process.exit(1); });
