import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Target, Flame, Activity, BookOpen, Trash2, Loader2 } from 'lucide-react';
import type { Habit } from '../../types/habits';

const ICON_MAP: Record<string, React.ElementType> = {
  Target, Flame, Activity, BookOpen
};

export function HabitsManager({ userId }: { userId: string | undefined }) {
  const [allHabits, setAllHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    
    const fetchAllHabits = async () => {
      const { data, error } = await supabase
        .from('desarrollo_habits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAllHabits(data as Habit[]);
      }
      setIsLoading(false);
    };

    fetchAllHabits();
  }, [userId]);

  const deleteHabit = async (habitId: string) => {
    if (!userId) return;
    setAllHabits(prev => prev.filter(h => h.id !== habitId)); // Optimistic UI
    
    await supabase.from('desarrollo_habits').delete().eq('id', habitId);
    // Nota: Como pusimos ON DELETE CASCADE en la BD, borrar el hábito borra también sus logs.
  };

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-emerald-500" /></div>;

  return (
    <div className="bg-[#0A0C10]/60 backdrop-blur-xl border border-white/5 rounded-[32px] p-8">
      <h3 className="text-2xl font-bold text-white mb-6">Habit Database</h3>
      
      {allHabits.length === 0 ? (
        <div className="border border-white/5 border-dashed rounded-2xl p-10 text-center">
          <p className="text-white/40">You have no habits in the database yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allHabits.map(habit => {
           const IconComponent = ICON_MAP[habit.icon_name || 'Target'] || Target;
            return (
              <div key={habit.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <IconComponent size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{habit.name}</h4>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">{habit.frequency_type}</span>
                  </div>
                </div>
                <button 
                  onClick={() => deleteHabit(habit.id)}
                  className="p-2 text-white/20 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}