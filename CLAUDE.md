# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (PWA service worker enabled in dev)
npm run build     # Type-check + Vite build
npm run lint      # ESLint
npm run preview   # Preview production build
```

Environment variables required in `.env.local`:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Path alias: `@` → `./src` (configured in vite.config.ts and tsconfig).

## Architecture Overview

Aether OS is a personal "life OS" — a single-user SPA organized around 8 life domains called **Universes**. The home screen is an SVG Wheel of Life; each segment navigates to that universe's dashboard.

### Top-level structure

```
src/
  core/           # Shared infrastructure (auth, routing, shell components)
  lib/            # Singletons (supabase client, utils, ai-service)
  components/     # Global shared UI (UniverseSelector, shadcn wrappers)
  universes/      # One folder per life domain
    base/         # Home dashboard (Wheel of Life)
    dinero/       # Finance universe (the most developed)
    salud/        # Health — uses UniverseDashboardShell (in construction)
    amor/         # Love life — uses UniverseDashboardShell
    desarrollopersonal/
    desarrolloprofesional/
    social/
    familia/
    ocio/
```

### Core layer (`src/core/`)

- **`router.tsx`** — All routes defined here. Every route except `/login` and `/registro` is wrapped in `<ProtectedRoute>`.
- **`contexts/AuthContext.tsx`** — Provides `{ user, session, loading }`. Shows a full-screen spinner while resolving. Wrap new universes with `useAuth()` to get `user.id`.
- **`components/UniverseDashboardShell.tsx`** — Reusable layout for universes not yet built. Accepts a `UniverseShellConfig` with `color`, `title`, `subtitle`, `headerIcon`, `moduleLabel`, and optional `lightBg`. Renders the sidebar, back button, mobile menu, and a "módulo en construcción" placeholder unless `children` is provided.
- **`components/AetherModal.tsx`** — Shared modal wrapper.

### Universe pattern (Dinero as the reference)

Every universe follows this internal structure:

```
universes/dinero/
  pages/          # Top-level page component — owns all UI state + event handlers
  components/
    views/        # One component per tab (DineroOverview, DineroTransactions, …)
    modals/       # All modals for the universe in one file (DineroModals)
    charts/       # Recharts-based chart components
    ui/           # Universe-specific primitives
  hooks/
    useDineroData.ts     # All data fetching (single Promise.all)
    useDineroActions.ts  # All mutations (create/update/delete + balance logic)
  lib/
    dinero-io.ts   # Pure utilities: parseFile (CSV/XLSX/JSON/PDF import) + exportRecords
  types/
    index.ts       # TypeScript interfaces + co-located Zod validation schemas
```

**State management pattern in Dinero:**
- The page component (`DineroDashboard.tsx`) owns all modal open/close booleans and form draft state.
- `useDineroData` — fetches all 8 collections in parallel via `Promise.all`. Always scoped with `.eq('user_id', uid)` (defense-in-depth alongside Supabase RLS — never remove these filters).
- `useDineroActions` — receives `userId` and `fetchData` callback; handles optimistic balance updates after transactions.
- When editing a transaction, always retrieve the **original** from the `transactions` array by ID to compute correct balance deltas — never use the stale form draft.

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

### Wheel of Life (DashboardPage)

The home dashboard renders an SVG wheel with 8 segments drawn via arc paths. Each segment has 10 filled arcs representing score (0–10). Scores are persisted to `UserWheel` on `mouseup`/`touchend` (not on every `onChange`) and historical snapshots go to `User_Reality_Check`. The `SEGMENT_COLORS` map defines each universe's identity color.

## Design System

### Tailwind custom tokens (`tailwind.config.js`)

| Token | Value | Use |
|---|---|---|
| `forest.DEFAULT` | `#0B2118` | Dinero sidebar bg, primary dark |
| `forest.light` | `#163E2E` | Dinero subheader bg |
| `mint.DEFAULT` | `#A7F38F` | Primary accent / CTA |
| `mint.hover` | `#8EE874` | Hover state of accent |
| `sage.DEFAULT` | `#F4F9F2` | App background |
| `sage.dark` | `#E2EDE0` | Subtle surface |
| `charcoal` | `#2D3A35` | Dark text on light |

### Universe identity colors (CSS vars in `index.css`)

Each universe has a saturated identity color: `--amor: #FF0040`, `--dinero: #05DF72`, `--desarrollopersonal: #113DC0`, `--salud: #FE7F01`, `--desarrolloprofesional: #1D293D`, `--social: #1447E6`, `--familia: #C81CDE`, `--ocio: #1D293D`.

### Aether UI Kit classes (defined in `src/index.css`)

| Class | Purpose |
|---|---|
| `.aether-card` | White card, `rounded-[32px]`, `shadow-sm`, `border-gray-100` |
| `.aether-card-interactive` | Add to `.aether-card` for hover lift + shadow |
| `.aether-title` | Serif, 3xl–4xl, tracking-tight, `#2D2A26` |
| `.aether-title-light` | Same as above but for dark backgrounds |
| `.aether-eyebrow` | 10px, uppercase, tracking-[0.2em], bold — used for labels/tags |
| `.aether-eyebrow-light` | Same but for dark backgrounds |
| `.aether-metric-xl` | 6xl–7xl bold sans-serif — main KPI numbers |
| `.aether-metric-md` | 4xl–5xl — secondary metrics |
| `.aether-input` | Rounded-full input, gray-50 bg, focus ring |
| `.aether-btn` | Rounded-full button, shadow-md, active:scale-95 |
| `.aether-modal-backdrop` | Fixed backdrop with blur, slides up on mobile |
| `.aether-modal-panel` | White panel, rounded-t-[32px] on mobile / rounded-[32px] on desktop |
| `.custom-scrollbar` | Minimal 6px scrollbar |
| `.hide-scrollbar` | Fully hidden scrollbar |

### Typography

- **Body / UI**: Geist Variable (`@fontsource-variable/geist`) + system-ui fallback
- **Headings** (`h1–h4`): Serif (Georgia) via `@apply font-serif tracking-tight`
- **Historical pattern**: Some components use Nunito via Google Fonts (`style={{ fontFamily: "'Nunito', sans-serif" }}`), being phased out in favor of Geist

### Animations

`tailwindcss-animate` is installed. Use Tailwind's `animate-in`, `fade-in`, `slide-in-from-bottom-4`, `duration-*` utilities for enter animations. Example: `className="animate-in fade-in slide-in-from-bottom-4 duration-500"`.

## Key Conventions

- **Global navigation**: `UniverseSelector` (a shadcn `<Select>`) is injected into each universe's top nav — it reads `useLocation()` to show the current universe.
- **Zod validation**: Input schemas are co-located with types in `universes/<name>/types/index.ts`. Use them in action hooks before sending to Supabase.
- **File import security**: `dinero-io.ts` validates MIME type, extension, and size (10 MB max) before processing. PDF.js worker is bundled locally (no CDN) to prevent supply-chain exposure.
- **`UniverseDashboardShell` lightBg flag**: Set `lightBg={true}` when the universe color is light (e.g. Ocio cyan, Desarrollo Profesional gold) so text and button colors switch from white to dark automatically.
