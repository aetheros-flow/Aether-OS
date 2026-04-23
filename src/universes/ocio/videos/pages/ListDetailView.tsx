import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trash2, Film } from 'lucide-react';
import { toast } from 'sonner';

import { useVideos } from '../context';
import VideoCard from '../components/VideoCard';
import AddVideoSheet from '../components/AddVideoSheet';
import { VIDEOS_ACCENT } from '../lib/platforms';

export default function ListDetailView() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { getList, itemsForList, deleteList } = useVideos();
  const [addOpen, setAddOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const list = getList(listId ?? null);
  const items = listId ? itemsForList(listId) : [];

  if (!list) {
    return (
      <div className="py-20 text-center">
        <p className="text-base font-bold text-zinc-300">Lista no encontrada</p>
        <button
          onClick={() => navigate('/ocio/videos/lists')}
          className="mt-4 px-5 h-10 rounded-full text-[13px] font-semibold text-white bg-white/8 active:scale-95 transition-transform"
        >
          Volver a Lists
        </button>
      </div>
    );
  }

  const color = list.color || VIDEOS_ACCENT;
  const watched = items.filter(i => i.watched_at).length;
  const progress = items.length > 0 ? Math.round((watched / items.length) * 100) : 0;

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar la lista "${list.name}"? Los videos que contenga van a quedar sin lista.`)) return;
    setDeleting(true);
    try {
      await deleteList(list.id);
      toast.success('Lista eliminada');
      navigate('/ocio/videos/lists');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar');
      setDeleting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-5">
      {/* Hero */}
      <section
        className="relative rounded-3xl overflow-hidden p-5 md:p-6"
        style={{
          background: `linear-gradient(135deg, ${color}22 0%, ${color}08 50%, rgba(255,255,255,0.02) 100%)`,
          border: `1px solid ${color}35`,
        }}
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-25 blur-[80px]" style={{ background: color }} />
        <div className="relative">
          <p className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color }}>
            Playlist
          </p>
          <h1 className="font-serif text-2xl md:text-4xl font-semibold text-white tracking-tight mt-2 leading-tight">
            {list.name}
          </h1>
          {list.description && (
            <p className="text-sm text-zinc-300 mt-2 max-w-2xl leading-relaxed">{list.description}</p>
          )}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tabular-nums">{items.length}</span>
              <span className="text-xs text-zinc-500">{items.length === 1 ? 'video' : 'videos'}</span>
            </div>
            {items.length > 0 && (
              <>
                <span className="text-zinc-700">·</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${progress}%`, background: color }} />
                  </div>
                  <span className="text-[11px] font-black tabular-nums" style={{ color }}>{progress}%</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 mt-5">
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 px-4 h-10 rounded-full text-[13px] font-bold active:scale-95 transition-transform"
              style={{ background: color, color: '#0A0012', boxShadow: `0 4px 14px ${color}55` }}
            >
              <Plus size={14} strokeWidth={2.75} />
              Agregar video
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3.5 h-10 rounded-full text-[12px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 active:scale-95 transition-transform disabled:opacity-50"
            >
              <Trash2 size={13} />
              Eliminar lista
            </button>
          </div>
        </div>
      </section>

      {/* Videos */}
      {items.length === 0 ? (
        <div className="rounded-3xl bg-white/[0.03] border border-dashed border-white/10 p-10 flex flex-col items-center justify-center text-center">
          <Film size={32} className="text-zinc-600 mb-3" />
          <p className="text-base font-bold text-white">Lista vacía</p>
          <p className="text-sm text-zinc-400 mt-1">Agregá el primer video con el botón de arriba.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {items.map(item => (
            <VideoCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <AddVideoSheet open={addOpen} onClose={() => setAddOpen(false)} defaultListId={list.id} />
    </motion.div>
  );
}
