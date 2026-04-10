'use client';

import { useEffect, useState, useRef } from 'react';
import { getAllSongs, invalidateSongsCache } from '@/lib/songs-store';
import type { Song } from '@/data/types';

/**
 * useSongsStore
 * Loads all songs from Supabase into the in-memory cache on first render.
 * Returns the songs array and a loading flag.
 * Subsequent calls return the cached data instantly.
 */
export function useSongsStore() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    getAllSongs().then(data => {
      setSongs(data);
      setLoading(false);
    });
  }, []);

  return { songs, loading, refresh: () => { invalidateSongsCache(); initialized.current = false; } };
}
