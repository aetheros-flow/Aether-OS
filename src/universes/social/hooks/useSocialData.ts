import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../core/contexts/AuthContext';
import type {
  SocialContact,
  SocialEvent,
  SocialCommunity,
  NewContactInput,
  NewEventInput,
  NewCommunityInput,
} from '../types';

export function useSocialData() {
  const { user } = useAuth();
  const [contacts,    setContacts]    = useState<SocialContact[]>([]);
  const [events,      setEvents]      = useState<SocialEvent[]>([]);
  const [communities, setCommunities] = useState<SocialCommunity[]>([]);
  const [loading,     setLoading]     = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [{ data: c }, { data: e }, { data: com }] = await Promise.all([
        supabase
          .from('Social_contacts')
          .select('*')
          .eq('user_id', user.id)
          .order('last_contact_date', { ascending: false }),
        supabase
          .from('Social_events')
          .select('*')
          .eq('user_id', user.id)
          .order('event_date', { ascending: true }),
        supabase
          .from('Social_communities')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);
      if (c)   setContacts(c);
      if (e)   setEvents(e);
      if (com) setCommunities(com);
    } catch (err) {
      console.error('[useSocialData] fetchData error:', err);
      toast.error('Error al cargar los datos sociales');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createContact = async (input: NewContactInput): Promise<void> => {
    if (!user?.id) throw new Error('No autenticado');
    const { error } = await supabase.from('Social_contacts').insert([{
      user_id:           user.id,
      name:              input.name.trim(),
      category:          input.category,
      last_contact_date: input.last_contact_date || null,
      notes:             input.notes.trim() || null,
    }]);
    if (error) throw error;
    toast.success('Contacto agregado');
    await fetchData();
  };

  const updateContact = async (id: string, input: Partial<NewContactInput>): Promise<void> => {
    if (!user?.id) throw new Error('No autenticado');
    const { error } = await supabase
      .from('Social_contacts')
      .update({
        ...(input.name              !== undefined && { name: input.name.trim() }),
        ...(input.category          !== undefined && { category: input.category }),
        ...(input.last_contact_date !== undefined && { last_contact_date: input.last_contact_date || null }),
        ...(input.notes             !== undefined && { notes: input.notes.trim() || null }),
      })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    toast.success('Contacto actualizado');
    await fetchData();
  };

  const deleteContact = async (id: string): Promise<void> => {
    if (!user?.id) throw new Error('No autenticado');
    const { error } = await supabase
      .from('Social_contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    toast.success('Contacto eliminado');
    await fetchData();
  };

  const createEvent = async (input: NewEventInput): Promise<void> => {
    if (!user?.id) throw new Error('No autenticado');
    const { error } = await supabase.from('Social_events').insert([{
      user_id:    user.id,
      title:      input.title.trim(),
      event_date: input.event_date,
      type:       input.type,
      location:   input.location.trim() || null,
      notes:      input.notes.trim() || null,
    }]);
    if (error) throw error;
    toast.success('Evento agregado');
    await fetchData();
  };

  const deleteEvent = async (id: string): Promise<void> => {
    if (!user?.id) throw new Error('No autenticado');
    const { error } = await supabase
      .from('Social_events')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    toast.success('Evento eliminado');
    await fetchData();
  };

  const createCommunity = async (input: NewCommunityInput): Promise<void> => {
    if (!user?.id) throw new Error('No autenticado');
    const { error } = await supabase.from('Social_communities').insert([{
      user_id:   user.id,
      name:      input.name.trim(),
      type:      input.type,
      is_active: input.is_active,
      frequency: input.frequency,
    }]);
    if (error) throw error;
    toast.success('Comunidad agregada');
    await fetchData();
  };

  const toggleCommunityActive = async (id: string, currentState: boolean): Promise<void> => {
    if (!user?.id) throw new Error('No autenticado');
    const { error } = await supabase
      .from('Social_communities')
      .update({ is_active: !currentState })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    await fetchData();
  };

  const deleteCommunity = async (id: string): Promise<void> => {
    if (!user?.id) throw new Error('No autenticado');
    const { error } = await supabase
      .from('Social_communities')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    toast.success('Comunidad eliminada');
    await fetchData();
  };

  return {
    contacts,
    events,
    communities,
    loading,
    fetchData,
    createContact,
    updateContact,
    deleteContact,
    createEvent,
    deleteEvent,
    createCommunity,
    toggleCommunityActive,
    deleteCommunity,
  };
}
