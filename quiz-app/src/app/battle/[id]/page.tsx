'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useBattle } from '@/hooks/useBattle';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { useChannel } from '@/context/ChannelContext';
import { sfx } from '@/lib/audio-effects';
import SearchBar from '@/components/game/SearchBar';
import { type Song } from '@/data/songs';
import styles from './battle.module.css';

export default function BattlePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.id as string;
  const { activeChannel } = useChannel();

  const {
    state, room, playerNum, isHost, error,
    startGame, submitGuess, nextRound, useHint, leave,
  } = useBattle(roomId, activeChannel);

  const [hintLevel, setHintLevel] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [correctFlash, setCorrectFlash] = useState(false);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [playerNames, setPlayerNames] = useState<{ p1: string; p2: string }>({ p1: 'Jogador 1', p2: 'Jogador 2' });
  const [activeBarHeights, setActiveBarHeights] = useState<number[]>(
    Array.from({ length: 24 }, () => 4)
  );
  const [copied, setCopied] = useState(false);

  const { isPlaying, volume, changeVolume, loadAndPlay, getRealDuration, replay, stop } = useYouTubePlayer('bt-player', {
    onError: (code: number) => {
      if (code === 150 || code === 101 || code === 2) {
        console.warn('YouTube error in battle, skipping...');
      }
    },
  });

  const skipRef = useRef<() => void>(() => {});

  // Fetch player names
  useEffect(() => {
    if (!room) return;
    const supabase = createClient();
    const ids = [room.player1_id, room.player2_id].filter(Boolean) as string[];
    if (ids.length === 0) return;

    supabase
      .from('profiles')
      .select('id, username')
      .in('id', ids)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => {
        const data = res.data as { id: string; username: string }[] | null;
        if (!data) return;
        const map: Record<string, string> = {};
        for (const p of data) map[p.id] = p.username;
        setPlayerNames({
          p1: map[room.player1_id] || 'Jogador 1',
          p2: map[room.player2_id || ''] || 'Aguardando...',
        });
      });
  }, [room]);

  // Play audio when round starts
  useEffect(() => {
    if (state.phase === 'playing' && state.currentSong) {
      setHintLevel(0);
      setHasGuessed(false);
      setShowResult(false);

      const playRound = async () => {
        let ts = state.timestamp;
        // If duration is 0, get real duration
        if (state.currentSong!.duration === 0 && state.battleMode !== 'inferno') {
          const realDur = await getRealDuration(state.currentSong!.youtubeId);
          ts = Math.max(30, Math.floor(Math.random() * (realDur - state.audioDuration - 20)));
        }
        loadAndPlay(state.currentSong!.youtubeId, ts, state.audioDuration);
      };
      playRound();
    }
  }, [state.phase, state.currentSong?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show result overlay when game ends
  useEffect(() => {
    if (state.phase === 'game_over') {
      stop();
      setShowResult(true);
      sfx.playGameOver();
    }
  }, [state.phase, stop]);

  // Show round end feedback
  useEffect(() => {
    if (state.phase === 'round_end') {
      stop();
    }
  }, [state.phase, stop]);

  // Visualizer animation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveBarHeights(prev => prev.map(() => 10 + Math.random() * 35));
    }, 120);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleGuess = useCallback((song: Song) => {
    if (hasGuessed) return;
    setHasGuessed(true);
    stop();

    const isCorrect = song.id === state.currentSong?.id;
    if (isCorrect) {
      setCorrectFlash(true);
      sfx.playCorrect();
      setTimeout(() => setCorrectFlash(false), 1500);
    } else {
      setWrongFlash(true);
      sfx.playWrong();
      setTimeout(() => setWrongFlash(false), 600);
    }

    submitGuess(song.id, hintLevel);
  }, [hasGuessed, state.currentSong, hintLevel, submitGuess, stop]);

  const handleHint = useCallback(() => {
    const hintData = useHint();
    if (hintData) {
      setHintLevel(hintData.hintLevel);
      // Replay with longer duration
      if (state.currentSong) {
        replay(state.currentSong.youtubeId, state.timestamp, hintData.duration);
      }
    }
  }, [useHint, state.currentSong, state.timestamp, replay]);

  const handleReplay = useCallback(() => {
    if (state.currentSong) {
      const duration = state.battleMode === 'inferno' ? 10 : [5, 10, 15][Math.min(hintLevel, 2)];
      replay(state.currentSong.youtubeId, state.timestamp, duration);
    }
  }, [state.currentSong, state.timestamp, hintLevel, state.battleMode, replay]);

  const handleNextRound = useCallback(() => {
    if (!isHost) return;
    nextRound();
  }, [isHost, nextRound]);

  const handleLeave = useCallback(async () => {
    await leave();
    router.push('/battle');
  }, [leave, router]);

  const handleCopyCode = useCallback(() => {
    if (room) {
      navigator.clipboard.writeText(room.room_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [room]);

  const myScore = playerNum === 1 ? state.player1Score : state.player2Score;
  const myLives = playerNum === 1 ? state.player1Lives : state.player2Lives;
  const oppScore = playerNum === 1 ? state.player2Score : state.player1Score;
  const oppLives = playerNum === 1 ? state.player2Lives : state.player1Lives;
  const iGotItRight = playerNum === 1 ? state.player1Correct : state.player2Correct;
  const oppGotItRight = playerNum === 1 ? state.player2Correct : state.player1Correct;

  const canGuess = state.phase === 'playing' && !hasGuessed;
  const canUseHint = state.battleMode === 'normal' && hintLevel < 2 && state.phase === 'playing' && !hasGuessed;

  const myName = playerNum === 1 ? playerNames.p1 : playerNames.p2;
  const oppName = playerNum === 1 ? playerNames.p2 : playerNames.p1;

  return (
    <div className={styles.page} suppressHydrationWarning>
      <div id="bt-player" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} suppressHydrationWarning />
      <div className={styles.orbOrange} />
      <div className={styles.orbBlue} />

      {/* Header: Players */}
      <header className={styles.header}>
        <button onClick={handleLeave} className={styles.backBtn} title="Sair da batalha">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div className={styles.playersRow}>
          {/* Me */}
          <div className={`${styles.playerCard} ${styles.playerCardSelf}`}>
            <div className={styles.playerInfo}>
              <span className={styles.playerName}>
                {myName} {isHost ? '👑' : ''}
              </span>
              <div className={styles.playerStats}>
                <span className={styles.playerScore}>{myScore} pts</span>
                <div className={styles.livesRow}>
                  {[1, 2, 3].map(i => (
                    <span key={i} className={`${styles.lifeHeart} ${i > myLives ? styles.lifeLost : ''}`}>
                      ❤️
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <span className={styles.scoreVS}>VS</span>

          {/* Opponent */}
          <div className={styles.playerCard}>
            <div className={styles.playerInfo}>
              <span className={styles.playerName}>
                {oppName} {!isHost ? '👑' : ''}
                {oppGotItRight && state.phase === 'playing' && ' ✅'}
              </span>
              <div className={styles.playerStats}>
                <span className={styles.playerScore}>{oppScore} pts</span>
                <div className={styles.livesRow}>
                  {[1, 2, 3].map(i => (
                    <span key={i} className={`${styles.lifeHeart} ${i > oppLives ? styles.lifeLost : ''}`}>
                      ❤️
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.roundBadge}>
          {state.battleMode === 'inferno' ? '🔥 INFERNO' : '⚡ NORMAL'} • Rodada {state.currentRound}/{state.totalRounds}
        </div>
      </header>

      {/* Main Area */}
      <main className={styles.main}>
        {/* Error */}
        {error && (
          <div style={{ color: '#ef4444', textAlign: 'center' }}>
            {error}
            <Link href="/battle" style={{ display: 'block', marginTop: 12, color: 'var(--accent-orange)' }}>
              Voltar
            </Link>
          </div>
        )}

        {/* Loading */}
        {state.phase === 'loading' && !error && (
          <div className={styles.waitingScreen}>
            <div className={styles.waitingDots}>Carregando...</div>
          </div>
        )}

        {/* Waiting for opponent */}
        {state.phase === 'waiting' && room && (
          <div className={styles.waitingScreen}>
            <h2 className={styles.waitingTitle}>Aguardando Oponente</h2>
            <div className={styles.roomCode}>{room.room_code}</div>
            <button className={styles.copyBtn} onClick={handleCopyCode}>
              {copied ? '✅ Copiado!' : '📋 Copiar Código'}
            </button>
            <div className={styles.waitingDots}>Aguardando jogador...</div>
            <p className={styles.waitingHint}>
              Compartilhe o código com seu oponente para que ele entre na sala.
            </p>
            <button className={styles.cancelBtn} onClick={handleLeave}>
              Cancelar
            </button>
          </div>
        )}

        {/* Countdown */}
        {state.phase === 'countdown' && (
          <div className={styles.countdownScreen}>
            <motion.div
              key={state.message}
              className={styles.countdownNumber}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {state.message.replace('Começando em ', '').replace('...', '')}
            </motion.div>
          </div>
        )}

        {/* Playing / Round End */}
        {(state.phase === 'playing' || state.phase === 'round_end') && state.currentSong && (
          <div className={`${styles.playingScreen} ${correctFlash ? '' : ''} ${wrongFlash ? '' : ''}`}>
            <div className={styles.roundLabel}>
              RODADA {state.currentRound} {iGotItRight && '✅'}
            </div>

            {/* Visualizer */}
            <div className={styles.visualizerContainer}>
              <div className={styles.visualizerLabel}>
                {isPlaying ? '♪ TOCANDO...' : '♪ PAUSADO'}
              </div>
              <div className={styles.visualizer}>
                {activeBarHeights.map((h, i) => (
                  <div
                    key={i}
                    className={styles.bar}
                    style={{
                      height: isPlaying ? `${h}px` : '3px',
                      opacity: isPlaying ? 1 : 0.3,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className={styles.controlsRow}>
              <button
                className={styles.replayBtn}
                onClick={handleReplay}
                disabled={isPlaying || hasGuessed}
              >
                ⟳ Repetir
              </button>
              {canUseHint && (
                <button className={styles.hintBtn} onClick={handleHint}>
                  💡 Dica ({hintLevel + 1}/2)
                </button>
              )}
            </div>

            {/* Info bar */}
            <div className={styles.infoBar}>
              <span>
                {state.battleMode === 'inferno' ? '10s' : ['5s', '10s', '15s'][hintLevel]} de áudio
              </span>
              <span>
                Vale <span className={styles.pointsValue}>
                  {state.battleMode === 'inferno' ? 100 : [100, 60, 30][hintLevel]}
                </span> pts
              </span>
            </div>

            {/* Search Bar */}
            <SearchBar
              onSelect={handleGuess}
              disabled={!canGuess}
              placeholder={hasGuessed ? 'Aguardando rodada acabar...' : 'Qual música está tocando?'}
            />

            {/* Round end: show next round button for host */}
            {state.phase === 'round_end' && isHost && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleNextRound}
                style={{
                  padding: '12px 32px',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--accent-orange)',
                  color: '#000',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                {state.currentRound >= state.totalRounds ? 'VER RESULTADO' : 'PRÓXIMA RODADA →'}
              </motion.button>
            )}

            {state.phase === 'round_end' && !isHost && (
              <div className={styles.waitingDots}>Aguardando host...</div>
            )}
          </div>
        )}

        {/* Game Over Overlay */}
        <AnimatePresence>
          {showResult && state.phase === 'game_over' && (
            <motion.div
              className={styles.resultOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className={styles.resultCard}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className={styles.resultIcon}>
                  {state.message.includes('Você venceu') || (playerNum === 1 && state.player1Score > state.player2Score) || (playerNum === 2 && state.player2Score > state.player1Score)
                    ? '🏆' : state.message.includes('desconectou') ? '👋' : '⚔️'}
                </div>
                <h2 className={styles.resultTitle}>
                  {state.message || 'Fim de Jogo'}
                </h2>
                <div className={styles.resultScores}>
                  <div className={styles.resultPlayer}>
                    <span className={styles.resultPlayerLabel}>{myName}</span>
                    <span className={styles.resultPlayerScore} style={{ color: 'var(--accent-orange)' }}>
                      {myScore}
                    </span>
                  </div>
                  <div className={styles.resultPlayer}>
                    <span className={styles.resultPlayerLabel}>{oppName}</span>
                    <span className={styles.resultPlayerScore} style={{ color: 'var(--accent-blue)' }}>
                      {oppScore}
                    </span>
                  </div>
                </div>
                <div className={styles.resultActions}>
                  <button className={styles.leaveBtn} onClick={handleLeave}>
                    Sair
                  </button>
                  <Link href="/" className={styles.leaveBtn}>
                    Início
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
