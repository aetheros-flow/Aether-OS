import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { X, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

import { useVideos } from '../context';
import { VIDEOS_ACCENT } from '../lib/platforms';

interface NewListSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (listId: string) => void;
}

const PALETTE = [
  '#A855F7', // violet (default)
  '#EC4899', // pink
  '#F59E0B', // amber
  '#10B981', // emerald
  '#3B82F6', // blue
  '#EF4444', // red
  '#14B8A6', // teal
  '#F97316', // orange
];

export default function NewListSheet({ open, onClose, onCreated }: NewListSheetProps) {
  const { createList } = useVideos();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string>(VIDEOS_ACCENT);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setName(''); setDescription(''); setColor(VIDEOS_ACCENT);
    }
  }, [open]);

  const canSubmit = name.trim().length > 0 && !busy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      const id = await createList({ name: name.trim(), description: description.trim(), color });
      toast.success('Lista creada');
      onClose();
      onCreated?.(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info: PanInfo) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-zinc-950 border-t border-white/8 flex flex-col pb-[calc(env(safe-area-inset-bottom,0px)+8px)] touch-pan-y"
          >
            <div className="pt-3 pb-2 flex justify-center shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="px-5 pb-3 flex items-center justify-between shrink-0">
              <h3 className="font-serif text-xl text-white tracking-tight">Nueva Lista</h3>
              <button onClick={onClose} className="p-2 rounded-full bg-white/5 text-zinc-400 active:scale-90 transition-transform" aria-label="Cerrar">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 pb-6 pt-2 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Tutoriales de React"
                  autoCapitalize="sentences"
                  required
                  className="w-full h-11 px-4 rounded-xl text-[14px] font-medium text-white placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-white/15"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500">Descripción (opcional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="De qué trata esta lista"
                  className="w-full h-11 px-4 rounded-xl text-[14px] font-medium text-white placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-white/15"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {PALETTE.map(c => {
                    const isActive = color === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                        style={{
                          background: c,
                          boxShadow: isActive ? `0 0 0 3px rgba(0,0,0,1), 0 0 0 5px ${c}` : 'none',
                        }}
                        aria-label={c}
                      >
                        {isActive && <Check size={14} color="#000" strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-2 h-12 rounded-full font-bold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
                style={{ background: color, color: '#0A0012', boxShadow: `0 6px 20px ${color}50` }}
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={2.5} />}
                {busy ? 'Creando…' : 'Crear lista'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
