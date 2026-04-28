# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## What this is

**Lumina Library** (repo name: `Lebrary`) — a premium deep-reading app with AI-curated
chapter summaries, spaced-repetition quizzes, highlights + notes, and a chat companion.

It is one of the apps in the **AetherOS ecosystem** — a sibling repo `Aether-OS` (life-OS
dashboard) lives at `c:\APPs\Aether-OS\`. Both apps share the same Supabase project for
auth + data.

### Ecosystem layout

```
Supabase project: aetheros (single)
├── auth.users                  ← shared across all apps
├── UserWheel, User_Reality_Check
├── Finanzas_*                  ← AetherOS "Dinero" universe
├── Ocio_books, Ocio_watchlist, Ocio_hobbies, Ocio_bucket_list
│                               ← AetherOS "Ocio" universe (simple tracker)
└── lebrary_*                   ← THIS repo (full reading app)

Netlify sites (independent deploys):
├── aetheros-flow.netlify.app   ← Aether-OS repo
└── lebrary.netlify.app         ← this repo

Cross-link: AetherOS /ocio → "Abrir Lumina" button → lebrary.netlify.app
```

Table naming: AetherOS uses `Capitalized_snake` (`Ocio_books`), Lebrary uses
`lowercase_snake` (`lebrary_books`). Never rename — both conventions are established.

## Commands

```bash
npm run dev              # Vite dev server + hot reload + dev-only /api/* plugins
npm run build            # tsc -b && vite build → dist/
npm run preview          # Preview production build

# Content pipeline (dev-only, requires GEMINI_API_KEY)
npm run ingest -- "public/books-text/<file>.txt"   # single-book ingest
npm run ingest:all       # batch all pending files
npm run ingest:watch     # chokidar watcher → auto-ingest on drop

# One-time migrations
npm run migrate:catalog  # public/data/*.json → lebrary_books/authors
npm run migrate:storage  # public/books/* → Supabase Storage bucket "books"
```

`.env` vars (never commit):
```
GEMINI_API_KEY=                    # Google AI Studio free-tier key
VITE_SUPABASE_URL=                 # shared aetheros project
VITE_SUPABASE_ANON_KEY=            # public, RLS-enforced
SUPABASE_SERVICE_ROLE_KEY=         # local-only, bypasses RLS for ingest
```

Path alias: `@` → `./src`.

## Tech stack

- **React 18** + TypeScript + Vite 5
- **react-router-dom 6** (createBrowserRouter)
- **Tailwind CSS 3** — hand-rolled components, no shadcn
- **lucide-react** for icons
- **@supabase/supabase-js** — catalog + user data + auth (magic link)
- **@google/genai** — Gemini 2.5 Flash/Flash-Lite for ingest + chat companion
- **chokidar** — folder watcher for auto-ingest
- Fonts: **Fraunces** (serif / body copy) + **Inter** (UI) via Google Fonts

Stack differs from AetherOS (React 19 + RR7 + shadcn + zustand + framer-motion).
A future unification would require a migration — not worth it until Lebrary features
stabilize.

## Architecture

```
src/
├── router/router.tsx              # All routes. /login is public; everything else
│                                    wrapped in <AuthGate>.
├── context/
│   ├── AuthContext.tsx            # Supabase magic-link auth; runs localStorage
│   │                                → DB migration on first login.
│   ├── ThemeContext.tsx           # light/dark toggle persisted in localStorage
│   └── LanguageContext.tsx        # content language toggle (en/es) — UI stays EN
├── lib/
│   ├── supabase.ts                # Browser client (anon key, auth.uid() → RLS)
│   ├── catalog.ts                 # fetchAllBooks() + fetchAllAuthors() (catalog reads)
│   ├── supabase-mappers.ts        # DB row ↔ app type converters
│   ├── storage-urls.ts            # resolveOriginalFileUrl() → public Storage URL
│   ├── highlight-export.ts        # Markdown builder for /notebook export
│   ├── sm2.ts                     # Simplified SuperMemo-2 spaced-repetition algo
│   ├── user-migration.ts          # one-time localStorage → DB migration
│   └── events.ts                  # triggerDataRefresh() event for live updates
├── hooks/                         # One hook per user-data table, all async + RLS-scoped
│   ├── useBooks.ts / useAuthors.ts
│   ├── useFavorites.ts            # lebrary_favorites
│   ├── useHighlights.ts           # lebrary_highlights (createHighlight is async!)
│   ├── useReadingProgress.ts      # lebrary_reading_progress
│   ├── useQuizAttempts.ts         # lebrary_quiz_attempts
│   ├── useQuizReviews.ts          # lebrary_quiz_card_reviews (SM-2 state)
│   ├── useBookRating.ts           # lebrary_book_ratings
│   └── useCollections.ts          # lebrary_collections + lebrary_collection_books
├── views/                         # One per route
│   ├── LibraryView                # Home — grid + search + filter popover + import
│   ├── BookDetailView             # Book page — rating, favorites, collections, chapters
│   ├── ReaderView                 # Chapter reader — highlights, AI chat, drop cap
│   ├── QuizView                   # Quiz runner — feeds SM-2 on completion
│   ├── ReviewView                 # /review — daily spaced-repetition session
│   ├── NotebookView               # /notebook — all highlights grouped by book→chapter
│   ├── FavoritesView              # /favorites
│   ├── CollectionsView / CollectionView  # /shelves, /shelves/:id
│   ├── StatsView                  # /stats — KPI dashboard
│   ├── AuthorsView / AuthorProfileView
│   └── LoginView
├── components/
│   ├── auth/                      # AuthGate, UserMenu
│   ├── books/                     # BookCard, BookCover (generated fallback), FavoriteButton,
│   │                                 DeleteBookButton, BookRating
│   ├── reader/                    # HighlightedParagraph, HighlightToolbar, HighlightPopover,
│   │                                 ChatPanel (AI companion)
│   ├── search/CommandPalette.tsx  # Cmd/Ctrl+K global search
│   ├── filters/FilterPopover.tsx  # Compact filter pill with expandable chips
│   ├── ingest/                    # ImportModal (dev-only)
│   ├── collections/AddToCollectionMenu.tsx
│   └── layout/                    # Layout, Navbar, Footer
└── types/index.ts                 # All TS interfaces; LocalizedText = { en?, es? }

