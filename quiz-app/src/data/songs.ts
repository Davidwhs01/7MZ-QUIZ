import { Song, SongCategory, SeloKey, Artist, AppSection } from './types';
import { enygmaSongs } from './songs/enygma';
import { nerdHitsSongs } from './songs/nerdhits';
import { recordsSongs } from './songs/records';
import { m4rkimSongs } from './songs/m4rkim';
import { anirapSongs } from './songs/anirap';
import { rodrigozinSongs } from './songs/rodrigozin';
import { popSongs } from './songs/pop';
import { daikinezSongs } from './songs/daikinez';
import { nishikaySongs } from './songs/nishikay';

// Hub for all song modules. Consolidates them into a single array for application use.
// This resolves the "Expression produces a union type that is too complex to represent" 
// error by avoiding a single massive literal array.
export const songs: Song[] = [
  ...enygmaSongs,
  ...nerdHitsSongs,
  ...recordsSongs,
  ...m4rkimSongs,
  ...anirapSongs,
  ...rodrigozinSongs,
  ...popSongs,
  ...daikinezSongs,
  ...nishikaySongs,
];

// Re-export types for backward compatibility
export type { Song, SongCategory, SeloKey, Artist, AppSection };

export function getSongSection(song: Song): AppSection {
  return (song.artist === 'MELANIE' || song.artist === 'MITSKI') ? 'pop' : 'geek';
}

export function getSongsBySection(section: AppSection): Song[] {
  return songs.filter(s => getSongSection(s) === section);
}

export function getSongsByArtist(artist: Artist): Song[] {
  return songs.filter(s => s.artist === artist);
}

export function getRandomSong(excludeIds: string[] = [], selo?: SeloKey | SeloKey[], artist?: Artist): Song | null {
  let pool = songs;
  if (artist) {
    pool = pool.filter(s => s.artist === artist);
  }
  if (selo) {
    if (Array.isArray(selo)) {
      pool = pool.filter(s => selo.includes(s.category as SeloKey));
    } else if (selo === 'PÓS REVELAÇÃO') {
      pool = pool.filter(s => s.selos?.includes('PÓS REVELAÇÃO'));
    } else {
      pool = pool.filter(s => s.category === selo);
    }
  }
  const available = pool.filter(s => !excludeIds.includes(s.id));
  if (available.length === 0) {
    return null;
  }
  return available[Math.floor(Math.random() * available.length)];
}

export function searchSongs(query: string, selo?: SeloKey, artist?: Artist): Song[] {
  if (!query || query.length < 2) return [];

  const normalizedQuery = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const terms = normalizedQuery.split(/\s+/);

  let pool = songs;
  if (artist) {
    pool = pool.filter(s => s.artist === artist);
  }
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
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const allTerms = [
        titleNorm,
        ...(song.searchTerms || []).map(t =>
          t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        ),
        song.anime?.toLowerCase() || "",
      ].join(" ");

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
