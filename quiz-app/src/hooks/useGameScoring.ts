import { useState, useCallback } from 'react';
import { calculateRoundScore, getPointsForHintLevel, getAudioDuration, checkMilestone, type Milestone } from '@/lib/game-logic';

export interface ScoringState {
  score: number;
  round: number;
  streak: number;
  trueStreak: number;
  totalHintsUsed: number;
}

export function useGameScoring() {
  const [state, setState] = useState<ScoringState>({
    score: 0,
    round: 0,
    streak: 0,
    trueStreak: 0,
    totalHintsUsed: 0,
  });

  const startNewRound = useCallback(() => {
    setState(prev => ({ ...prev, round: prev.round + 1 }));
  }, []);

  const submitAnswer = useCallback((hintLevel: number, isCorrect: boolean) => {
    if (!isCorrect) {
      setState(prev => ({
        ...prev,
        streak: 0,
        trueStreak: 0,
      }));
      return { base: 0, bonus: 0, newScore: state.score, milestone: null };
    }

    const { base, bonus } = calculateRoundScore(hintLevel, state.trueStreak);
    const newScore = state.score + base + bonus;
    const newStreak = state.streak + 1;
    const newTrueStreak = hintLevel === 0 ? state.trueStreak + 1 : 0;
    const newHintsUsed = state.totalHintsUsed + hintLevel;

    const milestone = checkMilestone(newScore, state.score);

    setState(prev => ({
      ...prev,
      score: newScore,
      streak: newStreak,
      trueStreak: newTrueStreak,
      totalHintsUsed: newHintsUsed,
    }));

    return { base, bonus, newScore, milestone };
  }, [state.score, state.trueStreak, state.streak, state.totalHintsUsed]);

  const reset = useCallback(() => {
    setState({
      score: 0,
      round: 0,
      streak: 0,
      trueStreak: 0,
      totalHintsUsed: 0,
    });
  }, []);

  return {
    state,
    startNewRound,
    submitAnswer,
    reset,
    getPointsForHintLevel,
    getAudioDuration,
  };
}
