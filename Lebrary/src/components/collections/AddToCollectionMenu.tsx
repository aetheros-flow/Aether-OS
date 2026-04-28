import { useEffect, useRef, useState } from 'react';
import { Check, Layers, Plus } from 'lucide-react';
import { useCollections } from '@/hooks/useCollections';

interface AddToCollectionMenuProps {
  bookId: string;
}

export function AddToCollectionMenu({ bookId }: AddToCollectionMenuProps) {
  const { collections, create, addBook, removeBook } = useCollections();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onCreate = async () => {
    if (!newName.trim()) return;
    const created = await create(newName.trim());
    if (created) await addBook(created.id, bookId);
    setNewName('');
    setCreating(false);
  };

  const activeCount = collections.filter((c) => c.bookIds.includes(bookId)).length;

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium shadow-soft transition-all ${
          activeCount > 0
            ? 'border-lumen-400/60 bg-lumen-400/15 text-lumen-600 dark:text-lumen-300'
            : 'border-paper-300/70 bg-paper-50/80 text-ink-700 hover:border-lumen-400/40 hover:text-lumen-600 dark:border-ink-700/60 dark:bg-ink-800/70 dark:text-ink-100 dark:hover:text-lumen-400'
        }`}
      >
        <Layers className="h-3.5 w-3.5" />
        {activeCount > 0 ? `On ${activeCount} shelf${activeCount === 1 ? '' : 'ves'}` : 'Add to shelf'}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-paper-300/70 bg-paper-50 shadow-soft-lg dark:border-ink-700/60 dark:bg-ink-900">
          <div className="border-b border-paper-300/60 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-700 dark:border-ink-700/60 dark:text-ink-100">
            Your shelves
          </div>

          <div className="max-h-64 overflow-y-auto p-1">
            {collections.length === 0 ? (
              <p className="p-3 text-center text-xs text-ink-300 dark:text-ink-200">
                No shelves yet. Create one below.
              </p>
            ) : (
              collections.map((c) => {
                const on = c.bookIds.includes(bookId);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      if (on) void removeBook(c.id, bookId);
                      else void addBook(c.id, bookId);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      on
                        ? 'bg-lumen-400/15 text-ink-900 dark:text-ink-50'
                        : 'hover:bg-paper-200/60 text-ink-700 dark:hover:bg-ink-800/60 dark:text-ink-100'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    {on && <Check className="h-4 w-4 text-lumen-500 dark:text-lumen-400" />}
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-paper-300/60 p-2 dark:border-ink-700/60">
            {creating ? (
              <div className="flex gap-1">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void onCreate();
                    if (e.key === 'Escape') setCreating(false);
                  }}
                  placeholder="Shelf name"
                  className="flex-1 rounded-full border border-paper-300/70 bg-paper-50/70 px-3 py-1.5 text-sm outline-none focus:border-lumen-400/70 dark:border-ink-700/60 dark:bg-ink-900/60 dark:text-ink-50"
                />
                <button
                  type="button"
                  onClick={onCreate}
                  className="rounded-full bg-lumen-500 px-3 py-1.5 text-xs font-semibold text-paper-50 hover:bg-lumen-400 dark:bg-lumen-400 dark:text-ink-900"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-lumen-600 transition-colors hover:bg-lumen-400/10 dark:text-lumen-400"
              >
                <Plus className="h-3.5 w-3.5" />
                New shelf
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
