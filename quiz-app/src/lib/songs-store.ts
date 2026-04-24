/**
 * songs-store.ts
 *
 * In-memory cache of songs loaded from Supabase.
 * Loaded once on first use, then reused.
 *
 * Maintains full API compatibility with the old static songs.ts:
 *   getRandomSong(), searchSongs(), getSongsBySection(), getSongsByArtist()
 */

import { supabase } from '@/lib/supabase';
import type { Song, Artist, SeloKey, AppSection } from '@/data/types';

// ─── In-memory cache with TTL ────────────────────────────────────────────────
let _songs: Song[] | null = null;
let _loading: Promise<Song[]> | null = null;
let _lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function mapRow(row: Record<string, unknown>): Song {
  return {
    id: row.id as string,
    title: row.title as string,
    youtubeId: row.youtube_id as string,
    duration: (row.duration as number) || 0,
    category: row.category as Song['category'],
    artist: row.artist_id as Artist,
    anime: (row.anime as string) || undefined,
    searchTerms: (row.search_terms as string[]) || [],
    introSkip: (row.intro_skip as number) || undefined,
    outroBuffer: (row.outro_buffer as number) || undefined,
    selos: (row.selos as string[]) || undefined,
  };
}

export async function getAllSongs(): Promise<Song[]> {
  const now = Date.now();
  const isExpired = _songs && (now - _lastFetchTime > CACHE_TTL_MS);
  
  if (_songs && !isExpired) return _songs;
  if (_loading) return _loading;

  // If expired, clear for fresh fetch
  if (isExpired) {
    _songs = null;
  }

  _loading = (async () => {
    let allData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('active', true)
        .order('artist_id')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error('[songs-store] Failed to load songs:', error.message);
        return _songs ?? []; // return stale data if available
      }
      
      allData.push(...(data || []));
      
      if (!data || data.length < pageSize) {
        break;
      }
      page++;
    }

    _songs = allData.map(mapRow);
    _lastFetchTime = Date.now();
    _loading = null;
    return _songs;
  })();

  return _loading;
}

/** Force a refresh of the cache (e.g., after importing new songs) */
export function invalidateSongsCache() {
  _songs = null;
  _loading = null;
}

// ─── Query functions (same signature as songs.ts) ────────────────────────────

export async function getRandomSongAsync(
  excludeIds: string[] = [],
  selo?: SeloKey | SeloKey[],
  artist?: Artist
): Promise<Song | null> {
  let pool = await getAllSongs();

  if (artist) pool = pool.filter(s => s.artist === artist);

  if (selo) {
    if (Array.isArray(selo)) {
      pool = pool.filter(s => (selo as string[]).includes(s.category));
    } else if (selo === 'PÓS REVELAÇÃO') {
      pool = pool.filter(s => s.selos?.includes('PÓS REVELAÇÃO'));
    } else {
      pool = pool.filter(s => s.category === selo);
    }
  }

  const available = pool.filter(s => !excludeIds.includes(s.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

export async function searchSongsAsync(
  query: string,
  selo?: SeloKey,
  artist?: Artist
): Promise<Song[]> {
  if (!query || query.length < 2) return [];

  const normalizedQuery = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const terms = normalizedQuery.split(/\s+/);

  let pool = await getAllSongs();
  if (artist) pool = pool.filter(s => s.artist === artist);
  if (selo) {
    if (selo === 'PÓS REVELAÇÃO') {
      pool = pool.filter(s => s.selos?.includes('PÓS REVELAÇÃO'));
    } else {
      pool = pool.filter(s => s.category === selo);
    }
  }

  return pool
    .map(song => {
      const titleNorm = song.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const allTerms = [
        titleNorm,
        ...(song.searchTerms || []).map(t =>
          t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        ),
        song.anime?.toLowerCase() || '',
      ].join(' ');

      let score = 0;
      for (const term of terms) {
        if (allTerms.includes(term)) score++;
      }
      if (titleNorm.includes(normalizedQuery)) score += 3;

      return { song, score };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(r => r.song);
}

export async function getSongsBySectionAsync(section: AppSection): Promise<Song[]> {
  const { getAllArtists } = await import('@/lib/artists-store');
  const [all, allArtists] = await Promise.all([getAllSongs(), getAllArtists()]);
  const sectionIds = new Set(allArtists.filter(a => a.section === section).map(a => a.id));
  return all.filter(s => sectionIds.has(s.artist));
}

export async function getSongsByArtistAsync(artist: Artist): Promise<Song[]> {
  const all = await getAllSongs();
  return all.filter(s => s.artist === artist);
}
