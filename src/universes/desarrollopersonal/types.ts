import { z } from 'zod';

export const SkillSchema = z.object({
  id: z.string(),
  skill_name: z.string().min(1, "Skill name is required"),
  category: z.string().min(1, "Category is required"),
  current_level: z.number().min(0, "Level cannot be negative"),
  target_level: z.number().min(1, "Target level must be at least 1"),
  hours_invested: z.number().optional(),
});
export type Skill = z.infer<typeof SkillSchema>;

export const IkigaiLogSchema = z.object({
  id: z.string(),
  activity_name: z.string().min(1, "Activity name is required"),
  love_it: z.boolean(),
  good_at_it: z.boolean(),
  world_needs_it: z.boolean(),
  paid_for_it: z.boolean(),
  created_at: z.string(),
  log_date: z.string().optional(),
});
export type IkigaiLog = z.infer<typeof IkigaiLogSchema>;

export const JournalEntrySchema = z.object({
  id: z.string(),
  content: z.string(),
  mood: z.string(),
  created_at: z.string(),
  tags: z.array(z.string()).optional(),
});
export type JournalEntry = z.infer<typeof JournalEntrySchema>;

export const NewSkillInputSchema = SkillSchema.omit({ id: true, hours_invested: true });
export type NewSkillInput = z.infer<typeof NewSkillInputSchema>;

export const NewIkigaiInputSchema = IkigaiLogSchema.omit({ id: true, created_at: true, log_date: true });
export type NewIkigaiInput = z.infer<typeof NewIkigaiInputSchema>;

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
  overall: number;
  selfReported: number;
  discrepancy: number;
  factors: {
    habitConsistency: number;
    financialStress: number;
    journalSentiment: number;
    selfPerception: number;
  };
  insight: string;
  calculatedAt: string;
}
