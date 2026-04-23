import { useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../core/contexts/AuthContext';
import { resolveVideoMeta } from '../lib/oembed';
import { parseVideoUrl } from '../lib/platforms';
import {
  NewListSchema, NewVideoSchema,
  type NewListInput, type NewVideoInput,
} from '../types';

/**
 * All Videos mutations. Receives `refetch` from useVideosData. Every mutation
 * refetches on success so views stay truthful.
 */
export function useVideosActions(refetch: () => Promise<void>) {
  const { user } = useAuth();

  const requireUser = useCallback(() => {
    if (!user) throw new Error('No autenticado');
    return user.id as string;
  }, [user]);

  // ── Lists ────────────────────────────────────────────────────────────────
  const createList = useCallback(async (input: NewListInput): Promise<string> => {
    const uid = requireUser();
    const parsed = NewListSchema.parse(input);
    const { data, error } = await supabase.from('Ocio_videos_lists').insert({
      user_id: uid,
      name: parsed.name,
      description: parsed.description || null,
      color: parsed.color || null,
    }).select('id').single();
    if (error) throw error;
    await refetch();
    return data.id as string;
  }, [refetch, requireUser]);

  const updateList = useCallback(async (id: string, patch: Partial<NewListInput>) => {
    const uid = requireUser();
    const { error } = await supabase.from('Ocio_videos_lists').update({
      ...(patch.name !== undefined && { name: patch.name.trim() }),
      ...(patch.description !== undefined && { description: patch.description.trim() || null }),
      ...(patch.color !== undefined && { color: patch.color || null }),
    }).eq('id', id).eq('user_id', uid);
    if (error) throw error;
    await refetch();
  }, [refetch, requireUser]);

  const deleteList = useCallback(async (id: string) => {
    const uid = requireUser();
    const { error } = await supabase.from('Ocio_videos_lists').delete()
      .eq('id', id).eq('user_id', uid);
    if (error) throw error;
    await refetch();
  }, [refetch, requireUser]);

  // ── Videos ───────────────────────────────────────────────────────────────
  const addVideo = useCallback(async (input: NewVideoInput): Promise<string> => {
    const uid = requireUser();
    const parsed = NewVideoSchema.parse(input);

    const urlInfo = parseVideoUrl(parsed.url);
    const meta = await resolveVideoMeta(urlInfo.canonical_url);

    const { data, error } = await supabase.from('Ocio_videos_items').insert({
      user_id: uid,
      list_id: parsed.list_id ?? null,
      url: urlInfo.canonical_url,
      platform: meta.platform,
      external_id: meta.external_id,
      title: parsed.title?.trim() || meta.title,
      thumbnail_url: meta.thumbnail_url,
      author_name: meta.author_name,
      duration_sec: meta.duration_sec,
      description: parsed.description?.trim() || null,
    }).select('id').single();

    if (error) throw error;
    await refetch();
    return data.id as string;
  }, [refetch, requireUser]);

  const removeVideo = useCallback(async (id: string) => {
    const uid = requireUser();
    const { error } = await supabase.from('Ocio_videos_items').delete()
      .eq('id', id).eq('user_id', uid);
    if (error) throw error;
    await refetch();
  }, [refetch, requireUser]);

  const markVideoWatched = useCallback(async (id: string, watched: boolean) => {
    const uid = requireUser();
    const { error } = await supabase.from('Ocio_videos_items').update({
      watched_at: watched ? new Date().toISOString() : null,
    }).eq('id', id).eq('user_id', uid);
    if (error) throw error;
    await refetch();
  }, [refetch, requireUser]);

  const rateVideo = useCallback(async (id: string, rating: number | null) => {
    const uid = requireUser();
    const clamped = rating === null ? null : Math.max(1, Math.min(10, Math.round(rating)));
    const { error } = await supabase.from('Ocio_videos_items').update({
      rating: clamped,
    }).eq('id', id).eq('user_id', uid);
    if (error) throw error;
    await refetch();
  }, [refetch, requireUser]);

  const moveVideoToList = useCallback(async (id: string, listId: string | null) => {
    const uid = requireUser();
    const { error } = await supabase.from('Ocio_videos_items').update({
      list_id: listId,
    }).eq('id', id).eq('user_id', uid);
    if (error) throw error;
    await refetch();
  }, [refetch, requireUser]);

  return {
    createList, updateList, deleteList,
    addVideo, removeVideo, markVideoWatched, rateVideo, moveVideoToList,
  };
}
