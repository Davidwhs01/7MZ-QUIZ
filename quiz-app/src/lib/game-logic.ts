import { Song } from '@/data/songs';

export const POINTS_NO_HINT = 100;
export const POINTS_HINT_1 = 60;
export const POINTS_HINT_2 = 30;

export const DURATIONS = [5, 10, 15] as const;

// Default safe margins (seconds)
const DEFAULT_INTRO_SKIP = 30;
const DEFAULT_OUTRO_BUFFER = 20;
// Fallback duration when real duration is unknown (3 min avg for geek rap)
const ESTIMATED_DURATION = 180;

export interface Milestone {
  threshold: number;
  title: string;
  emoji: string;
  description: string;
}

export const MILESTONES: Milestone[] = [
  { threshold: 5, title: "Genin Musical", emoji: "🎵", description: "Primeiros passos no mundo da Geek Arena!" },
  { threshold: 10, title: "Chunin do Beat", emoji: "🎧", description: "Você conhece as batidas!" },
  { threshold: 15, title: "Jounin do Rap", emoji: "🔥", description: "Mestre das rimas nerd!" },
  { threshold: 25, title: "Kage Músico", emoji: "⚡", description: "Líder supremo do quiz!" },
  { threshold: 50, title: "Hokage do Geek", emoji: "👑", description: "Lenda absoluta das rimas!" },
];

export const MAX_TRUE_STREAK_BONUS = 20; // Maximum multiplier (cap at +500 pts bonus)
export const POINTS_PER_TRUE_STREAK = 25; // Points per successive zero-hint win

export function calculateRoundScore(hintLevel: number, trueStreak: number): { base: number, bonus: number } {
  const base = getPointsForHintLevel(hintLevel);
  let bonus = 0;

  if (hintLevel === 0 && trueStreak > 0) {
    const effectiveStreakBonus = Math.min(trueStreak, MAX_TRUE_STREAK_BONUS);
    bonus = effectiveStreakBonus * POINTS_PER_TRUE_STREAK;
  }

  return { base, bonus };
}

export function getPointsForHintLevel(hintLevel: number): number {
  switch (hintLevel) {
    case 0: return POINTS_NO_HINT;
    case 1: return POINTS_HINT_1;
    case 2: return POINTS_HINT_2;
    default: return POINTS_HINT_2;
  }
}

export function getAudioDuration(hintLevel: number): number {
  return DURATIONS[Math.min(hintLevel, DURATIONS.length - 1)];
}

export function generateRandomTimestamp(song: Song, snippetDuration: number): number {
  const introSkip = song.introSkip ?? DEFAULT_INTRO_SKIP;
  const outroBuffer = song.outroBuffer ?? DEFAULT_OUTRO_BUFFER;
  const duration = song.duration > 0 ? song.duration : ESTIMATED_DURATION;

  const safeStart = introSkip;
  const safeEnd = duration - outroBuffer - snippetDuration;

  if (safeEnd <= safeStart) {
    // Song is too short for full margins — shrink proportionally
    const reducedIntro = Math.min(Math.floor(duration * 0.1), 15);
    const reducedOutro = Math.min(Math.floor(duration * 0.05), 10);
    const fallbackStart = reducedIntro;
    const fallbackEnd = duration - reducedOutro - snippetDuration;
    if (fallbackEnd <= fallbackStart) return fallbackStart;
    return fallbackStart + Math.floor(Math.random() * (fallbackEnd - fallbackStart));
  }

  return safeStart + Math.floor(Math.random() * (safeEnd - safeStart));
}

export function checkMilestone(score: number, previousScore: number): Milestone | null {
  // Find highest milestone crossed between previousScore and score
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    const m = MILESTONES[i];
    if (score >= m.threshold && previousScore < m.threshold) {
      return m;
    }
  }
  return null;
}

export function getCurrentMilestone(streak: number): Milestone | null {
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (streak >= MILESTONES[i].threshold) {
      return MILESTONES[i];
    }
  }
  return null;
}
