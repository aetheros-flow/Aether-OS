-- =============================================================================
-- Ocio · Pantalla (Moviebase-style tracker) — Supabase schema v1
-- =============================================================================
-- Six user-scoped tables storing references to TMDB entities (tmdb_id + media_type).
-- Catalog data (title, poster, overview, cast) is fetched live from TMDB; only
-- per-user state (watchlist membership, watched-at timestamps, ratings, progress,
-- hidden flag) is persisted here. Keep rows minimal — never mirror TMDB metadata.
-- =============================================================================

-- ── Watchlist ────────────────────────────────────────────────────────────────
create table if not exists public."Ocio_pantalla_watchlist" (
  user_id     uuid not null references auth.users(id) on delete cascade,
  tmdb_id     integer not null,
  media_type  text not null check (media_type in ('movie','tv')),
  added_at    timestamptz not null default now(),
  primary key (user_id, tmdb_id, media_type)
);

alter table public."Ocio_pantalla_watchlist" enable row level security;

drop policy if exists "pantalla_watchlist_select" on public."Ocio_pantalla_watchlist";
create policy "pantalla_watchlist_select" on public."Ocio_pantalla_watchlist"
  for select using (auth.uid() = user_id);
drop policy if exists "pantalla_watchlist_insert" on public."Ocio_pantalla_watchlist";
create policy "pantalla_watchlist_insert" on public."Ocio_pantalla_watchlist"
  for insert with check (auth.uid() = user_id);
drop policy if exists "pantalla_watchlist_delete" on public."Ocio_pantalla_watchlist";
create policy "pantalla_watchlist_delete" on public."Ocio_pantalla_watchlist"
  for delete using (auth.uid() = user_id);

-- ── Movie history (watched timestamps) ───────────────────────────────────────
create table if not exists public."Ocio_pantalla_history" (
  user_id     uuid not null references auth.users(id) on delete cascade,
  tmdb_id     integer not null,
  media_type  text not null check (media_type in ('movie','tv')),
  watched_at  timestamptz not null default now(),
  primary key (user_id, tmdb_id, media_type)
);

alter table public."Ocio_pantalla_history" enable row level security;

drop policy if exists "pantalla_history_select" on public."Ocio_pantalla_history";
create policy "pantalla_history_select" on public."Ocio_pantalla_history"
  for select using (auth.uid() = user_id);
drop policy if exists "pantalla_history_insert" on public."Ocio_pantalla_history";
create policy "pantalla_history_insert" on public."Ocio_pantalla_history"
  for insert with check (auth.uid() = user_id);
drop policy if exists "pantalla_history_update" on public."Ocio_pantalla_history";
create policy "pantalla_history_update" on public."Ocio_pantalla_history"
  for update using (auth.uid() = user_id);
drop policy if exists "pantalla_history_delete" on public."Ocio_pantalla_history";
create policy "pantalla_history_delete" on public."Ocio_pantalla_history"
  for delete using (auth.uid() = user_id);

-- ── TV show progress (current season + episode, one row per show) ────────────
create table if not exists public."Ocio_pantalla_show_progress" (
  user_id      uuid not null references auth.users(id) on delete cascade,
  tmdb_id      integer not null,
  season       integer not null default 1,
  episode      integer not null default 0,      -- 0 = not started, 1 = S01E01 seen
  updated_at   timestamptz not null default now(),
  primary key (user_id, tmdb_id)
);

alter table public."Ocio_pantalla_show_progress" enable row level security;

drop policy if exists "pantalla_progress_all" on public."Ocio_pantalla_show_progress";
create policy "pantalla_progress_all" on public."Ocio_pantalla_show_progress"
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Episode-level history (each watched episode, audit trail) ────────────────
create table if not exists public."Ocio_pantalla_episode_history" (
  user_id      uuid not null references auth.users(id) on delete cascade,
  tmdb_id      integer not null,                -- show id
  season       integer not null,
  episode      integer not null,
  watched_at   timestamptz not null default now(),
  primary key (user_id, tmdb_id, season, episode)
);

alter table public."Ocio_pantalla_episode_history" enable row level security;

drop policy if exists "pantalla_episode_history_all" on public."Ocio_pantalla_episode_history";
create policy "pantalla_episode_history_all" on public."Ocio_pantalla_episode_history"
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Ratings (1–10, Moviebase uses 10-point scale) ────────────────────────────
create table if not exists public."Ocio_pantalla_ratings" (
  user_id     uuid not null references auth.users(id) on delete cascade,
  tmdb_id     integer not null,
  media_type  text not null check (media_type in ('movie','tv')),
  stars       integer not null check (stars between 1 and 10),
  rated_at    timestamptz not null default now(),
  primary key (user_id, tmdb_id, media_type)
);

alter table public."Ocio_pantalla_ratings" enable row level security;

drop policy if exists "pantalla_ratings_all" on public."Ocio_pantalla_ratings";
create policy "pantalla_ratings_all" on public."Ocio_pantalla_ratings"
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Hidden items (user chose to never see again in discover) ─────────────────
create table if not exists public."Ocio_pantalla_hidden" (
  user_id     uuid not null references auth.users(id) on delete cascade,
  tmdb_id     integer not null,
  media_type  text not null check (media_type in ('movie','tv')),
  hidden_at   timestamptz not null default now(),
  primary key (user_id, tmdb_id, media_type)
);

alter table public."Ocio_pantalla_hidden" enable row level security;

drop policy if exists "pantalla_hidden_all" on public."Ocio_pantalla_hidden";
create policy "pantalla_hidden_all" on public."Ocio_pantalla_hidden"
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists pantalla_watchlist_added_idx
  on public."Ocio_pantalla_watchlist" (user_id, added_at desc);
create index if not exists pantalla_history_watched_idx
  on public."Ocio_pantalla_history" (user_id, watched_at desc);
create index if not exists pantalla_episode_history_watched_idx
  on public."Ocio_pantalla_episode_history" (user_id, watched_at desc);
