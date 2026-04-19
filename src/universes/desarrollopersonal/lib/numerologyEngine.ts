/**
 * Numerology Engine — Aether OS
 * Pythagorean system (most widely used in Western numerology)
 */

/** Maps letters to Pythagorean numerology values */
const LETTER_VALUES: Record<string, number> = {
  a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
  j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
  s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8,
};

const MASTER_NUMBERS = new Set([11, 22, 33]);

/** Reduces a number to a single digit or master number */
export function reduceNumber(n: number): number {
  if (MASTER_NUMBERS.has(n)) return n;
  if (n < 10) return n;
  const sum = String(n).split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
  return reduceNumber(sum);
}

/** Life Path Number — derived from birth date */
export function getLifePathNumber(birthDate: string): number {
  const digits = birthDate.replace(/-/g, '').split('').map(Number);
  const sum = digits.reduce((a, b) => a + b, 0);
  return reduceNumber(sum);
}

/** Expression Number — derived from full birth name */
export function getExpressionNumber(fullName: string): number {
  const letters = fullName.toLowerCase().replace(/[^a-z]/g, '');
  const sum = letters.split('').reduce((acc, l) => acc + (LETTER_VALUES[l] ?? 0), 0);
  return reduceNumber(sum);
}

/** Soul Urge Number — derived from vowels in name */
export function getSoulUrgeNumber(fullName: string): number {
  const vowels = fullName.toLowerCase().replace(/[^aeiou]/g, '');
  const sum = vowels.split('').reduce((acc, l) => acc + (LETTER_VALUES[l] ?? 0), 0);
  return reduceNumber(sum);
}

/** Personal Year Number — changes each year */
export function getPersonalYearNumber(birthDate: string, currentYear?: number): number {
  const year = currentYear ?? new Date().getFullYear();
  const [, month, day] = birthDate.split('-').map(Number);
  const sum = reduceNumber(month) + reduceNumber(day) + reduceNumber(year);
  return reduceNumber(sum);
}

/** Personal Day Number — changes each day */
export function getPersonalDayNumber(birthDate: string, date: Date = new Date()): number {
  const personalYear = getPersonalYearNumber(birthDate, date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return reduceNumber(personalYear + reduceNumber(month) + reduceNumber(day));
}

export interface NumerologyProfile {
  lifePathNumber: number;
  expressionNumber: number;
  soulUrgeNumber: number;
  personalYearNumber: number;
  personalDayNumber: number;
}

export interface NumberMeaning {
  number: number;
  isMaster: boolean;
  title: string;
  keywords: string[];
  description: string;
  shadow: string; // The challenging side
}

export const NUMBER_MEANINGS: Record<number, NumberMeaning> = {
  1: { number: 1, isMaster: false, title: 'The Leader', keywords: ['independence', 'ambition', 'innovation'], description: 'Pioneer energy. You are here to lead, initiate, and forge your own path.', shadow: 'Tendency toward ego, stubbornness, or isolation.' },
  2: { number: 2, isMaster: false, title: 'The Diplomat', keywords: ['cooperation', 'sensitivity', 'balance'], description: 'The art of partnership. You excel in collaboration and creating harmony.', shadow: 'Codependency, indecision, or over-sensitivity.' },
  3: { number: 3, isMaster: false, title: 'The Creator', keywords: ['creativity', 'expression', 'joy'], description: 'The communicator and artist. You are here to inspire through self-expression.', shadow: 'Scattered energy, superficiality, or emotional repression.' },
  4: { number: 4, isMaster: false, title: 'The Builder', keywords: ['stability', 'discipline', 'foundation'], description: 'The master builder. You create lasting structures through dedication and hard work.', shadow: 'Rigidity, stubbornness, or resistance to change.' },
  5: { number: 5, isMaster: false, title: 'The Explorer', keywords: ['freedom', 'adventure', 'adaptability'], description: 'The free spirit. You are here to experience the full spectrum of life through change.', shadow: 'Restlessness, overindulgence, or commitment issues.' },
  6: { number: 6, isMaster: false, title: 'The Nurturer', keywords: ['responsibility', 'love', 'service'], description: 'The caretaker. You create beauty and nurture those around you.', shadow: 'Perfectionism, self-sacrifice, or meddling.' },
  7: { number: 7, isMaster: false, title: 'The Seeker', keywords: ['wisdom', 'analysis', 'spirituality'], description: 'The philosopher. You seek truth through deep analysis and spiritual inquiry.', shadow: 'Isolation, secretiveness, or cynicism.' },
  8: { number: 8, isMaster: false, title: 'The Powerhouse', keywords: ['abundance', 'authority', 'manifestation'], description: 'The achiever. You are here to master the material world and create abundance.', shadow: 'Workaholism, materialism, or misuse of power.' },
  9: { number: 9, isMaster: false, title: 'The Humanitarian', keywords: ['compassion', 'completion', 'wisdom'], description: 'The old soul. You are here to serve humanity and complete cycles of growth.', shadow: 'Martyrdom, bitterness, or difficulty letting go.' },
  11: { number: 11, isMaster: true, title: 'The Illuminator', keywords: ['intuition', 'inspiration', 'enlightenment'], description: 'Master Number. You are a channel for higher wisdom and spiritual light.', shadow: 'Extreme sensitivity, anxiety, or unfulfilled potential.' },
  22: { number: 22, isMaster: true, title: 'The Master Builder', keywords: ['vision', 'achievement', 'legacy'], description: 'Master Number. You build systems and structures that serve humanity at scale.', shadow: 'Overwhelm from immense potential or destructive tendencies.' },
  33: { number: 33, isMaster: true, title: 'The Master Teacher', keywords: ['compassion', 'healing', 'service'], description: 'Master Number. The highest vibration — pure compassionate service to all.', shadow: 'Martyrdom or self-neglect in service of others.' },
};

export function getNumerologyProfile(birthDate: string, fullName: string): NumerologyProfile {
  return {
    lifePathNumber: getLifePathNumber(birthDate),
    expressionNumber: getExpressionNumber(fullName),
    soulUrgeNumber: getSoulUrgeNumber(fullName),
    personalYearNumber: getPersonalYearNumber(birthDate),
    personalDayNumber: getPersonalDayNumber(birthDate),
  };
}

// ─── Aliases used by DesarrolloPersonalDashboard ─────────────────────────────
export const calculateLifePathNumber = getLifePathNumber;
export const calculateExpressionNumber = getExpressionNumber;
