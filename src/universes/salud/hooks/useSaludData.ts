import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Metric, Workout, Nutrition, Medical, NewMetricInput, NewWorkoutInput } from '../types';

export function useSaludData() {
  const [metrics,   setMetrics]   = useState<Metric[]>([]);
  const [workouts,  setWorkouts]  = useState<Workout[]>([]);
  const [nutrition, setNutrition] = useState<Nutrition[]>([]);
  const [medical,   setMedical]   = useState<Medical[]>([]);
  const [loading,   setLoading]   = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: m }, { data: w }, { data: n }, { data: med }] = await Promise.all([
        supabase.from('Salud_metrics').select('*').order('date', { ascending: false }).limit(7),
        supabase.from('Salud_workouts').select('*').order('date', { ascending: false }).limit(7),
        supabase.from('Salud_nutrition').select('*').order('date', { ascending: false }).limit(20),
        supabase.from('Salud_medical').select('*').order('date', { ascending: true }),
      ]);
      if (m)   setMetrics(m);
      if (w)   setWorkouts(w);
      if (n)   setNutrition(n);
      if (med) setMedical(med);
    } catch (err) {
      console.error('[useSaludData] fetchData error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createMetric = async (input: NewMetricInput): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Salud_metrics').insert([{
      user_id:      user.id,
      weight:       Number(input.weight),
      body_fat:     Number(input.body_fat),
      sleep_hours:  Number(input.sleep_hours),
      water_liters: Number(input.water_liters),
      date:         input.date,
    }]);
    if (error) throw error;
    await fetchData();
  };

  const createWorkout = async (input: NewWorkoutInput): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Salud_workouts').insert([{
      user_id:         user.id,
      type:            input.type,
      duration_mins:   Number(input.duration_mins),
      intensity:       input.intensity,
      calories_burned: Number(input.calories_burned),
      date:            `${input.date}T${input.time || '00:00'}:00Z`,
    }]);
    if (error) throw error;
    await fetchData();
  };

  return { metrics, workouts, nutrition, medical, loading, createMetric, createWorkout };
}
