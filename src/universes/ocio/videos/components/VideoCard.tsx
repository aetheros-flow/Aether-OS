import { motion } from 'framer-motion';
import { CheckCircle2, Play, Star, MoreVertical, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useVideos } from '../context';
import { PLATFORM_META, VIDEOS_ACCENT, formatDuration } from '../lib/platforms';
import type { VideoItem } from '../types';

interface VideoCardProps {
  item: VideoItem;
  /** Horizontal carousel variant (fixed width). */
  fixedWidth?: boolean;
  /** Hide the action menu (useful for compact rails). */
  hideMenu?: boolean;
}

export default function VideoCard({ item, fixedWidth, hideMenu }: VideoCardProps) {
  const { markVideoWatched, removeVideo } = useVideos();
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const watched = Boolean(item.watched_at);
  const plat = PLATFORM_META[item.platform];
  const duration = formatDuration(item.duration_sec);

  const widthClass = fixedWidth ? 'w-[240px] md:w-[280px] shrink-0 snap-start' : 'w-full';

  const toggleWatched = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setBusy(true);
    try { await markVideoWatched(item.id, !watched); }
    finally { setBusy(false); }
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setMenuOpen(false);
    if (!confirm('Delete this video?')) return;
    await removeVideo(item.id);
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={`${widthClass} flex flex-col gap-2 group`}
    >
      <button
        onClick={handleOpen}
        className="relative aspect-video w-full rounded-2xl overflow-hidden bg-zinc-900 ring-1 ring-white/5 shadow-lg shadow-black/50 active:scale-[0.99] transition-transform text-left"
      >
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={item.title ?? 'video'}
            loading="lazy"
            decoding="async"
            draggable={false}
            className={`w-full h-full object-cover transition-all ${watched ? 'opacity-60 grayscale-[20%]' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
            {plat.label}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md"
            style={{ background: `${VIDEOS_ACCENT}DD`, boxShadow: `0 8px 24px ${VIDEOS_ACCENT}80` }}
          >
            <Play size={22} fill="#000" stroke="#000" />
          </div>
        </div>

        {/* Platform chip */}
        <div
          className="absolute top-2 left-2 flex items-center gap-1 px-2 h-6 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ring-1 ring-white/15"
          style={{ background: 'rgba(0,0,0,0.6)', color: plat.color }}
        >
          <span className="w-1 h-1 rounded-full" style={{ background: plat.color, boxShadow: `0 0 4px ${plat.color}` }} />
          {plat.label}
        </div>

        {/* Duration chip */}
        {duration && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/75 backdrop-blur-sm text-white tabular-nums ring-1 ring-white/10">
            {duration}
          </div>
        )}

        {/* Watched badge */}
        {watched && (
          <div className="absolute top-2 right-2 p-1 rounded-full bg-black/70 backdrop-blur-md ring-1 ring-white/10">
            <CheckCircle2 size={13} style={{ color: VIDEOS_ACCENT }} />
          </div>
        )}

        {/* Rating badge */}
        {item.rating && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md ring-1 ring-white/10">
            <Star size={10} fill={VIDEOS_ACCENT} stroke={VIDEOS_ACCENT} />
            <span className="text-[10px] font-bold text-white tabular-nums">{item.rating}</span>
          </div>
        )}
      </button>

      <div className="flex items-start gap-2 px-0.5">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white/90 leading-tight line-clamp-2">
            {item.title ?? item.url}
          </p>
          {item.author_name && (
            <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{item.author_name}</p>
          )}
        </div>

        {!hideMenu && (
          <div className="relative shrink-0">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(v => !v); }}
              className="p-1.5 rounded-full text-zinc-500 hover:text-white active:scale-90 transition-all"
              aria-label="Video options"
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-1 w-44 rounded-xl overflow-hidden z-50 shadow-2xl shadow-black/70 ring-1 ring-white/10"
                  style={{ background: 'rgba(18,18,20,0.96)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
                >
                  <button
                    onClick={toggleWatched}
                    disabled={busy}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] font-semibold text-white text-left hover:bg-white/5 transition-colors"
                  >
                    <CheckCircle2 size={13} style={{ color: watched ? VIDEOS_ACCENT : '#a1a1aa' }} />
                    {watched ? 'Mark as unwatched' : 'Mark as watched'}
                  </button>
                  <button
                    onClick={handleOpen}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] font-semibold text-white text-left hover:bg-white/5 transition-colors border-t border-white/5"
                  >
                    <ExternalLink size={13} className="text-zinc-400" />
                    Open on platform
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] font-semibold text-red-400 text-left hover:bg-red-500/10 transition-colors border-t border-white/5"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
