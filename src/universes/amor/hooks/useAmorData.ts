import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../core/contexts/AuthContext';
import type {
  SpecialDate,
  LoveLanguages,
  LoveLanguageScores,
  Reflection,
  NewSpecialDateInput,
  NewReflectionInput,
} from '../types';

export function useAmorData() {
  const { user } = useAuth();

  const [specialDates,   setSpecialDates]   = useState<SpecialDate[]>([]);
  const [loveLanguages,  setLoveLanguages]  = useState<LoveLanguages | null>(null);
  const [reflections,    setReflections]    = useState<Reflection[]>([]);
  const [loading,        setLoading]        = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [
        { data: dates,   error: datesErr   },
        { data: langs,   error: langsErr   },
        { data: refs,    error: refsErr    },
      ] = await Promise.all([
        supabase
          .from('Amor_special_dates')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true }),
        supabase
          .from('Amor_love_languages')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('Amor_reflections')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (datesErr) console.error('[useAmorData] special_dates:', datesErr);
      if (langsErr) console.error('[useAmorData] love_languages:', langsErr);
      if (refsErr)  console.error('[useAmorData] reflections:', refsErr);

      if (dates) setSpecialDates(dates);
      if (langs) setLoveLanguages(langs);
      if (refs)  setReflections(refs);
    } catch (err) {
      console.error('[useAmorData] fetchData error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createSpecialDate = async (input: NewSpecialDateInput): Promise<void> => {
    if (!user?.id) throw new Error('No autenticado');
    const { error } = await supabase.from('Amor_special_dates').insert([{
      user_id: user.id,
      title:   input.title.trim(),
      date:    input.date,
      type:    input.type,
      notes:   input.notes.trim() || null,
    }]);
    if (error) throw error;
    toast.success('Fecha especial guardada');
    await fetchData();
  };

  const deleteSpecialDate = async (id: string): Promise<void> => {
    if (!user?.id) throw new Error('No autenticado');
    const { error } = await supabase
      .from('Amor_special_dates')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    toast.success('Fecha eliminada');
    await fetchData();
  };

  const saveLoveLanguages = async (
    ownScores: LoveLanguageScores,
    partnerScores: LoveLanguageScores | null,
  ): Promise<void> => {
    if (!user?.id) throw new Error('No autenticado');

    const payload = {
      user_id:        user.id,
      own_scores:     ownScores,
      partner_scores: partnerScores,
      updated_at:     new Date().toISOString(),
    };

    let error;
    if (loveLanguages?.id) {
      ({ error } = await supabase
        .from('Amor_love_languages')
        .update(payload)
        .eq('id', loveLanguages.id)
        .eq('user_id', user.id));
    } else {
      ({ error } = await supabase
        .from('Amor_love_languages')
        .insert([payload]));
    }

    if (error) throw error;
    toast.success('Lenguajes del amor guardados');
    await fetchData();
  };

  const createReflection = async (input: NewReflectionInput): Promise<void> => {
    if (!user?.id) throw new Error('No autenticado');
    const { error } = await supabase.from('Amor_reflections').insert([{
      user_id: user.id,
      content: input.content.trim(),
      mood:    input.mood,
    }]);
    if (error) throw error;
    toast.success('Reflexión guardada');
    await fetchData();
  };

  const deleteReflection = async (id: string): Promise<void> => {
    if (!user?.id) throw new Error('No autenticado');
    const { error } = await supabase
      .from('Amor_reflections')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    toast.success('Reflexión eliminada');
    await fetchData();
  };

  return {
    specialDates,
    loveLanguages,
    reflections,
    loading,
    fetchData,
    createSpecialDate,
    deleteSpecialDate,
    saveLoveLanguages,
    createReflection,
    deleteReflection,
  };
}
