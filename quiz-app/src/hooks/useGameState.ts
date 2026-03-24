'use client';

import { useCallback, useReducer } from 'react';
import { Song, SongCategory, getRandomSong } from '@/data/songs';
import {
  getPointsForHintLevel,
  getAudioDuration,
  generateRandomTimestamp,
  checkMilestone,
  Milestone,
} from '@/lib/game-logic';

export type GamePhase = 'IDLE' | 'LOADING' | 'PLAYING' | 'CORRECT' | 'GAME_OVER';

export interface GameState {
  phase: GamePhase;
  currentSong: Song | null;
  timestamp: number;
  hintLevel: number; // 0, 1, or 2
  score: number;
  streak: number; // consecutive correct answers
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
  | { type: 'RESET' };

const initialState: GameState = {
  phase: 'IDLE',
  currentSong: null,
  timestamp: 0,
  hintLevel: 0,
  score: 0,
  streak: 0,
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
      return {
        ...state,
        hintLevel: state.hintLevel + 1,
        totalHintsUsed: state.totalHintsUsed + 1,
      };
    }

    case 'CORRECT_ANSWER': {
      const points = getPointsForHintLevel(state.hintLevel);
      const newScore = state.score + points;
      const newStreak = state.streak + 1;
      const milestone = checkMilestone(newStreak, state.streak);
      
      return {
        ...state,
        phase: 'CORRECT',
        score: newScore,
        streak: newStreak,
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

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const startGame = useCallback(() => {
    dispatch({ type: 'START_GAME' });
  }, []);

  const loadNextSong = useCallback((category?: SongCategory) => {
    const song = getRandomSong(state.playedSongIds, category);
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

  return {
    state,
    startGame,
    loadNextSong,
    useHint,
    submitAnswer,
    nextRound,
    clearMilestone,
    resetGame,
  };
}
