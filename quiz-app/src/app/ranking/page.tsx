'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';

type RankedPlayer = {
  id: string;
  score: number;
  games_played: number;
  username: string;
  avatar_url: string;
};

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState<'GERAL' | 'NERD HITS' | '7MZ RECORDS'>('GERAL');
  const [ranking, setRanking] = useState<RankedPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      const supabase = createClient();
      
      try {
        if (activeTab === 'GERAL') {
          // Use core leaderboard table for overall cumulative points
          const { data, error } = await supabase
            .from('leaderboard')
            .select(`
              id, score, games_played,
              profiles(username, avatar_url)
            `)
            .order('score', { ascending: false })
            .limit(50);
            
          if (error) throw error;
          
          setRanking(data.map((d: any) => ({
            id: d.id,
            score: d.score,
            games_played: d.games_played,
            username: (d.profiles as any)?.username || 'Desconhecido',
            avatar_url: (d.profiles as any)?.avatar_url || '/7mz-logo.jpg'
          })));

        } else if (activeTab === 'NERD HITS') {
          // Use Postgres View for Nerd Hits specific
          const { data, error } = await supabase
            .from('ranking_nerdhits')
            .select('*')
            .order('score', { ascending: false })
            .limit(50);
            
          if (error) throw error;
          setRanking(data as RankedPlayer[]);

        } else if (activeTab === '7MZ RECORDS') {
          // Use Postgres View for 7MZ Records
          const { data, error } = await supabase
            .from('ranking_7mzrecords')
            .select('*')
            .order('score', { ascending: false })
            .limit(50);
            
          if (error) throw error;
          setRanking(data as RankedPlayer[]);
        }
      } catch (err) {
        console.error('Error fetching rankings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [activeTab]);

  const top3 = ranking.slice(0, 3);
  const others = ranking.slice(3);

  // Always force [2nd, 1st, 3rd] structure to keep visual layout balanced even if missing players
  const podiumArray = [
    { player: top3[1], rankPos: 2, spotClass: styles.second },
    { player: top3[0], rankPos: 1, spotClass: styles.first },
    { player: top3[2], rankPos: 3, spotClass: styles.third },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.orbOrange} />
      <div className={styles.orbBlue} />

      {/* Header */}
      <header className={styles.header}>
        <Link href="/" className={styles.backBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <div className={styles.logoHeader}>
          <Image src="/7mz-logo.jpg" alt="7MZ" width={36} height={36} className={styles.logoHeaderImg} />
          <h1 className={styles.logo}>7MZ <span>ARENA</span></h1>
        </div>
      </header>

      <main className={styles.main}>
        <motion.h2 
          className={styles.pageTitle}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          HALL DA FAMA
        </motion.h2>
        <p className={styles.pageSubtitle}>Eternizados pelo talento. Compare sua posição global.</p>

        {/* Filters */}
        <div className={styles.tabsContainer}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'GERAL' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('GERAL')}
          >
            GLOBAL
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'NERD HITS' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('NERD HITS')}
          >
            Nerd Hits
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === '7MZ RECORDS' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('7MZ RECORDS')}
          >
            Records
          </button>
        </div>

        {loading ? (
          <div className={styles.loadingSpinner} />
        ) : ranking.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum jogador pontuou nesta categoria ainda.</p>
        ) : (
          <>
            {/* Podium (Top 3) */}
            <div className={styles.podiumContainer}>
              {podiumArray.map((spot, idx) => {
                const { player, rankPos, spotClass } = spot;
                
                if (!player) {
                  return <div key={`empty-${rankPos}`} className={`${styles.podiumSpot} ${spotClass}`} />;
                }

                return (
                  <motion.div 
                    key={player.id}
                    className={`${styles.podiumSpot} ${spotClass}`}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: rankPos * 0.1, type: 'spring' }}
                  >
                    {rankPos === 1 && <span className={styles.podiumCrown}>👑</span>}
                    <div className={styles.podiumAvatarWrap}>
                      <Image 
                        src={player.avatar_url || '/7mz-logo.jpg'} 
                        alt={player.username}
                        width={rankPos === 1 ? 86 : 70} 
                        height={rankPos === 1 ? 86 : 70} 
                        className={styles.podiumAvatar}
                      />
                      <div className={styles.podiumRing} />
                    </div>
                    <div className={styles.podiumStep}>
                      <div className={styles.podiumName}>{player.username}</div>
                      <div className={styles.podiumScore}>{player.score.toLocaleString()}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Rest of the Ranking */}
            {others.length > 0 && (
              <div className={styles.rankingList}>
                {others.map((player, idx) => {
                  const actualRank = idx + 4;
                  return (
                    <motion.div 
                      key={player.id} 
                      className={styles.rankItem}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 + (idx * 0.05) }}
                    >
                      <span className={styles.rankNumber}>#{actualRank}</span>
                      <div className={styles.rankItemUser}>
                        <Image 
                          src={player.avatar_url || '/7mz-logo.jpg'} 
                          alt={player.username}
                          width={40} height={40} 
                          className={styles.rankItemAvatar} 
                        />
                        <span className={styles.rankItemName}>{player.username}</span>
                      </div>
                      <span className={styles.rankItemScore}>{player.score.toLocaleString()} pts</span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
