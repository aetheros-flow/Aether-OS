import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { X, Loader2, Link as LinkIcon, Check } from 'lucide-react';
import { toast } from 'sonner';

import { useVideos } from '../context';
import { PLATFORM_META, VIDEOS_ACCENT } from '../lib/platforms';
import { parseVideoUrl } from '../lib/platforms';
import type { VideoList } from '../types';

interface AddVideoSheetProps {
  open: boolean;
  onClose: () => void;
  /** Pre-select this list when opened from inside a list detail page. */
  defaultListId?: string | null;
}

export default function AddVideoSheet({ open, onClose, defaultListId }: AddVideoSheetProps) {
  const { lists, addVideo } = useVideos();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [listId, setListId] = useState<string | null>(defaultListId ?? null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setUrl(''); setTitle(''); setDescription('');
      setListId(defaultListId ?? null);
    }
  }, [open, defaultListId]);

  const parsed = url.trim() ? parseVideoUrl(url.trim()) : null;
  const platform = parsed?.platform ?? null;
  const canSubmit = url.trim().length > 0 && !busy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      await addVideo({
        url: url.trim(),
        list_id: listId,
        title: title.trim(),
        description: description.trim(),
      });
      toast.success('Video added');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add');
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
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] rounded-t-[28px] bg-[#241E1A] border-t border-[rgba(232,221,204,0.08)] flex flex-col pb-[calc(env(safe-area-inset-bottom,0px)+8px)] touch-pan-y"
          >
            <div className="pt-3 pb-2 flex justify-center shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="px-5 pb-3 flex items-center justify-between shrink-0">
              <h3 className="font-sans text-xl font-bold text-white tracking-tight" style={{ letterSpacing: '-0.01em' }}>Add Video</h3>
              <button onClick={onClose} className="p-2 rounded-full bg-white/5 text-zinc-400 active:scale-90 transition-transform" aria-label="Close">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-8 pt-2 flex flex-col gap-4">
              {/* URL */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500">Video URL</label>
                <div className="relative">
                  <LinkIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    inputMode="url"
                    enterKeyHint="next"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                    className="w-full h-11 pl-10 pr-4 rounded-xl text-[14px] font-medium text-white placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-white/15"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                </div>
                {platform && platform !== 'other' && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: PLATFORM_META[platform].color, boxShadow: `0 0 6px ${PLATFORM_META[platform].color}` }}
                    />
                    <span className="text-zinc-400">Detected:</span>
                    <span className="font-semibold" style={{ color: PLATFORM_META[platform].color }}>
                      {PLATFORM_META[platform].label}
                    </span>
                  </div>
                )}
              </div>

              {/* Title (optional override) */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500">Title (optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Leave empty to use the platform title"
                  className="w-full h-11 px-4 rounded-xl text-[14px] font-medium text-white placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-white/15"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>

              {/* List picker */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500">List</label>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar scroll-smooth -mx-5 px-5 pb-1">
                  <ListChip label="No list" active={listId === null} onClick={() => setListId(null)} />
                  {lists.map((l: VideoList) => (
                    <ListChip
                      key={l.id}
                      label={l.name}
                      color={l.color || VIDEOS_ACCENT}
                      active={listId === l.id}
                      onClick={() => setListId(l.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500">Note (optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Why are you saving it?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-[14px] font-medium text-white placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-white/15 resize-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-2 h-12 rounded-full font-bold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
                style={{
                  background: VIDEOS_ACCENT,
                  color: '#1B1714',
                  boxShadow: `0 6px 20px ${VIDEOS_ACCENT}50`,
                }}
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={2.5} />}
                {busy ? 'Saving…' : 'Add'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ListChip({ label, active, color = '#A855F7', onClick }: {
  label: string; active: boolean; color?: string; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 px-4 h-10 rounded-full text-[12px] font-semibold whitespace-nowrap active:scale-95 transition-all"
      style={{
        background: active ? `${color}20` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? `${color}55` : 'rgba(255,255,255,0.08)'}`,
        color: active ? color : '#d4d4d8',
      }}
    >
      {label}
    </button>
  );
}
