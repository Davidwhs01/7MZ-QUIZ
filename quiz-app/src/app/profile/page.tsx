'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';

type UserProfile = {
  id: string;
  email: string | undefined;
  username: string;
  avatar_url: string;
  score: number;
  games_played: number;
};

type MatchHistory = {
  id: string;
  score: number;
  mode: string;
  created_at: string;
};

type Identity = {
  id: string;
  provider: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<MatchHistory[]>([]);
  const [identities, setIdentities] = useState<Identity[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        router.push('/');
        return;
      }
      
      const user = session.user;
      const metadata = user.user_metadata;
      
      // 1. Get user identities (connected accounts)
      const { data: idData, error: idError } = await supabase.auth.getUserIdentities();
      if (!idError && idData) {
        setIdentities(idData.identities.map(i => ({ id: i.id, provider: i.provider })));
      }

      // 2. Get leaderboard stats
      const { data: leaderData } = await supabase
        .from('leaderboard')
        .select('score, games_played')
        .eq('id', user.id)
        .single();
        
      setProfile({
        id: user.id,
        email: user.email,
        username: metadata.custom_claims?.global_name || metadata.full_name || metadata.name || 'Jogador',
        avatar_url: metadata.avatar_url || metadata.picture || '/7mz-logo.jpg',
        score: leaderData?.score || 0,
        games_played: leaderData?.games_played || 0
      });

      // 3. Get recent match history
      const { data: historyData } = await supabase
        .from('match_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (historyData) setHistory(historyData);
      
      setLoading(false);
    };

    fetchUserData();
  }, [router]);

  const handleLinkIdentity = async (provider: 'google' | 'discord') => {
    setLinking(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase.auth.linkIdentity({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) {
        alert("Erro ao vincular conta: " + error.message);
        setLinking(false);
      }
      // Redirect happens automatically on success
    } catch (e) {
      console.error("Link error:", e);
      setLinking(false);
    }
  };

  const hasDiscord = identities.some(i => i.provider === 'discord');
  const hasGoogle = identities.some(i => i.provider === 'google');

  if (loading) {
    return (
      <div className={styles.page}>
         <div className={styles.loadingSpinner} />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className={styles.page}>
      <div className={styles.orbOrange} />
      <div className={styles.orbBlue} />

      <header className={styles.header}>
        <Link href="/" className={styles.backBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800 }}>MEU PERFIL</div>
      </header>

      <main className={styles.main}>
        {/* Profile Stats Card */}
        <motion.div 
          className={styles.profileCard}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className={styles.avatarWrap}>
            <Image 
              src={profile.avatar_url} 
              alt="Avatar" 
              width={100} 
              height={100} 
              className={styles.avatar} 
            />
          </div>
          <h1 className={styles.username}>{profile.username}</h1>
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <div className={styles.statValue}>{profile.score.toLocaleString()}</div>
              <div className={styles.statLabel}>Pontos Ganhos</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statValue}>{profile.games_played}</div>
              <div className={styles.statLabel}>Partidas Jogadas</div>
            </div>
          </div>
        </motion.div>

        {/* Account Connections */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Contas Vinculadas
          </h2>
          <div className={styles.connectionsCard}>
            
            {/* Discord */}
            <div className={styles.connectionItem}>
              <div className={styles.connectionInfo}>
                <svg viewBox="0 0 24 24" fill="#5865F2" width="24" height="24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                </svg>
                <span className={styles.connectionName}>Discord</span>
              </div>
              {hasDiscord ? (
                 <div className={styles.connectedBadge}>✓ Vinculado</div>
              ) : (
                <button 
                  onClick={() => handleLinkIdentity('discord')}
                  disabled={linking}
                  className={`${styles.btnLink} ${styles.btnDiscord}`}
                >
                  {linking ? 'Conectando...' : 'Vincular conta'}
                </button>
              )}
            </div>

            {/* Google */}
            <div className={styles.connectionItem}>
              <div className={styles.connectionInfo}>
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className={styles.connectionName}>Google</span>
              </div>
              {hasGoogle ? (
                 <div className={styles.connectedBadge}>✓ Vinculado</div>
              ) : (
                <button 
                  onClick={() => handleLinkIdentity('google')}
                  disabled={linking}
                  className={`${styles.btnLink} ${styles.btnGoogle}`}
                >
                  {linking ? 'Conectando...' : 'Vincular conta'}
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Match History */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <polyline points="12 8 12 12 14 14" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            Histórico Recente
          </h2>
          
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Você ainda não jogou nenhuma partida.</p>
          ) : (
            <div className={styles.historyList}>
              {history.map((match, idx) => (
                <motion.div 
                  key={match.id} 
                  className={styles.historyItem}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className={styles.historyDetails}>
                    <span className={styles.historyMode}>{match.mode}</span>
                    <span className={styles.historyDate}>
                      {new Date(match.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={styles.historyScore}>
                    +{match.score}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
