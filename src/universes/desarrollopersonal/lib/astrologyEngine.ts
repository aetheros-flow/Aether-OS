/**
 * Astrology Engine — Aether OS
 *
 * Provides birth chart calculations and daily transit data.
 * Uses external API (AstrologyAPI or Swiss Ephemeris via Edge Function).
 *
 * For now, defines the data structures and a mock implementation
 * that will be replaced by real API calls.
 */

export interface BirthData {
  date: string;       // ISO date: "1983-05-15"
  time: string;       // "HH:MM" in local time
  latitude: number;   // Birth city coordinates
  longitude: number;
  timezone: string;   // IANA tz: "America/Argentina/Buenos_Aires"
  city: string;
}

export interface Planet {
  name: string;
  sign: string;       // "Aries", "Taurus", etc.
  degree: number;     // 0-29.99
  house: number;      // 1-12
  retrograde: boolean;
}

export interface BirthChart {
  planets: Planet[];
  ascendant: { sign: string; degree: number };
  houses: { number: number; sign: string; degree: number }[];
  sunSign: string;
  moonSign: string;
  risingSign: string;
}

export interface DailyTransit {
  date: string;
  moon: { sign: string; phase: string; illumination: number };
  significantAspects: {
    planet1: string;
    aspect: string;   // "conjunction", "trine", "square", "opposition", "sextile"
    planet2: string;
    orb: number;
    description: string;
  }[];
  energyLevel: 'high' | 'medium' | 'low';
  theme: string;      // "Creativity & Expression", "Rest & Reflection", etc.
}

export interface AstroInsight {
  title: string;
  description: string;
  affirmation: string;
  focusArea: 'work' | 'relationships' | 'health' | 'creativity' | 'finances' | 'spirituality';
  intensity: 1 | 2 | 3; // 1=mild, 2=moderate, 3=intense
}

/**
 * Calculates the sun sign from a birth date.
 * Pure TypeScript — no API needed.
 */
export function getSunSign(birthDate: string): string {
  const date = new Date(birthDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  return 'Pisces';
}

/**
 * Returns the current moon phase based on date.
 * Approximation formula — accurate to within 1-2 days.
 */
export function getMoonPhase(date: Date = new Date()): { phase: string; illumination: number } {
  const knownNewMoon = new Date('2024-01-11');
  const lunarCycle = 29.53058867;
  const daysSince = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const cyclePosition = ((daysSince % lunarCycle) + lunarCycle) % lunarCycle;
  const illumination = Math.round(Math.abs(cyclePosition - lunarCycle / 2) / (lunarCycle / 2) * 100);

  let phase: string;
  if (cyclePosition < 1.85) phase = 'New Moon';
  else if (cyclePosition < 7.38) phase = 'Waxing Crescent';
  else if (cyclePosition < 9.22) phase = 'First Quarter';
  else if (cyclePosition < 14.77) phase = 'Waxing Gibbous';
  else if (cyclePosition < 16.61) phase = 'Full Moon';
  else if (cyclePosition < 22.15) phase = 'Waning Gibbous';
  else if (cyclePosition < 23.99) phase = 'Last Quarter';
  else phase = 'Waning Crescent';

  return { phase, illumination };
}

/**
 * Generates a daily astrological insight based on birth data and current date.
 * This is a rule-based generator — will be enhanced with real API data.
 */
export function getDailyInsight(birthData: BirthData, date: Date = new Date()): AstroInsight {
  const sunSign = getSunSign(birthData.date);
  const { phase } = getMoonPhase(date);

  // Rule-based insights per moon phase
  const phaseInsights: Record<string, Omit<AstroInsight, 'title'>> = {
    'New Moon': {
      description: `The New Moon invites ${sunSign} to plant seeds of intention. This is a powerful moment for fresh starts and setting goals for the cycle ahead.`,
      affirmation: 'I embrace new beginnings with clarity and purpose.',
      focusArea: 'spirituality',
      intensity: 2,
    },
    'Full Moon': {
      description: `The Full Moon illuminates what ${sunSign} has been building. Emotions run high — use this energy for release and celebration of progress.`,
      affirmation: 'I release what no longer serves my highest path.',
      focusArea: 'relationships',
      intensity: 3,
    },
    'Waxing Crescent': {
      description: `Momentum builds for ${sunSign}. Small consistent actions now create significant results by the Full Moon.`,
      affirmation: 'I take inspired action toward my vision.',
      focusArea: 'work',
      intensity: 2,
    },
    'Waning Gibbous': {
      description: `A time of reflection for ${sunSign}. What wisdom has this cycle offered? Share your insights with others.`,
      affirmation: 'I integrate my lessons and share my gifts.',
      focusArea: 'creativity',
      intensity: 1,
    },
  };

  const insight = phaseInsights[phase] ?? phaseInsights['Waxing Crescent'];

  return {
    title: `${phase} in ${sunSign} Energy`,
    ...insight,
  };
}
