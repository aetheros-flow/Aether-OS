import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase'; // Ajustá esta ruta a tu cliente de Supabase
import type { Habit, HabitLog, TodayHabit } from '../types/habits';

export function useHabits(userId: string | undefined) {
  const [todayHabits, setTodayHabits] = useState<TodayHabit[]>([]);
  const [heatmapData, setHeatmapData] = useState<number[]>(Array(28).fill(0));
  const [isLoading, setIsLoading] = useState(true);

  // Obtener la fecha de hoy en formato local (YYYY-MM-DD)
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchHabits = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);

    const todayStr = getTodayString();
    const currentDayOfWeek = new Date().getDay(); // 0 = Domingo, 1 = Lunes, etc.

    try {
      // 1. Traer TODOS los hábitos del usuario
      const { data: habitsData, error: habitsError } = await supabase
        .from('desarrollo_habits')
        .select('*')
        .eq('user_id', userId);

      if (habitsError) throw habitsError;

      // 2. Traer los logs de HOY
      const { data: logsData, error: logsError } = await supabase
        .from('desarrollo_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('completed_date', todayStr);

      if (logsError) throw logsError;

     // Reemplazá este bloque en tu useHabits.ts (aprox línea 44 a 50)
const habitsForToday = (habitsData as Habit[]).filter(habit => {
  if (habit.frequency_type === 'daily') return true;
  if (habit.frequency_type === 'specific_days') {
    // Agregamos (habit.days_of_week || []) para que nunca explote si es null
    return (habit.days_of_week || []).includes(currentDayOfWeek);
  }
  return false;
});

      // 4. Mapear estado "done" cruzando con los logs de hoy
      const mappedHabits: TodayHabit[] = habitsForToday.map(habit => {
        const isDone = (logsData as HabitLog[]).some(log => log.habit_id === habit.id);
        return { ...habit, done: isDone };
      });

      setTodayHabits(mappedHabits);
      
      // Acá iría la lógica real del Heatmap consultando los últimos 28 días en la BD.
      // Por ahora mantenemos la UI estática para el heatmap hasta armar la query compleja.
      setHeatmapData(Array.from({ length: 28 }, () => Math.floor(Math.random() * 4)));

    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const toggleHabit = async (habitId: string, currentStatus: boolean) => {
    if (!userId) return;

    const todayStr = getTodayString();

    // Optimistic UI update (se actualiza visualmente al instante)
    setTodayHabits(prev => prev.map(h => h.id === habitId ? { ...h, done: !currentStatus } : h));

    try {
      if (!currentStatus) {
        // Estaba incompleto, lo marcamos como completado (Insert)
        await supabase.from('desarrollo_logs').insert({
          habit_id: habitId,
          user_id: userId,
          completed_date: todayStr
        });
      } else {
        // Estaba completado, lo desmarcamos (Delete)
        await supabase.from('desarrollo_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('user_id', userId)
          .eq('completed_date', todayStr);
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
      // Rollback en caso de error
      fetchHabits();
    }
  };

  return { todayHabits, heatmapData, toggleHabit, isLoading };
}