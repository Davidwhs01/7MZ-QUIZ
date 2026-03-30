'use client';

import { useState, useEffect, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import styles from './LoginProfileCard.module.css';

interface ProfileInfo {
  username: string;
  avatar_url: string;
}

interface UserStats {
  score: number;
  games_played: number;
}

export default function LoginProfileCard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    const fetchSessionData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (cancelled) return;

        if (session?.user) {
          setUser(session.user);

          const { data: publicProfile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', session.user.id)
            .single();

          if (!cancelled && publicProfile) setProfileInfo(publicProfile as ProfileInfo);

          const { data: statData } = await supabase
            .from('leaderboard')
            .select('score, games_played')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!cancelled && statData) setStats(statData as UserStats);
        } else {
          setUser(null);
          setStats(null);
          setProfileInfo(null);
        }
      } catch (e) {
        console.error("Session fetch error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSessionData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string) => {
        if (event === 'INITIAL_SESSION') return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setStats(null);
          setProfileInfo(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          fetchSessionData();
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogin = async (provider: 'discord' | 'google') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className={styles.loadingContent}>
        <div className={styles.loadingAvatar} />
        <div className={styles.loadingTextWrap}>
          <div className={styles.loadingBar} />
          <div className={styles.loadingBarSmall} />
        </div>
      </div>
    );
  }

  if (user) {
    const avatarSrc = profileInfo?.avatar_url
      || user.user_metadata.avatar_url
      || user.user_metadata.picture
      || '/7mz-logo.jpg';
    const displayName = profileInfo?.username
      || user.user_metadata.custom_claims?.global_name
      || user.user_metadata.full_name
      || 'Jogador';

    return (
      <div className={styles.loggedInContent}>
        <Link href="/profile" className={styles.avatarLink}>
          <Image
            src={avatarSrc}
            alt={displayName}
            width={56}
            height={56}
            className={styles.avatarImg}
          />
          <div className={styles.avatarRing} />
        </Link>
        <div className={styles.loginText}>
          <Link href="/profile" className={styles.usernameLink}>
            <h4 className={styles.username}>{displayName}</h4>
          </Link>
          <div className={styles.userMeta}>
            <span className={styles.userPoints}>
              {stats ? `${stats.score.toLocaleString()} pts` : '0 pts'}
            </span>
            <span className={styles.metaDot}>•</span>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loggedOutContent}>
      <div className={styles.guestRow}>
        <div className={styles.guestAvatar}>
          <Image src="/7mz-logo.jpg" alt="Avatar" width={56} height={56} className={styles.guestAvatarImg} />
          <div className={styles.guestAvatarRing} />
        </div>
        <div className={styles.guestText}>
          <h4 className={styles.guestTitle}>Acesse sua conta</h4>
          <p className={styles.guestDesc}>Participe do ranking</p>
        </div>
      </div>

      <div className={styles.loginButtons}>
        <button onClick={() => handleLogin('discord')} className={`${styles.loginBtn} ${styles.discordBtn}`}>
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles.loginBtnIcon}>
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          ENTRAR COM DISCORD
        </button>

        <button onClick={() => handleLogin('google')} className={`${styles.loginBtn} ${styles.googleBtn}`}>
          <svg viewBox="0 0 24 24" className={styles.loginBtnIcon} xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          ENTRAR COM GOOGLE
        </button>
      </div>
    </div>
  );
}
