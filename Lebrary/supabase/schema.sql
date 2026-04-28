-- Lebrary — Supabase schema
--
-- NAMESPACING: all tables prefixed with `lebrary_` so they coexist with other
-- AetherOS modules (ocio_watchlist_*, hobbies_*, etc.) in the same project.
--
-- Run this once in the Supabase SQL editor. Idempotent — safe to re-run.
--
-- Design:
--   * Catalog (lebrary_authors, lebrary_books, lebrary_chapters,
--     lebrary_quiz_questions) is world-readable. Writes go through the
--     service-role key from the ingest.
--   * Per-user data (lebrary_reading_progress, lebrary_favorites,
--     lebrary_highlights, lebrary_quiz_attempts, lebrary_user_preferences)
--     is RLS-scoped to auth.uid().

---------------------------------------------------------------
-- CATALOG  (public read, service-role write)
---------------------------------------------------------------

create table if not exists public.lebrary_authors (
  id text primary key,
  name text not null,
  image text default '',
  bio_en text,
  bio_es text,
  accomplishments jsonb default '[]'::jsonb,   -- [{en, es}, ...]
  birth_year integer,
  death_year integer,
  nationality text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.lebrary_books (
  id text primary key,
  title_en text,
  title_es text,
  author_id text references public.lebrary_authors(id) on delete set null,
  cover_image text default '',
  description_en text,
  description_es text,
  original_language text check (original_language in ('en', 'es')),
  original_file_path text,
  original_file_format text check (original_file_format in ('pdf','epub','mobi','txt')),
  original_file_size_bytes bigint,
  publication_year integer,
  genre text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists lebrary_books_author_idx on public.lebrary_books(author_id);
create index if not exists lebrary_books_genre_gin_idx on public.lebrary_books using gin (genre);

create table if not exists public.lebrary_chapters (
  id text primary key,
  book_id text references public.lebrary_books(id) on delete cascade,
  "order" integer not null,
  title_en text,
  title_es text,
  content_en text,
  content_es text,
  key_ideas jsonb default '[]'::jsonb,         -- [{en, es}, ...]
  estimated_reading_minutes integer,
  created_at timestamptz default now()
);

create index if not exists lebrary_chapters_book_idx on public.lebrary_chapters(book_id, "order");

create table if not exists public.lebrary_quiz_questions (
  id text primary key,
  book_id text references public.lebrary_books(id) on delete cascade,
  chapter_id text references public.lebrary_chapters(id) on delete set null,
  "order" integer,
  difficulty text check (difficulty in ('medium', 'hard')),
  question_en text,
  question_es text,
  options jsonb default '[]'::jsonb,           -- [{en, es}, ...]
  correct_option smallint check (correct_option between 0 and 3),
  explanation_en text,
  explanation_es text
);

create index if not exists lebrary_quiz_book_idx on public.lebrary_quiz_questions(book_id, "order");

-- Catalog RLS: world-readable, writes require service_role.
alter table public.lebrary_authors        enable row level security;
alter table public.lebrary_books          enable row level security;
alter table public.lebrary_chapters       enable row level security;
alter table public.lebrary_quiz_questions enable row level security;

drop policy if exists lebrary_authors_read_all        on public.lebrary_authors;
drop policy if exists lebrary_books_read_all          on public.lebrary_books;
drop policy if exists lebrary_chapters_read_all       on public.lebrary_chapters;
drop policy if exists lebrary_quiz_questions_read_all on public.lebrary_quiz_questions;

create policy lebrary_authors_read_all        on public.lebrary_authors        for select using (true);
create policy lebrary_books_read_all          on public.lebrary_books          for select using (true);
create policy lebrary_chapters_read_all       on public.lebrary_chapters       for select using (true);
create policy lebrary_quiz_questions_read_all on public.lebrary_quiz_questions for select using (true);
-- (no insert/update/delete policies — only service_role bypasses RLS by default)

---------------------------------------------------------------
-- PER-USER DATA  (RLS = auth.uid() match)
---------------------------------------------------------------

create table if not exists public.lebrary_reading_progress (
  user_id uuid references auth.users(id) on delete cascade,
  book_id text references public.lebrary_books(id) on delete cascade,
  completed_chapter_ids text[] default '{}',
  last_read_chapter_id text,
  last_read_at timestamptz default now(),
  primary key (user_id, book_id)
);

create table if not exists public.lebrary_favorites (
  user_id uuid references auth.users(id) on delete cascade,
  book_id text references public.lebrary_books(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, book_id)
);

create table if not exists public.lebrary_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  book_id text references public.lebrary_books(id) on delete cascade,
  chapter_id text references public.lebrary_chapters(id) on delete cascade,
  text text not null,
  language text check (language in ('en', 'es')),
  prefix text default '',
  suffix text default '',
  note text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists lebrary_highlights_user_book_idx on public.lebrary_highlights(user_id, book_id);
create index if not exists lebrary_highlights_chapter_idx   on public.lebrary_highlights(chapter_id);

create table if not exists public.lebrary_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  book_id text references public.lebrary_books(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,  -- {questionId: selectedIndex}
  score integer not null,
  total_questions integer not null,
  completed_at timestamptz default now()
);

create index if not exists lebrary_quiz_attempts_user_book_idx
  on public.lebrary_quiz_attempts(user_id, book_id, completed_at desc);

-- Reader-specific preferences. Theme + content language are candidates to move
-- to a shared `user_profiles` table later (cross-module concern).
create table if not exists public.lebrary_user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text check (theme in ('light', 'dark')) default 'light',
  content_language text check (content_language in ('en', 'es')) default 'en',
  reader_font_size text check (reader_font_size in ('sm', 'md', 'lg', 'xl')) default 'md',
  updated_at timestamptz default now()
);

-- Enable RLS on per-user tables and define strict policies.
alter table public.lebrary_reading_progress enable row level security;
alter table public.lebrary_favorites        enable row level security;
alter table public.lebrary_highlights       enable row level security;
alter table public.lebrary_quiz_attempts    enable row level security;
alter table public.lebrary_user_preferences enable row level security;

drop policy if exists lebrary_reading_progress_own on public.lebrary_reading_progress;
drop policy if exists lebrary_favorites_own        on public.lebrary_favorites;
drop policy if exists lebrary_highlights_own       on public.lebrary_highlights;
drop policy if exists lebrary_quiz_attempts_own    on public.lebrary_quiz_attempts;
drop policy if exists lebrary_user_preferences_own on public.lebrary_user_preferences;

create policy lebrary_reading_progress_own on public.lebrary_reading_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy lebrary_favorites_own on public.lebrary_favorites for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy lebrary_highlights_own on public.lebrary_highlights for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy lebrary_quiz_attempts_own on public.lebrary_quiz_attempts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy lebrary_user_preferences_own on public.lebrary_user_preferences for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

---------------------------------------------------------------
-- HOUSEKEEPING
---------------------------------------------------------------

-- Shared generic trigger — kept unprefixed since it's a utility usable across modules.
-- If AetherOS already created this function, `create or replace` keeps it intact.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists lebrary_books_updated_at            on public.lebrary_books;
drop trigger if exists lebrary_authors_updated_at          on public.lebrary_authors;
drop trigger if exists lebrary_highlights_updated_at       on public.lebrary_highlights;
drop trigger if exists lebrary_user_preferences_updated_at on public.lebrary_user_preferences;

create trigger lebrary_books_updated_at
  before update on public.lebrary_books
  for each row execute function public.set_updated_at();

create trigger lebrary_authors_updated_at
  before update on public.lebrary_authors
  for each row execute function public.set_updated_at();

create trigger lebrary_highlights_updated_at
  before update on public.lebrary_highlights
  for each row execute function public.set_updated_at();

create trigger lebrary_user_preferences_updated_at
  before update on public.lebrary_user_preferences
  for each row execute function public.set_updated_at();
