'use client';

import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { useGameState } from '@/hooks/useGameState';
import { getAudioDuration, generateRandomTimestamp, calculateRoundScore } from '@/lib/game-logic';
import { saveGameScore } from '@/utils/supabase/gameActions';
import { sfx } from '@/lib/audio-effects';
import SearchBar from '@/components/game/SearchBar';
import Visualizer from '@/components/game/Visualizer';
import { Song, SeloKey, SongCategory, songs, type Artist } from '@/data/songs';
import styles from './play.module.css';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useChannel } from '@/context/ChannelContext';

// Detect artist from URL - more robust logic
function useGameArtistFromURL(activeChannel: Artist): Artist {
  const [detectedArtist, setDetectedArtist] = useState<Artist>(activeChannel);
  const [isDetected, setIsDetected] = useState(false);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const url = window.location.href;
    const path = window.location.pathname;
    
    // Check URL params first (highest priority)
    const artistParam = urlParams.get('artist');
    if (artistParam === 'meln') {
      setDetectedArtist('MELANIE');
      setIsDetected(true);
      return;
    }
    if (artistParam === 'enygma') {
      setDetectedArtist('ENYGMA');
      setIsDetected(true);
      return;
    }
    if (artistParam === '7mz') {
      setDetectedArtist('7MZ');
      setIsDetected(true);
      return;
    }
    if (artistParam === 'rodrigozin') {
      setDetectedArtist('RODRIGOZIN');
      setIsDetected(true);
      return;
    }
    
    // Check path to determine section
    if (path.includes('/pop') || path.startsWith('/pop')) {
      setDetectedArtist('MELANIE');
      setIsDetected(true);
      return;
    }
    
    // Use activeChannel from context, but validate it's valid
    if (activeChannel === '7MZ' || activeChannel === 'ENYGMA' || activeChannel === 'MELANIE' || activeChannel === 'RODRIGOZIN' || activeChannel === 'MITSKI') {
      setDetectedArtist(activeChannel);
    } else {
      // Default to 7MZ if activeChannel is invalid
      setDetectedArtist('7MZ');
    }
    setIsDetected(true);
  }, [activeChannel]);
  
  return detectedArtist;
}

