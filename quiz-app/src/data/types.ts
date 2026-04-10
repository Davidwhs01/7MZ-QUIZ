// Open string types — new artists/categories added via Supabase require no code changes
export type SongCategory = string;
export type SeloKey = string;
export type Artist = string;
export type AppSection = 'geek' | 'pop';


export interface Song {
  id: string;
  title: string;
  youtubeId: string;
  duration: number;
  category: SongCategory;
  artist: Artist;
  anime?: string;
  searchTerms?: string[];
  introSkip?: number;
  outroBuffer?: number;
  selos?: string[];
}
