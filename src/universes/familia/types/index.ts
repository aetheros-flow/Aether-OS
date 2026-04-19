// ── Familia Universe — TypeScript Interfaces ──────────────────────────────────

export interface FamiliaMember {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  birthday: string | null;
  notes: string | null;
  created_at: string;
}

export interface FamiliaTradition {
  id: string;
  user_id: string;
  name: string;
  frequency: string;
  last_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface FamiliaNote {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

// ── Form input types ───────────────────────────────────────────────────────────

export interface NewMemberInput {
  name: string;
  relationship: string;
  birthday: string;
  notes: string;
}

export interface NewTraditionInput {
  name: string;
  frequency: string;
  last_date: string;
  notes: string;
}

export interface NewNoteInput {
  content: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const RELATIONSHIP_OPTIONS = [
  'Madre',
  'Padre',
  'Hermano',
  'Hermana',
  'Abuelo',
  'Abuela',
  'Hijo',
  'Hija',
  'Pareja',
  'Tío',
  'Tía',
  'Primo',
  'Prima',
  'Suegro',
  'Suegra',
  'Cuñado',
  'Cuñada',
  'Sobrino',
  'Sobrina',
  'Otro',
] as const;

export const FREQUENCY_OPTIONS = [
  'Semanal',
  'Mensual',
  'Trimestral',
  'Semestral',
  'Anual',
] as const;
