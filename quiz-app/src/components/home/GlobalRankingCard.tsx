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

// Medalhas SVG inline — sem emojis (taste-skill)
const MedalGold = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="#f59e0b" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="5" fill="rgba(245,158,11,0.25)"/>
    <path d="M12 9l.9 2.7h2.8l-2.3 1.7.9 2.6L12 14.4l-2.3 1.6.9-2.6-2.3-1.7h2.8z" fill="#f59e0b"/>
  </svg>
);
const MedalSilver = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="#94a3b8" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="5" fill="rgba(148,163,184,0.2)"/>
  </svg>
);
const MedalBronze = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="#b45309" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="5" fill="rgba(180,83,9,0.2)"/>
  </svg>
);
const IconEmpty = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
    <path d="M6 9H4a2 2 0 0 1-2-2V5h4"/><path d="M18 9h2a2 2 0 0 0 2-2V5h-4"/>
    <path d="M12 17v4"/><path d="M8 21h8"/><path d="M6 9a6 6 0 0 0 12 0V3H6z"/>
  </svg>
);
const IconArrow = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

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

  const getMedal = (rank: number) => {
    if (rank === 1) return <MedalGold />;
    if (rank === 2) return <MedalSilver />;
    if (rank === 3) return <MedalBronze />;
    return null;
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#f59e0b';
      case 2: return '#94a3b8';
      case 3: return '#b45309';
      default: return 'var(--text-muted)';
    }
  };

  // ── Shimmer skeleton (taste-skill) ────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.rankingList}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className={styles.skeletonItem} style={{ animationDelay: `${i * 80}ms` }}>
            <div className={`${styles.skeletonRank} skeleton-shimmer`} style={{ animationDelay: `${i * 80}ms` }} />
            <div className={styles.skeletonText}>
              <div className={`skeleton-shimmer`} style={{ height: 12, width: '65%', borderRadius: 4, animationDelay: `${i * 80}ms` }} />
              <div className={`skeleton-shimmer`} style={{ height: 10, width: '35%', borderRadius: 4, marginTop: 6, animationDelay: `${i * 80 + 40}ms` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Empty state bonito (taste-skill) ──────────────────────────────────────
  if (error || ranking.length === 0) {
    return (
      <div className={styles.emptyState}>
        <IconEmpty />
        <p className={styles.emptyTitle}>
          {error ? 'Falha ao carregar' : 'Sem jogadores ainda'}
        </p>
        <p className={styles.emptyDesc}>
          {error
            ? 'Verifique sua conexão e tente novamente.'
            : 'Seja o primeiro a entrar no ranking.'}
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
          <div key={player.id} className={styles.rankItem} style={{ animationDelay: `${idx * 60}ms` }}>
            <span className={styles.rankNumber} style={{ color }}>
              {getMedal(rank) ?? <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.8rem' }}>#{rank}</span>}
            </span>
            <span className={styles.rankName}>
              {player.profiles?.username || 'Jogador'}
            </span>
            <span className={styles.rankPoints}>
              {player.score.toLocaleString('pt-BR')} pts
            </span>
          </div>
        );
      })}

      <div className={styles.viewAllWrap}>
        <Link href="/ranking" className={styles.viewAllBtn}>
          Ver ranking completo <IconArrow />
        </Link>
      </div>
    </div>
  );
}
