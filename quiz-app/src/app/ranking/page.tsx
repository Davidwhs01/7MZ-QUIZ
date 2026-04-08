'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';
import { useChannel } from '@/context/ChannelContext';
import { SECTIONS, AppSection, isValidSection } from '@/data/sections';

interface RankedPlayer {
  id: string;
  score: number;
  games_played: number;
  username: string;
  avatar_url: string;
}

type RankTab = 'GLOBAL' | '7MZ' | 'ENYGMA' | 'MELANIE';

export default function RankingPage() {
  const params = useParams();
  const router = useRouter();
  const sectionParam = params.section as string;
  const section: AppSection = isValidSection(sectionParam) ? sectionParam : 'geek';
  const sectionConfig = SECTIONS[section];
  
  const { activeChannel } = useChannel();
  const [activeTab, setActiveTab] = useState<RankTab>('GLOBAL');
  const [ranking, setRanking] = useState<RankedPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveTab('GLOBAL');
  }, [activeChannel]);

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      const supabase = createClient();

      try {
        if (activeTab === 'GLOBAL') {
          const { data, error } = await supabase
            .from('leaderboard')
            .select(`
              id, score, games_played,
              profiles(username, avatar_url)
            `)
            .order('score', { ascending: false })
            .limit(50);

          if (error) throw error;

          setRanking(data.map((d: Record<string, unknown>) => ({
            id: d.id as string,
            score: d.score as number,
            games_played: d.games_played as number,
            username: ((d.profiles as Record<string, unknown>)?.username as string) || 'Desconhecido',
            avatar_url: ((d.profiles as Record<string, unknown>)?.avatar_url as string) || '/7mz-logo.jpg'
          })));

        } else {
          // By artist: highscore from match_history grouped by user
          const { data, error } = await supabase
            .from('match_history')
            .select(`
              user_id,
              score,
              profiles(username, avatar_url)
            `)
            .eq('artist', activeTab)
            .order('score', { ascending: false });

          if (error) throw error;

          // Group by user, keep highest score and count games
          const userMap = new Map<string, RankedPlayer>();
          for (const row of (data as Record<string, unknown>[])) {
            const uid = row.user_id as string;
            const score = row.score as number;
            const profile = row.profiles as Record<string, unknown> | null;
            const existing = userMap.get(uid);

            if (!existing || score > existing.score) {
              userMap.set(uid, {
                id: uid,
                score,
                games_played: existing ? existing.games_played + 1 : 1,
                username: (profile?.username as string) || 'Desconhecido',
                avatar_url: (profile?.avatar_url as string) || '/7mz-logo.jpg'
              });
            } else if (existing) {
              existing.games_played++;
            }
          }

          const sorted = Array.from(userMap.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 50);

          setRanking(sorted);
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

  const podiumArray = [
    { player: top3[1], rankPos: 2, spotClass: styles.second },
    { player: top3[0], rankPos: 1, spotClass: styles.first },
    { player: top3[2], rankPos: 3, spotClass: styles.third },
  ];

  const tabs: { key: RankTab; label: string }[] = activeChannel === '7MZ'
    ? [
        { key: 'GLOBAL', label: 'GLOBAL' },
        { key: '7MZ', label: '7 MINUTOZ' },
      ]
    : [
        { key: 'GLOBAL', label: 'GLOBAL' },
        { key: 'ENYGMA', label: 'ENYGMA' },
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
          {activeChannel === '7MZ' && (
            <Image src="/7mz-logo.jpg" alt="7MZ Logo" width={36} height={36} className={styles.logoHeaderImg} />
          )}
          {activeChannel === 'ENYGMA' && (
            <Image src="/enygma-logo.jpg" alt="Enygma Logo" width={36} height={36} className={styles.logoHeaderImg} />
          )}
          {activeChannel === 'MELANIE' && (
            <Image src="/Melanie-Logo.jpg" alt="Melanie Logo" width={36} height={36} className={styles.logoHeaderImg} />
          )}
          <h1 className={styles.logo}>
            {activeChannel === '7MZ' ? '7 MINUTOZ' : activeChannel === 'MELANIE' ? 'MELANIE' : activeChannel === 'RODRIGOZIN' ? 'RODRIGO ZIN' : 'ENYGMA'} <span>ARENA</span>
          </h1>
          <Link href={`/${section}`} className={styles.sectionLink}>
            {section === 'geek' ? '← GEEK' : '← STUDIO'}
          </Link>
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

        {/* Tabs */}
        <div className={styles.tabsContainer}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.loadingSpinner} />
        ) : ranking.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum jogador pontuou nesta categoria ainda.</p>
        ) : (
          <>
            {/* Podium (Top 3) */}
            <div className={styles.podiumContainer}>
              {podiumArray.map((spot) => {
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
