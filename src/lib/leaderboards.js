import { supabase } from './supabase'

export const LEADERBOARD_TABLE = 'leaderboard_entries'
const LEADERBOARD_LIMIT = 10

export async function fetchLeaderboard(sourceType, sourceId, roundCount) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase
    .from(LEADERBOARD_TABLE)
    .select('id, display_name, score, accuracy, correct_answers, total_rounds, round_count, created_at')
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .eq('round_count', roundCount)
    .order('score', { ascending: false })
    .order('accuracy', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(LEADERBOARD_LIMIT)

  if (error) {
    throw error
  }

  return data ?? []
}

export async function submitLeaderboardEntries({
  accuracy,
  correctAnswers,
  displayName,
  roundCount,
  score,
  sources,
  totalRounds,
}) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const rows = sources.map((source) => ({
    display_name: displayName,
    score,
    accuracy,
    correct_answers: correctAnswers,
    total_rounds: totalRounds,
    round_count: roundCount,
    source_type: source.type,
    source_id: source.id,
    source_name: source.name,
  }))

  const { error } = await supabase.from(LEADERBOARD_TABLE).insert(rows)

  if (error) {
    throw error
  }
}
