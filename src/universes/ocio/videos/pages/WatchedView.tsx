import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PlaySquare } from 'lucide-react';

import { useVideos } from '../context';
import VideoCard from '../components/VideoCard';
import { VIDEOS_ACCENT } from '../lib/platforms';

export default function VideosWatchedView() {
  const { watchedItems } = useVideos();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return watchedItems;
    const q = search.trim().toLowerCase();
    return watchedItems.filter(i =>
      (i.title ?? '').toLowerCase().includes(q) ||
      (i.author_name ?? '').toLowerCase().includes(q)
    );
  }, [watchedItems, search]);

  // Group by month (en-US)
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const item of filtered) {
      const when = item.watched_at ? new Date(item.watched_at) : new Date();
      const key = when.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const bucket = map.get(key) ?? [];
      bucket.push(item);
      map.set(key, bucket);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500">History</p>
          <h1 className="font-sans text-3xl md:text-[32px] font-bold text-white tracking-tight leading-tight" style={{ letterSpacing: '-0.02em' }}>
            Watched
          </h1>
          <p className="font-serif italic text-base md:text-[17px] text-zinc-400">
            Everything you've already pressed play on.
          </p>
        </div>
        <p className="text-[11px] font-semibold text-zinc-500 pb-1 tabular-nums">
          {watchedItems.length} {watchedItems.length === 1 ? 'video' : 'videos'}
        </p>
      </div>

      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by title or author"
        inputMode="search"
        enterKeyHint="search"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className="w-full h-11 px-4 rounded-2xl text-[14px] font-medium text-white placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-white/15"
        style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.08)' }}
      />

      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-white/[0.03] border border-dashed border-white/10 p-10 flex flex-col items-center justify-center text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: `${VIDEOS_ACCENT}18`, border: `1px solid ${VIDEOS_ACCENT}35` }}
          >
            <PlaySquare size={22} style={{ color: VIDEOS_ACCENT }} />
          </div>
          <p className="text-base font-bold text-white">
            {search ? 'No results' : "You haven't watched anything yet"}
          </p>
          <p className="text-sm text-zinc-400 mt-1">
            {search ? 'Try another term' : 'Mark videos as watched to see them here.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(([month, rows]) => (
            <section key={month}>
              <p className="text-[11px] font-black tracking-[0.22em] uppercase text-zinc-500 mb-3 capitalize">
                {month}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                {rows.map(item => <VideoCard key={item.id} item={item} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </motion.div>
  );
}