export default function PlayPage() {
  const router = useRouter();
  const { activeChannel } = useChannel();
  const gameArtist = useGameArtistFromURL(activeChannel);
  
  // Apply theme based on gameArtist - force immediately on mount
  useEffect(() => {
    // Clear all theme classes first
    document.body.classList.remove('theme-7mz', 'theme-enygma', 'theme-melanie', 'theme-geek', 'theme-pop', 'theme-rodrigozin', 'theme-mitski');
    
    // Apply theme based on detected artist
    switch (gameArtist) {
      case '7MZ':
        document.body.classList.add('theme-7mz');
        break;
      case 'ENYGMA':
        document.body.classList.add('theme-enygma');
        break;
      case 'MELANIE':
        document.body.classList.add('theme-melanie');
        break;
      case 'RODRIGOZIN':
        document.body.classList.add('theme-rodrigozin');
        break;
      case 'MITSKI':
        document.body.classList.add('theme-mitski');
        break;
    }
    console.log('Theme applied:', gameArtist);
  }, [gameArtist]);
  
  const {
    state,
    startGame,
    loadNextSong,
    useHint,
    submitAnswer,
    nextRound,
    clearMilestone,
    resetGame,
  } = useGameState();

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
  const [bonusEarned, setBonusEarned] = useState(0);
  const [floatingPoints, setFloatingPoints] = useState<{ id: number, val: number } | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SeloKey | 'ALL' | null>(null);
  const [isViewingVideo, setIsViewingVideo] = useState(false);
  const [videoData, setVideoData] = useState<{ id: string; start: number } | null>(null);
  
  useEffect(() => {
    setSelectedCategory(null);
  }, [activeChannel]);

  const nextSongDataRef = useRef<{ song: Song; timestamp: number; duration: number } | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef(false);
  const scoreSubmittedRef = useRef(false);
  const categoryRef = useRef<SeloKey | SeloKey[] | undefined>(undefined);

  // Start new round: get real duration from YT, generate safe timestamp, then play
  const startNewRound = useCallback(async () => {
    const cat = categoryRef.current;
    const data = loadNextSong(cat, gameArtist);
    
    if (!data) {
      return;
    }
    
    // Get the REAL video duration from YouTube API
    const realDuration = await getRealDuration(data.song.youtubeId);
    
    // Override the song duration with the real one for timestamp generation
    const songWithRealDuration = { ...data.song, duration: realDuration };
    const safeTimestamp = generateRandomTimestamp(songWithRealDuration, realDuration);

    const fixedData = { ...data, timestamp: safeTimestamp, duration: realDuration };
    nextSongDataRef.current = fixedData;
    
    loadAndPlay(data.song.youtubeId, safeTimestamp, realDuration);
  }, [loadNextSong, getRealDuration, loadAndPlay, gameArtist]);

  // Keep skipSongRef updated so error handler can call it
  useEffect(() => {
    skipSongRef.current = startNewRound;
  }, [startNewRound]);

  // Handle ESC key to close video modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseVideo();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [state.phase]); // Dependency on phase to ensure nextRound is available if needed

  const handleOpenVideo = useCallback(() => {
    if (!state.currentSong) return;
    
    // Cancel the auto-transition timer
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
    
    const playbackTime = nextSongDataRef.current?.timestamp ?? state.timestamp;
    
    setVideoData({
      id: state.currentSong.youtubeId,
      start: Math.floor(playbackTime)
    });
    
    // Radical: turn off the feedback overlay so it doesn't stay behind/on top of the modal
    setShowCorrectFeedback(false);
    setIsViewingVideo(true);
  }, [state.currentSong, state.timestamp]);

  const handleCloseVideo = useCallback(() => {
    setIsViewingVideo(false);
    setVideoData(null);
    
    // Since we closed the feedback overlay above, we MUST trigger nextRound now
    // We check for phase CORRECT specifically to avoid double-transitioning 
    // if something else happened (though unlikely here)
    if (state.phase === 'CORRECT') {
      nextRound();
    }
  }, [state.phase, nextRound]);

  // When game phase changes to LOADING, load next song
  useEffect(() => {
    if (state.phase === 'LOADING' && isReady) {
      startNewRound();
    }
  }, [state.phase, isReady, startNewRound]);

  const handleStart = () => {
    if (hasStartedRef.current || !selectedCategory) return;
    hasStartedRef.current = true;
    scoreSubmittedRef.current = false;
    
    // Handle ALL: for each artist, use their categories combined
    if (selectedCategory === 'ALL') {
      if (gameArtist === '7MZ') {
        categoryRef.current = ['NERD HITS', '7MZ RECORDS'];
      } else if (gameArtist === 'RODRIGOZIN') {
        categoryRef.current = ['GEEKS', 'AUTORAIS'];
      } else if (gameArtist === 'ENYGMA') {
        categoryRef.current = 'ENYGMA';
      } else if (gameArtist === 'MELANIE') {
        categoryRef.current = 'POP';
      } else if (gameArtist === 'MITSKI') {
        categoryRef.current = 'POP';
      } else {
        categoryRef.current = undefined;
      }
    } else {
      categoryRef.current = selectedCategory;
    }
    startGame();
  };

  const handleAnswer = useCallback((song: Song) => {
    if (state.phase !== 'PLAYING') return;
    
    stop();
    const isCorrect = submitAnswer(song.id);
    
    if (isCorrect) {
      const { base, bonus } = calculateRoundScore(state.hintLevel, state.trueStreak);
      setPointsEarned(base);
      setBonusEarned(bonus);
      setShowCorrectFeedback(true);
      
      // Play SFX
      if (state.trueStreak >= 4) {
        sfx.playCombo();
      } else {
        sfx.playCorrect();
      }

      // Show floating points
      const id = Date.now();
      setFloatingPoints({ id, val: base + bonus });
      setTimeout(() => setFloatingPoints(curr => curr?.id === id ? null : curr), 1500);
      
      // Auto-transition after 2.5s, but we store the ref to cancel it if video opens
      feedbackTimerRef.current = setTimeout(() => {
        setShowCorrectFeedback(false);
        nextRound();
      }, 2500);
    } else {
      sfx.playWrong();
      setShowWrongFeedback(true);
      setTimeout(() => setShowWrongFeedback(false), 500);
    }
  }, [state.phase, state.hintLevel, state.trueStreak, submitAnswer, stop, nextRound]);

  const handleHint = useCallback(() => {
    const hintData = useHint();
    if (hintData && nextSongDataRef.current) {
      // Use the REAL timestamp from the ref (which was generated with getRealDuration),
      // NOT hintData.timestamp which comes from state and may be wrong (duration:0 fallback)
      replay(
        nextSongDataRef.current.song.youtubeId,
        nextSongDataRef.current.timestamp,
        hintData.duration
      );
    }
  }, [useHint, replay]);

  const handleReplay = useCallback(() => {
    if (nextSongDataRef.current) {
      const duration = getAudioDuration(state.hintLevel);
      replay(
        nextSongDataRef.current.song.youtubeId,
        nextSongDataRef.current.timestamp,
        duration
      );
    }
  }, [state.hintLevel, replay]);

  const handlePlayAgain = () => {
    hasStartedRef.current = false;
    scoreSubmittedRef.current = false;
    resetGame();
    setTimeout(() => {
      hasStartedRef.current = true;
      startGame();
    }, 100);
  };

  // Submit score on game over
  useEffect(() => {
    if (state.phase === 'GAME_OVER' && state.score > 0 && !scoreSubmittedRef.current) {
      scoreSubmittedRef.current = true;
      const cat = selectedCategory || 'ALL';
      saveGameScore(state.score, cat);
    }
  }, [state.phase, state.score, selectedCategory]);

  // Play Game Over sound
  useEffect(() => {
    if (state.phase === 'GAME_OVER') {
      sfx.playGameOver();
    }
  }, [state.phase]);

  // Exponential growth for fire intensity: slower start (subtle at low streak), peak at 20.
  const fireIntensity = Math.pow(Math.min(state.trueStreak / 20, 1), 2);
  const isOnFire = state.trueStreak >= 4; // Subtly appears at streak 4, becomes real at 10+

  return (
    <div 
      className={styles.page} 
      suppressHydrationWarning
      style={{ '--fire-intensity': fireIntensity } as any}
    >
      {/* Hidden YouTube Player for background audio — we only init once */}
      <div 
        id="yt-player" 
        style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }} 
        suppressHydrationWarning
      />
      {/* Background orbs */}
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
          {gameArtist === '7MZ' && (
            <Image src="/7mz-logo.jpg" alt="7MZ Logo" width={36} height={36} className={styles.logoHeaderImg} />
          )}
          {gameArtist === 'ENYGMA' && (
            <Image src="/enygma-logo.jpg" alt="Enygma Logo" width={36} height={36} className={styles.logoHeaderImg} />
          )}
          {gameArtist === 'MELANIE' && (
            <Image src="/Melanie-Logo.jpg" alt="Melanie Logo" width={36} height={36} className={styles.logoHeaderImg} />
          )}
          {gameArtist === 'MITSKI' && (
            <Image src="/Mitski-Logo.jpg" alt="Mitski Logo" width={36} height={36} className={styles.logoHeaderImg} />
          )}
          <h1 className={styles.logo}>
            {gameArtist === '7MZ' ? '7 MINUTOZ' : gameArtist === 'MELANIE' ? 'MELANIE' : gameArtist === 'RODRIGOZIN' ? 'RODRIGO ZIN' : gameArtist === 'MITSKI' ? 'MITSKI' : 'ENYGMA'} <span>ARENA</span>
          </h1>
        </div>
        {state.phase !== 'IDLE' && state.phase !== 'GAME_OVER' && (
          <div className={styles.headerStats}>
            <div className={styles.scoreBadge}>
              <span className={styles.scoreLabel}>PONTOS</span>
              <span className={styles.scoreValue}>{state.score}</span>
            </div>
            <div className={`${styles.streakBadge} ${isOnFire ? styles.streakHot : ''}`}>
              <span className={styles.streakIcon}>🔥</span>
              <span className={styles.streakValue}>{state.trueStreak}</span>
            </div>
          </div>
        )}
      </header>

      {/* Main Game Area */}
      <main className={styles.main}>
        {/* IDLE - Category Selection Screen */}
        {state.phase === 'IDLE' && (
          <div className={styles.startScreen} suppressHydrationWarning>
            <div className={styles.modeIcon}>🎵</div>
            <h2 className={styles.modeTitle}>Escolha a Categoria</h2>
            <p className={styles.modeDesc}>
              Ouça um trecho e adivinhe qual música geek está tocando.
            </p>

            {/* Category Cards */}
            <motion.div
              className={styles.categoryGrid}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: { staggerChildren: 0.1 }
                }
              }}
            >
              {gameArtist === '7MZ' && (
                <>
                  <motion.button
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300 } }
                    }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className={`${styles.categoryCard} ${selectedCategory === 'NERD HITS' ? styles.categoryCardActive : ''}`}
                    onClick={() => setSelectedCategory('NERD HITS')}
                  >
                    <span className={styles.categoryEmoji}>⚡</span>
                    <span className={styles.categoryName}>NERD HITS</span>
                    <span className={styles.categoryCount}>{songs.filter(s => s.category === 'NERD HITS').length} músicas</span>
                  </motion.button>

                  <motion.button
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300 } }
                    }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className={`${styles.categoryCard} ${selectedCategory === '7MZ RECORDS' ? styles.categoryCardActive : ''}`}
                    onClick={() => setSelectedCategory('7MZ RECORDS')}
                  >
                    <span className={styles.categoryEmoji}>🎤</span>
                    <span className={styles.categoryName}>7MZ RECORDS</span>
                    <span className={styles.categoryCount}>{songs.filter(s => s.category === '7MZ RECORDS').length} músicas</span>
                  </motion.button>
                </>
              )}

              {gameArtist === 'ENYGMA' && (
                <>
                  <motion.button
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300 } }
                    }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className={`${styles.categoryCard} ${selectedCategory === 'ENYGMA' ? styles.categoryCardActive : ''}`}
                    onClick={() => setSelectedCategory('ENYGMA')}
                  >
                    <span className={styles.categoryEmoji}>🔮</span>
                    <span className={styles.categoryName}>ENYGMA</span>
                    <span className={styles.categoryCount}>{songs.filter(s => s.category === 'ENYGMA').length} músicas</span>
                  </motion.button>

                  <motion.button
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300 } }
                    }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className={`${styles.categoryCard} ${selectedCategory === 'PÓS REVELAÇÃO' ? styles.categoryCardActive : ''}`}
                    onClick={() => setSelectedCategory('PÓS REVELAÇÃO')}
                  >
                    <span className={styles.categoryEmoji}>🔥</span>
                    <span className={styles.categoryName}>PÓS REVELAÇÃO</span>
                    <span className={styles.categoryCount}>{songs.filter(s => s.selos?.includes('PÓS REVELAÇÃO')).length} músicas</span>
                  </motion.button>
                </>
              )}

              {gameArtist === 'MELANIE' && (
                <>
                  <motion.button
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300 } }
                    }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className={`${styles.categoryCard} ${selectedCategory === 'POP' ? styles.categoryCardActive : ''}`}
                    onClick={() => setSelectedCategory('POP')}
                  >
                    <span className={styles.categoryEmoji}>🎤</span>
                    <span className={styles.categoryName}>POP</span>
                    <span className={styles.categoryCount}>{songs.filter(s => s.artist === 'MELANIE').length} músicas</span>
                  </motion.button>
                </>
              )}

              {gameArtist === 'MITSKI' && (
                <>
                  <motion.button
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300 } }
                    }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className={`${styles.categoryCard} ${selectedCategory === 'POP' ? styles.categoryCardActive : ''}`}
                    onClick={() => setSelectedCategory('POP')}
                  >
                    <span className={styles.categoryEmoji}>🎤</span>
                    <span className={styles.categoryName}>POP</span>
                    <span className={styles.categoryCount}>{songs.filter(s => s.artist === 'MITSKI').length} músicas</span>
                  </motion.button>
                </>
              )}

              {gameArtist === 'RODRIGOZIN' && (
                <>
                  <motion.button
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300 } }
                    }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className={`${styles.categoryCard} ${selectedCategory === 'GEEKS' ? styles.categoryCardActive : ''}`}
                    onClick={() => setSelectedCategory('GEEKS')}
                  >
                    <span className={styles.categoryEmoji}>🎮</span>
                    <span className={styles.categoryName}>GEEKS</span>
                    <span className={styles.categoryCount}>{songs.filter(s => s.category === 'GEEKS').length} músicas</span>
                  </motion.button>

                  <motion.button
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300 } }
                    }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className={`${styles.categoryCard} ${selectedCategory === 'AUTORAIS' ? styles.categoryCardActive : ''}`}
                    onClick={() => setSelectedCategory('AUTORAIS')}
                  >
                    <span className={styles.categoryEmoji}>🎵</span>
                    <span className={styles.categoryName}>AUTORAIS</span>
                    <span className={styles.categoryCount}>{songs.filter(s => s.category === 'AUTORAIS').length} músicas</span>
                  </motion.button>
                </>
              )}

              <motion.button
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300 } }
                }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className={`${styles.categoryCard} ${selectedCategory === 'ALL' ? styles.categoryCardActive : ''}`}
                onClick={() => setSelectedCategory('ALL')}
              >
                <span className={styles.categoryEmoji}>🌌</span>
                <span className={styles.categoryName}>TODAS AS MÚSICAS</span>
                <span className={styles.categoryCount}>{gameArtist === '7MZ' ? songs.filter(s => s.artist === '7MZ').length : gameArtist === 'RODRIGOZIN' ? songs.filter(s => s.artist === 'RODRIGOZIN').length : gameArtist === 'MELANIE' ? songs.filter(s => s.artist === 'MELANIE').length : gameArtist === 'MITSKI' ? songs.filter(s => s.artist === 'MITSKI').length : songs.filter(s => s.artist === 'ENYGMA').length} músicas</span>
              </motion.button>
            </motion.div>

            <div className={styles.rules}>
              <div className={styles.rule}>
                <span className={styles.ruleIcon}>🎧</span>
                <span>5s de áudio • 100 pts</span>
              </div>
              <div className={styles.rule}>
                <span className={styles.ruleIcon}>💡</span>
                <span>Dica 1 → 10s • 60 pts</span>
              </div>
              <div className={styles.rule}>
                <span className={styles.ruleIcon}>💡</span>
                <span>Dica 2 → 15s • 30 pts</span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: !selectedCategory || !isReady ? 1 : 1.05 }}
              whileTap={{ scale: !selectedCategory || !isReady ? 1 : 0.95 }}
              className={styles.startBtn}
              onClick={handleStart}
              disabled={!isReady || !selectedCategory}
            >
              {!selectedCategory ? 'SELECIONE UM ARTISTA' : (!isReady ? 'CARREGANDO...' : 'COMEÇAR')}
            </motion.button>
          </div>
        )}

        {/* LOADING */}
        {state.phase === 'LOADING' && (
          <div className={styles.loadingScreen}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Carregando música...</p>
          </div>
        )}

        {/* PLAYING */}
        {(state.phase === 'PLAYING' || state.phase === 'CORRECT' || state.phase === 'LOADING') && (
          <div className={`${styles.playingScreen} ${isOnFire ? styles.onFire : ''} ${showCorrectFeedback ? styles.correctFlash : ''} ${showWrongFeedback ? styles.wrongFlash : ''}`}>
            {/* Round + hint level info */}
            <div className={styles.roundHeader}>
              <span className={styles.roundNumber}>RODADA {state.round}</span>
              <div className={styles.hintDots}>
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className={`${styles.hintDot} ${i < state.hintLevel ? styles.hintDotUsed : ''} ${i === state.hintLevel && i < 2 ? styles.hintDotNext : ''}`}
                  />
                ))}
              </div>
            </div>

            {/* Sound Wave Visualizer — synced with isPlaying */}
            <div className={styles.visualizerContainer}>
              <Visualizer isPlaying={isPlaying} barCount={28} minHeight={15} maxHeight={60} />
            </div>

            {/* Controls Row */}
            <div className={styles.controlsRow}>
              {/* Volume */}
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

              {/* Replay */}
              <button
                className={styles.replayBtn}
                onClick={handleReplay}
                disabled={isPlaying || state.phase !== 'PLAYING'}
                title="Ouvir novamente"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor" stroke="none" />
                </svg>
                <span>Repetir</span>
              </button>

              {/* Hint */}
              {state.hintLevel < 2 && state.phase === 'PLAYING' && (
                <button
                  className={styles.hintBtn}
                  onClick={handleHint}
                >
                  <span className={styles.hintIcon}>💡</span>
                  <span>Dica ({state.hintLevel + 1}/2)</span>
                  <span className={styles.hintCost}>
                    {state.hintLevel === 0 ? '-40 pts' : '-30 pts'}
                  </span>
                </button>
              )}
            </div>

            {/* Points + audio duration indicator */}
            <div className={styles.infoBar}>
              <div className={styles.durationIndicator}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" opacity="0.5">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15V7l6 5-6 5z"/>
                </svg>
                <span>{state.hintLevel === 0 ? '5s' : state.hintLevel === 1 ? '10s' : '15s'} de áudio</span>
              </div>
              <div className={styles.pointsIndicator}>
                Vale <span className={styles.pointsValue}>
                  {state.hintLevel === 0 ? 100 : state.hintLevel === 1 ? 60 : 30}
                </span> pontos
              </div>
            </div>

            {/* Search Bar */}
            <SearchBar
              onSelect={handleAnswer}
              disabled={state.phase !== 'PLAYING'}
              placeholder="Qual música está tocando?"
              category={selectedCategory && selectedCategory !== 'ALL' ? selectedCategory : undefined}
              artist={gameArtist}
            />

            {/* Correct feedback overlay */}
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
                      {/* Glowing background using same image for a dominant color glow */}
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
                    {bonusEarned > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: 0.3 }}
                        className={styles.bonusPointsWrap}
                      >
                        <span className={styles.bonusPoints}>+{bonusEarned} COMBO 🔥</span>
                      </motion.div>
                    )}
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

        {/* GAME OVER */}
        {state.phase === 'GAME_OVER' && (
          <div className={styles.gameOverScreen}>
            {state.currentSong && (
              <div 
                className={styles.feedbackBg} 
                style={{ backgroundImage: `url(https://img.youtube.com/vi/${state.currentSong.youtubeId}/maxresdefault.jpg)` }} 
              />
            )}
            <div className={styles.gameOverContent}>
              <div className={styles.gameOverIcon}>💀</div>
              <h2 className={styles.gameOverTitle}>GAME OVER</h2>
              
              <div className={styles.correctAnswer}>
                {state.currentSong && (
                  <img
                    src={`https://img.youtube.com/vi/${state.currentSong.youtubeId}/hqdefault.jpg`}
                    alt={state.currentSong.title}
                    className={styles.gameOverThumb}
                  />
                )}
                <p className={styles.correctAnswerLabel}>A música era:</p>
                <p className={styles.correctAnswerTitle}>{state.currentSong?.title}</p>
                <div className={styles.gameOverMeta}>
                  {state.currentSong?.anime && (
                    <span className={styles.feedbackAnime}>{state.currentSong.anime}</span>
                  )}
                  {state.currentSong?.category && (
                    <span className={styles.feedbackCategory}>{state.currentSong.category}</span>
                  )}
                </div>
              </div>

              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{state.score}</span>
                  <span className={styles.statLabel}>Pontos</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{state.streak}</span>
                  <span className={styles.statLabel}>Rodadas</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{state.totalHintsUsed}</span>
                  <span className={styles.statLabel}>Dicas Usadas</span>
                </div>
              </div>

              <div className={styles.gameOverActions}>
                <button className={styles.playAgainBtn} onClick={handlePlayAgain}>
                  JOGAR NOVAMENTE
                </button>
                <Link href="/" className={styles.homeBtn}>
                  Voltar ao Início
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Points (Global Layer) */}
      {floatingPoints && (
        <div key={floatingPoints.id} className={styles.floatingPoints}>
          +{floatingPoints.val} pts!
        </div>
      )}

      {/* Milestone Toast */}
      {state.milestone && (
        <div className={styles.milestoneToast} onAnimationEnd={clearMilestone}>
          <span className={styles.milestoneEmoji}>{state.milestone.emoji}</span>
          <div>
            <p className={styles.milestoneTitle}>{state.milestone.title}</p>
            <p className={styles.milestoneDesc}>{state.milestone.description}</p>
          </div>
        </div>
      )}

      {/* Video Modal Overlay (Rendered at the bottom to ensure it's the top-most layer) */}
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
    </div>
  );
}
