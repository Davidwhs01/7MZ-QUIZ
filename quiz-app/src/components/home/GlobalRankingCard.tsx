'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import styles from './GlobalRankingCard.module.css';

interface LeaderboardProfile {
  username: string;
  avatar_url: string;
}

interface LeaderboardEntry {
  id: string;
  score: number;
  profiles: LeaderboardProfile;
}

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
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error fetching leaderboard:', err);
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRanking();

    return () => {
      cancelled = true;
    };
  }, []);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'var(--accent-orange)';
      case 2: return 'var(--accent-blue)';
      case 3: return '#a855f7';
      default: return 'var(--text-muted)';
    }
  };

  if (loading) {
    return (
      <div className={styles.rankingList}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={styles.loadingItem} />
        ))}
      </div>
    );
  }

  if (error || ranking.length === 0) {
    return (
      <div className={styles.rankingList}>
        <p className={styles.emptyMessage}>
          {error ? 'Erro ao carregar o ranking.' : 'Nenhum jogador no ranking ainda.'}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.rankingList}>
      {ranking.map((player, idx) => {
        const rank = idx + 1;
        const color = getRankColor(rank);
        return (
          <div key={player.id} className={styles.rankItem}>
            <span className={styles.rankNumber} style={{ color }}>
              #{rank}
            </span>
            <span className={styles.rankName}>
              {player.profiles?.username || 'Jogador Desconhecido'}
            </span>
            <span className={styles.rankPoints}>
              {player.score.toLocaleString()} pts
            </span>
          </div>
        );
      })}

      <div className={styles.viewAllWrap}>
        <Link href="/ranking" className={styles.viewAllBtn}>
          VER RANKING COMPLETO
        </Link>
      </div>
    </div>
  );
}
