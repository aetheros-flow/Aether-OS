// ── Daily horoscope via a free CORS-enabled API ──────────────────────────────
// Uses https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily
// (based on horoscope.com) — no API key, returns plain JSON with horoscope_data.
//
// If the service is down or the user is offline, we return a friendly fallback
// so the UI never breaks.

import { getSunSign } from './astrologyEngine';

export type Zodiac =
  | 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo'
  | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export interface DailyHoroscope {
  sign: Zodiac;
  date: string;       // ISO YYYY-MM-DD
  horoscope: string;
  source: string;
}

const ENDPOINT = 'https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily';

const SIGN_MAP: Record<string, Zodiac> = {
  Aries: 'aries', Taurus: 'taurus', Gemini: 'gemini', Cancer: 'cancer',
  Leo: 'leo', Virgo: 'virgo', Libra: 'libra', Scorpio: 'scorpio',
  Sagittarius: 'sagittarius', Capricorn: 'capricorn', Aquarius: 'aquarius',
  Pisces: 'pisces',
};

interface HoroscopeResponse {
  data?: {
    date?: string;
    horoscope_data?: string;
  };
}

/**
 * Fetches today's horoscope for a zodiac sign. Returns null on failure.
 */
export async function fetchDailyHoroscope(sign: Zodiac, signalTimeoutMs = 6000): Promise<DailyHoroscope | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), signalTimeoutMs);
  try {
    const url = `${ENDPOINT}?sign=${encodeURIComponent(sign)}&day=TODAY`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const json = (await res.json()) as HoroscopeResponse;
    const text = json.data?.horoscope_data?.trim();
    if (!text) return null;
    return {
      sign,
      date: json.data?.date ?? new Date().toISOString().slice(0, 10),
      horoscope: text,
      source: 'horoscope.com',
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Convenience: takes a birth date string (YYYY-MM-DD) and fetches the
 * horoscope for that person's sun sign.
 */
export async function fetchHoroscopeForBirthday(birthDateIso: string): Promise<DailyHoroscope | null> {
  const sign = getSunSign(birthDateIso);        // returns "Aries", "Taurus", ...
  const normalized = SIGN_MAP[sign];
  if (!normalized) return null;
  return fetchDailyHoroscope(normalized);
}
