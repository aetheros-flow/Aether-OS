import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../../../core/contexts/AuthContext';
import type { Skill, IkigaiLog, NewSkillInput, NewIkigaiInput, UserBirthData } from '../types';

export function useDesarrolloPersonalData() {
  const { user } = useAuth();
  const [skills, setSkills]         = useState<Skill[]>([]);
  const [ikigaiLogs, setIkigaiLogs] = useState<IkigaiLog[]>([]);
  const [birthData, setBirthData]   = useState<UserBirthData | null>(null);
  const [loading, setLoading]       = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [
        { data: s, error: sErr },
        { data: i, error: iErr },
        { data: b, error: bErr },
      ] = await Promise.all([
        supabase.from('Desarrollo_Skills').select('*').eq('user_id', user.id).order('current_level', { ascending: false }),
        supabase.from('Desarrollo_Ikigai_Log').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('Personal_birth_data').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      if (sErr) throw sErr;
      if (iErr) throw iErr;
      // bErr is non-fatal — table may not exist yet
      if (!bErr && b) setBirthData(b);

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
    if (user) fetchData();
  }, [fetchData, user]);

  // ── Skill actions ───────────────────────────────────────────────────────────
  const createSkill = async (input: NewSkillInput): Promise<void> => {
    if (!user) { toast.error('User not authenticated'); return; }
    const { error } = await supabase.from('Desarrollo_Skills').insert([{ user_id: user.id, ...input }]);
    if (error) { toast.error('Failed to create skill: ' + error.message); throw error; }
    toast.success('Skill created');
    await fetchData();
  };

  const updateSkillLevel = async (skillId: string, newLevel: number): Promise<void> => {
    if (!user) return;
    const { error } = await supabase
      .from('Desarrollo_Skills')
      .update({ current_level: newLevel })
      .eq('id', skillId)
      .eq('user_id', user.id);
    if (error) { toast.error('Failed to update skill'); throw error; }
    await fetchData();
  };

  const deleteSkill = async (skillId: string): Promise<void> => {
    if (!user) return;
    const { error } = await supabase
      .from('Desarrollo_Skills')
      .delete()
      .eq('id', skillId)
      .eq('user_id', user.id);
    if (error) { toast.error('Failed to delete skill'); throw error; }
    toast.success('Skill removed');
    await fetchData();
  };

  // ── Ikigai actions ──────────────────────────────────────────────────────────
  const createIkigaiLog = async (input: NewIkigaiInput): Promise<void> => {
    if (!user) { toast.error('User not authenticated'); return; }
    const { error } = await supabase.from('Desarrollo_Ikigai_Log').insert([{ user_id: user.id, ...input }]);
    if (error) { toast.error('Failed to log Ikigai: ' + error.message); throw error; }
    toast.success('Activity logged');
    await fetchData();
  };

  // ── Birth data actions ──────────────────────────────────────────────────────
  const saveBirthData = async (input: Omit<UserBirthData, 'id' | 'user_id' | 'created_at'>): Promise<void> => {
    if (!user) { toast.error('User not authenticated'); return; }
    const { error } = await supabase
      .from('Personal_birth_data')
      .upsert([{ user_id: user.id, ...input }], { onConflict: 'user_id' });
    if (error) { toast.error('Failed to save birth data: ' + error.message); throw error; }
    toast.success('Birth data saved');
    await fetchData();
  };

  return {
    skills, ikigaiLogs, birthData, loading,
    createSkill, updateSkillLevel, deleteSkill,
    createIkigaiLog,
    saveBirthData,
    refetch: fetchData,
  };
}
