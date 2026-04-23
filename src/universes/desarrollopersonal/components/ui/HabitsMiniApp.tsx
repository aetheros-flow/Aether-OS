import React, { useState } from 'react';
import {
  Target, CheckCircle2, Circle, Loader2, Plus, Flame, BookOpen, Activity, X,
  Dumbbell, Coffee, Brain, Heart, PenLine, Music,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useHabits } from '../../hooks/useHabits';

const ICON_MAP: Record<string, React.ElementType> = {
  Target, Flame, Activity, BookOpen, Dumbbell, Coffee, Brain, Heart, PenLine, Music,
};
const ICON_CHOICES = ['Target', 'Flame', 'Activity', 'BookOpen', 'Dumbbell', 'Coffee', 'Brain', 'Heart', 'PenLine', 'Music'];

interface HabitsMiniAppProps {
  userId: string | undefined;
  accent?: string;
}

export function HabitsMiniApp({ userId, accent = '#3B82F6' }: HabitsMiniAppProps) {
  const { todayHabits, heatmap, streak, toggleHabit, addHabit, isLoading } = useHabits(userId);
  const [isAdding, setIsAdding]       = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('Target');
  const [submitting, setSubmitting]   = useState(false);

  const completedToday = todayHabits.filter(h => h.done).length;
  const totalToday     = todayHabits.length;
  const progressPct    = totalToday === 0 ? 0 : Math.round((completedToday / totalToday) * 100);

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim() || !userId) return;
    setSubmitting(true);
    try {
      await addHabit({ name: newHabitName.trim(), icon_name: newHabitIcon, frequency_type: 'daily' });
      toast.success('Habit added');
      setNewHabitName('');
      setIsAdding(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add habit');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className="rounded-3xl p-8 flex h-64 items-center justify-center"
        style={{ background: 'rgba(10,12,16,0.6)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}
      >
        <Loader2 size={32} className="animate-spin" style={{ color: accent }} />
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl p-5 md:p-7 flex flex-col xl:flex-row gap-6 md:gap-10 relative overflow-hidden"
      style={{
        background: 'rgba(10,12,16,0.6)',
        border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}
    >
      <div
        className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 rounded-full blur-[100px] pointer-events-none"
        style={{ background: `${accent}10` }}
      />

      {/* ── HEATMAP + STATS ─────────────────────────────────────────────── */}
      <div className="flex-1 relative z-10 flex flex-col justify-center min-w-0">
        <div className="flex items-end justify-between mb-5">
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] block mb-1" style={{ color: `${accent}88` }}>
              Consistency · Last 28 days
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-white/90 tracking-tight">Activity Map</h3>
          </div>
          {streak > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 h-8 rounded-full"
              style={{ background: `${accent}18`, border: `1px solid ${accent}40` }}
            >
              <Flame size={12} style={{ color: accent }} fill={accent} />
              <span className="text-[12px] font-black tabular-nums" style={{ color: accent }}>
                {streak}d
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-rows-4 grid-flow-col gap-1.5 md:gap-2 w-fit">
          {heatmap.map((cell, i) => {
            const level = cell.level;
            return (
              <motion.div
                key={cell.date}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.01, duration: 0.25 }}
                title={`${cell.date} · ${cell.count} completion${cell.count === 1 ? '' : 's'}`}
                className="w-4 h-4 md:w-5 md:h-5 rounded-sm border"
                style={{
                  background: level === 0 ? 'rgba(255,255,255,0.04)'
                    : level === 1 ? `${accent}33`
                    : level === 2 ? `${accent}77`
                    :               accent,
                  borderColor: level === 0 ? 'rgba(255,255,255,0.05)' : `${accent}55`,
                  boxShadow: level === 3 ? `0 0 10px ${accent}50` : 'none',
                }}
              />
            );
          })}
        </div>

        {/* Today's progress bar */}
        {totalToday > 0 && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">Today</span>
              <span className="text-[11px] font-bold text-white/70 tabular-nums">
                {completedToday}/{totalToday} · {progressPct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: accent, boxShadow: `0 0 8px ${accent}60` }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── TODAY'S HABITS LIST ─────────────────────────────────────────── */}
      <div className="w-full xl:w-80 relative z-10 flex flex-col border-t xl:border-t-0 xl:border-l border-white/5 pt-6 xl:pt-0 xl:pl-10">
        <div className="flex justify-between items-center mb-5">
          <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50">Today's Focus</h4>
          <button
            onClick={() => setIsAdding(v => !v)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-90 transition-all"
            style={isAdding ? { background: `${accent}20`, color: accent } : undefined}
            aria-label={isAdding ? 'Cancel' : 'Add habit'}
          >
            {isAdding ? <X size={14} /> : <Plus size={14} />}
          </button>
        </div>

        <AnimatePresence>
          {isAdding && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              onSubmit={handleAddHabit}
              className="overflow-hidden mb-4"
            >
              <div className="flex gap-2 mb-3">
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Read 10 pages…"
                  value={newHabitName}
                  onChange={e => setNewHabitName(e.target.value)}
                  autoCapitalize="sentences"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 h-10 text-[13px] text-white placeholder-white/30 focus:outline-none focus:ring-1"
                  style={{ ['--tw-ring-color' as string]: `${accent}55` }}
                />
                <button
                  type="submit"
                  disabled={submitting || !newHabitName.trim()}
                  className="px-4 h-10 rounded-xl text-[12px] font-bold disabled:opacity-50 active:scale-95 transition-all"
                  style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Add'}
                </button>
              </div>

              {/* Icon picker */}
              <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
                {ICON_CHOICES.map(iconName => {
                  const Icon = ICON_MAP[iconName];
                  const active = newHabitIcon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setNewHabitIcon(iconName)}
                      className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                      style={{
                        background: active ? `${accent}22` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${active ? `${accent}55` : 'rgba(255,255,255,0.08)'}`,
                        color: active ? accent : '#a1a1aa',
                      }}
                      aria-label={iconName}
                    >
                      <Icon size={14} />
                    </button>
                  );
                })}
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {todayHabits.length === 0 && !isAdding ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}
            >
              <Target size={18} style={{ color: accent }} />
            </div>
            <p className="text-[13px] font-semibold text-white/60">No habits yet</p>
            <p className="text-[11px] text-white/40 mt-1 max-w-[200px]">Tap <span style={{ color: accent }}>+</span> to add your first ritual.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {todayHabits.map(habit => {
              const Icon = ICON_MAP[habit.icon_name || 'Target'] || Target;
              return (
                <div key={habit.id} className="flex items-center justify-between gap-3 py-1">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0"
                      style={{
                        background: habit.done ? `${accent}20` : 'rgba(255,255,255,0.04)',
                        color:      habit.done ? accent : 'rgba(255,255,255,0.4)',
                        border: `1px solid ${habit.done ? `${accent}45` : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      <Icon size={14} />
                    </div>
                    <span
                      className="text-[13px] md:text-sm font-semibold transition-colors truncate"
                      style={{
                        color: habit.done ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.88)',
                        textDecoration: habit.done ? 'line-through' : 'none',
                      }}
                    >
                      {habit.name}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleHabit(habit.id, habit.done)}
                    className="p-3 rounded-full active:scale-90 transition-transform shrink-0"
                    aria-label={habit.done ? 'Mark as not done' : 'Mark as done'}
                  >
                    {habit.done
                      ? <CheckCircle2 size={20} style={{ color: accent, filter: `drop-shadow(0 0 6px ${accent}80)` }} />
                      : <Circle size={20} className="text-white/20 hover:text-white/50" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
