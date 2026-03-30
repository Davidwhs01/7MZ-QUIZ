'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { createRoom, joinRoom } from '@/utils/supabase/battle';
import { useChannel } from '@/context/ChannelContext';
import { songs, type SongCategory } from '@/data/songs';
import type { Session } from '@supabase/supabase-js';
import styles from './battle.module.css';

type BattleMode = 'normal' | 'inferno';

export default function BattleHub() {
  const router = useRouter();
  const { activeChannel } = useChannel();

  const [session, setSession] = useState<Session | null>(null);
  const [selectedMode, setSelectedMode] = useState<BattleMode>('normal');
  const [selectedArtist, setSelectedArtist] = useState<SongCategory>(
    activeChannel === 'ENYGMA' ? 'ENYGMA' : 'NERD HITS'
  );
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeGame, setActiveGame] = useState<{ id: string; code: string } | null>(null);

  const isLoggedIn = session !== null;

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createClient().auth.getSession().then((res: any) => {
      setSession(res.data.session);
    });
  }, []);

  // Check for existing active game
  useEffect(() => {
    if (!isLoggedIn) return;
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('game_rooms')
        .select('id, room_code')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .in('status', ['waiting', 'playing'])
        .limit(1);
      if (data && data.length > 0) {
        setActiveGame({ id: data[0].id, code: data[0].room_code });
      }
    };
    check();
  }, [isLoggedIn]);

  // Update artist when channel changes
  useEffect(() => {
    setSelectedArtist(activeChannel === 'ENYGMA' ? 'ENYGMA' : 'NERD HITS');
  }, [activeChannel]);

  const artistOptions: { key: SongCategory; label: string }[] = activeChannel === '7MZ'
    ? [
        { key: 'NERD HITS', label: 'NERD HITS' },
        { key: '7MZ RECORDS', label: '7MZ RECORDS' },
      ]
    : [{ key: 'ENYGMA', label: 'ENYGMA' }];

  const handleCreate = useCallback(async () => {
    setLoading(true);
    setError('');
    const { room, error: err } = await createRoom(selectedMode);
    if (err || !room) {
      setError(err || 'Erro ao criar sala');
      setLoading(false);
      return;
    }
    router.push(`/battle/${room.id}`);
  }, [selectedMode, router]);

  const handleJoin = useCallback(async () => {
    if (roomCode.length < 4) return;
    setLoading(true);
    setError('');
    const { room, error: err } = await joinRoom(roomCode);
    if (err || !room) {
      setError(err || 'Sala não encontrada');
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
          <h1 className={styles.logo}>MULTIPLAYER <span>HUB</span></h1>
        </header>
        <div className={styles.loginRequired}>
          <p>Faça login para acessar o modo multiplayer!</p>
          <Link href="/">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.orbOrange} />
      <div className={styles.orbBlue} />
      <div className={styles.orbPurple} />

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
          <h1 className={styles.logo}>MULTIPLAYER <span>HUB</span></h1>
        </div>
      </header>

      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroBadge}>⚔️ JOGO ONLINE</div>
          <h2 className={styles.heroTitle}>ARENA <span>MULTIPLAYER</span></h2>
          <p className={styles.heroSub}>Desafie seus amigos em batalhas de conhecimento geek</p>
        </div>

        {/* Active Game */}
        {activeGame && (
          <Link href={`/battle/${activeGame.id}`} className={styles.activeBanner}>
            <span className={styles.activeBannerIcon}>🎮</span>
            <div className={styles.activeBannerInfo}>
              <div className={styles.activeBannerTitle}>Partida em andamento</div>
              <div className={styles.activeBannerDesc}>Sala {activeGame.code} • Clique para voltar</div>
            </div>
            <span className={styles.activeBannerArrow}>→</span>
          </Link>
        )}

        {/* Mode Selection */}
        <div>
          <div className={styles.sectionLabel}>Modo de Jogo</div>
          <div className={styles.modeGrid}>
            <div
              className={`${styles.modeCard} ${styles.modeCardActive}`}
            >
              <span className={styles.modeCardEmoji}>⚔️</span>
              <div className={styles.modeCardInfo}>
                <div className={styles.modeCardName}>Batalha 1v1</div>
                <div className={styles.modeCardDesc}>5 rodadas • 3 vidas • Quem somar mais pontos vence</div>
              </div>
              <span className={`${styles.modeCardBadge} ${styles.badgeReady}`}>PRONTO</span>
            </div>

            <div className={`${styles.modeCard} ${styles.modeCardLocked}`}>
              <span className={styles.modeCardEmoji}>🏆</span>
              <div className={styles.modeCardInfo}>
                <div className={styles.modeCardName}>Torneio</div>
                <div className={styles.modeCardDesc}>Eliminatório com 4, 8 ou 16 jogadores</div>
              </div>
              <span className={`${styles.modeCardBadge} ${styles.badgeSoon}`}>EM BREVE</span>
            </div>
          </div>
        </div>

        {/* Setup Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key="setup"
            className={styles.setupPanel}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Artist */}
            <div>
              <div className={styles.sectionLabel} style={{ marginBottom: 8 }}>Artista</div>
              <div className={styles.artistRow}>
                {artistOptions.map(opt => (
                  <button
                    key={opt.key}
                    className={`${styles.artistBtn} ${selectedArtist === opt.key ? styles.artistBtnActive : ''}`}
                    onClick={() => setSelectedArtist(opt.key)}
                  >
                    <span className={styles.artistBtnName}>{opt.label}</span>
                    <span className={styles.artistBtnCount}>
                      {songs.filter(s => s.category === opt.key).length} músicas
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <div className={styles.sectionLabel} style={{ marginBottom: 8 }}>Dificuldade</div>
              <div className={styles.diffRow}>
                <button
                  className={`${styles.diffBtn} ${selectedMode === 'normal' ? styles.diffBtnActive : ''}`}
                  onClick={() => setSelectedMode('normal')}
                >
                  <span className={styles.diffBtnName}>⚡ Normal</span>
                  <span className={styles.diffBtnTag}>Com dicas e bônus de velocidade</span>
                </button>
                <button
                  className={`${styles.diffBtn} ${selectedMode === 'inferno' ? styles.diffBtnActive : ''}`}
                  onClick={() => setSelectedMode('inferno')}
                >
                  <span className={styles.diffBtnName}>🔥 Inferno</span>
                  <span className={styles.diffBtnTag}>10s fixo • Sem dicas</span>
                </button>
              </div>
            </div>

            {/* Create */}
            <button
              className={styles.createBtn}
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? 'CRIANDO...' : '⚔️ CRIAR SALA'}
            </button>

            {/* Join */}
            <div className={styles.divider}>ou entre com código</div>
            <div className={styles.joinRow}>
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
                ENTRAR
              </button>
            </div>

            {error && <div className={styles.error}>{error}</div>}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
