// ── oEmbed resolver via noembed.com (CORS-enabled proxy) ────────────────────
// noembed.com is a long-running free service that wraps the oEmbed endpoints
// of YouTube, Vimeo, SoundCloud, TikTok, Twitch, Reddit, etc. and returns
// JSON with CORS enabled. If the host it doesn't support or is down, we gracefully
// fall back to whatever metadata the URL parser could derive.
//
// Docs: https://noembed.com/

import { parseVideoUrl } from './platforms';
import type { ResolvedVideoMeta, VideoPlatform } from '../types';

const NOEMBED = 'https://noembed.com/embed';

interface NoEmbedResponse {
  type?: string;
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  html?: string;
  provider_name?: string;
  duration?: number;   // present on vimeo/soundcloud, rarely on others
  error?: string;
}

/**
 * Fetch oEmbed metadata for a URL. Network-only — no caching here; callers
 * should only invoke at insert time (metadata is then persisted into the row).
 * Resolves with best-effort metadata; never rejects on 404/timeout.
 */
export async function resolveVideoMeta(url: string, opts: { timeoutMs?: number } = {}): Promise<ResolvedVideoMeta> {
  const parsed = parseVideoUrl(url);
  const fallback: ResolvedVideoMeta = {
    platform: parsed.platform,
    external_id: parsed.external_id,
    title: null,
    thumbnail_url: parsed.thumbnail_guess,
    author_name: null,
    duration_sec: null,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 6000);

  try {
    const endpoint = `${NOEMBED}?url=${encodeURIComponent(parsed.canonical_url)}&nowrap=on`;
    const res = await fetch(endpoint, { signal: controller.signal });
    if (!res.ok) return fallback;
    const data = (await res.json()) as NoEmbedResponse;
    if (data.error) return fallback;

    return {
      platform: coercePlatform(data.provider_name) ?? parsed.platform,
      external_id: parsed.external_id,
      title: data.title?.trim() || null,
      thumbnail_url: data.thumbnail_url ?? parsed.thumbnail_guess,
      author_name: data.author_name?.trim() || null,
      duration_sec: typeof data.duration === 'number' ? Math.round(data.duration) : null,
    };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

function coercePlatform(providerName: string | undefined): VideoPlatform | null {
  if (!providerName) return null;
  const p = providerName.toLowerCase();
  if (p.includes('youtube')) return 'youtube';
  if (p.includes('vimeo'))   return 'vimeo';
  if (p.includes('twitch'))  return 'twitch';
  if (p.includes('tiktok'))  return 'tiktok';
  if (p.includes('instagram')) return 'instagram';
  if (p.includes('twitter') || p === 'x') return 'twitter';
  return null;
}
