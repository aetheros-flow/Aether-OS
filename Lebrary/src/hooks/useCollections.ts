import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';

export interface Collection {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  bookIds: string[];
}

interface State {
  list: Collection[];
  loading: boolean;
  error: Error | null;
}

interface CollectionRow {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
  lebrary_collection_books: Array<{ book_id: string }> | null;
}

function rowToCollection(r: CollectionRow): Collection {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    color: r.color ?? 'amber',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    bookIds: (r.lebrary_collection_books ?? []).map((b) => b.book_id),
  };
}

export function useCollections() {
  const { user } = useAuth();
  const [state, setState] = useState<State>({ list: [], loading: !!user, error: null });

  const load = useCallback(async () => {
    if (!user) {
      setState({ list: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await getSupabase()
      .from('lebrary_collections')
      .select('*, lebrary_collection_books(book_id)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      setState({ list: [], loading: false, error: new Error(error.message) });
    } else {
      setState({
        list: ((data ?? []) as unknown as CollectionRow[]).map(rowToCollection),
        loading: false,
        error: null,
      });
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const create = useCallback(async (name: string, description = ''): Promise<Collection | null> => {
    if (!user) return null;
    const { data, error } = await getSupabase()
      .from('lebrary_collections')
      .insert({ user_id: user.id, name: name.trim(), description })
      .select('*, lebrary_collection_books(book_id)')
      .single();
    if (error || !data) return null;
    const created = rowToCollection(data as unknown as CollectionRow);
    setState((s) => ({ ...s, list: [created, ...s.list] }));
    return created;
  }, [user]);

  const rename = useCallback(async (id: string, name: string, description?: string) => {
    if (!user) return;
    setState((s) => ({
      ...s,
      list: s.list.map((c) =>
        c.id === id ? { ...c, name, description: description ?? c.description } : c,
      ),
    }));
    await getSupabase()
      .from('lebrary_collections')
      .update({ name, ...(description !== undefined ? { description } : {}) })
      .eq('id', id);
  }, [user]);

  const remove = useCallback(async (id: string) => {
    if (!user) return;
    setState((s) => ({ ...s, list: s.list.filter((c) => c.id !== id) }));
    await getSupabase().from('lebrary_collections').delete().eq('id', id);
  }, [user]);

  const addBook = useCallback(async (collectionId: string, bookId: string) => {
    if (!user) return;
    setState((s) => ({
      ...s,
      list: s.list.map((c) =>
        c.id === collectionId && !c.bookIds.includes(bookId)
          ? { ...c, bookIds: [...c.bookIds, bookId] }
          : c,
      ),
    }));
    await getSupabase().from('lebrary_collection_books').upsert(
      { collection_id: collectionId, book_id: bookId },
      { onConflict: 'collection_id,book_id' },
    );
  }, [user]);

  const removeBook = useCallback(async (collectionId: string, bookId: string) => {
    if (!user) return;
    setState((s) => ({
      ...s,
      list: s.list.map((c) =>
        c.id === collectionId ? { ...c, bookIds: c.bookIds.filter((id) => id !== bookId) } : c,
      ),
    }));
    await getSupabase()
      .from('lebrary_collection_books')
      .delete()
      .eq('collection_id', collectionId)
      .eq('book_id', bookId);
  }, [user]);

  return {
    collections: state.list,
    loading: state.loading,
    error: state.error,
    create,
    rename,
    remove,
    addBook,
    removeBook,
    refresh: load,
  };
}
