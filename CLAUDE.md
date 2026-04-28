# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working Agreements

Behavioural rules that override default proactiveness. Read these before any task.

### Scope Discipline

Stay strictly within the requested scope. Do **not** redesign adjacent components, change navigation patterns (e.g. wheel nav, click counts, tab structure), or apply new aesthetics unless explicitly asked. If you spot something worth changing outside scope, **propose it first and wait for approval** — do not bundle it into the current change.

### Skill / Dependency Verification

Before claiming that a package, skill, or resource "doesn't exist", actually check it: WebSearch, GitHub, npm, the relevant registry, or the local `.claude/skills/` folder. Never respond from assumption on availability questions. If you cannot verify, say so — don't guess.

## Commands

```bash
npm run dev       # Start dev server (PWA service worker enabled — see caching note below)
npm run build     # Type-check (tsc -b) + Vite build
npm run lint      # ESLint
npm run preview   # Preview production build
```

Environment variables required in `.env.local`:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_TMDB_API_KEY=...   # Required by Ocio → Pantalla (TMDB v3)
```

Get a free TMDB key at https://www.themoviedb.org/settings/api (Developer → personal use).

Path alias: `@` → `./src` (vite.config.ts + tsconfig).

### PWA cache trap during dev

The dev build registers a service worker. After editing CSS/palette tokens, a normal reload may serve the stale bundle — changes appear "not to happen." To verify a change is live: open in an **incognito window**, OR DevTools → Application → Service Workers → **Unregister** + Storage → **Clear site data**, then hard reload.

## PWA / Caching Awareness

This project uses a PWA service worker. After making **any** visual / CSS / UI change, **always remind the user** to hard-refresh (`Cmd+Shift+R` on macOS, `Ctrl+Shift+R` on Windows/Linux) or to bump the SW cache version. Warn proactively at the moment of change — do not wait for the user to report "changes not showing." This single mistake has consumed real session time before; treat it as a default end-of-task reminder for any UI work.

## Runtime Constraints (Deno)

Parts of this project run on Deno (e.g. Supabase Edge Functions) with **worker memory limits** and **image dimension limits on uploads**. When writing code that may run in that runtime:

- Prefer plain `fetch()` over heavy SDKs that pull in large dependency trees.
- Validate image **size and dimension constraints** *before* building any feature that depends on uploads — fail fast at the boundary, don't let the runtime kill the worker.
- Be mindful of memory: avoid loading entire files into memory when streaming is possible.
- If a third-party library is Node-only (uses `fs`, `Buffer`, native bindings), it will not work in the Deno worker — pick a Deno-compatible alternative or implement the primitive yourself.

## Architecture Overview

Aether OS is a single-user personal "life OS" SPA organized around 8 life domains called **Universes**. The home screen is an SVG Wheel of Life; each segment navigates to that universe's dashboard.

### Top-level structure

```
src/
  core/           # Shared infrastructure (auth, routing, shell components)
  lib/            # Singletons + shared tokens
    supabase.ts          # Supabase client
    universe-palette.ts  # Soft Cosmos palette — SURFACE, UNIVERSE_ACCENT, alpha()
    ai-service.ts
    utils.ts
  components/     # Global shared UI (UniverseSelector, shadcn wrappers)
  universes/
    base/         # Home dashboard (Wheel of Life) + AetherDiagnostics
    dinero/       # Finance — reference implementation
    ocio/         # Leisure — also mirrors Dinero's pattern
      pages/OcioDashboard.tsx
      pantalla/   # Moviebase-style TMDB-backed Movies & TV tracker
      videos/     # YouTube multi-platform tracker
    salud/ amor/ familia/ social/
    desarrollopersonal/ desarrolloprofesional/
                  # Placeholder universes using UniverseDashboardShell
