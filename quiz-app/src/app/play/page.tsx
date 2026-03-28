'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { useGameState } from '@/hooks/useGameState';
import { getAudioDuration, generateRandomTimestamp, calculateRoundScore } from '@/lib/game-logic';
import { saveGameScore } from '@/utils/supabase/gameActions';
import SearchBar from '@/components/game/SearchBar';
import { Song, SongCategory, songs } from '@/data/songs';
import styles from './play.module.css';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function PlayPage() {
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
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SongCategory | 'ALL' | null>(null);
  const nextSongDataRef = useRef<{ song: Song; timestamp: number; duration: number } | null>(null);
  const hasStartedRef = useRef(false);
  const scoreSubmittedRef = useRef(false);
  const categoryRef = useRef<SongCategory | undefined>(undefined);

  // Start new round: get real duration from YT, generate safe timestamp, then play
  const startNewRound = useCallback(async () => {
    const cat = categoryRef.current;
    const data = loadNextSong(cat);
    
    if (!data) {
      console.log('[7MZ DEBUG] Game complete! No more songs.');
      return;
    }
    
    // Get the REAL video duration from YouTube API
    const realDuration = await getRealDuration(data.song.youtubeId);
    
    // Override the song duration with the real one for timestamp generation
    const songWithRealDuration = { ...data.song, duration: realDuration };
    const safeTimestamp = generateRandomTimestamp(songWithRealDuration, data.duration);
    
    const fixedData = { ...data, timestamp: safeTimestamp };
    nextSongDataRef.current = fixedData;
    
    console.log('[7MZ DEBUG] Playing:', data.song.title, '| realDuration:', realDuration, 's | startAt:', safeTimestamp, 's | snippet:', data.duration, 's');
    loadAndPlay(data.song.youtubeId, safeTimestamp, data.duration);
  }, [loadNextSong, getRealDuration, loadAndPlay]);

  // Keep skipSongRef updated so error handler can call it
  useEffect(() => {
    skipSongRef.current = startNewRound;
  }, [startNewRound]);

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
    categoryRef.current = selectedCategory === 'ALL' ? undefined : selectedCategory;
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
      
      setTimeout(() => {
        setShowCorrectFeedback(false);
        nextRound();
      }, 2500);
    } else {
      setShowWrongFeedback(true);
      setTimeout(() => setShowWrongFeedback(false), 500);
    }
  }, [state.phase, state.hintLevel, submitAnswer, stop, nextRound]);

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

  // Dynamic fake visualizer
  const [activeBarHeights, setActiveBarHeights] = useState<number[]>(
    Array.from({ length: 28 }, () => 10)
  );

  // Submit score on game over
  useEffect(() => {
    if (state.phase === 'GAME_OVER' && state.score > 0 && !scoreSubmittedRef.current) {
      scoreSubmittedRef.current = true;
      saveGameScore(state.score, selectedCategory || 'ALL');
    }
  }, [state.phase, state.score, selectedCategory]);

  useEffect(() => {
    if (!isPlaying) return;
    
    // Rapidly update heights to simulate real audio frequencies
    const interval = setInterval(() => {
      setActiveBarHeights(prev => 
        prev.map(() => 15 + Math.random() * 45) // random heights between 15px and 60px
      );
    }, 120); // Update every 120ms for a snappy, realistic analyzer feel
    
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className={styles.page}>
      {/* Hidden YouTube Player */}
      <div id="yt-player" style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }} />

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
          <Image src="/7mz-logo.jpg" alt="7MZ" width={36} height={36} className={styles.logoHeaderImg} />
          <h1 className={styles.logo}>7MZ <span>ARENA</span></h1>
        </div>
        {state.phase !== 'IDLE' && state.phase !== 'GAME_OVER' && (
          <div className={styles.headerStats}>
            <div className={styles.scoreBadge}>
              <span className={styles.scoreLabel}>PONTOS</span>
              <span className={styles.scoreValue}>{state.score}</span>
            </div>
            <div className={styles.streakBadge}>
              <span className={styles.streakFire} title="Sequência Total">✅</span>
              <span className={styles.streakValue}>{state.streak}</span>
            </div>
            
            {state.trueStreak >= 2 && (
              <motion.div 
                className={styles.comboBadge}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                key={state.trueStreak} // forces re-animation on streak up
              >
                <span className={styles.comboFire}>🔥</span>
                <span className={styles.comboValue}>{state.trueStreak}x COMBO</span>
              </motion.div>
            )}
          </div>
        )}
      </header>

      {/* Main Game Area */}
      <main className={styles.main}>
        {/* IDLE - Category Selection Screen */}
        {state.phase === 'IDLE' && (
          <div className={styles.startScreen}>
            <div className={styles.modeIcon}>🎵</div>
            <h2 className={styles.modeTitle}>Escolha a Categoria</h2>
            <p className={styles.modeDesc}>
              Ouça um trecho e adivinhe qual música do 7 Minutoz está tocando.
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
                <span className={styles.categoryEmoji}>🔥</span>
                <span className={styles.categoryName}>AMBOS</span>
                <span className={styles.categoryCount}>{songs.length} músicas</span>
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
              {!selectedCategory ? 'SELECIONE UMA CATEGORIA' : (!isReady ? 'CARREGANDO...' : 'COMEÇAR')}
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
        {(state.phase === 'PLAYING' || state.phase === 'CORRECT') && (
          <div className={`${styles.playingScreen} ${showCorrectFeedback ? styles.correctFlash : ''} ${showWrongFeedback ? styles.wrongFlash : ''}`}>
            
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
              <div className={styles.visualizerLabel}>
                {isPlaying ? '♪ TOCANDO...' : '♪ PAUSADO'}
              </div>
              <div className={styles.visualizer}>
                {activeBarHeights.map((h, i) => (
                  <div
                    key={i}
                    className={styles.bar}
                    style={{ 
                      height: isPlaying ? `${h}px` : `${3 + (i % 3) * 2}px`,
                      opacity: isPlaying ? 1 : 0.3,
                    }}
                  />
                ))}
              </div>
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
            />

            {/* Correct feedback overlay */}
            {showCorrectFeedback && state.currentSong && (
              <div className={styles.feedbackOverlay}>
                <div 
                  className={styles.feedbackBg} 
                  style={{ backgroundImage: `url(https://img.youtube.com/vi/${state.currentSong.youtubeId}/maxresdefault.jpg)` }} 
                />
                <div className={styles.feedbackCard}>
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
    </div>
  );
}
