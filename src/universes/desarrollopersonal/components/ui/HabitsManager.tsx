import React from 'react';
import { Target, Flame, Activity, BookOpen, Trash2, Loader2, Dumbbell, Coffee, Brain, Heart, PenLine, Music } from 'lucide-react';
import { toast } from 'sonner';
import { useHabits } from '../../hooks/useHabits';

const ICON_MAP: Record<string, React.ElementType> = {
  Target, Flame, Activity, BookOpen, Dumbbell, Coffee, Brain, Heart, PenLine, Music,
};

interface HabitsManagerProps {
  userId: string | undefined;
  accent?: string;
}

export function HabitsManager({ userId, accent = '#3B82F6' }: HabitsManagerProps) {
  const { allHabits, deleteHabit, isLoading } = useHabits(userId);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? All logs for this habit will also be removed.`)) return;
    try {
      await deleteHabit(id);
      toast.success('Habit removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (isLoading) {
    return (
      <div
        className="rounded-3xl p-8 flex justify-center"
        style={{ background: 'rgba(10,12,16,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <Loader2 className="animate-spin" style={{ color: accent }} />
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl p-6 md:p-8"
      style={{ background: 'rgba(10,12,16,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: `${accent}AA` }}>
            Habits Lab
          </p>
          <h3 className="font-serif text-2xl md:text-3xl font-semibold text-white tracking-tight mt-1 leading-none">
            All Habits
          </h3>
        </div>
        <p className="text-[11px] font-semibold text-zinc-500 pb-1 tabular-nums">
          {allHabits.length} {allHabits.length === 1 ? 'habit' : 'habits'}
        </p>
      </div>

      {allHabits.length === 0 ? (
        <div className="border border-white/5 border-dashed rounded-2xl p-10 text-center">
          <p className="text-white/50 text-[14px]">Your habit database is empty.</p>
          <p className="text-white/30 text-[12px] mt-1">Switch to the Overview tab and tap + to add your first habit.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {allHabits.map(habit => {
            const Icon = ICON_MAP[habit.icon_name || 'Target'] || Target;
            return (
              <div
                key={habit.id}
                className="rounded-2xl p-4 flex items-center justify-between"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${accent}18`, border: `1px solid ${accent}40` }}
                  >
                    <Icon size={18} style={{ color: accent }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-white font-bold text-[14px] truncate">{habit.name}</h4>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-black">
                      {habit.frequency_type === 'daily' ? 'Daily' : 'Selected days'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(habit.id, habit.name)}
                  className="p-2.5 text-white/25 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors active:scale-90"
                  aria-label={`Delete ${habit.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
