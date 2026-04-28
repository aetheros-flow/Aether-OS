# Integration with AetherOS

Lebrary is a standalone app, but its data is designed to be readable from other
apps in the AetherOS ecosystem (same Supabase project, same `auth.users`).

## Canonical source of truth for "finished books"

AetherOS's `/ocio` dashboard currently derives the **"Libros leídos"** KPI from
its own `Ocio_books` table (`status = 'Leído'`). That table is the light-weight
tracker built into AetherOS; Lebrary is the deep-reading app.

**Going forward, Lebrary owns the authoritative "finished book" event.** When a
user reads the last chapter of a Lebrary book, `lebrary_reading_progress.finished_at`
is stamped with a timestamp (schema v4). Books archived simply as "Leído" in
AetherOS's `Ocio_books` are the legacy path — new books should flow through
Lebrary to get the rich chapter/quiz/highlight data.

### SQL to read finished books from AetherOS

From inside the AetherOS `useOcioData` hook, add a third source:

```ts
// AetherOS: useOcioData.ts (proposed addition)
const [ocioRes, lebraryFinishedRes] = await Promise.all([
  // …existing Ocio_books / Ocio_watchlist / etc. fetches…
  supabase
    .from('lebrary_reading_progress')
    .select('book_id, finished_at, lebrary_books(title_en, title_es, genre, author_id)')
    .eq('user_id', user.id)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false }),
]);
```

Because both tables live in the same Supabase project and the user is the same,
RLS on `lebrary_reading_progress` already returns only that user's rows. The
nested `lebrary_books(…)` selection resolves via the FK — a single round-trip.

### Unified KPI

```ts
const ocioBooksRead = ocioBooks.filter(b => b.status === 'Leído').length;
const lebraryBooksRead = lebraryFinished.length;
const totalBooksRead = ocioBooksRead + lebraryBooksRead;
```

Deduplication (if the same book appears in both): match by normalized title.
Rarely needed — in practice, the user uses one tracker per book.

### Cross-link UI

In `OcioDashboard` render the "Biblioteca" tab with two rows:

1. **"Lecturas en Lumina"** (finished books from `lebrary_reading_progress`) — each
   card has a "Ver en Lumina" button that opens
   `https://lebrary.netlify.app/books/<bookId>` in a new tab.
2. **"Tracker rápido"** (existing `Ocio_books` tracker) — for books the user
   just wants to check off without going through Lebrary's full flow.

A prominent button at the top of the tab: **"Abrir Biblioteca Lumina →"** opens
`https://lebrary.netlify.app/` directly.

## AI aura — cross-universe reading signals

Lebrary exposes rich reading signals that feed an ecosystem-wide AI pass. The
goal: build an "aura" that blends insights across universes (finances + reading +
relationships + health) instead of one-dimensional advice.

### What Lebrary contributes

For each user, aggregate:

- **Book type distribution** — `lebrary_books.genre` histogram, weighted by
  `finished_at` recency.
- **Reading cadence** — chapters read per week over the last N weeks from
  `lebrary_reading_progress.completed_chapter_ids` + `last_read_at`.
- **Depth of engagement** — ratio of highlights / chapters read, and ratio of
  highlights with a note / total highlights.
- **Retention signal** — SM-2 card performance from `lebrary_quiz_card_reviews`
  (avg ease_factor, % cards in mature interval ≥ 21 days).
- **Thematic clusters** — concat genre tags + chapter `key_ideas` from finished
  books → embed / summarize.

### The "aura" prompt shape

An ecosystem-level prompt for Gemini can blend these signals:

```
The reader finished 4 concept-dense books in the last 30 days (Frankl, Kahneman,
Dobelli, Einstein) and their SM-2 mature-card ratio is 68%. Their Dinero universe
shows consistent saving without investing. Their Ocio hobbies are solo-oriented
(reading, writing, photography). Health-wise: sleep averages 6.2h, stress score
is 7/10.

Given this reader's cross-universe state, reflect on:
1. One connection between what they're reading and what they're avoiding in
   other universes.
2. A question to sit with this week.
```

### Where this lives

- **Lebrary side**: expose a server-side function that returns the aggregated
  signals (`/api/reader-signals` or a Supabase Edge Function). Accepts the user's
  JWT, returns JSON.
- **AetherOS side**: the existing `lib/ai-service.ts` fetches signals from each
  universe's endpoint, concatenates them into a cross-universe prompt, calls
  Gemini, and renders the reflection in the AetherOS home dashboard.

This is the **Phase 5 / Phase 6** work. The building blocks in Lebrary exist
today (finished_at, key_ideas, genre, SM-2 stats). The ecosystem-level
aggregator lives in AetherOS.

## Table prefix conventions

| Prefix | Owner | Examples |
|---|---|---|
| `auth.*` | Supabase | `auth.users` (shared across everything) |
| `UserWheel`, `User_Reality_Check` | AetherOS | Wheel of Life |
| `Finanzas_*` (PascalCase + snake) | AetherOS | Dinero universe |
| `Ocio_*` (PascalCase + snake) | AetherOS | Ocio universe (lightweight tracker) |
| `lebrary_*` (lowercase snake) | Lebrary | Full reading app |

Any new app: pick a distinct prefix before creating tables. Never collide.
