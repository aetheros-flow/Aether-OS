import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Film } from 'lucide-react';
import type { VideoItem, VideoList } from '../types';
import { VIDEOS_ACCENT } from '../lib/platforms';

interface ListCardProps {
  list: VideoList;
  items: VideoItem[];
}

/**
 * Mosaic tile showing up to 4 thumbnails from the list + name + count.
 * Click navigates to list detail.
 */
export default function ListCard({ list, items }: ListCardProps) {
  const color = list.color || VIDEOS_ACCENT;
  const preview = items.slice(0, 4);
  const watchedCount = items.filter(i => i.watched_at).length;
  const progress = items.length > 0 ? Math.round((watchedCount / items.length) * 100) : 0;

  return (
    <Link to={`/ocio/videos/list/${list.id}`} className="block w-full">
      <motion.div
        whileTap={{ scale: 0.98 }}
        whileHover={{ y: -3 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="rounded-2xl overflow-hidden ring-1 ring-white/8 shadow-lg shadow-black/30 bg-white/[0.03]"
      >
        {/* ── Thumbnail mosaic ─────────────────────────────────────────── */}
        <div className="relative aspect-video bg-black grid grid-cols-2 grid-rows-2 gap-0.5">
          {preview.length === 0 ? (
            <div className="col-span-2 row-span-2 flex items-center justify-center">
              <Film size={26} style={{ color: `${color}88` }} />
            </div>
          ) : (
            [...preview, ...Array(4 - preview.length).fill(null)].map((v, idx) => (
              v?.thumbnail_url ? (
                <img
                  key={v.id}
                  src={v.thumbnail_url}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div key={idx} className="w-full h-full bg-white/[0.03]" />
              )
            ))
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Play badge */}
          <div
            className="absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md ring-1 ring-white/15"
            style={{ background: `${color}33`, color }}
          >
            <Play size={14} fill="currentColor" stroke="currentColor" />
          </div>
        </div>

        {/* ── Info ─────────────────────────────────────────────────────── */}
        <div className="p-3.5 pt-3">
          <h3 className="font-serif text-[17px] md:text-lg font-semibold text-white tracking-tight leading-tight line-clamp-1">
            {list.name}
          </h3>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] font-semibold text-zinc-500 tabular-nums">
              {items.length} {items.length === 1 ? 'video' : 'videos'}
              {items.length > 0 && ` · ${watchedCount} vistos`}
            </p>
            {items.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-12 h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${progress}%`, background: color }}
                  />
                </div>
                <span className="text-[10px] font-black tabular-nums" style={{ color }}>{progress}%</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
