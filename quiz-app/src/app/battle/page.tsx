'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { createRoom, joinRoom } from '@/utils/supabase/battle';
import { useChannel } from '@/context/ChannelContext';
import type { Session } from '@supabase/supabase-js';
import styles from './battle.module.css';

export default function BattleLobby() {
  const router = useRouter();
  const { activeChannel } = useChannel();
  const [mode, setMode] = useState<'normal' | 'inferno'>('normal');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createClient().auth.getSession().then((res: any) => {
      if (!cancelled) setSession(res.data.session);
    });
    return () => { cancelled = true; };
  }, []);

  const isLoggedIn = session !== null;

  // Check if user is already in a room
  useEffect(() => {
    const checkExistingRoom = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('game_rooms')
        .select('id')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .in('status', ['waiting', 'playing'])
        .limit(1);

      if (data && data.length > 0) {
        router.push(`/battle/${data[0].id}`);
      }
    };
    checkExistingRoom();
  }, [router]);

  const handleCreate = useCallback(async () => {
    setLoading(true);
    setError('');
    const { room, error: err } = await createRoom(mode);
    if (err || !room) {
      setError(err || 'Erro ao criar sala');
      setLoading(false);
      return;
    }
    router.push(`/battle/${room.id}`);
  }, [mode, router]);

  const handleJoin = useCallback(async () => {
    if (roomCode.length < 4) return;
    setLoading(true);
    setError('');
    const { room, error: err } = await joinRoom(roomCode);
    if (err || !room) {
      setError(err || 'Erro ao entrar na sala');
      setLoading(false);
      return;
    }
    router.push(`/battle/${room.id}`);
  }, [roomCode, router]);

  if (!isLoggedIn) {
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
          <h1 className={styles.logo}>BATALHA <span>ARENA</span></h1>
        </header>
        <div className={styles.content}>
          <div className={styles.loginRequired}>
            <p>Faça login para jogar no modo Batalha!</p>
            <Link href="/" style={{ color: 'var(--accent-orange)', marginTop: 12, display: 'inline-block' }}>
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
        <div className={styles.logoHeader}>
          {activeChannel === '7MZ' ? (
            <Image src="/7mz-logo.jpg" alt="7MZ" width={36} height={36} className={styles.logoHeaderImg} />
          ) : (
            <Image src="/enygma-logo.png" alt="Enygma" width={36} height={36} className={styles.logoHeaderImg} />
          )}
          <h1 className={styles.logo}>BATALHA <span>ARENA</span></h1>
        </div>
      </header>

      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className={styles.title}>Modo Batalha</h2>
          <p className={styles.subtitle}>5 rodadas • 3 vidas • Quem tiver mais pontos vence</p>
        </div>

        {/* Mode Selector */}
        <div className={styles.modeSelector}>
          <button
            className={`${styles.modeBtn} ${mode === 'normal' ? styles.modeBtnActive : ''}`}
            onClick={() => setMode('normal')}
          >
            <span className={styles.modeBtnName}>NORMAL</span>
            <span className={styles.modeBtnDesc}>Com dicas e bônus de velocidade</span>
          </button>
          <button
            className={`${styles.modeBtn} ${mode === 'inferno' ? styles.modeBtnActive : ''}`}
            onClick={() => setMode('inferno')}
          >
            <span className={styles.modeBtnName}>INFERNO</span>
            <span className={styles.modeBtnDesc}>10s fixo • Sem dicas</span>
          </button>
        </div>

        {/* Create Room */}
        <div className={styles.createSection}>
          <button
            className={styles.createBtn}
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? 'CRIANDO...' : '⚔️ CRIAR SALA'}
          </button>
        </div>

        <div className={styles.divider}>ou entre em uma sala</div>

        {/* Join Room */}
        <div className={styles.joinSection}>
          <input
            className={styles.codeInput}
            type="text"
            placeholder="CÓDIGO"
            value={roomCode}
            onChange={e => { setRoomCode(e.target.value.toUpperCase()); setError(''); }}
            maxLength={6}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            className={styles.joinBtn}
            onClick={handleJoin}
            disabled={loading || roomCode.length < 4}
          >
            {loading ? 'ENTRANDO...' : '🎮 ENTRAR NA SALA'}
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}
      </motion.div>
    </div>
  );
}
