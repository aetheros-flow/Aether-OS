// ── Videos types ─────────────────────────────────────────────────────────────
import { z } from 'zod';

export type VideoPlatform =
  | 'youtube' | 'vimeo' | 'twitch' | 'tiktok' | 'instagram' | 'twitter' | 'other';

// ── Supabase rows ────────────────────────────────────────────────────────────
export interface VideoList {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string;
}

export interface VideoItem {
  id: string;
  user_id: string;
  list_id: string | null;
  url: string;
  platform: VideoPlatform;
  external_id: string | null;
  title: string | null;
  thumbnail_url: string | null;
  author_name: string | null;
  duration_sec: number | null;
  description: string | null;
  rating: number | null;
  watched_at: string | null;
  added_at: string;
}

// ── Form inputs + Zod ────────────────────────────────────────────────────────
export const NewListSchema = z.object({
  name:        z.string().trim().min(1, 'Nombre requerido').max(80),
  description: z.string().trim().max(500).optional().default(''),
  color:       z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal('')),
});
export type NewListInput = z.infer<typeof NewListSchema>;

export const NewVideoSchema = z.object({
  url:         z.string().trim().url('URL inválida'),
  list_id:     z.string().uuid().nullable().optional(),
  description: z.string().trim().max(500).optional().default(''),
  title:       z.string().trim().max(300).optional().default(''),
});
export type NewVideoInput = z.infer<typeof NewVideoSchema>;

// ── Platform metadata (runtime resolved from URL) ────────────────────────────
export interface ResolvedVideoMeta {
  platform: VideoPlatform;
  external_id: string | null;
  title: string | null;
  thumbnail_url: string | null;
  author_name: string | null;
  duration_sec: number | null;
}
