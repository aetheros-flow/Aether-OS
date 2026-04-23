import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Habit, HabitLog, TodayHabit } from '../types/habits';

interface AddHabitInput {
  name: string;
  icon_name?: string;
  frequency_type?: 'daily' | 'specific_days';
  days_of_week?: number[];
}

export function useHabits(userId: string | undefined) {
  const [todayHabits, setTodayHabits] = useState<TodayHabit[]>([]);
  const [allHabits, setAllHabits] = useState<Habit[]>([]);
  const [heatmap, setHeatmap]     = useState<HeatmapCell[]>(emptyHeatmap());
  const [streak, setStreak]       = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    if (!userId) { setIsLoading(false); return; }
    setIsLoading(true);
    setError(null);

    const todayStr = toLocalIsoDate(new Date());
    const currentDayOfWeek = new Date().getDay();
    const since = new Date();
    since.setDate(since.getDate() - 27);     // last 28 days inclusive
    const sinceStr = toLocalIsoDate(since);

    try {
      const [habitsRes, todayLogsRes, rangeLogsRes] = await Promise.all([
        supabase.from('desarrollo_habits').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('desarrollo_logs').select('*').eq('user_id', userId).eq('completed_date', todayStr),
        supabase.from('desarrollo_logs').select('completed_date,habit_id').eq('user_id', userId).gte('completed_date', sinceStr),
      ]);

      if (habitsRes.error) throw habitsRes.error;
      if (todayLogsRes.error) throw todayLogsRes.error;
      if (rangeLogsRes.error) throw rangeLogsRes.error;

      const habits       = (habitsRes.data ?? []) as Habit[];
      const todayLogs    = (todayLogsRes.data ?? []) as HabitLog[];
      const rangeLogs    = (rangeLogsRes.data ?? []) as Pick<HabitLog, 'completed_date' | 'habit_id'>[];

      setAllHabits(habits);

      // Today's habits: filter by frequency
      const todayFiltered = habits.filter(h => {
        if (h.frequency_type === 'daily') return true;
        if (h.frequency_type === 'specific_days') {
          return (h.days_of_week ?? []).includes(currentDayOfWeek);
        }
        return false;
      });
      const todayCountByHabit = new Set(todayLogs.map(l => l.habit_id));
      const mappedToday: TodayHabit[] = todayFiltered.map(h => ({ ...h, done: todayCountByHabit.has(h.id) }));
      setTodayHabits(mappedToday);

      // Real heatmap: count completions per date for the last 28 days
      setHeatmap(buildHeatmap(rangeLogs, since));

      // Current streak: consecutive days with ≥1 completion, counting back from today
      setStreak(computeStreak(rangeLogs, new Date()));
    } catch (err) {
      console.error('[useHabits] fetch error:', err);
      setError(err instanceof Error ? err.message : 'Error loading habits');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  // ── Toggle (mark / unmark today) ─────────────────────────────────────────
  const toggleHabit = useCallback(async (habitId: string, currentStatus: boolean) => {
    if (!userId) return;
    const todayStr = toLocalIsoDate(new Date());

    // Optimistic
    setTodayHabits(prev => prev.map(h => h.id === habitId ? { ...h, done: !currentStatus } : h));

    try {
      if (!currentStatus) {
        await supabase.from('desarrollo_logs').insert({
          habit_id: habitId, user_id: userId, completed_date: todayStr,
        });
      } else {
        await supabase.from('desarrollo_logs').delete()
          .eq('habit_id', habitId).eq('user_id', userId).eq('completed_date', todayStr);
      }
      // Refetch to update heatmap + streak
      fetchHabits();
    } catch (err) {
      console.error('[useHabits] toggle error:', err);
      fetchHabits(); // rollback via server truth
    }
  }, [userId, fetchHabits]);

  // ── Add ──────────────────────────────────────────────────────────────────
  const addHabit = useCallback(async (input: AddHabitInput) => {
    if (!userId) throw new Error('Not authenticated');
    const { error } = await supabase.from('desarrollo_habits').insert({
      user_id: userId,
      name: input.name.trim(),
      frequency_type: input.frequency_type ?? 'daily',
      icon_name: input.icon_name ?? 'Target',
      days_of_week: input.days_of_week ?? null,
    });
    if (error) throw error;
    await fetchHabits();
  }, [userId, fetchHabits]);

  // ── Delete ───────────────────────────────────────────────────────────────
  const deleteHabit = useCallback(async (habitId: string) => {
    if (!userId) throw new Error('Not authenticated');
    const { error } = await supabase.from('desarrollo_habits').delete()
      .eq('id', habitId).eq('user_id', userId);
    if (error) throw error;
    await fetchHabits();
  }, [userId, fetchHabits]);

  return {
    todayHabits, allHabits, heatmap, streak,
    toggleHabit, addHabit, deleteHabit,
    isLoading, error,
    refetch: fetchHabits,
  };
}

// ── Heatmap helpers ──────────────────────────────────────────────────────────
export interface HeatmapCell {
  date: string;    // YYYY-MM-DD
  count: number;   // completions that day
  level: 0 | 1 | 2 | 3;
}

function emptyHeatmap(): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  const d = new Date();
  d.setDate(d.getDate() - 27);
  for (let i = 0; i < 28; i++) {
    cells.push({ date: toLocalIsoDate(d), count: 0, level: 0 });
    d.setDate(d.getDate() + 1);
  }
  return cells;
}

function buildHeatmap(logs: Pick<HabitLog, 'completed_date' | 'habit_id'>[], since: Date): HeatmapCell[] {
  const counts = new Map<string, number>();
  for (const l of logs) counts.set(l.completed_date, (counts.get(l.completed_date) ?? 0) + 1);

  const cells: HeatmapCell[] = [];
  const d = new Date(since);
  for (let i = 0; i < 28; i++) {
    const dateStr = toLocalIsoDate(d);
    const count = counts.get(dateStr) ?? 0;
    cells.push({ date: dateStr, count, level: bucketLevel(count) });
    d.setDate(d.getDate() + 1);
  }
  return cells;
}

function bucketLevel(count: number): 0 | 1 | 2 | 3 {
  if (count === 0) return 0;
  if (count <= 1)  return 1;
  if (count <= 3)  return 2;
  return 3;
}

function computeStreak(logs: Pick<HabitLog, 'completed_date' | 'habit_id'>[], from: Date): number {
  const dates = new Set(logs.map(l => l.completed_date));
  let streak = 0;
  const cursor = new Date(from);
  // Do not count today if user hasn't completed yet — start from today and walk back while there's an entry
  while (dates.has(toLocalIsoDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function toLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
