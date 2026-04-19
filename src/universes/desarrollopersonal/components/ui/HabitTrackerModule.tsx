import React, { useState } from 'react';
import { CalendarDays, Trophy, ClipboardList, LayoutGrid, Plus, Ban, Paintbrush, Clock, User, GraduationCap } from 'lucide-react';

export function HabitTrackerModule({ userId }: { userId: string | undefined }) {
  const [habitTab, setHabitTab] = useState<'today' | 'habits' | 'tasks' | 'categories'>('today');
  const [taskSubTab, setTaskSubTab] = useState<'single' | 'recurring'>('single');

  // Simulación del calendario
  const calendarDays = [
    { day: 'Sat', date: '21' }, { day: 'Sun', date: '22' }, 
    { day: 'Mon', date: '23' }, { day: 'Tue', date: '24' }, 
    { day: 'Wed', date: '25' }, { day: 'Thu', date: '26' }, 
    { day: 'Fri', date: '27' }
  ];

  return (
    <div className="bg-[#0A0C10] border border-white/5 rounded-[32px] overflow-hidden min-h-[600px] relative">
      
      {/* NAVEGACIÓN SUPERIOR DEL MÓDULO (Simula el header de la app) */}
      <div className="flex justify-between items-center p-6 border-b border-white/5">
         <h2 className="text-2xl font-bold capitalize text-white">{habitTab}</h2>
         {/* Botón flotante reubicado al header para mantener el diseño limpio de Aether OS */}
         {habitTab !== 'categories' && (
           <button className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:bg-rose-400 transition-all active:scale-95">
             <Plus size={20} className="text-black" />
           </button>
         )}
      </div>

      <div className="p-6">
        {/* --- VISTA: TODAY --- */}
        {habitTab === 'today' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] mb-12 pb-2">
              {calendarDays.map((d, i) => (
                <button key={i} className={`flex flex-col items-center justify-center min-w-[60px] py-3 rounded-2xl border transition-colors ${d.date === '24' ? 'bg-white/10 border-white/20' : 'bg-transparent border-transparent hover:bg-white/5'}`}>
                  <span className="text-[10px] text-white/40 font-bold uppercase">{d.day}</span>
                  <span className="text-xl font-bold mt-1 text-white">{d.date}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center justify-center text-center mt-12">
              <div className="w-24 h-24 bg-[#050608] rounded-full flex items-center justify-center mb-6 border border-white/5 relative">
                <CalendarDays size={40} className="text-rose-400 opacity-80" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">There is nothing scheduled</h3>
              <p className="text-white/40 text-sm">Try adding new activities</p>
            </div>
          </div>
        )}

        {/* --- VISTA: HABITS --- */}
        {habitTab === 'habits' && (
          <div className="animate-in fade-in duration-300 flex flex-col items-center justify-center text-center mt-20">
            <div className="w-24 h-24 bg-[#050608] rounded-full flex items-center justify-center mb-6 border border-white/5 relative">
              <Trophy size={40} className="text-amber-500 opacity-80" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">There are no active habits</h3>
            <p className="text-white/40 text-sm">It's always a good day for a new start</p>
          </div>
        )}

        {/* --- VISTA: TASKS --- */}
        {habitTab === 'tasks' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex w-full border-b border-white/10 mb-16">
              <button onClick={() => setTaskSubTab('single')} className={`flex-1 py-3 text-sm font-bold transition-all relative ${taskSubTab === 'single' ? 'text-rose-500' : 'text-white/40'}`}>
                Single tasks
                {taskSubTab === 'single' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-500 rounded-t-full" />}
              </button>
              <button onClick={() => setTaskSubTab('recurring')} className={`flex-1 py-3 text-sm font-bold transition-all relative ${taskSubTab === 'recurring' ? 'text-rose-500' : 'text-white/40'}`}>
                Recurring tasks
                {taskSubTab === 'recurring' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-500 rounded-t-full" />}
              </button>
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-[#050608] rounded-full flex items-center justify-center mb-6 border border-white/5">
                <ClipboardList size={40} className="text-blue-400 opacity-80" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{taskSubTab === 'single' ? 'No tasks' : 'No recurring tasks'}</h3>
              <p className="text-white/40 text-sm">{taskSubTab === 'single' ? 'There are no upcoming tasks' : 'There are no active recurring tasks'}</p>
            </div>
          </div>
        )}

        {/* --- VISTA: CATEGORIES --- */}
        {habitTab === 'categories' && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-12">
              <h4 className="text-sm font-bold text-white/80 mb-4">Custom categories</h4>
              <div className="bg-[#050608] border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                <LayoutGrid size={24} className="text-white/20 mb-2" />
                <p className="text-white/30 text-sm">There are no custom categories</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white/80 mb-4">Default categories</h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl bg-rose-600 flex items-center justify-center"><Ban size={24} className="text-black" /></div>
                  <span className="text-xs font-bold text-white">Quit bad...</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl bg-red-500 flex items-center justify-center"><Paintbrush size={24} className="text-black" /></div>
                  <span className="text-xs font-bold text-white">Art</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl bg-pink-600 flex items-center justify-center"><Clock size={24} className="text-black" /></div>
                  <span className="text-xs font-bold text-white">Task</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl bg-fuchsia-600 flex items-center justify-center"><User size={24} className="text-black" /></div>
                  <span className="text-xs font-bold text-white">Meditation</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500 flex items-center justify-center"><GraduationCap size={24} className="text-black" /></div>
                  <span className="text-xs font-bold text-white">Study</span>
                </div>
              </div>
            </div>
            
            <button className="w-full bg-rose-500 hover:bg-rose-400 text-black font-black text-xs uppercase tracking-widest py-4 rounded-xl mt-8 transition-all">
              New Category
            </button>
          </div>
        )}
      </div>

      {/* FOOTER DEL MÓDULO (Simula el navbar de HabitNow, pero contenido dentro de esta caja) */}
      <div className="absolute bottom-0 left-0 w-full border-t border-white/5 bg-[#0A0C10] p-2 flex justify-around items-center">
        <button onClick={() => setHabitTab('today')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${habitTab === 'today' ? 'bg-rose-500/10 text-rose-500' : 'text-white/40 hover:text-white'}`}>
          <CalendarDays size={18} />
          <span className="text-[10px] mt-1 font-bold">Today</span>
        </button>
        <button onClick={() => setHabitTab('habits')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${habitTab === 'habits' ? 'bg-rose-500/10 text-rose-500' : 'text-white/40 hover:text-white'}`}>
          <Trophy size={18} />
          <span className="text-[10px] mt-1 font-bold">Habits</span>
        </button>
        <button onClick={() => setHabitTab('tasks')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${habitTab === 'tasks' ? 'bg-rose-500/10 text-rose-500' : 'text-white/40 hover:text-white'}`}>
          <ClipboardList size={18} />
          <span className="text-[10px] mt-1 font-bold">Tasks</span>
        </button>
        <button onClick={() => setHabitTab('categories')} className={`flex flex-col items-center p-2 rounded-xl transition-colors ${habitTab === 'categories' ? 'bg-rose-500/10 text-rose-500' : 'text-white/40 hover:text-white'}`}>
          <LayoutGrid size={18} />
          <span className="text-[10px] mt-1 font-bold">Categories</span>
        </button>
      </div>

    </div>
  );
}