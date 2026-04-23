import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ListVideo } from 'lucide-react';

import { useVideos } from '../context';
import ListCard from '../components/ListCard';
import NewListSheet from '../components/NewListSheet';
import { VIDEOS_ACCENT } from '../lib/platforms';

export default function VideosListsView() {
  const { lists, itemsForList } = useVideos();
  const [newOpen, setNewOpen] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500">Library</p>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-white tracking-tight leading-none mt-1">
            Lists
          </h1>
        </div>
        <button
          onClick={() => setNewOpen(true)}
          className="flex items-center gap-1.5 px-4 h-10 rounded-full text-[13px] font-bold active:scale-95 transition-transform"
          style={{
            background: VIDEOS_ACCENT,
            color: '#0A0012',
            boxShadow: `0 4px 14px ${VIDEOS_ACCENT}45`,
          }}
        >
          <Plus size={14} strokeWidth={2.75} />
          New list
        </button>
      </div>

      {lists.length === 0 ? (
        <div className="rounded-3xl bg-white/[0.03] border border-dashed border-white/10 p-10 flex flex-col items-center justify-center text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: `${VIDEOS_ACCENT}18`, border: `1px solid ${VIDEOS_ACCENT}35` }}
          >
            <ListVideo size={22} style={{ color: VIDEOS_ACCENT }} />
          </div>
          <p className="text-base font-bold text-white">Aún no hay listas</p>
          <p className="text-sm text-zinc-400 mt-1 max-w-sm">
            Organizá tus videos por tema, formato o proyecto. Ej: "Tutoriales de React", "Podcasts", "Workout 2026".
          </p>
          <button
            onClick={() => setNewOpen(true)}
            className="mt-5 flex items-center gap-1.5 px-5 h-10 rounded-full text-[13px] font-bold active:scale-95 transition-transform"
            style={{ background: VIDEOS_ACCENT, color: '#0A0012', boxShadow: `0 4px 14px ${VIDEOS_ACCENT}45` }}
          >
            <Plus size={14} strokeWidth={2.75} />
            Crear primera lista
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {lists.map(l => (
            <ListCard key={l.id} list={l} items={itemsForList(l.id)} />
          ))}
        </div>
      )}

      <NewListSheet open={newOpen} onClose={() => setNewOpen(false)} />
    </motion.div>
  );
}
