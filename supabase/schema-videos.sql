-- =============================================================================
-- Ocio · Videos (URL-based multi-platform video tracker) — Supabase schema v1
-- =============================================================================
-- User-scoped tables for tracking videos the user wants to watch / has watched
-- across platforms (YouTube, Vimeo, Twitch, TikTok, etc.). Metadata (title,
-- thumbnail, duration) is fetched via noembed.com at insert time and cached
-- in the row — keeps the UX fast and avoids hammering platform APIs on render.
-- =============================================================================

-- ── Lists (playlists/collections) ─────────────────────────────────────────────
create table if not exists public."Ocio_videos_lists" (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  color       text,                    -- optional hex for list identity
  created_at  timestamptz not null default now()
);

alter table public."Ocio_videos_lists" enable row level security;

drop policy if exists "videos_lists_all" on public."Ocio_videos_lists";
create policy "videos_lists_all" on public."Ocio_videos_lists"
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Video items ───────────────────────────────────────────────────────────────
create table if not exists public."Ocio_videos_items" (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  list_id        uuid references public."Ocio_videos_lists"(id) on delete set null,
  url            text not null,
  platform       text not null check (platform in ('youtube','vimeo','twitch','tiktok','instagram','twitter','other')),
  external_id    text,                 -- platform-native ID (YouTube video id, etc.) — nullable for 'other'
  title          text,                 -- fetched via oEmbed, may be null if fetch failed
  thumbnail_url  text,
  author_name    text,
  duration_sec   integer,              -- optional, not all oEmbed sources give it
  description    text,                 -- user's note about why they saved it
  rating         integer check (rating between 1 and 10),
  watched_at     timestamptz,          -- null → not watched yet
  added_at       timestamptz not null default now()
);

alter table public."Ocio_videos_items" enable row level security;

drop policy if exists "videos_items_all" on public."Ocio_videos_items";
create policy "videos_items_all" on public."Ocio_videos_items"
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists videos_items_user_added_idx
  on public."Ocio_videos_items" (user_id, added_at desc);
create index if not exists videos_items_user_watched_idx
  on public."Ocio_videos_items" (user_id, watched_at desc nulls last);
create index if not exists videos_items_list_idx
  on public."Ocio_videos_items" (list_id, added_at desc);
create index if not exists videos_lists_user_idx
  on public."Ocio_videos_lists" (user_id, created_at desc);

-- Prevent duplicate URL saves per user (UX guardrail)
create unique index if not exists videos_items_user_url_uq
  on public."Ocio_videos_items" (user_id, url);
