import type { Song, Artist } from '@/data/songs';

export type GamePhase = 'idle' | 'loading' | 'playing' | 'correct' | 'round_end' | 'game_over';

export interface BaseGameState {
  phase: GamePhase;
  currentSong: Song | null;
  timestamp: number;
  audioDuration: number;
}

export interface SingleGameState extends BaseGameState {
  mode: 'single';
  round: number;
  hintLevel: number;
  score: number;
  streak: number;
  trueStreak: number;
  totalHintsUsed: number;
}

export interface BattlePlayerState {
  score: number;
  lives: number;
  correct: boolean;
}

export interface BattleGameState extends BaseGameState {
  mode: 'battle';
  round: number;
  totalRounds: number;
  player1: BattlePlayerState;
  player2: BattlePlayerState;
  battleMode: 'normal' | 'inferno';
}

export type GameState = SingleGameState | BattleGameState;

export interface RoundResult {
  correct: boolean;
  scoreDelta: number;
  bonusEarned: number;
  livesRemaining?: number;
}

export interface HintData {
  hintLevel: number;
  duration: number;
}

export type { Song, Artist };
