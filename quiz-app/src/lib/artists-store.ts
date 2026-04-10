/**
 * artists-store.ts
 * Loads all active artists from Supabase and caches them in memory.
 * Used by ChannelContext and ChannelSelector for dynamic artist listing.
 */
import { supabase } from '@/lib/supabase';

export interface ArtistRecord {
  id: string;
  name: string;
  section: 'geek' | 'pop';
  logo_url: string | null;
  avatar_url: string | null;
  theme_class: string | null;
  primary_color: string | null;
  primary_color_rgb: string | null;
  secondary_color: string | null;
  secondary_color_rgb: string | null;
  youtube_channel_url: string | null;
  category: string | null;
  active: boolean;
}

let _artists: ArtistRecord[] | null = null;
let _loading: Promise<ArtistRecord[]> | null = null;

export async function getAllArtists(): Promise<ArtistRecord[]> {
  if (_artists) return _artists;
  if (_loading) return _loading;

  _loading = (async () => {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('active', true)
      .order('section')
      .order('name');

    if (error) {
      console.error('[artists-store] Failed to load artists:', error.message);
      return [];
    }

    _artists = (data ?? []) as ArtistRecord[];
    _loading = null;
    return _artists;
  })();

  return _loading;
}

export function getArtistsBySection(artists: ArtistRecord[], section: 'geek' | 'pop'): ArtistRecord[] {
  return artists.filter(a => a.section === section);
}

export function invalidateArtistsCache() {
  _artists = null;
  _loading = null;
}
