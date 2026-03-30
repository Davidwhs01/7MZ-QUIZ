'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getRandomSong, type Song, type Artist } from '@/data/songs';
import { generateRandomTimestamp, getAudioDuration } from '@/lib/game-logic';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface BattleState {
  phase: 'loading' | 'waiting' | 'countdown' | 'playing' | 'round_end' | 'game_over';
  currentRound: number;
  totalRounds: number;
  player1Score: number;
  player2Score: number;
  player1Lives: number;
  player2Lives: number;
  player1HintLevel: number;
  player2HintLevel: number;
  currentSong: Song | null;
  timestamp: number;
  audioDuration: number;
  roundStartTime: number;
  player1Correct: boolean;
  player2Correct: boolean;
  player1Answered: boolean;
  player2Answered: boolean;
  lastCorrectPlayer: number | null;
  battleMode: 'normal' | 'inferno';
  artist: string;
  message: string;
}

export interface RoomRow {
  id: string;
  room_code: string;
  player1_id: string;
  player2_id: string | null;
  status: string;
  current_round: number;
  total_rounds: number;
  battle_mode: 'normal' | 'inferno';
  artist: string;
  player1_score: number;
  player2_score: number;
  player1_lives: number;
  player2_lives: number;
  p1_round_correct: boolean;
  p2_round_correct: boolean;
  speed_bonus_given: boolean;
  round_start_time: number | null;
  current_state: Record<string, unknown> | null;
  winner_id: string | null;
}

type EventHandler = (payload: Record<string, unknown>) => void;

const INITIAL_STATE: BattleState = {
  phase: 'loading',
  currentRound: 0,
  totalRounds: 5,
  player1Score: 0,
  player2Score: 0,
  player1Lives: 3,
  player2Lives: 3,
  player1HintLevel: 0,
  player2HintLevel: 0,
  currentSong: null,
  timestamp: 0,
  audioDuration: 5,
  roundStartTime: 0,
  player1Correct: false,
  player2Correct: false,
  player1Answered: false,
  player2Answered: false,
  lastCorrectPlayer: null,
  battleMode: 'normal',
  artist: '7MZ',
  message: '',
};

