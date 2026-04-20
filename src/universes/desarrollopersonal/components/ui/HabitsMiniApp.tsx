import React, { useState } from 'react';
import { Target, CheckCircle2, Circle, Loader2, Plus, Flame, BookOpen, Activity } from 'lucide-react';
import { useHabits } from '../../hooks/useHabits';
import { supabase } from '../../../../../src/lib/supabase';

const ICON_MAP: Record<string, React.ElementType> = {
  Target, Flame, Activity, BookOpen
};

export function HabitsMiniApp({ userId }: { userId: string | undefined }) {
  const { todayHabits, heatmapData, toggleHabit, isLoading } = useHabits(userId);
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');

  // Función para agregar un hábito real a Supabase
  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim() || !userId) return;

    try {
      await supabase.from('desarrollo_habits').insert({
        user_id: userId,
        name: newHabitName,
        frequency_type: 'daily', // Por defecto lo hacemos diario para fricción cero
        icon_name: 'Target'
      });
      setNewHabitName('');
      setIsAdding(false);
      // Nota: En un escenario ideal, tu useHabits exportaría un mutate() para recargar la lista,
      // o podrías usar suscripciones en tiempo real de Supabase.
      window.location.reload(); // Recarga simple para ver el hábito nuevo instantáneamente
    } catch (error) {
      console.error("Error agregando hábito:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#0A0C10]/60 backdrop-blur-xl border border-white/5 rounded-[24px] p-8 flex h-64 items-center justify-center">
        <Loader2 size={32} className="text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#0A0C10]/60 backdrop-blur-xl border border-white/5 rounded-[24px] md:rounded-[32px] p-5 md:p-8 flex flex-col xl:flex-row gap-8 md:gap-12 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-700" />
      
      {/* 1. HEATMAP (Mapa de calor) */}
      <div className="flex-1 relative z-10 flex flex-col justify-center overflow-x-auto [scrollbar-width:none]">
        <div className="flex items-center justify-between mb-6 min-w-[250px]">
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400/50 block mb-1">Consistency</span>
            <h3 className="text-xl md:text-2xl font-bold text-white/90 tracking-tight">Activity Map</h3>
          </div>
        </div>
        
        <div className="grid grid-rows-4 grid-flow-col gap-1.5 md:gap-2 w-fit">
          {heatmapData.map((level, index) => {
            let colorClass = "bg-white/5 border-white/5";
            if (level === 1) colorClass = "bg-emerald-900/40 border-emerald-500/20";
            if (level === 2) colorClass = "bg-emerald-600/60 border-emerald-500/40";
            if (level === 3) colorClass = "bg-emerald-400 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]";

            return <div key={index} className={`w-4 h-4 md:w-5 md:h-5 rounded-sm border ${colorClass}`} />;
          })}
        </div>
      </div>

      {/* 2. LISTA DE HÁBITOS (La Mini-App) */}
      <div className="w-full xl:w-80 relative z-10 flex flex-col border-t xl:border-t-0 xl:border-l border-white/5 pt-6 xl:pt-0 xl:pl-12">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">Today's Focus</h4>
          <button onClick={() => setIsAdding(!isAdding)} className="bg-white/5 hover:bg-white/10 p-1.5 rounded-md transition-colors">
            <Plus size={14} className="text-white/60" />
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleAddHabit} className="mb-4 flex gap-2">
            <input 
              autoFocus
              type="text" 
              placeholder="e.g. Read 10 pages…"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50"
            />
            <button type="submit" className="bg-emerald-500/20 text-emerald-400 px-3 py-2 rounded-lg text-xs font-bold hover:bg-emerald-500/30">
              Add
            </button>
          </form>
        )}
        
        {todayHabits.length === 0 && !isAdding ? (
          <p className="text-white/40 text-sm font-medium">No habits yet. Click '+' to start.</p>
        ) : (
          <div className="flex flex-col gap-3 md:gap-4">
            {todayHabits.map((habit) => {
              const IconComponent = ICON_MAP[habit.icon_name || 'Target'] || Target;
              return (
                <div key={habit.id} className="flex items-center justify-between group/habit">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${habit.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
                      <IconComponent size={14} />
                    </div>
                    <span className={`text-xs md:text-sm font-bold transition-colors ${habit.done ? 'text-white/40 line-through' : 'text-white/80'}`}>
                      {habit.name}
                    </span>
                  </div>
                  <button onClick={() => toggleHabit(habit.id, habit.done)} className="transition-transform active:scale-90 p-2 -mr-2 cursor-pointer">
                    {habit.done ? <CheckCircle2 size={20} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" /> : <Circle size={20} className="text-white/20 hover:text-white/60" />}
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