import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../core/contexts/AuthContext';
import type {
  FamiliaMember,
  FamiliaTradition,
  FamiliaNote,
  NewMemberInput,
  NewTraditionInput,
  NewNoteInput,
} from '../types';

export function useFamiliaData() {
  const { user } = useAuth();

  const [members,    setMembers]    = useState<FamiliaMember[]>([]);
  const [traditions, setTraditions] = useState<FamiliaTradition[]>([]);
  const [notes,      setNotes]      = useState<FamiliaNote[]>([]);
  const [loading,    setLoading]    = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [
        { data: m },
        { data: t },
        { data: n },
      ] = await Promise.all([
        supabase
          .from('Familia_members')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true }),
        supabase
          .from('Familia_traditions')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true }),
        supabase
          .from('Familia_notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);
      if (m) setMembers(m);
      if (t) setTraditions(t);
      if (n) setNotes(n);
    } catch (err) {
      console.error('[useFamiliaData] fetchData error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Mutations ────────────────────────────────────────────────────────────────

  const createMember = async (input: NewMemberInput): Promise<void> => {
    if (!user?.id) throw new Error('No autenticado');
    const { error } = await supabase.from('Familia_members').insert([{
      user_id:      user.id,
      name:         input.name.trim(),
      relationship: input.relationship,
      birthday:     input.birthday || null,
      notes:        input.notes.trim() || null,
    }]);
    if (error) throw error;
    await fetchData();
  };

  const updateMember = async (id: string, input: NewMemberInput): Promise<void> => {
    if (!user?.id) throw new Error('No autenticado');
    const { error } = await supabase
      .from('Familia_members')
      .update({
        name:         input.name.trim(),
        relationship: input.relationship,
        birthday:     input.birthday || null,
        notes:        input.notes.trim() || null,
      })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    await fetchData();
  };

  const deleteMember = async (id: string): Promise<void> => {
    if (!user?.id) throw new Error('No autenticado');
    const { error } = await supabase
      .from('Familia_members')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    await fetchData();
  };

  const createTradition = async (input: NewTraditionInput): Promise<void> => {
    if (!user?.id) throw new Error('No autenticado');
    const { error } = await supabase.from('Familia_traditions').insert([{
      user_id:   user.id,
      name:      input.name.trim(),
      frequency: input.frequency,
      last_date: input.last_date || null,
      notes:     input.notes.trim() || null,
    }]);
    if (error) throw error;
    await fetchData();
  };

  const updateTradition = async (id: string, input: NewTraditionInput): Promise<void> => {
    if (!user?.id) throw new Error('No autenticado');
    const { error } = await supabase
      .from('Familia_traditions')
      .update({
        name:      input.name.trim(),
        frequency: input.frequency,
        last_date: input.last_date || null,
        notes:     input.notes.trim() || null,
      })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    await fetchData();
  };

  const deleteTradition = async (id: string): Promise<void> => {
    if (!user?.id) throw new Error('No autenticado');
    const { error } = await supabase
      .from('Familia_traditions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    await fetchData();
  };

  const createNote = async (input: NewNoteInput): Promise<void> => {
    if (!user?.id) throw new Error('No autenticado');
    const { error } = await supabase.from('Familia_notes').insert([{
      user_id: user.id,
      content: input.content.trim(),
    }]);
    if (error) throw error;
    await fetchData();
  };

  const deleteNote = async (id: string): Promise<void> => {
    if (!user?.id) throw new Error('No autenticado');
    const { error } = await supabase
      .from('Familia_notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    await fetchData();
  };

  return {
    members,
    traditions,
    notes,
    loading,
    fetchData,
    createMember,
    updateMember,
    deleteMember,
    createTradition,
    updateTradition,
    deleteTradition,
    createNote,
    deleteNote,
  };
}
