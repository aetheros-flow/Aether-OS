-- Lebrary — Schema v2 additions (Phase 2 / 3 features).
-- Run this AFTER schema.sql. Idempotent.
--
-- Adds book ratings (stars 1-5 + optional review). Per-user, RLS-protected.

create table if not exists public.lebrary_book_ratings (
  user_id uuid references auth.users(id) on delete cascade,
  book_id text references public.lebrary_books(id) on delete cascade,
  stars smallint check (stars between 1 and 5),
  review text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, book_id)
);

alter table public.lebrary_book_ratings enable row level security;

drop policy if exists lebrary_book_ratings_own on public.lebrary_book_ratings;

create policy lebrary_book_ratings_own on public.lebrary_book_ratings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists lebrary_book_ratings_updated_at on public.lebrary_book_ratings;

create trigger lebrary_book_ratings_updated_at
  before update on public.lebrary_book_ratings
  for each row execute function public.set_updated_at();
