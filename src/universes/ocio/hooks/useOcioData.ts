import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../core/contexts/AuthContext';
import type {
  OcioBook, OcioHobby, OcioBucketItem,
  NewBookInput, NewHobbyInput, NewBucketInput,
} from '../types';

// NOTE: legacy `Ocio_watchlist` table is no longer read/written here. The
// Pantalla module under `ocio/pantalla/` replaces it with TMDB-backed state
// in `Ocio_pantalla_*` tables. The old table is preserved in the DB as dead
// weight for now; drop it manually once there are definitely no rows.

export function useOcioData() {
  const { user } = useAuth();

  const [books,   setBooks]   = useState<OcioBook[]>([]);
  const [hobbies, setHobbies] = useState<OcioHobby[]>([]);
  const [bucket,  setBucket]  = useState<OcioBucketItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [
        { data: b },
        { data: h },
        { data: bl },
      ] = await Promise.all([
        supabase.from('Ocio_books').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('Ocio_hobbies').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('Ocio_bucket_list').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      if (b)  setBooks(b);
      if (h)  setHobbies(h);
      if (bl) setBucket(bl);
    } catch (err) {
      console.error('[useOcioData] fetchData error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createBook = async (input: NewBookInput): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Ocio_books').insert([{
      user_id: user.id,
      title:   input.title.trim(),
      author:  input.author.trim(),
      status:  input.status,
      rating:  input.rating ? Number(input.rating) : null,
      notes:   input.notes.trim() || null,
    }]);
    if (error) throw error;
    await fetchData();
  };

  const updateBook = async (id: string, input: Partial<NewBookInput>): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Ocio_books').update({
      ...(input.title   !== undefined && { title:  input.title.trim() }),
      ...(input.author  !== undefined && { author: input.author.trim() }),
      ...(input.status  !== undefined && { status: input.status }),
      ...(input.rating  !== undefined && { rating: input.rating ? Number(input.rating) : null }),
      ...(input.notes   !== undefined && { notes:  input.notes.trim() || null }),
    }).eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    await fetchData();
  };

  const deleteBook = async (id: string): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Ocio_books').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    await fetchData();
  };

  const createHobby = async (input: NewHobbyInput): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Ocio_hobbies').insert([{
      user_id:        user.id,
      name:           input.name.trim(),
      frequency:      input.frequency.trim(),
      last_practiced: input.last_practiced || null,
      notes:          input.notes.trim() || null,
    }]);
    if (error) throw error;
    await fetchData();
  };

  const deleteHobby = async (id: string): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Ocio_hobbies').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    await fetchData();
  };

  const createBucketItem = async (input: NewBucketInput): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Ocio_bucket_list').insert([{
      user_id:     user.id,
      description: input.description.trim(),
      category:    input.category.trim(),
      status:      input.status,
    }]);
    if (error) throw error;
    await fetchData();
  };

  const updateBucketItem = async (id: string, status: OcioBucketItem['status']): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Ocio_bucket_list').update({ status }).eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    await fetchData();
  };

  const deleteBucketItem = async (id: string): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Ocio_bucket_list').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    await fetchData();
  };

  return {
    books, hobbies, bucket, loading, fetchData,
    createBook, updateBook, deleteBook,
    createHobby, deleteHobby,
    createBucketItem, updateBucketItem, deleteBucketItem,
  };
}
