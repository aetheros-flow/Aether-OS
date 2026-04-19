/**
 * Astrology Engine — Aether OS
 *
 * Client-side astronomical calculations using standard formulae
 * (Jean Meeus, "Astronomical Algorithms", 2nd edition).
 * Accuracy: Sun ±1′, Moon ±1°, Ascendant ±1°.
 */

// ─── Natal Chart ─────────────────────────────────────────────────────────────

export interface NatalChartPoint {
  sign: string;
  degree: number;   // degrees within the sign (0–29.99)
  longitude: number; // absolute ecliptic longitude (0–359.99)
}

export interface NatalChartData {
  sun: NatalChartPoint;
  moon: NatalChartPoint;
  ascendant: NatalChartPoint;
  mercury: NatalChartPoint;
  venus: NatalChartPoint;
  mars: NatalChartPoint;
}

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

function normalizeDeg(d: number): number {
  return ((d % 360) + 360) % 360;
}

function toRad(d: number): number { return (d * Math.PI) / 180; }
function toDeg(r: number): number { return (r * 180) / Math.PI; }

function pointFromLon(lon: number): NatalChartPoint {
  const n = normalizeDeg(lon);
  const idx = Math.floor(n / 30);
  return { sign: ZODIAC_SIGNS[idx], degree: n % 30, longitude: n };
}

/** Julian Day Number (UT) */
function julianDay(
  year: number, month: number, day: number,
  hour: number, minute: number, utcOffset: number,
): number {
  const ut = hour - utcOffset + minute / 60;
  let y = year;
  let m = month;
  if (month <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day + ut / 24 + B - 1524.5
  );
}

/** Solar ecliptic longitude (accuracy ~1′) */
function solarLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  let M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  M = toRad(M);
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M) +
    0.000289 * Math.sin(3 * M);
  return L0 + C;
}

/** Lunar ecliptic longitude (accuracy ~1°) */
function moonLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const Lm = 218.3165 + 481267.8813 * T;
  let M  = toRad(357.5291 + 35999.0503 * T);
  let Mm = toRad(134.9634 + 477198.8676 * T);
  let F  = toRad(93.2721  + 483202.0175 * T);
  let D  = toRad(297.8502 + 445267.1115 * T);
  return (
    Lm +
    6.289 * Math.sin(Mm) +
    1.274 * Math.sin(2 * D - Mm) +
    0.658 * Math.sin(2 * D) +
    0.214 * Math.sin(2 * Mm) -
    0.186 * Math.sin(M) -
    0.114 * Math.sin(2 * F)
  );
}

/** Mercury ecliptic longitude (simplified) */
function mercuryLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const L = 252.2509 + 149472.6746 * T;
  const M = toRad(174.7948 + 149472.515 * T);
  return L + 23.4400 * Math.sin(M) + 2.9818 * Math.sin(2 * M);
}

/** Venus ecliptic longitude (simplified) */
function venusLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const L = 181.9798 + 58517.8156 * T;
  const M = toRad(50.4161 + 58517.8039 * T);
  return L + 0.7758 * Math.sin(M) + 0.0033 * Math.sin(2 * M);
}

/** Mars ecliptic longitude (simplified) */
function marsLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const L = 355.4330 + 19140.2993 * T;
  const M = toRad(19.3730 + 19139.8584 * T);
  return L + 10.6912 * Math.sin(M) + 0.6228 * Math.sin(2 * M);
}

/** Ascendant / Rising sign */
function ascendantLongitude(jd: number, latitude: number, longitude: number): number {
  const T = (jd - 2451545.0) / 36525;
  let GMST = normalizeDeg(
    280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T,
  );
  const LST = GMST + longitude;
  const eps = toRad(23.4393 - 0.013 * T);
  const RAMC = toRad(LST);
  const lat = toRad(latitude);
  const y = -Math.cos(RAMC);
  const x = Math.sin(RAMC) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps);
  return normalizeDeg(toDeg(Math.atan2(y, x)));
}

/**
 * Calculate a full natal chart.
 * @param day        Day of birth (1–31)
 * @param month      Month of birth (1–12)
 * @param year       Year of birth (e.g. 1983)
 * @param hour       Birth hour in local time (0–23)
 * @param minute     Birth minute (0–59)
 * @param latitude   Birth city latitude (decimal degrees, south = negative)
 * @param longitude  Birth city longitude (decimal degrees, west = negative)
 * @param utcOffset  UTC offset in hours at birth (e.g. -3 for ART)
 */
export async function calculateNatalChart(
  day: number, month: number, year: number,
  hour: number, minute: number,
  latitude: number, longitude: number,
  utcOffset: number,
): Promise<NatalChartData> {
  const jd = julianDay(year, month, day, hour, minute, utcOffset);
  return {
    sun:       pointFromLon(solarLongitude(jd)),
    moon:      pointFromLon(moonLongitude(jd)),
    ascendant: pointFromLon(ascendantLongitude(jd, latitude, longitude)),
    mercury:   pointFromLon(mercuryLongitude(jd)),
    venus:     pointFromLon(venusLongitude(jd)),
    mars:      pointFromLon(marsLongitude(jd)),
  };
}

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
