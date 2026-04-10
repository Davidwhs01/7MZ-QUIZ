'use client';

import { useCallback, useReducer } from 'react';
import { Song, SeloKey, type Artist } from '@/data/songs';
import { getRandomSongAsync } from '@/lib/songs-store';
import {
  getAudioDuration,
  generateRandomTimestamp,
  checkMilestone,
  calculateRoundScore,
  Milestone,
} from '@/lib/game-logic';

export type GamePhase = 'IDLE' | 'LOADING' | 'PLAYING' | 'CORRECT' | 'GAME_OVER' | 'CATEGORY_COMPLETE';

export interface GameState {
  phase: GamePhase;
  currentSong: Song | null;
  timestamp: number;
  hintLevel: number; // 0, 1, or 2
  score: number;
  streak: number; // general consecutive correct answers
  trueStreak: number; // consecutive correct answers without hints
  bestStreak: number;
  round: number;
  playedSongIds: string[];
  milestone: Milestone | null;
  totalHintsUsed: number;
}

type GameAction =
  | { type: 'START_GAME' }
  | { type: 'SONG_LOADED'; song: Song; timestamp: number }
  | { type: 'USE_HINT' }
  | { type: 'CORRECT_ANSWER' }
  | { type: 'WRONG_ANSWER' }
  | { type: 'NEXT_ROUND' }
  | { type: 'CLEAR_MILESTONE' }
  | { type: 'RESET' }
  | { type: 'CATEGORY_COMPLETE' };

const initialState: GameState = {
  phase: 'IDLE',
  currentSong: null,
  timestamp: 0,
  hintLevel: 0,
  score: 0,
  streak: 0,
  trueStreak: 0,
  bestStreak: 0,
  round: 0,
  playedSongIds: [],
  milestone: null,
  totalHintsUsed: 0,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return { ...initialState, phase: 'LOADING' };

    case 'SONG_LOADED':
      return {
        ...state,
        phase: 'PLAYING',
        currentSong: action.song,
        timestamp: action.timestamp,
        hintLevel: 0,
        round: state.round + 1,
        playedSongIds: [...state.playedSongIds, action.song.id],
      };

    case 'USE_HINT': {
      if (state.hintLevel >= 2) return state;
      
      const newHintLevel = state.hintLevel + 1;
      let penalizedTrueStreak = state.trueStreak;
      
      if (newHintLevel === 1) {
        // Punish by halving the streak on first hint
        penalizedTrueStreak = Math.floor(state.trueStreak / 2);
      } else if (newHintLevel === 2) {
        // Completely reset streak on second hint
        penalizedTrueStreak = 0;
      }

      return {
        ...state,
        hintLevel: newHintLevel,
        totalHintsUsed: state.totalHintsUsed + 1,
        trueStreak: penalizedTrueStreak,
      };
    }

    case 'CORRECT_ANSWER': {
      const { base, bonus } = calculateRoundScore(state.hintLevel, state.trueStreak);
      const newScore = state.score + base + bonus;
      const newStreak = state.streak + 1;
      
      // True streak increases only if no hints were used
      const newTrueStreak = state.hintLevel === 0 ? state.trueStreak + 1 : state.trueStreak;
      
      const milestone = checkMilestone(newStreak, state.streak);
      
      return {
        ...state,
        phase: 'CORRECT',
        score: newScore,
        streak: newStreak,
        trueStreak: newTrueStreak,
        bestStreak: Math.max(state.bestStreak, newStreak),
        milestone,
      };
    }

    case 'WRONG_ANSWER':
      return {
        ...state,
        phase: 'GAME_OVER',
        bestStreak: Math.max(state.bestStreak, state.streak),
      };

    case 'NEXT_ROUND':
      return {
        ...state,
        phase: 'LOADING',
        milestone: null,
      };

    case 'CLEAR_MILESTONE':
      return {
        ...state,
        milestone: null,
      };

    case 'RESET':
      return initialState;

    case 'CATEGORY_COMPLETE':
      return {
        ...state,
        phase: 'CATEGORY_COMPLETE',
        bestStreak: Math.max(state.bestStreak, state.streak),
      };

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const startGame = useCallback(() => {
    dispatch({ type: 'START_GAME' });
  }, []);

  const loadNextSong = useCallback(async (selo?: SeloKey | SeloKey[], artist?: Artist) => {
    const song = await getRandomSongAsync(state.playedSongIds, selo, artist);
    
    if (!song) {
      dispatch({ type: 'CATEGORY_COMPLETE' }); // Category completed!
      return null;
    }

    const duration = getAudioDuration(0);
    const timestamp = generateRandomTimestamp(song, duration);
    dispatch({ type: 'SONG_LOADED', song, timestamp });
    return { song, timestamp, duration };
  }, [state.playedSongIds]);

  const useHint = useCallback(() => {
    if (state.hintLevel >= 2) return null;
    const newHintLevel = state.hintLevel + 1;
    const duration = getAudioDuration(newHintLevel);
    dispatch({ type: 'USE_HINT' });
    return { duration, timestamp: state.timestamp };
  }, [state.hintLevel, state.timestamp]);

  const submitAnswer = useCallback((songId: string) => {
    if (state.currentSong && songId === state.currentSong.id) {
      dispatch({ type: 'CORRECT_ANSWER' });
      return true;
    } else {
      dispatch({ type: 'WRONG_ANSWER' });
      return false;
    }
  }, [state.currentSong]);

  const nextRound = useCallback(() => {
    dispatch({ type: 'NEXT_ROUND' });
  }, []);

  const clearMilestone = useCallback(() => {
    dispatch({ type: 'CLEAR_MILESTONE' });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const completeCategory = useCallback(() => {
    dispatch({ type: 'CATEGORY_COMPLETE' });
  }, []);

  return {
    state,
    startGame,
    loadNextSong,
    useHint,
    submitAnswer,
    nextRound,
    clearMilestone,
    resetGame,
    completeCategory,
  };
}