scripts/                           # Node tools (tsx-run)
├── ingest-book.ts                 # CLI entry for single-book Gemini ingest
├── ingest-all.ts                  # Batch runner
├── watch-books.ts                 # chokidar folder watcher
├── migrate-json-to-db.ts          # public/data/*.json → Supabase
├── migrate-originals-to-storage.ts # public/books/* → Supabase Storage
└── lib/
    ├── gemini.ts                  # @google/genai client + JSON-repair fallback
    ├── prompt.ts                  # Ingest system prompt (book-type classifier +
    │                                 length guidance + bilingual output)
    ├── ingest.ts                  # Reusable ingestBookFile() function
    ├── ingest-log.ts              # scripts/.ingest-log.json tracks processed files
    ├── persist.ts                 # DB upserts for books/authors + dedup + delete
    ├── original-file.ts           # fuzzy-match .txt → PDF/EPUB in public/books
    ├── slug.ts                    # deterministic book/author IDs from titles
    ├── supabase-admin.ts          # service-role client (server-side only)
    ├── vite-ingest-plugin.ts      # POST /api/import + DELETE /api/books/:id
    └── vite-chat-plugin.ts        # POST /api/chat — AI reading companion

supabase/
├── schema.sql                     # Base — catalog + user-scoped tables + RLS
├── schema-v2.sql                  # lebrary_book_ratings
└── schema-v3.sql                  # lebrary_collections + lebrary_quiz_card_reviews

