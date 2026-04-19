// ── Desarrollo Profesional Universe Types ────────────────────────────────────

export type ProjectStatus  = 'Activo' | 'Completado' | 'En pausa';
export type LearningType   = 'Curso' | 'Libro' | 'Podcast' | 'Workshop';

// ── Domain models ─────────────────────────────────────────────────────────────

export interface ProProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  tech_stack: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface ProLearning {
  id: string;
  user_id: string;
  name: string;
  type: LearningType;
  platform: string | null;
  progress: number;
  hours_invested: number;
  created_at: string;
}

export interface ProCertification {
  id: string;
  user_id: string;
  name: string;
  issuer: string;
  obtained_date: string | null;
  expiry_date: string | null;
  url: string | null;
  created_at: string;
}

export interface ProNetworkContact {
  id: string;
  user_id: string;
  name: string;
  role: string | null;
  company: string | null;
  how_met: string | null;
  notes: string | null;
  created_at: string;
}

// ── Input forms ───────────────────────────────────────────────────────────────

export interface NewProjectInput {
  name: string;
  description: string;
  status: ProjectStatus;
  tech_stack: string;
  start_date: string;
  end_date: string;
}

export interface NewLearningInput {
  name: string;
  type: LearningType;
  platform: string;
  progress: string;
  hours_invested: string;
}

export interface NewCertificationInput {
  name: string;
  issuer: string;
  obtained_date: string;
  expiry_date: string;
  url: string;
}

export interface NewNetworkInput {
  name: string;
  role: string;
  company: string;
  how_met: string;
  notes: string;
}
