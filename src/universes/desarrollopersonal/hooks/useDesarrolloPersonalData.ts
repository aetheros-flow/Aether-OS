import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Skill, IkigaiLog, NewSkillInput, NewIkigaiInput } from '../types';

export function useDesarrolloPersonalData() {
  const [skills,     setSkills]     = useState<Skill[]>([]);
  const [ikigaiLogs, setIkigaiLogs] = useState<IkigaiLog[]>([]);
  const [loading,    setLoading]    = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: s }, { data: i }] = await Promise.all([
        supabase.from('Desarrollo_Skills').select('*').order('current_level', { ascending: false }),
        supabase.from('Desarrollo_Ikigai_Log').select('*').order('created_at', { ascending: false }),
      ]);
      if (s) setSkills(s);
      if (i) setIkigaiLogs(i);
    } catch (err) {
      console.error('[useDesarrolloPersonalData] fetchData error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createSkill = async (input: NewSkillInput): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Desarrollo_Skills').insert([{ user_id: user.id, ...input }]);
    if (error) throw error;
    await fetchData();
  };

  const createIkigaiLog = async (input: NewIkigaiInput): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Desarrollo_Ikigai_Log').insert([{ user_id: user.id, ...input }]);
    if (error) throw error;
    await fetchData();
  };

  return { skills, ikigaiLogs, loading, createSkill, createIkigaiLog };
}