public/
├── data/books.json, authors.json  # Legacy seed (now stale; DB is source of truth)
├── books/                         # Original PDFs/EPUBs/MOBI (gitignored, in Storage)
└── books-text/                    # Calibre-converted .txt (gitignored, ingest input)
```

## Data model

### Catalog (public read, service-role write)

| Table | What |
|---|---|
| `lebrary_authors` | `{ id, name, bio_en/es, accomplishments jsonb, birth_year, death_year, nationality }` |
| `lebrary_books` | `{ id, title_en/es, author_id, description_en/es, original_language, original_file_path, genre text[], publication_year, cover_image }` |
| `lebrary_chapters` | `{ id, book_id, order, title_en/es, content_en/es, key_ideas jsonb, estimated_reading_minutes }` |
| `lebrary_quiz_questions` | `{ id, book_id, chapter_id, order, difficulty (medium\|hard), question_en/es, options jsonb, correct_option, explanation_en/es }` |

### Per-user (RLS = `auth.uid() = user_id`)

| Table | What |
|---|---|
| `lebrary_reading_progress` | `{ user_id, book_id, completed_chapter_ids text[], last_read_chapter_id, last_read_at }` — PK (user_id, book_id) |
| `lebrary_favorites` | `{ user_id, book_id, created_at }` — PK (user_id, book_id) |
| `lebrary_highlights` | `{ id uuid, user_id, book_id, chapter_id, text, language, prefix, suffix, note, created_at, updated_at }` |
| `lebrary_quiz_attempts` | `{ id uuid, user_id, book_id, answers jsonb, score, total_questions, completed_at }` |
| `lebrary_quiz_card_reviews` | `{ user_id, question_id, ease_factor, interval_days, repetitions, next_review_at, last_rating, last_reviewed_at }` — SM-2 state per card |
| `lebrary_book_ratings` | `{ user_id, book_id, stars (1-5), review }` |
| `lebrary_collections` | `{ id uuid, user_id, name, description, color }` |
| `lebrary_collection_books` | `{ collection_id, book_id, added_at }` |
| `lebrary_user_preferences` | `{ user_id, theme, content_language, reader_font_size }` |

### Storage

Bucket `books` (public) holds the original files (`.pdf`/`.epub`/`.mobi`). Keys are
sanitized filenames without diacritics (ñ/í/ú stripped — Supabase rejects them).
`resolveOriginalFileUrl(book)` generates public URLs on demand.

## Key design decisions

- **Two persistence layers during auth transition:** localStorage keys (`lumina.v1.*`)
  for favorites/progress/highlights/attempts existed pre-auth. First login runs
  `runUserDataMigration(userId)` once and sets `lumina.v1.migrated:<userId>` flag.
  Never delete localStorage — it stays as fallback for unauthenticated demos.
- **Dev-only plugins:** `/api/import`, `/api/books/:id`, `/api/chat` only run under
  `npm run dev`. Production (Netlify) is read-only. Any of these can move to
  Netlify Functions or Supabase Edge Functions when prod-writes are needed.
- **Content language is decoupled from UI language:** the whole UI is in English;
  book content toggles between `en`/`es` via `ContentLanguageContext`. Every
  `LocalizedText = { en?: string; es?: string }` — `localize()` helper handles
  fallback.
- **Book IDs are deterministic slugs** of the English title
  (`book-<slugify(titleEn)>`). Two ingests of the same book produce the same id
  and `mergeBook` UPDATEs instead of duplicating. Combined with fuzzy filename
  detection in `findPotentialDuplicate`, the ingest is safe to re-run.
- **Gemini ingest is bilingual in one call:** `buildIngestPrompt` requests EN+ES
  simultaneously. Google Search grounding is enabled so Gemini verifies
  `author.birthYear`, `publicationYear`, `nationality` against the live web.
- **Chapter max is hard-capped at 12** in the prompt — Gemini previously produced
  99 chapter entries for Dobelli, which truncated output tokens. For books with
  more natural chapters, Gemini groups them thematically.
- **SRS ratings are user-driven on `/review`**: after revealing the correct
  answer the user self-grades (Again/Hard/Good/Easy), which calibrates better
  than automatic correctness scoring.
- **AI companion is per-chapter scoped:** `ChatPanel` resets messages when
  `chapter.id` changes. The backend builds a system prompt with the chapter's
  full curated content + the user's highlights for that chapter, so Gemini
  responds with grounded context.

## Design system

Palette (custom Tailwind tokens in `tailwind.config.js`):

| Token | Role |
|---|---|
| `paper.50-400` | Warm cream light-mode surfaces |
| `ink.50-950` | Slate-warm dark-mode surfaces |
| `lumen.300-700` | Amber accent (CTAs, highlights, active state) |

Typography:
- `font-sans` → Inter (UI)
- `font-serif` → Fraunces (titles, reading body, epigraphs)

Reusable CSS classes in `src/styles/index.css`:

| Class | What |
|---|---|
| `.reading-body` | Fraunces reader prose (larger line-height, tracking) |
| `.reading-body > p:first-of-type::first-letter` | Drop cap (serif, amber) |
| `.epigraph` | Italic description with giant decorative quote mark |
| `.glass-surface` | Backdrop-blur surface — used in Cards, Navbar |
| `.flash-highlight` | 2.2s lumen pulse animation for deep-link to a highlight |

## Playbook for common tasks

### Add a new user-scoped feature
1. Add a `lebrary_<thing>` table in a new `supabase/schema-vN.sql`. RLS = `auth.uid() = user_id`, trigger for `updated_at`.
2. Add a hook `src/hooks/use<Thing>.ts` following the pattern: optimistic local state + Supabase upsert/delete + `useAuth()` gating. Hook returns `{ loading, error, getX, createX, updateX, deleteX }`.
3. Add a component in `src/components/<area>/` that consumes the hook. Keep it dumb (props-driven) if shared across views.
4. Wire it into the relevant view (usually `BookDetailView` or a new view under `src/views/`).
5. Apply the SQL in Supabase SQL Editor manually. The app picks it up live.

### Add a new route
1. `src/views/NewView.tsx` — follow existing view conventions (`LoadingState`/`ErrorState` from `components/common`, epigraph + grid pattern).
2. Add to `src/router/router.tsx`, wrapped in `gated(<NewView />)` if auth-required.
3. Add a `NavLink` to `src/components/layout/Navbar.tsx`.

### Ingest a new book
1. Drop the source file (.pdf/.epub/.mobi) into `public/books/`.
2. Convert to `.txt` via Calibre's `ebook-convert` → drop in `public/books-text/`.
   Or run `scripts/convert-books.ps1` for batch conversion (requires Calibre).
3. Trigger ingest: GUI (Import button in Library) / `npm run ingest -- "path.txt"` / drop into `books-text/` while `npm run ingest:watch` is running.
4. Gemini does the rest. Book appears in the grid after `triggerDataRefresh()`.

## What NOT to do

- **Never** add `SUPABASE_SERVICE_ROLE_KEY` to `VITE_`-prefixed env or to Netlify build-time env. It bypasses RLS — browser access would be catastrophic.
- **Never** remove `.eq('user_id', user.id)` filters from hooks, even though RLS would block cross-user reads. Defense-in-depth.
- **Never** commit `public/books/*` (copyrighted PDFs) or `.env` (secrets). Both are gitignored.
- **Never** assume the Netlify deploy can write anything — only the dev server has `/api/*` plugins. Any prod-write feature needs a Netlify Function or Supabase Edge Function.
- **Don't** rename table columns without a corresponding `ALTER TABLE` migration SQL committed to `supabase/`. The mappers in `src/lib/supabase-mappers.ts` would silently return `null`.

## Current status (2026-04-21)

Phase 1 (catalog in DB), Phase 2 (auth + user data in DB), and Phase 3 (storage) are complete. All four follow-up features shipped: global Cmd+K search, collections/shelves, spaced-repetition review, AI chapter companion.

The app is functional end-to-end in dev and deployable to Netlify (reads only; writes via dev server).

Next natural milestones:
1. **PWA / offline mode** — vite-plugin-pwa + service worker for offline reading.
2. **Migrate dev-only endpoints to Supabase Edge Functions** so GUI import/delete/chat work in production.
3. **Shared user profile table** across AetherOS apps (theme/language/display name) — currently per-app.
4. **Stack unification with AetherOS** if/when that becomes a priority (React 19, shadcn, framer-motion) — would be a multi-week migration.
