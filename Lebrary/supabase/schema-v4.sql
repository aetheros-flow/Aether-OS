-- Lebrary — Schema v4
-- Run after schema-v3.sql. Idempotent.
--
-- Adds:
--   * `finished_at` column to lebrary_reading_progress so finishing a book is
--     a first-class timestamped fact (instead of derived from completed_chapter_ids
--     == chapter count). Easier to query from AetherOS for cross-universe KPIs.
--   * Index for fast "finished books for this user" queries.

alter table public.lebrary_reading_progress
  add column if not exists finished_at timestamptz;

create index if not exists lebrary_reading_progress_finished_idx
  on public.lebrary_reading_progress(user_id, finished_at desc)
  where finished_at is not null;

-- Backfill: for any existing reading_progress row where all chapters are complete,
-- set finished_at to last_read_at. Safe to re-run.
update public.lebrary_reading_progress rp
set finished_at = coalesce(rp.finished_at, rp.last_read_at)
from (
  select b.id as book_id, count(c.id) as total_chapters
  from public.lebrary_books b
  left join public.lebrary_chapters c on c.book_id = b.id
  group by b.id
) ch
where rp.book_id = ch.book_id
  and ch.total_chapters > 0
  and array_length(rp.completed_chapter_ids, 1) >= ch.total_chapters
  and rp.finished_at is null;
