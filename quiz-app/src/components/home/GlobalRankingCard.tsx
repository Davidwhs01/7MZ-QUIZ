'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

type LeaderboardEntry = {
  id: string;
  score: number;
  profiles: {
    username: string;
    avatar_url: string;
  };
};

export default function GlobalRankingCard() {
  const [ranking, setRanking] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const fetchRanking = async () => {
      if (cancelled) return;
      
      try {
        const { data, error } = await supabase
          .from('leaderboard')
          .select(`
            id,
            score,
            profiles (
              username,
              avatar_url
            )
          `)
          .order('score', { ascending: false })
          .limit(5);

        if (error) throw error;
        if (!cancelled) {
          setRanking(data as unknown as LeaderboardEntry[]);
        }
      } catch (err: any) {
        console.error('Error fetching leaderboard:', err);
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Defer the fetch until Supabase has evaluated the auth state from local storage.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
       if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          fetchRanking();
       }
    });

    return () => { 
      cancelled = true; 
      subscription.unsubscribe();
    };
  }, []);

  const getRankColor = (rank: number) => {
    switch(rank) {
      case 1: return 'var(--accent-orange)';
      case 2: return 'var(--accent-blue)';
      case 3: return '#a855f7';
      default: return 'var(--text-muted)';
    }
  };

  if (loading) {
    return (
      <div className="rankingList" style={{ gap: 8, display: 'flex', flexDirection: 'column' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ height: 40, background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', animation: 'pulse 2s infinite' }} />
        ))}
      </div>
    );
  }

  if (error || ranking.length === 0) {
    return (
      <div className="rankingList">
        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', margin: '20px 0' }}>
          {error ? 'Erro ao carregar o ranking.' : 'Nenhum jogador no ranking ainda.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rankingList">
      {ranking.map((player, idx) => {
        const rank = idx + 1;
        const color = getRankColor(rank);
        return (
          <div key={player.id} className="rankItem" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid transparent' }}>
            <span className="rankNumber" style={{ color: color, fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, minWidth: 30 }}>
              #{rank}
            </span>
            <span className="rankName" style={{ fontFamily: 'var(--font-ui)', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {player.profiles?.username || 'Jogador Desconhecido'}
            </span>
            <span className="rankPoints" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {player.score.toLocaleString()} pts
            </span>
          </div>
        );
      })}

      <div style={{ marginTop: '16px', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Link 
          href="/ranking"
          style={{ 
            display: 'inline-flex', alignItems: 'center', padding: '10px 20px', 
            background: 'rgba(255, 136, 0, 0.1)', color: 'var(--accent-orange)', 
            fontFamily: 'var(--font-ui)', fontSize: '0.8rem', fontWeight: 700, 
            borderRadius: '100px', cursor: 'pointer', border: '1px solid rgba(255, 136, 0, 0.2)', textDecoration: 'none',
            letterSpacing: '0.02em', transition: 'all 0.2s'
          }}
        >
          VER RANKING COMPLETO
        </Link>
      </div>
    </div>
  );
}
