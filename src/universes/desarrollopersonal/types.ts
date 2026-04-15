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
