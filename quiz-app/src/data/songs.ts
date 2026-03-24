export interface Song {
  id: string;
  title: string;
  youtubeId: string;
  duration: number; // seconds
  anime?: string;
  album?: string;
  year?: number;
  searchTerms: string[];
}

// 7 Minutoz songs with verified YouTube IDs
export const songs: Song[] = [
  // === User-verified IDs ===
  {
    id: "l-death-note",
    title: "Rap do L (Death Note) - O Maior Detetive",
    youtubeId: "fCtWj7X31jE",
    duration: 280,
    anime: "Death Note",
    searchTerms: ["l", "death note", "maior detetive", "lawliet"]
  },
  {
    id: "doflamingo",
    title: "Rap do Doflamingo (One Piece) - Um Rei",
    youtubeId: "6CXJ61UaDhE",
    duration: 290,
    anime: "One Piece",
    searchTerms: ["doflamingo", "one piece", "um rei", "doffy"]
  },
  {
    id: "akatsuki",
    title: "Rap da Akatsuki - Os Ninjas Mais Procurados do Mundo",
    youtubeId: "-oYMo8k22Vw",
    duration: 355,
    anime: "Naruto",
    album: "JINCHUURIKI",
    year: 2020,
    searchTerms: ["akatsuki", "ninjas mais procurados", "naruto"]
  },
  {
    id: "nagato",
    title: "Rap do Nagato (Naruto) - Minha Dor",
    youtubeId: "iUM3YdqwgPg",
    duration: 285,
    anime: "Naruto",
    searchTerms: ["nagato", "minha dor", "naruto", "pain"]
  },
  {
    id: "itachi",
    title: "Rap do Itachi (Naruto) - Essa Dor Que Causei",
    youtubeId: "zs_zpMnwNMs",
    duration: 290,
    anime: "Naruto",
    year: 2017,
    searchTerms: ["itachi", "dor que causei", "naruto", "uchiha"]
  },
  {
    id: "chopper",
    title: "Rap do Chopper (One Piece) - Sou Um Monstro",
    youtubeId: "ZJoHrBYg-iQ",
    duration: 265,
    anime: "One Piece",
    searchTerms: ["chopper", "one piece", "sou um monstro", "tony tony"]
  },
  {
    id: "deidara",
    title: "Rap do Deidara (Naruto) - A Arte É a Explosão",
    youtubeId: "y2LqIojs2wc",
    duration: 275,
    anime: "Naruto",
    searchTerms: ["deidara", "arte", "explosão", "naruto", "akatsuki"]
  },
  {
    id: "pain-shinra",
    title: "Rap do Nagato / Pain (Naruto) - Shinra Tensei",
    youtubeId: "KN4Tnp6XcGk",
    duration: 300,
    anime: "Naruto",
    searchTerms: ["pain", "nagato", "shinra tensei", "naruto"]
  },
  {
    id: "coringas",
    title: "Rap dos Coringas - Circo dos Horrores",
    youtubeId: "qMNX3FJh4Z4",
    duration: 320,
    anime: "DC Comics",
    year: 2019,
    searchTerms: ["coringas", "circo dos horrores", "coringa", "joker"]
  },
  {
    id: "hokages",
    title: "Rap dos Hokages (Naruto) - A Vontade do Fogo",
    youtubeId: "W8dWDjwkMDw",
    duration: 345,
    anime: "Naruto",
    year: 2019,
    searchTerms: ["hokages", "vontade do fogo", "naruto"]
  },
  {
    id: "gachiakuta",
    title: "Rudo Surebrec (Gachiakuta) - Do Paraíso ao Inferno",
    youtubeId: "qeZCx2u_Uz0",
    duration: 260,
    anime: "Gachiakuta",
    year: 2024,
    searchTerms: ["gachiakuta", "rudo", "surebrec", "paraíso", "inferno"]
  },
  {
    id: "mahito",
    title: "Mahito ft. Small (Novatroop)",
    youtubeId: "ayIn3hFDFYg",
    duration: 265,
    anime: "Jujutsu Kaisen",
    year: 2021,
    searchTerms: ["mahito", "jujutsu kaisen", "novatroop", "small"]
  },
  {
    id: "itadori",
    title: "Itadori ft. M4rkim",
    youtubeId: "tTAOA8POclQ",
    duration: 275,
    anime: "Jujutsu Kaisen",
    year: 2021,
    searchTerms: ["itadori", "yuji", "jujutsu kaisen", "m4rkim"]
  },
  {
    id: "satoru-gojo",
    title: "Satoru Gojo ft. Henrique Mendonça",
    youtubeId: "fu9dCuPRFHY",
    duration: 295,
    anime: "Jujutsu Kaisen",
    year: 2021,
    searchTerms: ["gojo", "satoru", "mais forte", "jujutsu kaisen", "henrique"]
  },
  {
    id: "judas",
    title: "Judas",
    youtubeId: "6b02hELah9Y",
    duration: 250,
    year: 2023,
    searchTerms: ["judas"]
  },
  {
    id: "sukuna",
    title: "Sukuna ft. Basara",
    youtubeId: "wViRL-63XJk",
    duration: 270,
    anime: "Jujutsu Kaisen",
    year: 2022,
    searchTerms: ["sukuna", "ryomen", "jujutsu kaisen", "basara", "rei das maldições"]
  },
  {
    id: "zoro",
    title: "Rap do Zoro (One Piece) - O Maior Espadachim do Mundo",
    youtubeId: "YLif14qUxg0",
    duration: 285,
    anime: "One Piece",
    searchTerms: ["zoro", "one piece", "espadachim", "roronoa"]
  },
  {
    id: "ban",
    title: "Rap do Ban (Nanatsu no Taizai) - O Pecado da Ganância",
    youtubeId: "dUoWRyZiVaA",
    duration: 280,
    anime: "Nanatsu no Taizai",
    searchTerms: ["ban", "nanatsu", "pecado", "ganância", "seven deadly sins"]
  },
  {
    id: "sasuke-renegado",
    title: "Rap do Sasuke - O Renegado",
    youtubeId: "r1blNSgRD00",
    duration: 285,
    anime: "Naruto",
    searchTerms: ["sasuke", "renegado", "naruto", "uchiha"]
  },
  {
    id: "sasuke-maldicao",
    title: "Rap do Sasuke (Naruto) - Maldição do Ódio",
    youtubeId: "WYJ2hKTXKWA",
    duration: 285,
    anime: "Naruto",
    year: 2018,
    searchTerms: ["sasuke", "maldição", "ódio", "naruto", "uchiha"]
  },
];

export function getRandomSong(excludeIds: string[] = []): Song {
  const available = songs.filter(s => !excludeIds.includes(s.id));
  if (available.length === 0) {
    // Reset if all songs used
    return songs[Math.floor(Math.random() * songs.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

export function searchSongs(query: string): Song[] {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  
  const terms = normalizedQuery.split(/\s+/);
  
  return songs
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
      
      // Score: how many query terms match
      let score = 0;
      for (const term of terms) {
        if (allTerms.includes(term)) score++;
      }

      // Bonus for title containing full query
      if (titleNorm.includes(normalizedQuery)) score += 3;
      
      return { song, score };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(r => r.song);
}
