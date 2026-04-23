// ── TMDB constants: provider IDs, network IDs, region, accent ────────────────
// Provider IDs come from /watch/providers/movie. Network IDs from TMDB itself
// (Netflix=213, Disney+=2739, Prime=1024, Apple TV+=2552).

export const PANTALLA_ACCENT = '#E11D1D';

/** Default watch region used for discover + watch/providers. */
export const DEFAULT_REGION = 'AR';

/** The four streaming providers surfaced in Home + filters. */
export const STREAMING_PROVIDERS = [
  { id: 8,   key: 'netflix',   name: 'Netflix',    color: '#E50914' },
  { id: 337, key: 'disney',    name: 'Disney+',    color: '#113CCF' },
  { id: 9,   key: 'prime',     name: 'Prime Video', color: '#00A8E1' },
  { id: 350, key: 'apple',     name: 'Apple TV+',  color: '#A7A9AC' },
] as const;

export type StreamingProviderKey = (typeof STREAMING_PROVIDERS)[number]['key'];

/** Network IDs used for "Network Production" row — TV-only discovery. */
export const STREAMING_NETWORKS = [
  { id: 213,  key: 'netflix',   name: 'Netflix' },
  { id: 2739, key: 'disney',    name: 'Disney+' },
  { id: 1024, key: 'prime',     name: 'Prime Video' },
  { id: 2552, key: 'apple',     name: 'Apple TV+' },
] as const;
