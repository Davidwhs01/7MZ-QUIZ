-- ============================================================
-- GEEK ARENA - PVP BATTLE MODE (v2 - com sistema de vidas)
-- Rode no Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS game_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  player1_id UUID REFERENCES auth.users(id),
  player2_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished', 'abandoned')),
  current_round INT NOT NULL DEFAULT 0,
  total_rounds INT NOT NULL DEFAULT 5,
  battle_mode TEXT NOT NULL DEFAULT 'normal' CHECK (battle_mode IN ('normal', 'inferno')),
  player1_score INT NOT NULL DEFAULT 0,
  player2_score INT NOT NULL DEFAULT 0,
  player1_lives INT NOT NULL DEFAULT 3,
  player2_lives INT NOT NULL DEFAULT 3,
  p1_round_correct BOOLEAN NOT NULL DEFAULT FALSE,
  p2_round_correct BOOLEAN NOT NULL DEFAULT FALSE,
  speed_bonus_given BOOLEAN NOT NULL DEFAULT FALSE,
  round_start_time BIGINT,
  current_state JSONB,
  winner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_rooms_code ON game_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_game_rooms_p1 ON game_rooms(player1_id) WHERE status IN ('waiting', 'playing');
CREATE INDEX IF NOT EXISTS idx_game_rooms_p2 ON game_rooms(player2_id) WHERE status IN ('waiting', 'playing');

ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "create_rooms" ON game_rooms;
CREATE POLICY "create_rooms" ON game_rooms
  FOR INSERT WITH CHECK (auth.uid() = player1_id);

DROP POLICY IF EXISTS "view_rooms" ON game_rooms;
CREATE POLICY "view_rooms" ON game_rooms
  FOR SELECT USING (auth.uid() = player1_id OR auth.uid() = player2_id);

DROP POLICY IF EXISTS "update_rooms" ON game_rooms;
CREATE POLICY "update_rooms" ON game_rooms
  FOR UPDATE USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
