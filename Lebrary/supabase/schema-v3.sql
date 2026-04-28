-- Lebrary — Schema v3 additions
-- Run in Supabase SQL editor after schema-v2.sql. Idempotent.
--
-- Adds:
--   * Collections (custom shelves) — many-to-many with books, per-user.
--   * Quiz card reviews — SM-2 spaced-repetition state per (user, question).

---------------------------------------------------------------
-- Collections
---------------------------------------------------------------

create table if not exists public.lebrary_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  color text default 'amber',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists lebrary_collections_user_idx
  on public.lebrary_collections(user_id, created_at desc);

create table if not exists public.lebrary_collection_books (
  collection_id uuid references public.lebrary_collections(id) on delete cascade,
  book_id text references public.lebrary_books(id) on delete cascade,
  added_at timestamptz default now(),
  primary key (collection_id, book_id)
);

alter table public.lebrary_collections      enable row level security;
alter table public.lebrary_collection_books enable row level security;

drop policy if exists lebrary_collections_own      on public.lebrary_collections;
drop policy if exists lebrary_collection_books_own on public.lebrary_collection_books;

create policy lebrary_collections_own on public.lebrary_collections for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Membership rows are readable/writable only if the collection belongs to the user.
create policy lebrary_collection_books_own on public.lebrary_collection_books for all
  using (
    exists (
      select 1 from public.lebrary_collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.lebrary_collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

drop trigger if exists lebrary_collections_updated_at on public.lebrary_collections;
create trigger lebrary_collections_updated_at
  before update on public.lebrary_collections
  for each row execute function public.set_updated_at();

---------------------------------------------------------------
-- Spaced repetition — SM-2 card state
---------------------------------------------------------------

create table if not exists public.lebrary_quiz_card_reviews (
  user_id uuid references auth.users(id) on delete cascade,
  question_id text references public.lebrary_quiz_questions(id) on delete cascade,
  ease_factor real not null default 2.5,
  interval_days integer not null default 0,
  repetitions integer not null default 0,
  last_reviewed_at timestamptz,
  next_review_at timestamptz not null default now(),
  last_rating smallint,            -- 0=again, 1=hard, 2=good, 3=easy
  primary key (user_id, question_id)
);

-- Fast "what's due for this user?" query.
create index if not exists lebrary_quiz_card_reviews_due_idx
  on public.lebrary_quiz_card_reviews(user_id, next_review_at);

alter table public.lebrary_quiz_card_reviews enable row level security;

drop policy if exists lebrary_quiz_card_reviews_own on public.lebrary_quiz_card_reviews;

create policy lebrary_quiz_card_reviews_own on public.lebrary_quiz_card_reviews for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
