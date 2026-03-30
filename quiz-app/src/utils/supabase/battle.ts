import { createClient } from './client';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createRoom(battleMode: 'normal' | 'inferno' = 'normal') {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { room: null, error: 'Login necessário' };

  // Cleanup old rooms
  await cleanupStaleRooms();

  const roomCode = generateRoomCode();
  const { data, error } = await supabase
    .from('game_rooms')
    .insert({
      room_code: roomCode,
      player1_id: user.id,
      status: 'waiting',
      battle_mode: battleMode,
      current_state: { phase: 'waiting' },
    })
    .select()
    .single();

  if (error) return { room: null, error: error.message };
  return { room: data, error: null };
}

export async function joinRoom(roomCode: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { room: null, error: 'Login necessário' };

  const { data: room, error: findErr } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('room_code', roomCode.toUpperCase().trim())
    .eq('status', 'waiting')
    .is('player2_id', null)
    .single();

  if (findErr || !room) return { room: null, error: 'Sala não encontrada ou já cheia' };
  if (room.player1_id === user.id) return { room: null, error: 'Você não pode entrar na sua própria sala' };

  const { data: updated, error: updateErr } = await supabase
    .from('game_rooms')
    .update({
      player2_id: user.id,
      status: 'playing',
      current_state: { phase: 'starting', message: 'Ambos os jogadores conectados!' },
    })
    .eq('id', room.id)
    .select()
    .single();

  if (updateErr) return { room: null, error: updateErr.message };
  return { room: updated, error: null };
}

export async function leaveRoom(roomId: string) {
  const supabase = createClient();
  await supabase
    .from('game_rooms')
    .update({ status: 'abandoned', updated_at: new Date().toISOString() })
    .eq('id', roomId);
}

export async function getRoom(roomId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('id', roomId)
    .single();
  return data;
}

async function cleanupStaleRooms() {
  const supabase = createClient();
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  await supabase
    .from('game_rooms')
    .update({ status: 'abandoned' })
    .eq('status', 'waiting')
    .lt('created_at', cutoff);
}
