import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bookmark, CheckCircle, BookMarked, Star, List, EyeOff,
  BarChart3, Settings, ChevronRight,
} from 'lucide-react';

import { usePantalla } from '../context';
import { useAuth } from '../../../../core/contexts/AuthContext';
import { PANTALLA_ACCENT } from '../lib/tmdb-constants';

export default function ProfileView() {
  const { user } = useAuth();
  const { watchlist, history, ratings, hidden } = usePantalla();

  const totalMovies = history.filter(h => h.media_type === 'movie').length;
  const totalShows = history.filter(h => h.media_type === 'tv').length;
  const avgRating = ratings.length
    ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1)
    : '—';

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '🎬';

  const lists = [
    { icon: Bookmark,    label: 'Watchlist',      count: watchlist.length, to: '/ocio/pantalla/movies' },
    { icon: CheckCircle, label: 'History',        count: history.length,   to: '/ocio/pantalla/movies' },
    { icon: Star,        label: 'Ratings',        count: ratings.length,   to: undefined, disabled: true },
    { icon: BookMarked,  label: 'Collection',     count: 0,                to: undefined, disabled: true },
    { icon: List,        label: 'Personal Lists', count: 0,                to: undefined, disabled: true },
  ];

  const entries = [
    { icon: EyeOff, label: 'Hidden Items', count: hidden.length, to: undefined, disabled: true },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-6">

      {/* ── Identity ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center font-bold text-base md:text-lg tracking-wider"
          style={{
            background: `linear-gradient(135deg, ${PANTALLA_ACCENT}22, ${PANTALLA_ACCENT}08)`,
            border: `1px solid ${PANTALLA_ACCENT}35`,
            color: PANTALLA_ACCENT,
            boxShadow: `0 4px 20px ${PANTALLA_ACCENT}18`,
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-white tracking-tight leading-tight">
            My Profile
          </h1>
          <p className="text-xs text-zinc-400 mt-1 truncate">
            {user?.email ?? 'Not signed in'}
          </p>
        </div>
        <div className="flex gap-2">
          <IconTile icon={BarChart3} disabled />
          <IconTile icon={Settings} disabled />
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Movies" value={totalMovies} />
        <StatCard label="Shows"  value={totalShows} />
        <StatCard label="Avg ★"  value={avgRating} />
      </div>

      {/* ── Lists ───────────────────────────────────────────────────────── */}
      <section>
        <p className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500 mb-2.5 px-1">Lists</p>
        <div className="rounded-2xl bg-white/[0.04] border border-white/5 divide-y divide-white/5 overflow-hidden">
          {lists.map(({ icon, label, count, to, disabled }) => (
            <Row key={label} icon={icon} label={label} count={count} to={to} disabled={disabled} />
          ))}
        </div>
      </section>

      {/* ── Entries ─────────────────────────────────────────────────────── */}
      <section>
        <p className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500 mb-2.5 px-1">My Entries</p>
        <div className="rounded-2xl bg-white/[0.04] border border-white/5 divide-y divide-white/5 overflow-hidden">
          {entries.map(({ icon, label, count, to, disabled }) => (
            <Row key={label} icon={icon} label={label} count={count} to={to} disabled={disabled} />
          ))}
        </div>
      </section>

      <p className="text-[11px] text-zinc-600 text-center mt-2 px-6">
        Collections, Personal Lists, Reminders and Favorite People are coming soon.
      </p>
    </motion.div>
  );
}

// ── UI atoms ─────────────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/5">
      <p className="text-2xl md:text-3xl font-bold text-white tabular-nums leading-none">{value}</p>
      <p className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-500 mt-2">{label}</p>
    </div>
  );
}

function IconTile({ icon: Icon, disabled }: { icon: typeof Settings; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      className="p-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 active:scale-90 transition-transform disabled:opacity-40"
      aria-label="Action"
    >
      <Icon size={14} strokeWidth={2.25} />
    </button>
  );
}

function Row({ icon: Icon, label, count, to, disabled }: {
  icon: typeof Bookmark; label: string; count: number; to?: string; disabled?: boolean;
}) {
  const inner = (
    <div className="flex items-center gap-3.5 px-4 py-3.5">
      <div className="p-2 rounded-xl bg-white/[0.04] border border-white/5">
        <Icon size={16} className="text-zinc-300" strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-white">{label}</p>
      </div>
      <span className="text-[12px] font-bold text-zinc-500 tabular-nums">{count}</span>
      {!disabled && to && <ChevronRight size={16} className="text-zinc-600 -mr-1" />}
    </div>
  );
  if (disabled || !to) return <div className="opacity-50">{inner}</div>;
  return <Link to={to} className="block hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors">{inner}</Link>;
}
