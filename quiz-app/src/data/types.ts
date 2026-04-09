export type SongCategory = 'NERD HITS' | '7MZ RECORDS' | 'ENYGMA' | 'POP' | 'GEEKS' | 'AUTORAIS' | 'M4RKIM' | 'ANIRAP' | 'DAIKINEZ' | 'NISHIKAY';
export type SeloKey = SongCategory | 'PÓS REVELAÇÃO';
export type Artist = '7MZ' | 'ENYGMA' | 'MELANIE' | 'RODRIGOZIN' | 'MITSKI' | 'M4RKIM' | 'ANIRAP' | 'DAIKINEZ' | 'NISHIKAY';
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
