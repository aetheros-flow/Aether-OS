/**
 * Aether OS — Universe Palette
 *
 * Single source of truth for the "Soft Cosmos" skin:
 *  - warm paper-dark surfaces (replaces pure-black #0A0A0A)
 *  - desaturated universe accents (used by the Wheel + universe pages)
 *
 * Import from anywhere in the app via `@/lib/universe-palette`.
 */

/** Warm paper-dark surface tokens. Keep these in sync with `neo-*` classes in index.css. */
export const SURFACE = {
  /** Page background — warm near-black with a hint of brown. */
  bg: '#1B1714',
  /** Elevated surface (header pills, top nav background). */
  card: '#221D19',
  /** Slightly lighter than card, used for modal panels. */
  panel: '#241E1A',
  /** Main text on dark. */
  text: '#F5EFE6',
  /** Secondary / muted text on dark. */
  textMuted: '#A8A096',
  /** Border hairline on warm dark. */
  border: 'rgba(232,221,204,0.08)',
  /** Stronger border for focused states. */
  borderStrong: 'rgba(232,221,204,0.16)',
} as const;

/**
 * Desaturated identity colors — ~20% less saturation than the raw brand hex.
 * Each universe's saturated color is preserved in index.css CSS vars (--amor etc.)
 * for legacy consumers; prefer this map when building new UI.
 */
export type UniverseId =
  | 'amor'
  | 'dinero'
  | 'desarrollopersonal'
  | 'salud'
  | 'desarrolloprofesional'
  | 'social'
  | 'familia'
  | 'ocio';

export const UNIVERSE_ACCENT: Record<UniverseId, string> = {
  amor:                 '#E05A7A', // dusty rose (was #FF0040)
  dinero:               '#7EC28A', // sage green (was #05DF72)
  desarrollopersonal:   '#6B8FC4', // dusty blue (was #113DC0)
  salud:                '#D97A3A', // warm terracotta (was #FE7F01)
  desarrolloprofesional:'#D9B25E', // amber gold (was #1D293D — was cold, now warm)
  social:               '#9F87C9', // muted lavender (was #1447E6)
  familia:              '#C090BC', // dusty plum (was #C81CDE)
  ocio:                 '#D97265', // coral clay (was #1D293D)
};

/** Subtle hex tints used for glows, chip backgrounds, etc. */
export const alpha = (hex: string, a: number) => {
  const clamp = Math.max(0, Math.min(1, a));
  const n = Math.round(clamp * 255).toString(16).padStart(2, '0').toUpperCase();
  return `${hex}${n}`;
};

/** Get a full per-universe theme in one call. */
export function universeTheme(id: UniverseId) {
  const accent = UNIVERSE_ACCENT[id];
  return {
    ...SURFACE,
    accent,
    accentSoft: alpha(accent, 0.16),
    accentTint: alpha(accent, 0.08),
    accentBorder: alpha(accent, 0.25),
  };
}
