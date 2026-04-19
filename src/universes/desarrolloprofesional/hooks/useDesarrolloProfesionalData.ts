import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../core/contexts/AuthContext';
import type {
  ProProject, ProLearning, ProCertification, ProNetworkContact,
  NewProjectInput, NewLearningInput, NewCertificationInput, NewNetworkInput,
} from '../types';

export function useDesarrolloProfesionalData() {
  const { user } = useAuth();

  const [projects,       setProjects]       = useState<ProProject[]>([]);
  const [learning,       setLearning]       = useState<ProLearning[]>([]);
  const [certifications, setCertifications] = useState<ProCertification[]>([]);
  const [network,        setNetwork]        = useState<ProNetworkContact[]>([]);
  const [loading,        setLoading]        = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [
        { data: p },
        { data: l },
        { data: c },
        { data: n },
      ] = await Promise.all([
        supabase.from('Pro_projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('Pro_learning').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('Pro_certifications').select('*').eq('user_id', user.id).order('obtained_date', { ascending: false }),
        supabase.from('Pro_network').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      if (p) setProjects(p);
      if (l) setLearning(l);
      if (c) setCertifications(c);
      if (n) setNetwork(n);
    } catch (err) {
      console.error('[useDesarrolloProfesionalData] fetchData error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Project mutations ─────────────────────────────────────────────────────

  const createProject = async (input: NewProjectInput): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Pro_projects').insert([{
      user_id:     user.id,
      name:        input.name.trim(),
      description: input.description.trim() || null,
      status:      input.status,
      tech_stack:  input.tech_stack.trim() || null,
      start_date:  input.start_date || null,
      end_date:    input.end_date || null,
    }]);
    if (error) throw error;
    await fetchData();
  };

  const updateProject = async (id: string, input: Partial<NewProjectInput>): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Pro_projects').update({
      ...(input.name        !== undefined && { name:        input.name.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() || null }),
      ...(input.status      !== undefined && { status:      input.status }),
      ...(input.tech_stack  !== undefined && { tech_stack:  input.tech_stack.trim() || null }),
      ...(input.start_date  !== undefined && { start_date:  input.start_date || null }),
      ...(input.end_date    !== undefined && { end_date:    input.end_date || null }),
    }).eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    await fetchData();
  };

  const deleteProject = async (id: string): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Pro_projects').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    await fetchData();
  };

  // ── Learning mutations ────────────────────────────────────────────────────

  const createLearning = async (input: NewLearningInput): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Pro_learning').insert([{
      user_id:        user.id,
      name:           input.name.trim(),
      type:           input.type,
      platform:       input.platform.trim() || null,
      progress:       Math.min(100, Math.max(0, Number(input.progress) || 0)),
      hours_invested: Number(input.hours_invested) || 0,
    }]);
    if (error) throw error;
    await fetchData();
  };

  const updateLearning = async (id: string, input: Partial<NewLearningInput>): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Pro_learning').update({
      ...(input.name           !== undefined && { name:           input.name.trim() }),
      ...(input.type           !== undefined && { type:           input.type }),
      ...(input.platform       !== undefined && { platform:       input.platform.trim() || null }),
      ...(input.progress       !== undefined && { progress:       Math.min(100, Math.max(0, Number(input.progress) || 0)) }),
      ...(input.hours_invested !== undefined && { hours_invested: Number(input.hours_invested) || 0 }),
    }).eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    await fetchData();
  };

  const deleteLearning = async (id: string): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Pro_learning').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    await fetchData();
  };

  // ── Certification mutations ───────────────────────────────────────────────

  const createCertification = async (input: NewCertificationInput): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Pro_certifications').insert([{
      user_id:       user.id,
      name:          input.name.trim(),
      issuer:        input.issuer.trim(),
      obtained_date: input.obtained_date || null,
      expiry_date:   input.expiry_date || null,
      url:           input.url.trim() || null,
    }]);
    if (error) throw error;
    await fetchData();
  };

  const deleteCertification = async (id: string): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Pro_certifications').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    await fetchData();
  };

  // ── Network mutations ─────────────────────────────────────────────────────

  const createNetworkContact = async (input: NewNetworkInput): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Pro_network').insert([{
      user_id: user.id,
      name:    input.name.trim(),
      role:    input.role.trim() || null,
      company: input.company.trim() || null,
      how_met: input.how_met.trim() || null,
      notes:   input.notes.trim() || null,
    }]);
    if (error) throw error;
    await fetchData();
  };

  const updateNetworkContact = async (id: string, input: Partial<NewNetworkInput>): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Pro_network').update({
      ...(input.name    !== undefined && { name:    input.name.trim() }),
      ...(input.role    !== undefined && { role:    input.role.trim() || null }),
      ...(input.company !== undefined && { company: input.company.trim() || null }),
      ...(input.how_met !== undefined && { how_met: input.how_met.trim() || null }),
      ...(input.notes   !== undefined && { notes:   input.notes.trim() || null }),
    }).eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    await fetchData();
  };

  const deleteNetworkContact = async (id: string): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Pro_network').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    await fetchData();
  };

  return {
    projects, learning, certifications, network, loading, fetchData,
    createProject, updateProject, deleteProject,
    createLearning, updateLearning, deleteLearning,
    createCertification, deleteCertification,
    createNetworkContact, updateNetworkContact, deleteNetworkContact,
  };
}