```

### Ocio → Pantalla (Movies & TV tracker)

Routed at `/ocio/pantalla/*` as a nested shell with bottom-nav tabs (Home, Movies, TV Shows, Profile) plus `/:mediaType/:tmdbId` for title detail. All user-scoped state lives in `Ocio_pantalla_*` tables (see `supabase/schema-pantalla.sql`). Catalog data (title, poster, cast, providers) is fetched live from TMDB and cached 5 min in-memory via `src/universes/ocio/pantalla/lib/tmdb.ts`.

### Core layer (`src/core/`)

- **`router.tsx`** — All routes. Everything except `/login` and `/registro` is wrapped in `<ProtectedRoute>`.
- **`contexts/AuthContext.tsx`** — Provides `{ user, session, loading }`. Full-screen spinner while resolving. Use `useAuth()` to get `user.id`.
- **`components/UniverseDashboardShell.tsx`** — Reusable layout for **placeholder universes** (amor, salud, familia, social, DP, DPP). Accepts `UniverseShellConfig` with `color`, `title`, `subtitle`, `headerIcon`, `moduleLabel`. Renders a sidebar + "Calibrating" placeholder unless `children` is provided.
- **`components/AetherModal.tsx`** — Shared modal. **Mobile**: drag-to-dismiss bottom sheet with spring physics (threshold: 120px offset or 500px/s velocity), grabber handle, safe-area padding, Escape to close. **Desktop**: centered panel with spring-scale enter. Surface is the shared `.neo-modal-panel` (warm paper-dark) — all 14 callers inherit automatically.
- **`components/UniverseMobileHeader.tsx`** — Mobile-only fixed top header. Accepts `color` (bg) and `textColor`. `isDark` auto-detects `#fff`, `#ffffff`, and `#F5EFE6` (Soft Cosmos off-white) to pick button/subtitle contrast.

### Universe pattern — two reference implementations

Fully built universes follow this structure (Dinero and Ocio are both reference):

```
universes/<name>/
  pages/          # Top-level page — owns all UI state + event handlers
  components/
    views/        # One component per tab (overview, transactions, …)
    modals/       # All modals bundled (e.g. DineroModals) + standalone sheets
    charts/       # Recharts components
    ui/           # Universe-specific primitives
  hooks/
    use<Name>Data.ts     # All fetching (one Promise.all)
    use<Name>Actions.ts  # All mutations (optimistic balance updates)
  lib/
    <name>-io.ts   # Pure utilities (e.g. CSV/XLSX/JSON/PDF parse + export)
  types/
    index.ts       # TypeScript interfaces + co-located Zod validation schemas
```

**Layout convention** (use this for any new universe and when migrating placeholder universes):

- **Top nav** (not left sidebar) with: back/logo on the left, horizontal `uppercase tracking-widest rounded-full` tab pills in the middle, context-aware primary CTA on the right.
- **Sub-header bar** with the active tab name (breadcrumb) on the left + a single signature stat on the right (e.g. `Net worth · $X`, `Calidad · X.X`).
- **Dashboard tab rhythm**: `OVERVIEW / <title>` hero + `+Add` → AI Insight card → 3-metric strip → 2-column split (primary + recent activity).
- **Mobile bottom nav** (5 items max), matches Dinero's pattern.

### State management pattern (Dinero example)

- The page component (`DineroDashboard.tsx`) owns all modal open/close booleans and form draft state.
- `use<Name>Data` fetches all collections in parallel via `Promise.all`. **Always** scoped with `.eq('user_id', uid)` as defense-in-depth alongside Supabase RLS — never remove these filters.
- `use<Name>Actions` receives `userId` + a `fetchData` callback; handles optimistic balance updates.
- When editing a transaction, always retrieve the **original** from the `transactions` array by ID to compute correct balance deltas — never use the stale form draft.

### Import pipeline (Dinero)

Two-phase: `analyzeImport` (parse file + AI categorize + dedupe) → `ImportPreviewSheet` shows prepared rows with toggles → `commitImport` inserts selected rows + recomputes account balance in one combined delta. `dinero-io.ts` validates MIME type, extension, and size (10 MB max) before processing. PDF.js worker is bundled locally (no CDN) to avoid supply-chain exposure.

### Supabase tables

| Table | Universe |
|---|---|
| `UserWheel` | Home — wheel scores (columns: user_id + one per universe id) |
| `User_Reality_Check` | Home — historical wheel score entries |
| `Finanzas_accounts` | Dinero |
| `Finanzas_transactions` | Dinero — joined with `Finanzas_accounts(name)` |
| `Finanzas_investments`, `Finanzas_projects` | Dinero |
| `Finanzas_crypto_radar` | Dinero — crypto trade journal |
| `Finanzas_categories`, `Finanzas_budgets`, `Finanzas_subscriptions` | Dinero |
| `Ocio_books`, `Ocio_hobbies`, `Ocio_bucket_list` | Ocio — manual trackers |
| `Ocio_pantalla_watchlist` | Pantalla — `{ user_id, tmdb_id, media_type, added_at }` |
| `Ocio_pantalla_history` | Pantalla — whole-title watched timestamp |
| `Ocio_pantalla_show_progress` | Pantalla — current season + episode per show |
| `Ocio_pantalla_episode_history` | Pantalla — audit trail of watched episodes |
| `Ocio_pantalla_ratings` | Pantalla — 1–10 stars per title |
| `Ocio_pantalla_hidden` | Pantalla — titles excluded from discover |

Legacy `Ocio_watchlist` is deprecated (tab removed from OcioDashboard).

### Wheel of Life (DashboardPage)

SVG wheel with 8 segments drawn via arc paths. Each segment has 10 filled arcs representing score (0–10). Scores are persisted to `UserWheel` on `mouseup`/`touchend` (not on every `onChange`); historical snapshots go to `User_Reality_Check`. The wheel uses the same warm paper-dark bg as the universes (`#1B1714`) for a cohesive home→universe transition.

## Design System — "Soft Cosmos"

The app uses a unified warm paper-dark skin. **Single source of truth:** `src/lib/universe-palette.ts`.

### Palette module

```ts
import { SURFACE, UNIVERSE_ACCENT, alpha } from '@/lib/universe-palette';

SURFACE.bg           // '#1B1714' — page background (warm near-black)
SURFACE.card         // '#221D19' — elevated card surface
SURFACE.panel        // '#241E1A' — modal / bottom sheet panel
SURFACE.text         // '#F5EFE6' — main text on dark (off-white, not pure white)
SURFACE.textMuted    // '#A8A096' — secondary text
SURFACE.border       // 'rgba(232,221,204,0.08)' — hairline border
SURFACE.borderStrong // 'rgba(232,221,204,0.16)' — focused border

UNIVERSE_ACCENT.amor                  // '#E05A7A' dusty rose
UNIVERSE_ACCENT.dinero                // '#7EC28A' sage green
UNIVERSE_ACCENT.desarrollopersonal    // '#6B8FC4' dusty blue
UNIVERSE_ACCENT.salud                 // '#D97A3A' warm terracotta
UNIVERSE_ACCENT.desarrolloprofesional // '#D9B25E' amber gold
UNIVERSE_ACCENT.social                // '#9F87C9' muted lavender
UNIVERSE_ACCENT.familia               // '#C090BC' dusty plum
UNIVERSE_ACCENT.ocio                  // '#D97265' coral clay

alpha(hex, 0.2)  // appends alpha to a hex, e.g. '#E05A7A33'
```

**Rule:** accents are ~20% desaturated from the original brand hexes. Do not reintroduce neon hexes (`#05DF72`, `#FF0040`, `#1447E6`, `#FE7F01`, `#C81CDE`, `#00E5FF`, `#FFD700`, etc.) — if found in code, migrate them to the palette module. Similarly, the warm bg replaced pure-black `#0A0A0A` and `bg-zinc-950` everywhere.

### CSS variables (`src/index.css`)

Palette mirrored as CSS vars for consumers that can't import TS:

```css
--aether-bg / --aether-card / --aether-panel
--aether-text / --aether-text-muted
--aether-border / --aether-border-strong

/* Per-universe identity (desaturated): */
--amor / --dinero / --desarrollopersonal / --salud
--desarrolloprofesional / --social / --familia / --ocio
```

### Aether UI Kit classes (`src/index.css @layer components`)

| Class | Purpose |
|---|---|
| `.aether-card` | White card (light surface), `rounded-[32px]`, `shadow-sm` — legacy light-bg pattern |
| `.aether-card-interactive` | Add to `.aether-card` for hover lift |
| `.aether-title` / `.aether-title-light` | Serif headings for light / dark bg |
| `.aether-eyebrow` / `.aether-eyebrow-light` | 10px uppercase labels |
| `.aether-metric-xl` / `.aether-metric-md` | Big KPI numbers |
| `.aether-input`, `.aether-btn` | Rounded-full premium inputs/buttons |
| `.aether-grain` | Subtle film-grain overlay — drop `<div className="aether-grain" aria-hidden />` on a `relative` parent |
| `.aether-grabber` | Drag handle pill for bottom sheets |
| `.custom-scrollbar` / `.hide-scrollbar` | 6px minimal / fully hidden scrollbar |

### Neo kit — warm paper-dark surfaces (`src/index.css @layer components`)

Used by Dinero, Ocio, and all universe shells. These classes read from the `--aether-*` vars so they inherit any future palette retune.

| Class | Purpose |
|---|---|
| `.neo-card` / `.neo-card-interactive` / `.neo-card-lg` | Warm dark cards with backdrop blur |
| `.neo-title` / `.neo-title-hero` | Sans-serif bold headings (on dark bg) |
| `.neo-eyebrow` / `.neo-label` | Muted 10px uppercase labels |
| `.neo-metric` | Big tabular metric numbers (`clamp(2.25rem, 7vw, 3.75rem)`) |
| `.neo-input` / `.neo-btn` / `.neo-btn-accent` / `.neo-chip` | Inputs / buttons / chips on warm dark |
| `.neo-modal-panel` | Warm paper-dark panel used by AetherModal |
| `.neo-bg` | Apply warm bg + off-white text to a container |

### Typography

- **Body / UI**: Geist Variable (`@fontsource-variable/geist`) + system-ui fallback
- **Headings** (`h1–h4`): Serif (Georgia) via `@apply font-serif tracking-tight`
- Some legacy components use Nunito via Google Fonts — being phased out in favor of Geist

### Animations

`tailwindcss-animate` + framer-motion. Standard enter: `animate-in fade-in slide-in-from-bottom-4 duration-500`. Spring physics in framer-motion: `{ type: 'spring', stiffness: 340, damping: 32 }` for modals; `{ stiffness: 280, damping: 24 }` for cards. Tap physics reused across universes: `{ scale: 0.96, filter: 'brightness(1.1)' }`.

## Key Conventions

- **Global navigation**: `UniverseSelector` (shadcn `<Select>`) is injected into each universe's top nav — reads `useLocation()` to show the current universe.
- **Zod validation**: Input schemas are co-located with types in `universes/<name>/types/index.ts`. Use them in action hooks before sending to Supabase.
- **File import security**: `dinero-io.ts` validates MIME, extension, and size (10 MB max). PDF.js worker is bundled locally.
- **`UniverseDashboardShell.lightBg`**: deprecated — the shell is warm-dark only now. Prop kept to avoid breaking callers but has no effect.
- **New universes / migrations**: follow the **Dinero/Ocio top-nav layout**, not the placeholder sidebar shell. Import accent from `UNIVERSE_ACCENT`. Surface colors must come from `SURFACE` or the `--aether-*` vars — never hard-code `#0A0A0A`, `bg-zinc-950`, or saturated identity hexes.


