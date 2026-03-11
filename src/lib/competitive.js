import { supabase } from './supabase'

const PROFILES_TABLE = 'profiles'
const SOURCES_TABLE = 'blindtest_sources'
const ACTIVITIES_TABLE = 'play_activities'
const PRESETS_TABLE = 'game_presets'
const ONE_V_ONE_MATCHES_TABLE = 'one_v_one_matches'
const ONE_V_ONE_RESULTS_TABLE = 'one_v_one_results'
const MULTIPLAYER_LOBBIES_TABLE = 'multiplayer_lobbies'
const MULTIPLAYER_PLAYERS_TABLE = 'multiplayer_lobby_players'
const MULTIPLAYER_ANSWERS_TABLE = 'multiplayer_answers'
const TRENDING_VIEW = 'trending_blindtests'

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  return supabase
}

function createShortCode(length = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}

function calculateExpectedScore(rating, opponentRating) {
  return 1 / (1 + 10 ** ((opponentRating - rating) / 400))
}

function calculateEloDelta(rating, opponentRating, outcome, kFactor = 32) {
  return Math.round(kFactor * (outcome - calculateExpectedScore(rating, opponentRating)))
}

export async function fetchSession() {
  const client = requireSupabase()
  const { data, error } = await client.auth.getSession()

  if (error) {
    throw error
  }

  return data.session
}

export async function signUpWithEmail({ email, password, displayName }) {
  const client = requireSupabase()
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  })

  if (error) {
    throw error
  }

  if (data.session?.user) {
    await ensureProfile(data.session.user, displayName)
  } else if (data.user && data.session) {
    await ensureProfile(data.user, displayName)
  }

  return data
}

export async function signInWithEmail({ email, password }) {
  const client = requireSupabase()
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  if (data.user) {
    await ensureProfile(data.user)
  }

  return data
}

export async function signOutUser() {
  const client = requireSupabase()
  const { error } = await client.auth.signOut()

  if (error) {
    throw error
  }
}

