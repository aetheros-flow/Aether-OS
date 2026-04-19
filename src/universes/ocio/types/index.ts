// ── Ocio Universe Types ───────────────────────────────────────────────────────

export type BookStatus     = 'Leyendo' | 'Leído' | 'Por leer';
export type WatchStatus    = 'Viendo' | 'Visto' | 'Pendiente';
export type BucketStatus   = 'Pendiente' | 'En progreso' | 'Completado';

// ── Domain models ─────────────────────────────────────────────────────────────

export interface OcioBook {
  id: string;
  user_id: string;
  title: string;
  author: string;
  status: BookStatus;
  rating: number | null;
  notes: string | null;
  created_at: string;
}

export interface OcioWatchlistItem {
  id: string;
  user_id: string;
  title: string;
  platform: string;
  status: WatchStatus;
  genre: string | null;
  rating: number | null;
  created_at: string;
}

export interface OcioHobby {
  id: string;
  user_id: string;
  name: string;
  frequency: string;
  last_practiced: string | null;
  notes: string | null;
  created_at: string;
}

export interface OcioBucketItem {
  id: string;
  user_id: string;
  description: string;
  category: string;
  status: BucketStatus;
  created_at: string;
}

// ── Input forms ───────────────────────────────────────────────────────────────

export interface NewBookInput {
  title: string;
  author: string;
  status: BookStatus;
  rating: string;
  notes: string;
}

export interface NewWatchInput {
  title: string;
  platform: string;
  status: WatchStatus;
  genre: string;
  rating: string;
}

export interface NewHobbyInput {
  name: string;
  frequency: string;
  last_practiced: string;
  notes: string;
}

export interface NewBucketInput {
  description: string;
  category: string;
  status: BucketStatus;
}
