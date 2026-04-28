// ── Platform detection + ID extraction + thumbnail fallbacks ─────────────────
// Zero-dependency URL parsing. No external API needed for detection or for
// building YouTube/Vimeo thumbnails (they have predictable URL patterns).
// oEmbed fetch (via noembed) lives in ./oembed.ts — that's the only network hop.

import type { VideoPlatform } from '../types';

// Inherits Ocio universe identity (coral clay, Soft Cosmos desaturated).
// Mirrors UNIVERSE_ACCENT.ocio in src/lib/universe-palette.ts.
export const VIDEOS_ACCENT = '#D97265';

export interface ParsedVideoUrl {
  platform: VideoPlatform;
  external_id: string | null;
  canonical_url: string;      // normalized (no tracking params, canonical form)
  thumbnail_guess: string | null; // direct CDN URL if derivable from ID
}

/**
 * Detects the platform from a URL and extracts the native ID.
 * Returns { platform: 'other' } for unknown hosts — still savable.
 */
export function parseVideoUrl(raw: string): ParsedVideoUrl {
  let url: URL;
  try { url = new URL(raw.trim()); }
  catch { return { platform: 'other', external_id: null, canonical_url: raw.trim(), thumbnail_guess: null }; }

  const host = url.hostname.replace(/^www\./, '').toLowerCase();

  // ── YouTube ────────────────────────────────────────────────────────────
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    const v = url.searchParams.get('v');
    // /shorts/XXX
    const shortsMatch = url.pathname.match(/^\/shorts\/([A-Za-z0-9_-]{6,})/);
    // /embed/XXX or /v/XXX
    const embedMatch = url.pathname.match(/^\/(?:embed|v)\/([A-Za-z0-9_-]{6,})/);
    const id = v ?? shortsMatch?.[1] ?? embedMatch?.[1] ?? null;
    return {
      platform: 'youtube',
      external_id: id,
      canonical_url: id ? `https://www.youtube.com/watch?v=${id}` : raw,
      thumbnail_guess: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null,
    };
  }
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0] || null;
    return {
      platform: 'youtube',
      external_id: id,
      canonical_url: id ? `https://www.youtube.com/watch?v=${id}` : raw,
      thumbnail_guess: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null,
    };
  }

  // ── Vimeo ──────────────────────────────────────────────────────────────
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const match = url.pathname.match(/^\/(?:video\/)?(\d+)/);
    const id = match?.[1] ?? null;
    return {
      platform: 'vimeo',
      external_id: id,
      canonical_url: id ? `https://vimeo.com/${id}` : raw,
      thumbnail_guess: null, // Vimeo thumbs require oEmbed resolution
    };
  }

  // ── Twitch ─────────────────────────────────────────────────────────────
  if (host === 'twitch.tv' || host === 'clips.twitch.tv') {
    const videoMatch = url.pathname.match(/^\/videos\/(\d+)/);
    const clipMatch  = url.pathname.match(/^\/[^/]+\/clip\/([^/?#]+)/);
    const id = videoMatch?.[1] ?? clipMatch?.[1] ?? null;
    return {
      platform: 'twitch',
      external_id: id,
      canonical_url: raw.trim(),
      thumbnail_guess: null,
    };
  }

  // ── TikTok ─────────────────────────────────────────────────────────────
  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
    const match = url.pathname.match(/\/video\/(\d+)/);
    const id = match?.[1] ?? null;
    return {
      platform: 'tiktok',
      external_id: id,
      canonical_url: raw.trim(),
      thumbnail_guess: null,
    };
  }

  // ── Instagram ──────────────────────────────────────────────────────────
  if (host === 'instagram.com' || host.endsWith('.instagram.com')) {
    const match = url.pathname.match(/\/(?:reel|p|tv)\/([^/?#]+)/);
    return {
      platform: 'instagram',
      external_id: match?.[1] ?? null,
      canonical_url: raw.trim(),
      thumbnail_guess: null,
    };
  }

  // ── X / Twitter ────────────────────────────────────────────────────────
  if (host === 'twitter.com' || host === 'x.com' || host.endsWith('.twitter.com')) {
    const match = url.pathname.match(/\/status\/(\d+)/);
    return {
      platform: 'twitter',
      external_id: match?.[1] ?? null,
      canonical_url: raw.trim(),
      thumbnail_guess: null,
    };
  }

  return { platform: 'other', external_id: null, canonical_url: raw.trim(), thumbnail_guess: null };
}

// ── Platform label + tint for chips ──────────────────────────────────────────
export const PLATFORM_META: Record<VideoPlatform, { label: string; color: string }> = {
  youtube:   { label: 'YouTube',   color: '#FF0000' },
  vimeo:     { label: 'Vimeo',     color: '#1AB7EA' },
  twitch:    { label: 'Twitch',    color: '#9146FF' },
  tiktok:    { label: 'TikTok',    color: '#25F4EE' },
  instagram: { label: 'Instagram', color: '#E4405F' },
  twitter:   { label: 'X',         color: '#FFFFFF' },
  other:     { label: 'Web',       color: '#A3A3A3' },
};

// ── Duration helper ──────────────────────────────────────────────────────────
export function formatDuration(sec: number | null): string | null {
  if (!sec || sec <= 0) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}:${String(s).padStart(2, '0')}`;
  return `${s}s`;
}
