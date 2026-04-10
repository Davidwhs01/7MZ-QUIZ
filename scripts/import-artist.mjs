#!/usr/bin/env node
/**
 * import-artist.mjs
 *
 * Pipeline completo para importar um canal do YouTube para o 7MZ Arena:
 *   1. Extrai metadados do canal e vídeos via yt-dlp
 *   2. Baixa avatar, extrai cores dominantes com node-vibrant
 *   3. Cria o artista no Supabase (se não existir) com cores e avatar_url
 *   4. Insere músicas novas (dedup automático por youtube_id)
 *
 * Uso:
 *   node scripts/import-artist.mjs <channel_url> <artist_id> [--dry-run]
 *
 * Exemplos:
 *   node scripts/import-artist.mjs https://www.youtube.com/@Miistery MIISTERY
 *   node scripts/import-artist.mjs https://www.youtube.com/@Daikinez DAIKINEZ --dry-run
 *
 * Requisitos:
 *   - yt-dlp instalado (pip install yt-dlp)
 *   - SUPABASE_SERVICE_ROLE_KEY no quiz-app/.env.local
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Args ──────────────────────────────────────────────────────────────────────
const [, , channelUrl, artistId, ...flags] = process.argv;
const DRY_RUN = flags.includes('--dry-run');

if (!channelUrl || !artistId) {
  console.error('Usage: node scripts/import-artist.mjs <channel_url> <artist_id> [--dry-run]');
  process.exit(1);
}

// ─── Load env ──────────────────────────────────────────────────────────────────
const envPath = join(__dirname, '../quiz-app/.env.local');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8').split('\n')
    .filter(l => l.includes('='))
    .map(l => [l.split('=')[0].trim(), l.split('=').slice(1).join('=').trim()])
);

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!KEY || KEY.length < 10) {
  console.error('❌  SUPABASE_SERVICE_ROLE_KEY not set in quiz-app/.env.local');
  process.exit(1);
}

// ─── Check yt-dlp ──────────────────────────────────────────────────────────────
try {
  const version = execSync('yt-dlp --version', { encoding: 'utf8' }).trim();
  console.log(`✅ yt-dlp ${version}`);
} catch {
  console.error('❌  yt-dlp not found. Install: pip install yt-dlp');
  process.exit(1);
}

// ─── Fetch channel metadata + videos ───────────────────────────────────────────
console.log(`\n🎬 Extracting channel: ${channelUrl}`);
console.log(`👤 Artist ID: ${artistId}`);
if (DRY_RUN) console.log('🔍 DRY RUN — nothing will be inserted\n');

let rawOutput;
try {
  rawOutput = execSync(
    `yt-dlp --flat-playlist --dump-single-json --no-warnings "${channelUrl}/videos"`,
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );
} catch (err) {
  console.error('❌  yt-dlp failed:', err.message?.slice(0, 300));
  process.exit(1);
}

let playlistData;
try {
  playlistData = JSON.parse(rawOutput);
} catch {
  console.error('❌  Failed to parse yt-dlp output');
  process.exit(1);
}

const entries = playlistData.entries || [];
const channelName = playlistData.channel || playlistData.uploader || artistId;

// Extract avatar URL from yt-dlp (thumbnails array or channel_url thumbnail)
const avatarUrl = playlistData.thumbnails?.find(t => t.id === 'avatar_uncropped')?.url
  || playlistData.thumbnails?.at(-1)?.url
  || null;

console.log(`📋 Found ${entries.length} videos — Channel: "${channelName}"`);
console.log(`🖼️  Avatar: ${avatarUrl ? '✅ found' : '⚠️  not found'}\n`);

// ─── Extract colors from avatar ────────────────────────────────────────────────
let primaryColor = '#ff6b2b';
let primaryColorRgb = '255, 107, 43';
let secondaryColor = '#3b82f6';
let secondaryColorRgb = '59, 130, 246';

if (avatarUrl) {
  console.log('🎨 Extracting colors from avatar...');
  const tempPath = join(__dirname, `_temp_avatar_${artistId}.jpg`);
  try {
    // Download avatar temporarily
    execSync(
      `yt-dlp --no-playlist -o "${tempPath}" "${avatarUrl}" --no-warnings 2>NUL || curl -L -o "${tempPath}" "${avatarUrl}"`,
      { encoding: 'utf8', stdio: 'pipe' }
    );

    if (existsSync(tempPath)) {
      // Use node-vibrant ESM import (v4 API)
      const { Vibrant } = await import('node-vibrant/node');
      const palette = await Vibrant.from(tempPath).getPalette();

      // Pick Vibrant as primary, DarkMuted or Muted as secondary
      const vibrant = palette.Vibrant;
      const darkMuted = palette.DarkMuted;
      const muted = palette.Muted;
      const darkVibrant = palette.DarkVibrant;

      if (vibrant) {
        const [r, g, b] = vibrant.rgb.map(Math.round);
        primaryColor = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
        primaryColorRgb = `${r}, ${g}, ${b}`;
      }

      const sec = darkMuted || muted || darkVibrant;
      if (sec) {
        const [r, g, b] = sec.rgb.map(Math.round);
        secondaryColor = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
        secondaryColorRgb = `${r}, ${g}, ${b}`;
      }

      unlinkSync(tempPath);
      console.log(`   Primary:   ${primaryColor} (rgb: ${primaryColorRgb})`);
      console.log(`   Secondary: ${secondaryColor} (rgb: ${secondaryColorRgb})\n`);
    }
  } catch (err) {
    console.warn(`⚠️  Color extraction failed (using defaults): ${err.message?.slice(0, 100)}`);
    if (existsSync(tempPath)) unlinkSync(tempPath);
  }
}

// ─── Check / create artist in Supabase ────────────────────────────────────────
const artistRes = await fetch(`${SUPABASE_URL}/rest/v1/artists?id=eq.${artistId}`, {
  headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
});
const artistData = await artistRes.json();
const artistExists = artistData && artistData.length > 0;

if (!DRY_RUN) {
  if (!artistExists) {
    console.log(`🆕 Creating artist "${channelName}" (${artistId})...`);

    const createRes = await fetch(`${SUPABASE_URL}/rest/v1/artists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': KEY,
        'Authorization': `Bearer ${KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        id: artistId,
        name: channelName,
        section: 'geek',
        youtube_channel_url: channelUrl,
        logo_url: avatarUrl || `/${artistId.toLowerCase()}-logo.jpg`,
        avatar_url: avatarUrl,
        theme_class: `theme-${artistId.toLowerCase()}`,
        category: artistId,
        active: true,
        primary_color: primaryColor,
        primary_color_rgb: primaryColorRgb,
        secondary_color: secondaryColor,
        secondary_color_rgb: secondaryColorRgb,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error('❌ Failed to create artist:', err.slice(0, 200));
      process.exit(1);
    }
    console.log(`✅ Artist created!\n`);
  } else {
    // Update colors if artist already exists but has no colors yet
    const existing = artistData[0];
    if (!existing.primary_color && primaryColor !== '#ff6b2b') {
      await fetch(`${SUPABASE_URL}/rest/v1/artists?id=eq.${artistId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': KEY,
          'Authorization': `Bearer ${KEY}`,
        },
        body: JSON.stringify({
          primary_color: primaryColor,
          primary_color_rgb: primaryColorRgb,
          secondary_color: secondaryColor,
          secondary_color_rgb: secondaryColorRgb,
          avatar_url: avatarUrl || existing.avatar_url,
        }),
      });
      console.log(`🎨 Updated colors for existing artist ${artistId}\n`);
    } else {
      console.log(`👤 Artist ${artistId} already exists in Supabase`);
    }
  }
}

// ─── Fetch existing youtube_ids from Supabase ──────────────────────────────────
const existingRes = await fetch(
  `${SUPABASE_URL}/rest/v1/songs?select=youtube_id&artist_id=eq.${artistId}`,
  { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } }
);
const existingIds = new Set((await existingRes.json() || []).map(r => r.youtube_id));
console.log(`📦 Already in Supabase for ${artistId}: ${existingIds.size} songs`);

// ─── Filter new videos ─────────────────────────────────────────────────────────
function generateId(title, videoId, artistId) {
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-').slice(0, 40);
  return `${artistId.toLowerCase()}-${slug}-${videoId.slice(-4)}`;
}

function generateSearchTerms(title) {
  return title.toLowerCase()
    .replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, ' ')
    .split(/\s+/).filter(t => t.length > 2).slice(0, 12);
}

const newSongs = entries
  .filter(e => !existingIds.has(e.id))
  .filter(e => e.id && e.title && !e.title.toLowerCase().includes('#shorts'))
  .map(e => ({
    id: generateId(e.title, e.id, artistId),
    title: e.title,
    youtube_id: e.id,
    duration: e.duration || 0,
    category: artistId,
    artist_id: artistId,
    anime: null,
    search_terms: generateSearchTerms(e.title),
    intro_skip: null,
    outro_buffer: null,
    selos: null,
    active: true,
  }));

console.log(`🆕 New songs to import: ${newSongs.length}`);
console.log(`⏭️  Duplicates skipped:  ${entries.length - newSongs.length}\n`);

if (newSongs.length === 0) {
  console.log('✅ Nothing to import — channel is up to date!');
  process.exit(0);
}

// Preview first 5
console.log('Preview (first 5):');
newSongs.slice(0, 5).forEach(s => console.log(`  [${s.youtube_id}] ${s.title.slice(0, 60)}`));
if (newSongs.length > 5) console.log(`  ... and ${newSongs.length - 5} more`);

if (DRY_RUN) {
  console.log('\n🔍 DRY RUN complete — use without --dry-run to insert');
  process.exit(0);
}

// ─── Insert songs into Supabase ────────────────────────────────────────────────
console.log('\n📤 Inserting songs into Supabase...');
const BATCH = 100;
let inserted = 0;

for (let i = 0; i < newSongs.length; i += BATCH) {
  const batch = newSongs.slice(i, i + BATCH);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/songs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Prefer': 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify(batch),
  });

  if (!res.ok) {
    console.error(`\n❌ Batch failed:`, (await res.text()).slice(0, 200));
  } else {
    inserted += batch.length;
    process.stdout.write(`\r✅ ${inserted}/${newSongs.length} songs inserted...`);
  }
}

console.log(`\n\n🏁 Done!`);
console.log(`   🎵 Songs: ${inserted} new (${existingIds.size + inserted} total)`);
console.log(`   🎨 Theme: primary=${primaryColor} / secondary=${secondaryColor}`);
console.log(`   🖼️  Avatar: ${avatarUrl ? avatarUrl.slice(0, 60) + '...' : 'not found'}`);
