// ─── Core domain types ────────────────────────────────────────────────────────

export interface Skill {
  id: string;
  skill_name: string;
  category: string;
  current_level: number;
  target_level: number;
  hours_invested?: number;
}

export interface IkigaiLog {
  id: string;
  activity_name: string;
  love_it: boolean;
  good_at_it: boolean;
  world_needs_it: boolean;
  paid_for_it: boolean;
  created_at: string;
  log_date?: string;
}

export interface JournalEntry {
  id: string;
  content: string;
  mood: string;
  created_at: string;
  tags?: string[];
}

export interface NewSkillInput {
  skill_name: string;
  category: string;
  current_level: number;
  target_level: number;
}

export interface NewIkigaiInput {
  activity_name: string;
  love_it: boolean;
  good_at_it: boolean;
  world_needs_it: boolean;
  paid_for_it: boolean;
}

// ─── Astrology & Numerology ───────────────────────────────────────────────────

export interface UserBirthData {
  id: string;
  user_id: string;
  birth_date: string;
  birth_time: string | null;
  birth_city: string | null;
  birth_latitude: number | null;
  birth_longitude: number | null;
  birth_timezone: string | null;
  full_name: string;
  created_at: string;
}

export interface AetherScore {
  overall: number;        // 0-10, the "real" score calculated by AI
  selfReported: number;   // 0-10, what the user said
  discrepancy: number;    // difference between reported and real
  factors: {
    habitConsistency: number;
    financialStress: number;
    journalSentiment: number;
    selfPerception: number;
  };
  insight: string;        // AI-generated explanation
  calculatedAt: string;   // ISO date
}
