create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text not null check (char_length(display_name) between 1 and 32),
  avatar_url text,
  ranked_elo integer not null default 1000 check (ranked_elo >= 0),
  ranked_wins integer not null default 0 check (ranked_wins >= 0),
  ranked_losses integer not null default 0 check (ranked_losses >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.blindtest_sources (
  id text primary key,
  source_type text not null check (source_type in ('artist', 'playlist')),
  name text not null,
  cover_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.play_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  mode text not null check (mode in ('solo', 'one_v_one', 'multiplayer')),
  source_id text not null references public.blindtest_sources (id) on delete cascade,
  source_type text not null check (source_type in ('artist', 'playlist')),
  source_name text not null,
  round_count integer not null check (round_count in (5, 10, 15, 20)),
  score integer not null check (score >= 0),
  accuracy integer not null check (accuracy between 0 and 100),
  correct_answers integer not null check (correct_answers >= 0),
  total_rounds integer not null check (total_rounds > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.game_presets (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles (id) on delete set null,
  source_id text references public.blindtest_sources (id) on delete set null,
  round_count integer not null check (round_count in (5, 10, 15, 20)),
  rounds jsonb not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.one_v_one_matches (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  opponent_id uuid references public.profiles (id) on delete set null,
  visibility text not null check (visibility in ('public', 'private')),
  match_type text not null check (match_type in ('ranked', 'unranked')),
  status text not null default 'waiting' check (status in ('waiting', 'active', 'completed', 'cancelled')),
  join_code text unique,
  source_id text references public.blindtest_sources (id) on delete set null,
  source_type text not null check (source_type in ('artist', 'playlist')),
  source_name text not null,
  round_count integer not null check (round_count in (5, 10, 15, 20)),
  preset_id uuid not null references public.game_presets (id) on delete cascade,
  winner_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

create table if not exists public.one_v_one_results (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.one_v_one_matches (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  display_name text not null,
  score integer not null check (score >= 0),
  accuracy integer not null check (accuracy between 0 and 100),
  correct_answers integer not null check (correct_answers >= 0),
  total_rounds integer not null check (total_rounds > 0),
  elo_change integer,
  created_at timestamptz not null default timezone('utc', now()),
  unique (match_id, user_id)
);

create table if not exists public.multiplayer_lobbies (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'waiting' check (status in ('waiting', 'live', 'finished', 'cancelled')),
  join_code text not null unique,
  source_id text references public.blindtest_sources (id) on delete set null,
  source_type text not null check (source_type in ('artist', 'playlist')),
  source_name text not null,
  round_count integer not null check (round_count in (5, 10, 15, 20)),
  preset_id uuid references public.game_presets (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  finished_at timestamptz
);

create table if not exists public.multiplayer_lobby_players (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references public.multiplayer_lobbies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  display_name text not null,
  is_host boolean not null default false,
  joined_at timestamptz not null default timezone('utc', now()),
  unique (lobby_id, user_id)
);

create table if not exists public.multiplayer_answers (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references public.multiplayer_lobbies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  round_number integer not null check (round_number > 0),
  selected_track_id text,
  is_correct boolean not null,
  earned_points integer not null check (earned_points >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (lobby_id, user_id, round_number)
);

create or replace view public.trending_blindtests as
select
  pa.source_id,
  pa.source_type,
  pa.source_name,
  bs.cover_url,
  count(*)::int as play_count,
  max(pa.created_at) as last_played_at
from public.play_activities pa
left join public.blindtest_sources bs on bs.id = pa.source_id
where pa.created_at >= timezone('utc', now()) - interval '14 days'
group by pa.source_id, pa.source_type, pa.source_name, bs.cover_url
order by play_count desc, last_played_at desc;

create index if not exists play_activities_lookup_idx
  on public.play_activities (source_id, created_at desc);

create index if not exists one_v_one_matches_status_idx
  on public.one_v_one_matches (status, match_type, visibility, created_at desc);

create index if not exists multiplayer_lobbies_status_idx
  on public.multiplayer_lobbies (status, created_at desc);

alter table public.profiles enable row level security;
alter table public.blindtest_sources enable row level security;
alter table public.play_activities enable row level security;
alter table public.game_presets enable row level security;
alter table public.one_v_one_matches enable row level security;
alter table public.one_v_one_results enable row level security;
alter table public.multiplayer_lobbies enable row level security;
alter table public.multiplayer_lobby_players enable row level security;
alter table public.multiplayer_answers enable row level security;

drop policy if exists "profiles are publicly readable" on public.profiles;
create policy "profiles are publicly readable"
  on public.profiles
  for select
  using (true);

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "sources are publicly readable" on public.blindtest_sources;
create policy "sources are publicly readable"
  on public.blindtest_sources
  for select
  using (true);

drop policy if exists "authenticated can write sources" on public.blindtest_sources;
create policy "authenticated can write sources"
  on public.blindtest_sources
  for all
  using (true)
  with check (true);

drop policy if exists "activities are publicly readable" on public.play_activities;
create policy "activities are publicly readable"
  on public.play_activities
  for select
  using (true);

drop policy if exists "authenticated can write activities" on public.play_activities;
create policy "authenticated can write activities"
  on public.play_activities
  for all
  using (true)
  with check (true);

drop policy if exists "game presets readable" on public.game_presets;
create policy "game presets readable"
  on public.game_presets
  for select
  to authenticated
  using (true);

drop policy if exists "authenticated can write game presets" on public.game_presets;
create policy "authenticated can write game presets"
  on public.game_presets
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can read matches" on public.one_v_one_matches;
create policy "authenticated can read matches"
  on public.one_v_one_matches
  for select
  to authenticated
  using (true);

drop policy if exists "authenticated can write matches" on public.one_v_one_matches;
create policy "authenticated can write matches"
  on public.one_v_one_matches
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can read match results" on public.one_v_one_results;
create policy "authenticated can read match results"
  on public.one_v_one_results
  for select
  to authenticated
  using (true);

drop policy if exists "authenticated can write match results" on public.one_v_one_results;
create policy "authenticated can write match results"
  on public.one_v_one_results
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can read lobbies" on public.multiplayer_lobbies;
create policy "authenticated can read lobbies"
  on public.multiplayer_lobbies
  for select
  to authenticated
  using (true);

drop policy if exists "authenticated can write lobbies" on public.multiplayer_lobbies;
create policy "authenticated can write lobbies"
  on public.multiplayer_lobbies
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can read lobby players" on public.multiplayer_lobby_players;
create policy "authenticated can read lobby players"
  on public.multiplayer_lobby_players
  for select
  to authenticated
  using (true);

drop policy if exists "authenticated can write lobby players" on public.multiplayer_lobby_players;
create policy "authenticated can write lobby players"
  on public.multiplayer_lobby_players
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can read multiplayer answers" on public.multiplayer_answers;
create policy "authenticated can read multiplayer answers"
  on public.multiplayer_answers
  for select
  to authenticated
  using (true);

drop policy if exists "authenticated can write multiplayer answers" on public.multiplayer_answers;
create policy "authenticated can write multiplayer answers"
  on public.multiplayer_answers
  for all
  to authenticated
  using (true)
  with check (true);
