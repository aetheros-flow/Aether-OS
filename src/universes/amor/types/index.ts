// ── Amor Universe — TypeScript interfaces ──────────────────────────────────

export interface SpecialDate {
  id: string;
  user_id: string;
  title: string;
  date: string;
  type: 'aniversario' | 'primer_encuentro' | 'cumpleanos_pareja' | 'cumpleanos_familiar' | 'otro';
  notes: string | null;
  created_at: string;
}

export interface LoveLanguages {
  id: string;
  user_id: string;
  own_scores: LoveLanguageScores;
  partner_scores: LoveLanguageScores | null;
  updated_at: string;
}

export interface LoveLanguageScores {
  palabras_afirmacion: number;
  actos_de_servicio: number;
  recibir_regalos: number;
  tiempo_de_calidad: number;
  contacto_fisico: number;
}

export interface Reflection {
  id: string;
  user_id: string;
  content: string;
  mood: MoodType;
  created_at: string;
}

export type MoodType = 'amor' | 'feliz' | 'neutral' | 'triste' | 'tenso';

export const MOOD_EMOJI: Record<MoodType, string> = {
  amor:    '❤️',
  feliz:   '😊',
  neutral: '😐',
  triste:  '😢',
  tenso:   '😤',
};

export const MOOD_LABEL: Record<MoodType, string> = {
  amor:    'Amor',
  feliz:   'Feliz',
  neutral: 'Neutral',
  triste:  'Triste',
  tenso:   'Tenso',
};

export const DATE_TYPE_LABEL: Record<SpecialDate['type'], string> = {
  aniversario:       'Aniversario',
  primer_encuentro:  'Primer Encuentro',
  cumpleanos_pareja: 'Cumpleaños Pareja',
  cumpleanos_familiar: 'Cumpleaños Familiar',
  otro:              'Otro',
};

export const DATE_TYPE_ICON: Record<SpecialDate['type'], string> = {
  aniversario:         '💍',
  primer_encuentro:    '✨',
  cumpleanos_pareja:   '🎂',
  cumpleanos_familiar: '🎁',
  otro:                '📅',
};

export const LOVE_LANGUAGE_LABELS: Record<keyof LoveLanguageScores, string> = {
  palabras_afirmacion: 'Palabras de Afirmación',
  actos_de_servicio:   'Actos de Servicio',
  recibir_regalos:     'Recibir Regalos',
  tiempo_de_calidad:   'Tiempo de Calidad',
  contacto_fisico:     'Contacto Físico',
};

export const LOVE_LANGUAGE_ICONS: Record<keyof LoveLanguageScores, string> = {
  palabras_afirmacion: '💬',
  actos_de_servicio:   '🤝',
  recibir_regalos:     '🎁',
  tiempo_de_calidad:   '⏳',
  contacto_fisico:     '🤗',
};

// ── Input DTOs ──────────────────────────────────────────────────────────────

export interface NewSpecialDateInput {
  title: string;
  date: string;
  type: SpecialDate['type'];
  notes: string;
}

export interface NewReflectionInput {
  content: string;
  mood: MoodType;
}

export const DEFAULT_LOVE_SCORES: LoveLanguageScores = {
  palabras_afirmacion: 3,
  actos_de_servicio:   3,
  recibir_regalos:     3,
  tiempo_de_calidad:   3,
  contacto_fisico:     3,
};