export async function fetchProfile(userId) {
  const client = requireSupabase()
  const { data, error } = await client
    .from(PROFILES_TABLE)
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function ensureProfile(user, preferredDisplayName) {
  const client = requireSupabase()
  const displayName =
    preferredDisplayName?.trim() ||
    user.user_metadata?.display_name ||
    user.email?.split('@')[0] ||
    'Player'

  const { data, error } = await client
    .from(PROFILES_TABLE)
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        display_name: displayName.slice(0, 32),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'id',
      },
    )
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateProfile(userId, updates) {
  const client = requireSupabase()
  const { data, error } = await client
    .from(PROFILES_TABLE)
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function upsertBlindtestSource(source) {
  const client = requireSupabase()
  const payload = {
    id: `${source.type}:${source.id}`,
    source_type: source.type,
    name: source.name,
    cover_url: source.coverUrl ?? null,
    metadata: source.metadata ?? {},
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await client
    .from(SOURCES_TABLE)
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function recordPlayActivities({
  userId,
  mode,
  sources,
  roundCount,
  score,
  accuracy,
  correctAnswers,
  totalRounds,
}) {
  const client = requireSupabase()
  const rows = await Promise.all(
    sources.map(async (source) => {
      const savedSource = await upsertBlindtestSource(source)

      return {
        user_id: userId ?? null,
        mode,
        source_id: savedSource.id,
        source_type: savedSource.source_type,
        source_name: savedSource.name,
        round_count: roundCount,
        score,
        accuracy,
        correct_answers: correctAnswers,
        total_rounds: totalRounds,
      }
    }),
  )

  const { error } = await client.from(ACTIVITIES_TABLE).insert(rows)

  if (error) {
    throw error
  }
}

export async function fetchTrendingBlindtests(limit = 8) {
  const client = requireSupabase()
  const { data, error } = await client
    .from(TRENDING_VIEW)
    .select('*')
    .limit(limit)

  if (error) {
    throw error
  }

  return data ?? []
}

export async function createGamePreset({ createdBy, source, roundCount, rounds, metadata = {} }) {
  const client = requireSupabase()
  const savedSource = source ? await upsertBlindtestSource(source) : null

  const { data, error } = await client
    .from(PRESETS_TABLE)
    .insert({
      created_by: createdBy,
      source_id: savedSource?.id ?? null,
      round_count: roundCount,
      rounds,
      metadata,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function fetchPreset(presetId) {
  const client = requireSupabase()
  const { data, error } = await client.from(PRESETS_TABLE).select('*').eq('id', presetId).single()

  if (error) {
    throw error
  }

  return data
}

export async function createOneVOneMatch({
  createdBy,
  visibility,
  matchType,
  source,
  roundCount,
  rounds,
}) {
  const client = requireSupabase()
  const savedSource = await upsertBlindtestSource(source)
  const preset = await createGamePreset({
    createdBy,
    source,
    roundCount,
    rounds,
    metadata: {
      mode: 'one_v_one',
    },
  })

  const { data, error } = await client
    .from(ONE_V_ONE_MATCHES_TABLE)
    .insert({
      created_by: createdBy,
      visibility,
      match_type: matchType,
      join_code: visibility === 'private' ? createShortCode() : null,
      source_id: savedSource.id,
      source_type: savedSource.source_type,
      source_name: savedSource.name,
      round_count: roundCount,
      preset_id: preset.id,
      status: 'waiting',
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function fetchPublicOneVOneMatches(matchType) {
  const client = requireSupabase()
  let query = client
    .from(ONE_V_ONE_MATCHES_TABLE)
    .select('*')
    .eq('visibility', 'public')
    .eq('status', 'waiting')
    .order('created_at', { ascending: false })

  if (matchType) {
    query = query.eq('match_type', matchType)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data ?? []
}

export async function fetchUserOneVOneMatches(userId) {
  const client = requireSupabase()
  const { data, error } = await client
    .from(ONE_V_ONE_MATCHES_TABLE)
    .select('*')
    .or(`created_by.eq.${userId},opponent_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function fetchOneVOneMatchByCode(code) {
  const client = requireSupabase()
  const { data, error } = await client
    .from(ONE_V_ONE_MATCHES_TABLE)
    .select('*')
    .eq('join_code', code)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function joinOneVOneMatch(matchId, userId) {
  const client = requireSupabase()
  const { data, error } = await client
    .from(ONE_V_ONE_MATCHES_TABLE)
    .update({
      opponent_id: userId,
      status: 'active',
    })
    .eq('id', matchId)
    .is('opponent_id', null)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

async function applyRankedEloIfNeeded(match, results) {
  if (match.match_type !== 'ranked' || results.length !== 2) {
    return { winnerId: null, results }
  }

  const client = requireSupabase()
  const profiles = await Promise.all(results.map((result) => fetchProfile(result.user_id)))
  const [firstProfile, secondProfile] = profiles
  const [firstResult, secondResult] = results
  const winnerId =
    firstResult.score === secondResult.score
      ? firstResult.accuracy >= secondResult.accuracy
        ? firstResult.user_id
        : secondResult.user_id
      : firstResult.score > secondResult.score
        ? firstResult.user_id
        : secondResult.user_id

  const firstOutcome = winnerId === firstResult.user_id ? 1 : 0
  const secondOutcome = winnerId === secondResult.user_id ? 1 : 0
  const firstDelta = calculateEloDelta(firstProfile?.ranked_elo ?? 1000, secondProfile?.ranked_elo ?? 1000, firstOutcome)
  const secondDelta = calculateEloDelta(secondProfile?.ranked_elo ?? 1000, firstProfile?.ranked_elo ?? 1000, secondOutcome)

  await client
    .from(PROFILES_TABLE)
    .update({
      ranked_elo: Math.max(0, (firstProfile?.ranked_elo ?? 1000) + firstDelta),
      ranked_wins: (firstProfile?.ranked_wins ?? 0) + (firstOutcome === 1 ? 1 : 0),
      ranked_losses: (firstProfile?.ranked_losses ?? 0) + (firstOutcome === 0 ? 1 : 0),
      updated_at: new Date().toISOString(),
    })
    .eq('id', firstResult.user_id)

  await client
    .from(PROFILES_TABLE)
    .update({
      ranked_elo: Math.max(0, (secondProfile?.ranked_elo ?? 1000) + secondDelta),
      ranked_wins: (secondProfile?.ranked_wins ?? 0) + (secondOutcome === 1 ? 1 : 0),
      ranked_losses: (secondProfile?.ranked_losses ?? 0) + (secondOutcome === 0 ? 1 : 0),
      updated_at: new Date().toISOString(),
    })
    .eq('id', secondResult.user_id)

  const nextResults = [
    {
      ...firstResult,
      elo_change: firstDelta,
    },
    {
      ...secondResult,
      elo_change: secondDelta,
    },
  ]

  await client
    .from(ONE_V_ONE_RESULTS_TABLE)
    .upsert(nextResults.map((result) => ({ id: result.id, elo_change: result.elo_change })), { onConflict: 'id' })

  return {
    winnerId,
    results: nextResults,
  }
}

export async function submitOneVOneResult({
  matchId,
  userId,
  displayName,
  score,
  accuracy,
  correctAnswers,
  totalRounds,
}) {
  const client = requireSupabase()
  const { data: savedResult, error } = await client
    .from(ONE_V_ONE_RESULTS_TABLE)
    .upsert(
      {
        match_id: matchId,
        user_id: userId,
        display_name: displayName,
        score,
        accuracy,
        correct_answers: correctAnswers,
        total_rounds: totalRounds,
      },
      {
        onConflict: 'match_id,user_id',
      },
    )
    .select()
    .single()

  if (error) {
    throw error
  }

  const { data: match, error: matchError } = await client
    .from(ONE_V_ONE_MATCHES_TABLE)
    .select('*')
    .eq('id', matchId)
    .single()

  if (matchError) {
    throw matchError
  }

  const { data: results, error: resultsError } = await client
    .from(ONE_V_ONE_RESULTS_TABLE)
    .select('*')
    .eq('match_id', matchId)

  if (resultsError) {
    throw resultsError
  }

  let winnerId = null

  if ((results ?? []).length === 2) {
    const rankedResolution = await applyRankedEloIfNeeded(match, results)
    winnerId = rankedResolution.winnerId

    if (!winnerId) {
      const [firstResult, secondResult] = results
      winnerId =
        firstResult.score === secondResult.score
          ? firstResult.accuracy >= secondResult.accuracy
            ? firstResult.user_id
            : secondResult.user_id
          : firstResult.score > secondResult.score
            ? firstResult.user_id
            : secondResult.user_id
    }

    await client
      .from(ONE_V_ONE_MATCHES_TABLE)
      .update({
        status: 'completed',
        winner_id: winnerId,
        completed_at: new Date().toISOString(),
      })
      .eq('id', matchId)
  }

  return {
    savedResult,
    winnerId,
  }
}

export async function createMultiplayerLobby({
  hostId,
  source,
  roundCount,
  rounds,
}) {
  const client = requireSupabase()
  const savedSource = await upsertBlindtestSource(source)
  const preset = await createGamePreset({
    createdBy: hostId,
    source,
    roundCount,
    rounds,
    metadata: {
      mode: 'multiplayer',
    },
  })
  const joinCode = createShortCode()
  const { data: lobby, error } = await client
    .from(MULTIPLAYER_LOBBIES_TABLE)
    .insert({
      host_id: hostId,
      join_code: joinCode,
      source_id: savedSource.id,
      source_type: savedSource.source_type,
      source_name: savedSource.name,
      round_count: roundCount,
      preset_id: preset.id,
      status: 'waiting',
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return lobby
}

export async function fetchLobbyByCode(code) {
  const client = requireSupabase()
  const { data, error } = await client
    .from(MULTIPLAYER_LOBBIES_TABLE)
    .select('*')
    .eq('join_code', code)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function fetchPublicLobbies() {
  const client = requireSupabase()
  const { data, error } = await client
    .from(MULTIPLAYER_LOBBIES_TABLE)
    .select('*')
    .eq('status', 'waiting')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function joinMultiplayerLobby({ lobbyId, userId, displayName, isHost = false }) {
  const client = requireSupabase()
  const { data, error } = await client
    .from(MULTIPLAYER_PLAYERS_TABLE)
    .upsert(
      {
        lobby_id: lobbyId,
        user_id: userId,
        display_name: displayName,
        is_host: isHost,
      },
      {
        onConflict: 'lobby_id,user_id',
      },
    )
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function fetchLobbyPlayers(lobbyId) {
  const client = requireSupabase()
  const { data, error } = await client
    .from(MULTIPLAYER_PLAYERS_TABLE)
    .select('*')
    .eq('lobby_id', lobbyId)
    .order('joined_at', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function startMultiplayerLobby(lobbyId) {
  const client = requireSupabase()
  const { data, error } = await client
    .from(MULTIPLAYER_LOBBIES_TABLE)
    .update({
      status: 'live',
      started_at: new Date().toISOString(),
    })
    .eq('id', lobbyId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function finishMultiplayerLobby(lobbyId) {
  const client = requireSupabase()
  const { error } = await client
    .from(MULTIPLAYER_LOBBIES_TABLE)
    .update({
      status: 'finished',
      finished_at: new Date().toISOString(),
    })
    .eq('id', lobbyId)

  if (error) {
    throw error
  }
}

export async function submitMultiplayerAnswer({
  lobbyId,
  userId,
  roundNumber,
  selectedTrackId,
  isCorrect,
  earnedPoints,
}) {
  const client = requireSupabase()
  const { error } = await client
    .from(MULTIPLAYER_ANSWERS_TABLE)
    .upsert(
      {
        lobby_id: lobbyId,
        user_id: userId,
        round_number: roundNumber,
        selected_track_id: selectedTrackId,
        is_correct: isCorrect,
        earned_points: earnedPoints,
      },
      {
        onConflict: 'lobby_id,user_id,round_number',
      },
    )

  if (error) {
    throw error
  }
}

export async function fetchMultiplayerScoreboard(lobbyId) {
  const client = requireSupabase()
  const { data: players, error: playersError } = await client
    .from(MULTIPLAYER_PLAYERS_TABLE)
    .select('*')
    .eq('lobby_id', lobbyId)

  if (playersError) {
    throw playersError
  }

  const { data: answers, error: answersError } = await client
    .from(MULTIPLAYER_ANSWERS_TABLE)
    .select('*')
    .eq('lobby_id', lobbyId)

  if (answersError) {
    throw answersError
  }

  const answersByUser = new Map()

  ;(answers ?? []).forEach((answer) => {
    const previous = answersByUser.get(answer.user_id) ?? {
      score: 0,
      correctAnswers: 0,
      answersCount: 0,
    }

    answersByUser.set(answer.user_id, {
      score: previous.score + answer.earned_points,
      correctAnswers: previous.correctAnswers + (answer.is_correct ? 1 : 0),
      answersCount: previous.answersCount + 1,
    })
  })

  return (players ?? [])
    .map((player) => ({
      ...player,
      score: answersByUser.get(player.user_id)?.score ?? 0,
      correctAnswers: answersByUser.get(player.user_id)?.correctAnswers ?? 0,
      answersCount: answersByUser.get(player.user_id)?.answersCount ?? 0,
    }))
    .sort((left, right) => right.score - left.score)
}

export async function claimPrivateOneVOneMatch(matchId, userId) {
  const client = requireSupabase()
  const { data, error } = await client
    .from(ONE_V_ONE_MATCHES_TABLE)
    .update({ opponent_id: userId })
    .is('opponent_id', null)
    .eq('id', matchId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function activateOneVOneMatch(matchId) {
  const client = requireSupabase()
  const { data, error } = await client
    .from(ONE_V_ONE_MATCHES_TABLE)
    .update({ status: 'active' })
    .eq('id', matchId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function fetchOneVOneMatch(matchId) {
  const client = requireSupabase()
  const { data, error } = await client
    .from(ONE_V_ONE_MATCHES_TABLE)
    .select('*')
    .eq('id', matchId)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function fetchOneVOneMatchResults(matchId) {
  const client = requireSupabase()
  const { data, error } = await client
    .from(ONE_V_ONE_RESULTS_TABLE)
    .select('*')
    .eq('match_id', matchId)

  if (error) {
    throw error
  }

  return data ?? []
}

export function subscribeToLobby(lobbyId, onEvent) {
  const client = requireSupabase()

  return client
    .channel(`lobby-${lobbyId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: MULTIPLAYER_LOBBIES_TABLE,
        filter: `id=eq.${lobbyId}`,
      },
      (payload) => onEvent({ type: 'lobby', payload }),
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: MULTIPLAYER_PLAYERS_TABLE,
        filter: `lobby_id=eq.${lobbyId}`,
      },
      (payload) => onEvent({ type: 'player', payload }),
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: MULTIPLAYER_ANSWERS_TABLE,
        filter: `lobby_id=eq.${lobbyId}`,
      },
      (payload) => onEvent({ type: 'answer', payload }),
    )
    .subscribe()
}
