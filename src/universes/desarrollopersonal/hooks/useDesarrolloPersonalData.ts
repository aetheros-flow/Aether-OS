import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../../../core/contexts/AuthContext';
import type { Skill, IkigaiLog, NewSkillInput, NewIkigaiInput } from '../types';

export function useDesarrolloPersonalData() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [ikigaiLogs, setIkigaiLogs] = useState<IkigaiLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [{ data: s, error: sErr }, { data: i, error: iErr }] = await Promise.all([
        supabase.from('Desarrollo_Skills').select('*').eq('user_id', user.id).order('current_level', { ascending: false }),
        supabase.from('Desarrollo_Ikigai_Log').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      
      if (sErr) throw sErr;
      if (iErr) throw iErr;
      
      if (s) setSkills(s);
      if (i) setIkigaiLogs(i);
    } catch (err: any) {
      console.error('[useDesarrolloPersonalData] fetchData error:', err);
      toast.error('Failed to load personal dev data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { 
    if (user) {
      fetchData(); 
    }
  }, [fetchData, user]);

  const createSkill = async (input: NewSkillInput): Promise<void> => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }
    const { error } = await supabase.from('Desarrollo_Skills').insert([{ user_id: user.id, ...input }]);
    if (error) {
      toast.error('Failed to create skill: ' + error.message);
      throw error;
    }
    toast.success('Skill created successfully');
    await fetchData();
  };

  const createIkigaiLog = async (input: NewIkigaiInput): Promise<void> => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }
    const { error } = await supabase.from('Desarrollo_Ikigai_Log').insert([{ user_id: user.id, ...input }]);
    if (error) {
      toast.error('Failed to log Ikigai: ' + error.message);
      throw error;
    }
    toast.success('Ikigai log recorded successfully');
    await fetchData();
  };

  return { skills, ikigaiLogs, loading, createSkill, createIkigaiLog };
}
