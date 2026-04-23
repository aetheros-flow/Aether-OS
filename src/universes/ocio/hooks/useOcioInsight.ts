// ── Ocio · AI scoring hook ───────────────────────────────────────────────────
// Aggregates recent activity across Books, Hobbies, Bucket, Pantalla (movies/TV)
// and Videos to propose a 0-10 Ocio score for the Wheel of Life. The score
// doesn't reward pure consumption — it rewards BALANCED consumption:
//
//   consistency (40%) — regular engagement across the last 30 days
//   diversity   (30%) — variety of sub-modules touched
//   quality     (30%) — average rating across all rated items (ratings > 7 = good)
//
// The hook fetches only lightweight data (counts + last 30d events) and caches
// the result for 5 min to avoid hammering Supabase on every dashboard mount.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../core/contexts/AuthContext';

// ── Types ────────────────────────────────────────────────────────────────────
export interface OcioSignal {
  /** Raw 0-10 score. */
  score: number;
  /** Short human-readable reason. */
  label: string;
}

export interface OcioInsight {
  /** AI-suggested wheel score for Ocio (0-10). */
  suggestedScore: number;
  /** User's current wheel score (from UserWheel table, if available). */
  currentScore: number | null;
  /** suggestedScore - currentScore, or null if no current score. */
  delta: number | null;
  /** Individual signals, each 0-10. */
  signals: {
    consistency: OcioSignal;
    diversity:   OcioSignal;
    quality:     OcioSignal;
  };
  /** One-line natural-language summary of the state. */
  reasoning: string;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ── Weights ──────────────────────────────────────────────────────────────────
const W_CONSISTENCY = 0.40;
const W_DIVERSITY   = 0.30;
const W_QUALITY     = 0.30;

const WINDOW_DAYS = 30;

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useOcioInsight(): OcioInsight {
  const { user } = useAuth();
  const [state, setState] = useState<Omit<OcioInsight, 'refetch'>>({
    suggestedScore: 0,
    currentScore: null,
    delta: null,
    signals: {
      consistency: { score: 0, label: '' },
      diversity:   { score: 0, label: '' },
      quality:     { score: 0, label: '' },
    },
    reasoning: 'Cargando insight…',
    loading: true,
    error: null,
  });

  const fetchInsight = useCallback(async () => {
    if (!user) { setState(s => ({ ...s, loading: false })); return; }
    const uid = user.id;
    setState(s => ({ ...s, loading: true, error: null }));

    try {
      const sinceIso = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();

      const [
        booksRes, hobbiesRes, bucketRes,
        pantallaHistoryRes, pantallaEpisodesRes, pantallaRatingsRes,
        videosRes, wheelRes,
      ] = await Promise.all([
        supabase.from('Ocio_books').select('id,status,rating,created_at').eq('user_id', uid),
        supabase.from('Ocio_hobbies').select('id,last_practiced,created_at').eq('user_id', uid),
        supabase.from('Ocio_bucket_list').select('id,status,created_at').eq('user_id', uid),
        supabase.from('Ocio_pantalla_history').select('watched_at,media_type').eq('user_id', uid).gte('watched_at', sinceIso),
        supabase.from('Ocio_pantalla_episode_history').select('watched_at').eq('user_id', uid).gte('watched_at', sinceIso),
        supabase.from('Ocio_pantalla_ratings').select('stars').eq('user_id', uid),
        supabase.from('Ocio_videos_items').select('id,watched_at,rating,added_at').eq('user_id', uid),
        supabase.from('UserWheel').select('ocio').eq('user_id', uid).maybeSingle(),
      ]);

      const books    = booksRes.data ?? [];
      const hobbies  = hobbiesRes.data ?? [];
      const bucket   = bucketRes.data ?? [];
      const movies   = pantallaHistoryRes.data ?? [];
      const eps      = pantallaEpisodesRes.data ?? [];
      const pRatings = pantallaRatingsRes.data ?? [];
      const videos   = videosRes.data ?? [];
      const currentScore = (wheelRes.data as { ocio?: number } | null)?.ocio ?? null;

      // ── Signal 1: CONSISTENCY ──────────────────────────────────────────
      // Days with at least one activity in the last 30 days (episode watched,
      // movie watched, hobby practiced, video watched, book status change).
      const activeDays = new Set<string>();
      for (const m of movies) if (m.watched_at) activeDays.add(m.watched_at.slice(0, 10));
      for (const e of eps)    if (e.watched_at) activeDays.add(e.watched_at.slice(0, 10));
      for (const h of hobbies) {
        if (h.last_practiced && new Date(h.last_practiced) >= new Date(sinceIso)) {
          activeDays.add(h.last_practiced.slice(0, 10));
        }
      }
      for (const v of videos) {
        if (v.watched_at && new Date(v.watched_at) >= new Date(sinceIso)) {
          activeDays.add(v.watched_at.slice(0, 10));
        }
      }
      // Consistency score: linearly maps activeDays/30 to 0-10, but caps at 10
      // with diminishing returns — 15 active days (half the window) = ~8/10.
      const activeRatio = activeDays.size / WINDOW_DAYS;
      const consistencyScore = clamp(10 * Math.sqrt(activeRatio), 0, 10);
      const consistencyLabel =
        activeDays.size === 0 ? 'Sin actividad reciente' :
        activeDays.size < 5   ? `${activeDays.size} días activos · poco frecuente` :
        activeDays.size < 15  ? `${activeDays.size}/30 días activos` :
                                `${activeDays.size}/30 días activos · excelente ritmo`;

      // ── Signal 2: DIVERSITY ────────────────────────────────────────────
      // How many sub-modules are ACTIVE (have signals in the last 30d or
      // have content period for books/bucket). Max 5 modules.
      let activeModules = 0;
      if (books.length > 0) activeModules++;                                          // Books
      if (hobbies.length > 0) activeModules++;                                        // Hobbies
      if (bucket.some(b => b.status !== 'Completado')) activeModules++;               // Bucket (has pending)
      if (movies.length > 0 || eps.length > 0) activeModules++;                       // Pantalla
      if (videos.some(v => v.added_at && new Date(v.added_at) >= new Date(sinceIso)
          || v.watched_at && new Date(v.watched_at) >= new Date(sinceIso))) activeModules++; // Videos

      const diversityScore = clamp((activeModules / 5) * 10, 0, 10);
      const diversityLabel =
        activeModules === 0 ? 'Ningún módulo activo' :
        activeModules <= 2  ? `${activeModules}/5 módulos activos · concentrado` :
        activeModules <= 3  ? `${activeModules}/5 módulos activos` :
                              `${activeModules}/5 módulos activos · equilibrado`;

      // ── Signal 3: QUALITY ──────────────────────────────────────────────
      // Average of all ratings normalized to 0-10. Books rate 1-5, Pantalla
      // 1-10, Videos 1-10. Normalize and average.
      const ratingsNormalized: number[] = [];
      for (const b of books) {
        if (b.rating != null) ratingsNormalized.push((Number(b.rating) / 5) * 10);
      }
      for (const r of pRatings) {
        if (r.stars != null) ratingsNormalized.push(Number(r.stars));
      }
      for (const v of videos) {
        if (v.rating != null) ratingsNormalized.push(Number(v.rating));
      }

      const avgRating = ratingsNormalized.length > 0
        ? ratingsNormalized.reduce((a, b) => a + b, 0) / ratingsNormalized.length
        : null;

      // If there are no ratings at all, quality signal stays neutral at 5
      // (neither rewards nor punishes — we can't judge).
      const qualityScore = avgRating == null ? 5 : clamp(avgRating, 0, 10);
      const qualityLabel =
        avgRating == null             ? 'Sin ratings · neutral' :
        avgRating < 5                 ? `${avgRating.toFixed(1)} promedio · consumo bajo criterio` :
        avgRating < 7                 ? `${avgRating.toFixed(1)} promedio · aceptable` :
                                        `${avgRating.toFixed(1)} promedio · elegís bien`;

      // ── Weighted score ──────────────────────────────────────────────────
      const suggested = Math.round(
        (consistencyScore * W_CONSISTENCY
          + diversityScore * W_DIVERSITY
          + qualityScore   * W_QUALITY) * 10
      ) / 10;

      const delta = currentScore != null ? Math.round((suggested - currentScore) * 10) / 10 : null;

      // ── Reasoning (1 sentence) ──────────────────────────────────────────
      const reasoning = buildReasoning({
        suggested, delta,
        consistency: consistencyScore, diversity: diversityScore, quality: qualityScore,
        activeDays: activeDays.size, activeModules,
      });

      setState({
        suggestedScore: suggested,
        currentScore,
        delta,
        signals: {
          consistency: { score: round1(consistencyScore), label: consistencyLabel },
          diversity:   { score: round1(diversityScore),   label: diversityLabel },
          quality:     { score: round1(qualityScore),     label: qualityLabel },
        },
        reasoning,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('[useOcioInsight]', err);
      setState(s => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Error calculando insight',
        reasoning: 'No pudimos calcular el insight ahora — reintentá en unos segundos.',
      }));
    }
  }, [user]);

  useEffect(() => { fetchInsight(); }, [fetchInsight]);

  return { ...state, refetch: fetchInsight };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function buildReasoning({ suggested, delta, consistency, diversity, quality, activeDays, activeModules }: {
  suggested: number; delta: number | null;
  consistency: number; diversity: number; quality: number;
  activeDays: number; activeModules: number;
}): string {
  if (activeDays === 0 && activeModules === 0) {
    return 'Empezá por sembrar: agregá un libro, una experiencia, o abrí Pantalla o Videos para rastrear algo.';
  }
  // Find the weakest signal to give actionable advice
  const weakest = Math.min(consistency, diversity, quality);
  const trend = delta != null
    ? delta > 0.3 ? `en alza (+${delta.toFixed(1)})`
      : delta < -0.3 ? `bajando (${delta.toFixed(1)})`
      : 'estable'
    : null;

  if (weakest === consistency && consistency < 5) {
    return `Score sugerido ${suggested.toFixed(1)}${trend ? ` · ${trend}` : ''}. Tu ritmo es irregular — apuntá a actividad al menos cada 2 días.`;
  }
  if (weakest === diversity && diversity < 5) {
    return `Score sugerido ${suggested.toFixed(1)}${trend ? ` · ${trend}` : ''}. Estás concentrado en pocos formatos — explorá otros módulos para balancear.`;
  }
  if (weakest === quality && quality < 5) {
    return `Score sugerido ${suggested.toFixed(1)}${trend ? ` · ${trend}` : ''}. Tus ratings recientes están bajos — revisá si estás eligiendo contenido con intención.`;
  }
  if (suggested >= 8) {
    return `Score sugerido ${suggested.toFixed(1)}${trend ? ` · ${trend}` : ''}. Ritmo sólido, diversidad balanceada, buena calidad — ocio bien vivido.`;
  }
  return `Score sugerido ${suggested.toFixed(1)}${trend ? ` · ${trend}` : ''}. Balance razonable entre consistencia, diversidad y calidad.`;
}
