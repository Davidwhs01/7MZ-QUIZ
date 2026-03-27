import { createClient } from './client';

export async function saveGameScore(score: number, mode: string) {
  const supabase = createClient();
  
  // 1. Get current logged in user
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.user) {
    // User is not logged in, we don't save the score to global ranking
    return { success: false, reason: 'unauthenticated' };
  }

  const userId = session.user.id;

  try {
    // 2. Insert into match_history
    const { error: matchError } = await supabase
      .from('match_history')
      .insert({
        user_id: userId,
        score: score,
        mode: mode
      });

    if (matchError) throw matchError;

    // 3. Update or Insert into leaderboard
    // We need to fetch their current leaderboard stats first
    const { data: currentLeaderboard, error: fetchError } = await supabase
      .from('leaderboard')
      .select('score, games_played')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is 'not found'
      throw fetchError;
    }

    if (!currentLeaderboard) {
      // First time playing, insert
      const { error: insertLeadError } = await supabase
        .from('leaderboard')
        .insert({
          id: userId,
          score: score,
          games_played: 1
        });
        
      if (insertLeadError) throw insertLeadError;
    } else {
      // Update existing
      const { error: updateLeadError } = await supabase
        .from('leaderboard')
        .update({
          score: currentLeaderboard.score + score, // Cumulative score
          games_played: currentLeaderboard.games_played + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateLeadError) throw updateLeadError;
    }

    return { success: true };

  } catch (error) {
    console.error('Error saving game score:', error);
    return { success: false, reason: 'database_error', error };
  }
}
