import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Play, ListVideo, Film } from 'lucide-react';

import { useVideos } from '../context';
import VideoCard from '../components/VideoCard';
import ListCard from '../components/ListCard';
import { VIDEOS_ACCENT } from '../lib/platforms';

export default function VideosHomeView() {
  const { lists, items, unwatchedItems, watchedItems, itemsForList, loading } = useVideos();

  const recentUnwatched = unwatchedItems.slice(0, 10);
  const recentWatched = watchedItems.slice(0, 10);
  const topLists = lists.slice(0, 6);

  const totalDuration = items.reduce((sum, i) => sum + (i.duration_sec ?? 0), 0);
  const hoursSaved = Math.round(totalDuration / 3600);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex flex-col gap-8 md:gap-10">

      {/* ── Hero stats ──────────────────────────────────────────────────── */}
      <section
        className="relative rounded-3xl overflow-hidden p-5 md:p-7"
        style={{
          background: `linear-gradient(135deg, ${VIDEOS_ACCENT}22 0%, ${VIDEOS_ACCENT}08 40%, rgba(255,255,255,0.02) 100%)`,
          border: `1px solid ${VIDEOS_ACCENT}30`,
        }}
      >
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-30 blur-[80px]"
          style={{ background: VIDEOS_ACCENT }}
        />
        <div className="relative">
          <p className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: VIDEOS_ACCENT }}>
            Your library
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white tracking-tight mt-2 leading-tight">
            {items.length === 0
              ? 'Nothing saved yet'
              : `${items.length} video${items.length === 1 ? '' : 's'} saved`}
          </h2>
          <div className="flex items-center gap-4 mt-3 text-[13px] text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Play size={13} style={{ color: VIDEOS_ACCENT }} fill={VIDEOS_ACCENT} />
              <span className="tabular-nums">{watchedItems.length}</span>
              <span className="text-zinc-500">watched</span>
            </span>
            <span className="text-zinc-700">·</span>
            <span className="flex items-center gap-1.5">
              <ListVideo size={13} style={{ color: VIDEOS_ACCENT }} />
              <span className="tabular-nums">{lists.length}</span>
              <span className="text-zinc-500">lists</span>
            </span>
            {hoursSaved > 0 && (
              <>
                <span className="text-zinc-700">·</span>
                <span className="flex items-center gap-1.5">
                  <span className="tabular-nums font-semibold text-white">~{hoursSaved}h</span>
                  <span className="text-zinc-500">content</span>
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Up Next (unwatched) ─────────────────────────────────────────── */}
      {!loading && recentUnwatched.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeader title="Up Next" eyebrow="Not Watched" />
          <div className="-mx-4 md:-mx-8">
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 px-4 md:px-8 snap-x scroll-smooth hide-scrollbar">
              {recentUnwatched.map(item => (
                <VideoCard key={item.id} item={item} fixedWidth />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Your Lists ──────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <Link to="/ocio/videos/lists" className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500">Curated</span>
            <h2 className="font-serif text-[22px] md:text-2xl font-semibold text-white tracking-tight leading-none">
              Your Lists
            </h2>
          </div>
          <ChevronRight size={20} className="text-zinc-500" />
        </Link>

        {topLists.length === 0 ? (
          <div className="rounded-3xl bg-white/[0.03] border border-white/5 p-8 flex flex-col items-center justify-center text-center">
            <Film size={36} className="text-zinc-600 mb-3" />
            <p className="text-sm font-semibold text-zinc-300">Todavía no tenés listas</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs">
              Creá una desde la tab "Lists" para organizar tus videos por tema.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {topLists.map(l => (
              <ListCard key={l.id} list={l} items={itemsForList(l.id)} />
            ))}
          </div>
        )}
      </section>

      {/* ── Recently Watched ────────────────────────────────────────────── */}
      {recentWatched.length > 0 && (
        <section className="flex flex-col gap-4">
          <Link to="/ocio/videos/watched" className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500">History</span>
              <h2 className="font-serif text-[22px] md:text-2xl font-semibold text-white tracking-tight leading-none">
                Recently Watched
              </h2>
            </div>
            <ChevronRight size={20} className="text-zinc-500" />
          </Link>
          <div className="-mx-4 md:-mx-8">
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 px-4 md:px-8 snap-x scroll-smooth hide-scrollbar">
              {recentWatched.map(item => (
                <VideoCard key={item.id} item={item} fixedWidth />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Empty state (no videos at all) ──────────────────────────────── */}
      {!loading && items.length === 0 && (
        <div className="rounded-3xl bg-white/[0.03] border border-dashed border-white/10 p-10 flex flex-col items-center justify-center text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: `${VIDEOS_ACCENT}18`, border: `1px solid ${VIDEOS_ACCENT}35` }}
          >
            <Play size={22} style={{ color: VIDEOS_ACCENT }} fill={VIDEOS_ACCENT} />
          </div>
          <p className="text-base font-bold text-white">Empezá tu biblioteca</p>
          <p className="text-sm text-zinc-400 mt-1 max-w-sm">
            Tocá <span style={{ color: VIDEOS_ACCENT }} className="font-bold">Add</span> arriba y pegá una URL de YouTube, Vimeo, Twitch o cualquier otra plataforma.
          </p>
        </div>
      )}
    </motion.div>
  );
}

function SectionHeader({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500">{eyebrow}</span>
      <h2 className="font-serif text-[22px] md:text-2xl font-semibold text-white tracking-tight leading-none">
        {title}
      </h2>
    </div>
  );
}
