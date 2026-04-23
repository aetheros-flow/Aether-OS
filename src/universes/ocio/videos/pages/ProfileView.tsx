import { motion } from 'framer-motion';
import { PlaySquare, Bookmark, ListVideo, Star, Clock } from 'lucide-react';

import { useVideos } from '../context';
import { useAuth } from '../../../../core/contexts/AuthContext';
import { VIDEOS_ACCENT, formatDuration, PLATFORM_META } from '../lib/platforms';

export default function VideosProfileView() {
  const { user } = useAuth();
  const { items, lists, unwatchedItems, watchedItems } = useVideos();

  const ratings = items.filter(i => i.rating != null).map(i => i.rating as number);
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '—';
  const totalDurationSec = items.reduce((s, i) => s + (i.duration_sec ?? 0), 0);
  const durLabel = formatDuration(totalDurationSec) ?? '—';

  // Platform distribution
  const byPlatform = items.reduce((acc, i) => {
    acc[i.platform] = (acc[i.platform] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const platforms = Object.entries(byPlatform).sort((a, b) => b[1] - a[1]);

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'VD';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-6">

      {/* Identity */}
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center font-bold text-base md:text-lg tracking-wider"
          style={{
            background: `linear-gradient(135deg, ${VIDEOS_ACCENT}22, ${VIDEOS_ACCENT}08)`,
            border: `1px solid ${VIDEOS_ACCENT}35`,
            color: VIDEOS_ACCENT,
            boxShadow: `0 4px 20px ${VIDEOS_ACCENT}18`,
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-white tracking-tight leading-tight">
            Videos · Profile
          </h1>
          <p className="text-xs text-zinc-400 mt-1 truncate">
            {user?.email ?? 'Not signed in'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={PlaySquare} label="Watched" value={watchedItems.length} />
        <StatCard icon={Bookmark}   label="Saved"   value={unwatchedItems.length} />
        <StatCard icon={ListVideo}  label="Lists"   value={lists.length} />
        <StatCard icon={Star}       label="Avg ★"   value={avgRating} />
      </div>

      {/* Total watch-time */}
      <div className="rounded-2xl p-5 flex items-center gap-4"
        style={{
          background: `linear-gradient(135deg, ${VIDEOS_ACCENT}15 0%, rgba(255,255,255,0.02) 100%)`,
          border: `1px solid ${VIDEOS_ACCENT}25`,
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: `${VIDEOS_ACCENT}22`, border: `1px solid ${VIDEOS_ACCENT}45` }}
        >
          <Clock size={18} style={{ color: VIDEOS_ACCENT }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500">Total content saved</p>
          <p className="text-2xl font-bold text-white tabular-nums mt-0.5">{durLabel}</p>
        </div>
      </div>

      {/* Platform distribution */}
      {platforms.length > 0 && (
        <section>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500 mb-3 px-1">By platform</p>
          <div className="rounded-2xl bg-white/[0.04] border border-white/5 divide-y divide-white/5 overflow-hidden">
            {platforms.map(([key, count]) => {
              const meta = PLATFORM_META[key as keyof typeof PLATFORM_META];
              const pct = Math.round((count / items.length) * 100);
              return (
                <div key={key} className="flex items-center gap-3.5 px-4 py-3.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${meta.color}20`, border: `1px solid ${meta.color}45` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color, boxShadow: `0 0 4px ${meta.color}` }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white">{meta.label}</p>
                    <div className="w-full h-1 mt-1.5 rounded-full bg-white/8 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: meta.color }} />
                    </div>
                  </div>
                  <span className="text-[13px] font-bold text-white tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/5">
      <Icon size={15} style={{ color: VIDEOS_ACCENT }} />
      <p className="text-2xl md:text-3xl font-bold text-white tabular-nums leading-none mt-3">{value}</p>
      <p className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500 mt-2">{label}</p>
    </div>
  );
}