export function useBattle(roomId: string | null, artist?: Artist) {
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<BattleState>(INITIAL_STATE);
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [playerNum, setPlayerNum] = useState<1 | 2 | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const playedSongsRef = useRef<Set<string>>(new Set());

  const isHost = playerNum === 1;
  const opponentNum: 1 | 2 | null = playerNum ? (playerNum === 1 ? 2 : 1) : null;

  const update = useCallback((patch: Partial<BattleState>) => {
    setState(prev => ({ ...prev, ...patch }));
  }, []);

  // ---- INIT: load room + subscribe ----
  useEffect(() => {
    if (!roomId) return;

    let cancelled = false;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setUserId(user.id);

      const { data: roomArr } = await supabase
        .from('game_rooms').select('*').eq('id', roomId).limit(1);
      const roomData = roomArr?.[0];

      if (!roomData || cancelled) {
        setError('Sala não encontrada');
        return;
      }

      setRoom(roomData as RoomRow);
      const pNum = (roomData as RoomRow).player1_id === user.id ? 1 : 2;
      setPlayerNum(pNum);

      // Determine initial phase
      const isWaiting = roomData.status === 'waiting';
      const bothConnected = roomData.status === 'playing' && roomData.player2_id;
      let initPhase: BattleState['phase'];
      if (isWaiting) {
        initPhase = 'waiting';
      } else if (bothConnected && roomData.current_round === 0) {
        initPhase = pNum === 1 ? 'countdown' : 'waiting';
      } else {
        const savedPhase = (roomData.current_state as Record<string, unknown>)?.phase as BattleState['phase'] | undefined;
        initPhase = savedPhase && ['countdown', 'playing', 'round_end', 'game_over'].includes(savedPhase) ? savedPhase : 'playing';
      }

      update({
        phase: initPhase,
        message: initPhase === 'countdown' ? 'Oponente conectado!' : '',
        currentRound: roomData.current_round,
        totalRounds: roomData.total_rounds,
        player1Score: roomData.player1_score,
        player2Score: roomData.player2_score,
        player1Lives: roomData.player1_lives,
        player2Lives: roomData.player2_lives,
        player1Correct: roomData.p1_round_correct,
        player2Correct: roomData.p2_round_correct,
        battleMode: roomData.battle_mode,
        artist: roomData.artist || '7MZ',
      });

      // Subscribe to broadcast channel
      const channel = supabase.channel(`battle:${roomId}`, {
        config: { broadcast: { self: false } },
      });

      // Auto-start countdown and first round (host only)
      const startCountdownAndRound = async () => {
        for (let i = 3; i >= 1; i--) {
          channel.send({ type: 'broadcast', event: 'countdown_tick', payload: { tick: i } });
          update({ phase: 'countdown', message: `Começando em ${i}...` });
          await new Promise(r => setTimeout(r, 1000));
        }

        const roundData = generateRound();
        const payload = { ...roundData, round: 1 };

        channel.send({ type: 'broadcast', event: 'round_start', payload });

        await supabase.from('game_rooms').update({
          current_round: 1,
          p1_round_correct: false,
          p2_round_correct: false,
          speed_bonus_given: false,
          round_start_time: roundData.roundStartTime as number,
          current_state: { phase: 'playing', round: 1 },
        }).eq('id', roomId);

        update({
          phase: 'playing',
          currentRound: 1,
          currentSong: roundData.song as Song,
          timestamp: roundData.timestamp as number,
          audioDuration: roundData.audioDuration as number,
          roundStartTime: roundData.roundStartTime as number,
          player1Correct: false,
          player2Correct: false,
          player1Answered: false,
          player2Answered: false,
          player1HintLevel: 0,
          player2HintLevel: 0,
          lastCorrectPlayer: null,
          message: 'Rodada 1',
        });
      };

      // Detect opponent joining via DB change (reliable fallback)
      channel.on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${roomId}`,
      }, (payload: { new: Record<string, unknown> }) => {
        const newRow = payload.new;
        if (newRow.player2_id && pNum === 1 && newRow.status === 'playing' && newRow.current_round === 0) {
          // Opponent just joined — host auto-starts countdown
          update({ phase: 'countdown', message: 'Oponente conectado!' });
          // Auto-start game after short delay
          setTimeout(() => {
            startCountdownAndRound();
          }, 1500);
        }
        // Sync scores/lives from DB
        update({
          player1Score: newRow.player1_score as number,
          player2Score: newRow.player2_score as number,
          player1Lives: newRow.player1_lives as number,
          player2Lives: newRow.player2_lives as number,
        });
      });

      channel.on('broadcast', { event: 'countdown_tick' }, (payload: { payload: Record<string, unknown> }) => {
        update({ phase: 'countdown', message: `Começando em ${payload.payload.tick}...` });
      });

      channel.on('broadcast', { event: 'round_start' }, (payload: { payload: Record<string, unknown> }) => {
        const d = payload.payload;
        playedSongsRef.current.add(d.songId as string);
        update({
          phase: 'playing',
          currentRound: d.round as number,
          currentSong: d.song as Song,
          timestamp: d.timestamp as number,
          audioDuration: d.audioDuration as number,
          roundStartTime: d.roundStartTime as number,
          player1Correct: false,
          player2Correct: false,
          player1Answered: false,
          player2Answered: false,
          lastCorrectPlayer: null,
          message: `Rodada ${d.round}`,
        });
      });

      channel.on('broadcast', { event: 'guess_result' }, (payload: { payload: Record<string, unknown> }) => {
        const d = payload.payload;
        const patch: Partial<BattleState> = {};
        if (d.playerNum === 1) {
          patch.player1Correct = d.isCorrect as boolean;
          if (d.scoreDelta) patch.player1Score = state.player1Score + (d.scoreDelta as number);
          if (d.lives !== undefined) patch.player1Lives = d.lives as number;
        } else {
          patch.player2Correct = d.isCorrect as boolean;
          if (d.scoreDelta) patch.player2Score = state.player2Score + (d.scoreDelta as number);
          if (d.lives !== undefined) patch.player2Lives = d.lives as number;
        }
        if (d.isCorrect) patch.lastCorrectPlayer = d.playerNum as number;
        if (d.gameOver) {
          patch.phase = 'game_over';
          patch.message = d.winnerText as string;
        }
        update(patch);
      });

      channel.on('broadcast', { event: 'hint_used' }, (payload: { payload: Record<string, unknown> }) => {
        const d = payload.payload;
        const oppNum = d.playerNum as number;
        const hintLevel = d.hintLevel as number;
        
        const patch: Partial<BattleState> = { message: `Oponente usou dica ${hintLevel}` };
        if (oppNum === 1) {
          patch.player1HintLevel = hintLevel;
        } else {
          patch.player2HintLevel = hintLevel;
        }
        update(patch);
        setTimeout(() => update({ message: '' }), 2000);
      });

      channel.on('broadcast', { event: 'round_end' }, () => {
        update({ phase: 'round_end' });
      });

      channel.on('broadcast', { event: 'next_round' }, (payload: { payload: Record<string, unknown> }) => {
        const d = payload.payload;
        playedSongsRef.current.add(d.songId as string);
        update({
          phase: 'playing',
          currentRound: d.round as number,
          currentSong: d.song as Song,
          timestamp: d.timestamp as number,
          audioDuration: d.audioDuration as number,
          roundStartTime: d.roundStartTime as number,
          player1Correct: false,
          player2Correct: false,
          player1Answered: false,
          player2Answered: false,
          lastCorrectPlayer: null,
          message: `Rodada ${d.round}`,
        });
      });

      channel.on('broadcast', { event: 'game_over' }, (payload: { payload: Record<string, unknown> }) => {
        const d = payload.payload;
        update({ phase: 'game_over', message: d.winnerText as string });
      });

      channel.on('broadcast', { event: 'rematch_request' }, () => {
        update({ message: 'Oponente quer revanche!' });
      });

      channel.on('broadcast', { event: 'opponent_left' }, () => {
        update({ phase: 'game_over', message: 'Oponente desconectou. Você venceu!' });
      });

      channel.subscribe();

      // Notify host that we joined (for guest reconnect scenarios)
      if (pNum === 2) {
        setTimeout(() => {
          channel.send({ type: 'broadcast', event: 'opponent_joined', payload: {} });
        }, 500);
      }

      channelRef.current = channel;
    };

    init();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, supabase, update]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- HOST: generate round song ----
  const generateRound = useCallback((): Record<string, unknown> => {
    const song = getRandomSong(
      Array.from(playedSongsRef.current),
      state.battleMode === 'inferno' ? undefined : undefined,
      state.artist as Artist,
    );
    if (!song) {
      playedSongsRef.current.clear();
      return generateRound(); // retry with fresh pool
    }

    const duration = state.battleMode === 'inferno' ? 10 : getAudioDuration(0);
    const timestamp = generateRandomTimestamp(song, duration);
    const roundStartTime = Date.now();

    return { song, timestamp, audioDuration: duration, roundStartTime, songId: song.id };
  }, [state.battleMode, state.artist]);

  // ---- HOST: start countdown + first round ----
  const startGame = useCallback(async () => {
    if (!isHost || !channelRef.current) return;

    // Countdown
    for (let i = 3; i >= 1; i--) {
      channelRef.current.send({ type: 'broadcast', event: 'countdown_tick', payload: { tick: i } });
      update({ phase: 'countdown', message: `Começando em ${i}...` });
      await new Promise(r => setTimeout(r, 1000));
    }

    const roundData = generateRound();
    const payload = { ...roundData, round: 1 };

    channelRef.current.send({ type: 'broadcast', event: 'round_start', payload });

    // Also update DB
    await supabase.from('game_rooms').update({
      current_round: 1,
      p1_round_correct: false,
      p2_round_correct: false,
      speed_bonus_given: false,
      round_start_time: roundData.roundStartTime as number,
      current_state: { phase: 'playing', round: 1 },
    }).eq('id', roomId);

    update({
      phase: 'playing',
      currentRound: 1,
      currentSong: roundData.song as Song,
      timestamp: roundData.timestamp as number,
      audioDuration: roundData.audioDuration as number,
      roundStartTime: roundData.roundStartTime as number,
      player1Correct: false,
      player2Correct: false,
      player1Answered: false,
      player2Answered: false,
      message: 'Rodada 1',
    });
  }, [isHost, roomId, supabase, generateRound, update]);

  // ---- ANY PLAYER: submit guess ----
  const submitGuess = useCallback((songId: string, hintLevel: number) => {
    if (!channelRef.current || !userId || !playerNum) return;
    if (state.phase !== 'playing') return;

    const isCorrect = songId === state.currentSong?.id;
    const now = Date.now();

    channelRef.current.send({
      type: 'broadcast',
      event: 'guess',
      payload: { playerNum, songId, hintLevel, isCorrect, timestamp: now },
    });

    // Host processes the guess
    if (isHost) {
      processGuess(playerNum, isCorrect, hintLevel, now);
    }
  }, [userId, playerNum, state.phase, state.currentSong, isHost]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- HOST: process a guess ----
  const processGuess = useCallback(async (
    pNum: 1 | 2,
    isCorrect: boolean,
    hintLevel: number,
    guessTime: number,
  ) => {
    if (!roomId || !channelRef.current) return;

    const livesKey = pNum === 1 ? 'player1_lives' : 'player2_lives';
    const correctKey = pNum === 1 ? 'p1_round_correct' : 'p2_round_correct';
    const scoreKey = pNum === 1 ? 'player1_score' : 'player2_score';

    let scoreDelta = 0;
    let newLives = pNum === 1 ? state.player1Lives : state.player2Lives;
    let gameOver = false;
    let winnerText = '';

    if (isCorrect) {
      // Calculate points
      if (state.battleMode === 'inferno') {
        scoreDelta = 100;
      } else {
        const basePoints = [100, 60, 30][Math.min(hintLevel, 2)];
        scoreDelta = basePoints;

        // Speed bonus: first correct without hints gets +30
        if (hintLevel === 0 && !state.player1Correct && !state.player2Correct) {
          scoreDelta += 30;
        }
      }
    } else {
      newLives = Math.max(0, newLives - 1);
      if (newLives <= 0) {
        gameOver = true;
        winnerText = pNum === 1 ? 'Jogador 2 venceu!' : 'Jogador 1 venceu!';
      }
    }

    const newP1Score = pNum === 1 ? state.player1Score + scoreDelta : state.player1Score;
    const newP2Score = pNum === 2 ? state.player2Score + scoreDelta : state.player2Score;
    const newP1Correct = pNum === 1 ? isCorrect : state.player1Correct;
    const newP2Correct = pNum === 2 ? isCorrect : state.player2Correct;

    // Broadcast result
    channelRef.current.send({
      type: 'broadcast',
      event: 'guess_result',
      payload: {
        playerNum: pNum,
        isCorrect,
        scoreDelta,
        lives: newLives,
        gameOver,
        winnerText,
      },
    });

    // Update local state
    const patch: Partial<BattleState> = {};
    if (pNum === 1) {
      patch.player1Correct = isCorrect;
      patch.player1Answered = true;
      patch.player1Score = newP1Score;
      patch.player1Lives = newLives;
    } else {
      patch.player2Correct = isCorrect;
      patch.player2Answered = true;
      patch.player2Score = newP2Score;
      patch.player2Lives = newLives;
    }
    if (isCorrect) patch.lastCorrectPlayer = pNum;
    if (gameOver) {
      patch.phase = 'game_over';
      patch.message = winnerText;
    }
    update(patch);

    // Update DB
    const dbUpdate: Record<string, unknown> = {
      [correctKey]: newP1Correct || newP2Correct,
      [livesKey]: newLives,
      [scoreKey]: pNum === 1 ? newP1Score : newP2Score,
      p1_round_correct: newP1Correct,
      p2_round_correct: newP2Correct,
    };

    if (gameOver) {
      dbUpdate.status = 'finished';
      dbUpdate.winner_id = pNum === 1 ? room?.player2_id : room?.player1_id;
      dbUpdate.current_state = { phase: 'game_over', winnerText };
    }

    await supabase.from('game_rooms').update(dbUpdate).eq('id', roomId);
  }, [roomId, state, room, supabase, update]);

  // ---- HOST: check if round is complete ----
  useEffect(() => {
    if (!isHost || state.phase !== 'playing') return;

    // Round ends only when BOTH players have answered
    const bothAnswered = state.player1Answered && state.player2Answered;
    if (!bothAnswered) return;

    // Auto-advance to next round after delay
    const timer = setTimeout(async () => {
      const nextRoundNum = state.currentRound + 1;

      if (nextRoundNum > state.totalRounds) {
        const winnerText =
          state.player1Score > state.player2Score ? 'Jogador 1 venceu!' :
          state.player2Score > state.player1Score ? 'Jogador 2 venceu!' : 'Empate!';

        channelRef.current?.send({ type: 'broadcast', event: 'game_over', payload: { winnerText } });
        update({ phase: 'game_over', message: winnerText });

        await supabase.from('game_rooms').update({
          status: 'finished',
          current_state: { phase: 'game_over', winnerText },
        }).eq('id', roomId);
        return;
      }

      const roundData = generateRound();
      const payload = { ...roundData, round: nextRoundNum };

      channelRef.current?.send({ type: 'broadcast', event: 'next_round', payload });

      await supabase.from('game_rooms').update({
        current_round: nextRoundNum,
        p1_round_correct: false,
        p2_round_correct: false,
        speed_bonus_given: false,
        round_start_time: roundData.roundStartTime as number,
        current_state: { phase: 'playing', round: nextRoundNum },
      }).eq('id', roomId);

      update({
        phase: 'playing',
        currentRound: nextRoundNum,
        currentSong: roundData.song as Song,
        timestamp: roundData.timestamp as number,
        audioDuration: roundData.audioDuration as number,
        roundStartTime: roundData.roundStartTime as number,
        player1Correct: false,
        player2Correct: false,
        player1Answered: false,
        player2Answered: false,
        lastCorrectPlayer: null,
        message: `Rodada ${nextRoundNum}`,
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [isHost, state.phase, state.currentRound, state.totalRounds, state.player1Answered, state.player2Answered, state.player1Correct, state.player2Correct, state.player1Score, state.player2Score, roomId, supabase, generateRound, update]);

  // ---- HOST: next round ----
  const nextRound = useCallback(async () => {
    if (!isHost || !channelRef.current) return;

    const nextRoundNum = state.currentRound + 1;

    if (nextRoundNum > state.totalRounds) {
      const winnerText =
        state.player1Score > state.player2Score ? 'Jogador 1 venceu!' :
        state.player2Score > state.player1Score ? 'Jogador 2 venceu!' : 'Empate!';

      channelRef.current.send({ type: 'broadcast', event: 'game_over', payload: { winnerText } });
      update({ phase: 'game_over', message: winnerText });

      await supabase.from('game_rooms').update({
        status: 'finished',
        current_state: { phase: 'game_over', winnerText },
      }).eq('id', roomId);
      return;
    }

    const roundData = generateRound();
    const payload = { ...roundData, round: nextRoundNum };

    channelRef.current.send({ type: 'broadcast', event: 'next_round', payload });

    await supabase.from('game_rooms').update({
      current_round: nextRoundNum,
      p1_round_correct: false,
      p2_round_correct: false,
      speed_bonus_given: false,
      round_start_time: roundData.roundStartTime as number,
      current_state: { phase: 'playing', round: nextRoundNum },
    }).eq('id', roomId);

    update({
      phase: 'playing',
      currentRound: nextRoundNum,
      currentSong: roundData.song as Song,
      timestamp: roundData.timestamp as number,
      audioDuration: roundData.audioDuration as number,
      roundStartTime: roundData.roundStartTime as number,
      player1Correct: false,
      player2Correct: false,
      player1Answered: false,
      player2Answered: false,
      lastCorrectPlayer: null,
      message: `Rodada ${nextRoundNum}`,
    });
  }, [isHost, state, roomId, supabase, generateRound, update]);

  // ---- ANY: use hint (normal mode only) ----
  const useHint = useCallback(() => {
    if (state.battleMode === 'inferno') return null;
    if (!playerNum || !channelRef.current) return null;

    const currentHintLevel = playerNum === 1 ? state.player1HintLevel : state.player2HintLevel;
    const newHintLevel = currentHintLevel + 1;
    if (newHintLevel > 2) return null;

    const duration = getAudioDuration(newHintLevel);

    channelRef.current.send({
      type: 'broadcast',
      event: 'hint_used',
      payload: { playerNum, hintLevel: newHintLevel },
    });

    return { duration, hintLevel: newHintLevel };
  }, [state.battleMode, playerNum, state.player1HintLevel, state.player2HintLevel]);

  // ---- ANY: leave ----
  const leave = useCallback(async () => {
    channelRef.current?.send({ type: 'broadcast', event: 'opponent_left', payload: {} });
    if (roomId) {
      await supabase.from('game_rooms').update({ status: 'abandoned' }).eq('id', roomId);
    }
  }, [roomId, supabase]);

  // ---- ANY: request rematch ----
  const requestRematch = useCallback(() => {
    channelRef.current?.send({ type: 'broadcast', event: 'rematch_request', payload: {} });
    update({ message: 'Aguardando oponente aceitar...' });
  }, [update]);

  return {
    state,
    room,
    playerNum,
    userId,
    isHost,
    opponentNum,
    error,
    startGame,
    submitGuess,
    nextRound,
    useHint,
    leave,
    requestRematch,
  };
}
