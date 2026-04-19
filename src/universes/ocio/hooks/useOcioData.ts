import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../core/contexts/AuthContext';
import type {
  OcioBook, OcioWatchlistItem, OcioHobby, OcioBucketItem,
  NewBookInput, NewWatchInput, NewHobbyInput, NewBucketInput,
} from '../types';

export function useOcioData() {
  const { user } = useAuth();

  const [books,     setBooks]     = useState<OcioBook[]>([]);
  const [watchlist, setWatchlist] = useState<OcioWatchlistItem[]>([]);
  const [hobbies,   setHobbies]   = useState<OcioHobby[]>([]);
  const [bucket,    setBucket]    = useState<OcioBucketItem[]>([]);
  const [loading,   setLoading]   = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [
        { data: b },
        { data: w },
        { data: h },
        { data: bl },
      ] = await Promise.all([
        supabase.from('Ocio_books').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('Ocio_watchlist').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('Ocio_hobbies').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('Ocio_bucket_list').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      if (b)  setBooks(b);
      if (w)  setWatchlist(w);
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

  const createWatchItem = async (input: NewWatchInput): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Ocio_watchlist').insert([{
      user_id:  user.id,
      title:    input.title.trim(),
      platform: input.platform,
      status:   input.status,
      genre:    input.genre.trim() || null,
      rating:   input.rating ? Number(input.rating) : null,
    }]);
    if (error) throw error;
    await fetchData();
  };

  const updateWatchItem = async (id: string, input: Partial<NewWatchInput>): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Ocio_watchlist').update({
      ...(input.title    !== undefined && { title:    input.title.trim() }),
      ...(input.platform !== undefined && { platform: input.platform }),
      ...(input.status   !== undefined && { status:   input.status }),
      ...(input.genre    !== undefined && { genre:    input.genre.trim() || null }),
      ...(input.rating   !== undefined && { rating:   input.rating ? Number(input.rating) : null }),
    }).eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    await fetchData();
  };

  const deleteWatchItem = async (id: string): Promise<void> => {
    if (!user) throw new Error('No autenticado');
    const { error } = await supabase.from('Ocio_watchlist').delete().eq('id', id).eq('user_id', user.id);
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
    books, watchlist, hobbies, bucket, loading, fetchData,
    createBook, updateBook, deleteBook,
    createWatchItem, updateWatchItem, deleteWatchItem,
    createHobby, deleteHobby,
    createBucketItem, updateBucketItem, deleteBucketItem,
  };
}
