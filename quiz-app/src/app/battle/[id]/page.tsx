'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { useBattle } from '@/hooks/useBattle';
import { getAudioDuration, generateRandomTimestamp, calculateRoundScore } from '@/lib/game-logic';
import { sfx } from '@/lib/audio-effects';
import SearchBar from '@/components/game/SearchBar';
import Visualizer from '@/components/game/Visualizer';
import { Song, SeloKey, songs } from '@/data/songs';
import styles from '../../play/play.module.css';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useChannel } from '@/context/ChannelContext';
import { createClient } from '@/utils/supabase/client';

export default function BattlePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.id as string;
  const { activeChannel } = useChannel();

  const {
    state,
    room,
    playerNum,
    isHost,
    error,
    submitGuess,
    useHint,
    leave,
  } = useBattle(roomId);

  const skipSongRef = useRef<() => void>(() => {});

  const { isReady, isPlaying, volume, changeVolume, loadAndPlay, getRealDuration, replay, stop } = useYouTubePlayer('yt-player', {
    onError: (errorCode: number) => {
      console.warn(`YouTube error ${errorCode}, skipping to next song...`);
      if (errorCode === 150 || errorCode === 101 || errorCode === 2) {
        setTimeout(() => skipSongRef.current(), 500);
      }
    },
  });
  
  const [showCorrectFeedback, setShowCorrectFeedback] = useState(false);
  const [showWrongFeedback, setShowWrongFeedback] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [floatingPoints, setFloatingPoints] = useState<{ id: number, val: number } | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SeloKey | 'ALL' | null>(null);
  const [isViewingVideo, setIsViewingVideo] = useState(false);
  const [videoData, setVideoData] = useState<{ id: string; start: number } | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [playerNames, setPlayerNames] = useState<{ p1: string; p2: string }>({ p1: 'Jogador 1', p2: 'Jogador 2' });
  const [copied, setCopied] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    setSelectedCategory(null);
  }, [activeChannel]);

  const nextSongDataRef = useRef<{ song: Song; timestamp: number; duration: number } | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef(false);
  const scoreSubmittedRef = useRef(false);
  const categoryRef = useRef<SeloKey | undefined>(undefined);

  useEffect(() => {
    if (!room) return;
    const supabase = createClient();
    const ids = [room.player1_id, room.player2_id].filter(Boolean) as string[];
    if (ids.length === 0) return;

    supabase
      .from('profiles')
      .select('id, username')
      .in('id', ids)
      .then((res: { data: { id: string; username: string }[] | null }) => {
        const data = res.data;
        if (!data) return;
        const map: Record<string, string> = {};
        for (const p of data) map[p.id] = p.username;
        setPlayerNames({
          p1: map[room.player1_id] || 'Jogador 1',
          p2: map[room.player2_id || ''] || 'Aguardando...',
        });
      });
  }, [room]);

  const myScore = playerNum === 1 ? state.player1Score : state.player2Score;
  const myLives = playerNum === 1 ? state.player1Lives : state.player2Lives;
  const oppScore = playerNum === 1 ? state.player2Score : state.player1Score;
  const oppLives = playerNum === 1 ? state.player2Lives : state.player1Lives;
  const iGotItRight = playerNum === 1 ? state.player1Correct : state.player2Correct;
  const oppGotItRight = playerNum === 1 ? state.player2Correct : state.player1Correct;
  const myName = playerNum === 1 ? playerNames.p1 : playerNames.p2;
  const oppName = playerNum === 1 ? playerNames.p2 : playerNames.p1;

  const canGuess = state.phase === 'playing' && !hasGuessed;
  const canUseHint = state.battleMode === 'normal' && hintLevel < 2 && state.phase === 'playing' && !hasGuessed;

  const startNewRound = useCallback(async () => {
    const cat = categoryRef.current;
    const data = { song: state.currentSong, timestamp: state.timestamp, duration: state.audioDuration };
    
    if (!data) return;
    
    loadAndPlay(data.song!.youtubeId, data.timestamp, data.duration);
  }, [loadAndPlay, state]);

  useEffect(() => {
    skipSongRef.current = startNewRound;
  }, [startNewRound]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseVideo();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase === 'playing' && state.currentSong) {
      setHintLevel(0);
      setHasGuessed(false);
      setShowCorrectFeedback(false);
      setShowWrongFeedback(false);
      loadAndPlay(state.currentSong.youtubeId, state.timestamp, state.audioDuration);
    }
  }, [state.phase, state.currentSong?.id]);

  useEffect(() => {
    if (state.phase === 'game_over') {
      stop();
      setShowResult(true);
      sfx.playGameOver();
    }
  }, [state.phase, stop]);

  const handleOpenVideo = useCallback(() => {
    if (!state.currentSong) return;
    
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
    
    const playbackTime = nextSongDataRef.current?.timestamp ?? state.timestamp;
    
    setVideoData({
      id: state.currentSong.youtubeId,
      start: Math.floor(playbackTime)
    });
    
    setShowCorrectFeedback(false);
    setIsViewingVideo(true);
  }, [state.currentSong, state.timestamp]);

  const handleCloseVideo = useCallback(() => {
    setIsViewingVideo(false);
    setVideoData(null);
  }, []);

  const handleStart = () => {
    // Battle starts automatically when both players join
  };

  const handleAnswer = useCallback((song: Song) => {
    if (state.phase !== 'playing' || hasGuessed) return;
    
    setHasGuessed(true);
    stop();
    
    const isCorrect = song.id === state.currentSong?.id;
    
    if (isCorrect) {
      setPointsEarned(100);
      setShowCorrectFeedback(true);
      sfx.playCorrect();
      
      feedbackTimerRef.current = setTimeout(() => {
        setShowCorrectFeedback(false);
      }, 2500);
    } else {
      setShowWrongFeedback(true);
      sfx.playWrong();
      setTimeout(() => setShowWrongFeedback(false), 500);
    }

    submitGuess(song.id, hintLevel);
  }, [state.phase, state.currentSong, hintLevel, submitGuess, stop, hasGuessed]);

  const handleHint = useCallback(() => {
    const hintData = useHint();
    if (hintData && nextSongDataRef.current) {
      replay(
        nextSongDataRef.current.song.youtubeId,
        nextSongDataRef.current.timestamp,
        hintData.duration
      );
      setHintLevel(hintData.hintLevel);
    }
  }, [useHint, replay]);

  const handleReplay = useCallback(() => {
    if (nextSongDataRef.current) {
      const duration = getAudioDuration(hintLevel);
      replay(
        nextSongDataRef.current.song.youtubeId,
        nextSongDataRef.current.timestamp,
        duration
      );
    }
  }, [hintLevel, replay]);

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

  const isOnFire = false;

  return (
    <div 
      className={styles.page} 
      suppressHydrationWarning
    >
      <div 
        id="yt-player" 
        style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }} 
        suppressHydrationWarning
      />
      <div className={styles.orbOrange} />
      <div className={styles.orbBlue} />

      <header className={styles.header}>
        <button onClick={handleLeave} className={styles.backBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, justifyContent: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-orange)' }}>
              {myName} {isHost ? '👑' : ''}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {myScore} pts
            </div>
            <div>
              {[1, 2, 3].map(i => (
                <span key={i} style={{ opacity: i > myLives ? 0.2 : 1, fontSize: '0.6rem' }}>❤️</span>
              ))}
            </div>
          </div>
          
          <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-muted)' }}>VS</span>
          
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {oppName} {!isHost ? '👑' : ''}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {oppScore} pts
            </div>
            <div>
              {[1, 2, 3].map(i => (
                <span key={i} style={{ opacity: i > oppLives ? 0.2 : 1, fontSize: '0.6rem' }}>❤️</span>
              ))}
            </div>
          </div>
        </div>
        
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)' }}>
          {state.battleMode === 'inferno' ? '🔥 INFERNO' : '⚡ NORMAL'} • Rodada {state.currentRound}/{state.totalRounds}
        </div>
      </header>

      <main className={styles.main}>
        {error && (
          <div style={{ color: '#ef4444', textAlign: 'center' }}>
            {error}
            <Link href="/battle" style={{ display: 'block', marginTop: 12, color: 'var(--accent-orange)' }}>
              Voltar
            </Link>
          </div>
        )}

        {state.phase === 'loading' && !error && (
          <div className={styles.loadingScreen}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Carregando...</p>
          </div>
        )}

        {state.phase === 'waiting' && room && (
          <div className={styles.startScreen}>
            <h2 className={styles.modeTitle}>Aguardando Oponente</h2>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-orange)', letterSpacing: '0.1em', margin: '20px 0' }}>
              {room.room_code}
            </div>
            <button 
              onClick={handleCopyCode}
              style={{ padding: '10px 20px', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 20 }}
            >
              {copied ? '✅ Copiado!' : '📋 Copiar Código'}
            </button>
            <div className={styles.waitingDots}>Aguardando jogador...</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', maxWidth: 280, marginTop: 12 }}>
              Compartilhe o código com seu oponente.
            </p>
            <button 
              onClick={handleLeave}
              style={{ marginTop: 20, padding: '10px 24px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        )}

        {state.phase === 'countdown' && (
          <div className={styles.loadingScreen}>
            <motion.div
              key={state.message}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              style={{ fontSize: '5rem', fontWeight: 900, color: 'var(--accent-orange)' }}
            >
              {state.message.replace('Começando em ', '').replace('...', '')}
            </motion.div>
          </div>
        )}

        {(state.phase === 'playing' || state.phase === 'round_end') && state.currentSong && (
          <div className={`${styles.playingScreen} ${isOnFire ? styles.onFire : ''} ${showCorrectFeedback ? styles.correctFlash : ''} ${showWrongFeedback ? styles.wrongFlash : ''}`}>
            <div className={styles.roundHeader}>
              <span className={styles.roundNumber}>RODADA {state.currentRound}</span>
              {iGotItRight && <span style={{ marginLeft: 8 }}>✅</span>}
              <div className={styles.hintDots}>
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className={`${styles.hintDot} ${i < hintLevel ? styles.hintDotUsed : ''} ${i === hintLevel && i < 2 ? styles.hintDotNext : ''}`}
                  />
                ))}
              </div>
            </div>

            <div className={styles.visualizerContainer}>
              <Visualizer isPlaying={isPlaying} barCount={28} minHeight={15} maxHeight={60} />
            </div>

            <div className={styles.controlsRow}>
              <div className={styles.volumeControl}>
                <button
                  className={styles.volumeBtn}
                  onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                  title="Ajustar volume"
                >
                  {volume === 0 ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/>
                    </svg>
                  ) : volume < 50 ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  )}
                </button>
                {showVolumeSlider && (
                  <div className={styles.volumeSliderWrap}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => changeVolume(Number(e.target.value))}
                      className={styles.volumeSlider}
                    />
                    <span className={styles.volumeValue}>{volume}%</span>
                  </div>
                )}
              </div>

              <button
                className={styles.replayBtn}
                onClick={handleReplay}
                disabled={isPlaying || state.phase !== 'playing'}
                title="Ouvir novamente"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor" stroke="none" />
                </svg>
                <span>Repetir</span>
              </button>

              {canUseHint && (
                <button
                  className={styles.hintBtn}
                  onClick={handleHint}
                >
                  <span className={styles.hintIcon}>💡</span>
                  <span>Dica ({hintLevel + 1}/2)</span>
                  <span className={styles.hintCost}>
                    {hintLevel === 0 ? '-40 pts' : '-30 pts'}
                  </span>
                </button>
              )}
            </div>

            <div className={styles.infoBar}>
              <div className={styles.durationIndicator}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" opacity="0.5">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15V7l6 5-6 5z"/>
                </svg>
                <span>{hintLevel === 0 ? '5s' : hintLevel === 1 ? '10s' : '15s'} de áudio</span>
              </div>
              <div className={styles.pointsIndicator}>
                Vale <span className={styles.pointsValue}>
                  {hintLevel === 0 ? 100 : hintLevel === 1 ? 60 : 30}
                </span> pontos
              </div>
            </div>

            <SearchBar
              onSelect={handleAnswer}
              disabled={!canGuess}
              placeholder={hasGuessed ? 'Aguardando...' : 'Qual música está tocando?'}
              artist={state.artist as '7MZ' | 'ENYGMA'}
            />

            {state.phase === 'round_end' && (
              <div style={{ marginTop: 16, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                  <span>{iGotItRight ? '✅' : '❌'}</span>
                  <span>Você {iGotItRight ? 'acertou!' : 'errou!'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                  <span>{oppGotItRight ? '✅' : '❌'}</span>
                  <span>{oppName} {oppGotItRight ? 'acertou!' : 'errou!'}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Próxima rodada...</div>
              </div>
            )}

            {showCorrectFeedback && state.currentSong && (
              <div className={`${styles.feedbackOverlay} ${isOnFire ? styles.feedbackHot : ''}`}>
                <div 
                  className={styles.feedbackBg} 
                  style={{ backgroundImage: `url(https://img.youtube.com/vi/${state.currentSong.youtubeId}/maxresdefault.jpg)` }} 
                />
                <div className={styles.feedbackCard}>
                  <div 
                    onClick={() => handleOpenVideo()}
                    className={styles.feedbackThumbLink}
                    role="button"
                    tabIndex={0}
                    title="Assistir clipe no YouTube"
                  >
                    <div className={styles.feedbackThumbWrap}>
                      <img
                        src={`https://img.youtube.com/vi/${state.currentSong.youtubeId}/hqdefault.jpg`}
                        alt=""
                        aria-hidden="true"
                        className={styles.feedbackThumbGlow}
                      />
                      <img
                        src={`https://img.youtube.com/vi/${state.currentSong.youtubeId}/hqdefault.jpg`}
                        alt={state.currentSong.title}
                        className={styles.feedbackThumb}
                      />
                      <div className={styles.playOverlay}>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        <span>ASSISTIR CLIPE</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.feedbackInfo}>
                    <div className={styles.feedbackBadgeRow}>
                      <span className={styles.correctEmoji}>✅</span>
                      <span className={styles.earnedPoints}>+{pointsEarned} pts</span>
                    </div>
                    <h3 className={styles.feedbackSongTitle}>{state.currentSong.title}</h3>
                    <div className={styles.feedbackMeta}>
                      {state.currentSong.anime && (
                        <span className={styles.feedbackAnime}>{state.currentSong.anime}</span>
                      )}
                      <span className={styles.feedbackCategory}>{state.currentSong.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {floatingPoints && (
          <div key={floatingPoints.id} className={styles.floatingPoints}>
            +{floatingPoints.val} pts!
          </div>
        )}
      </main>

      {isViewingVideo && videoData && (
        <div 
          className={styles.videoModalOverlay}
          onClick={() => handleCloseVideo()}
        >
          <div 
            className={styles.videoContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className={styles.closeVideoBtn}
              onClick={() => handleCloseVideo()}
            >
              ×
            </button>
            <iframe 
              width="100%" 
              height="100%" 
              src={`https://www.youtube.com/embed/${videoData.id}?start=${videoData.start}&autoplay=1&enablejsapi=1&controls=1&rel=0&modestbranding=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen
            />
          </div>
        </div>
      )}

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
                {state.player1Score > state.player2Score ? '🏆' : state.player2Score > state.player1Score ? '🏆' : '⚔️'}
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
                <button className={styles.playAgainBtn} onClick={handleLeave}>
                  Sair
                </button>
                <Link href="/" className={styles.homeBtn}>
                  Início
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
