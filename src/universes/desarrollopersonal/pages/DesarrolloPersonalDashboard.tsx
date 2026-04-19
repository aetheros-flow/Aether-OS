import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase'; // Asegurate de que esta ruta sea la correcta en tu proyecto
import { calculateNatalChart } from '../lib/astrologyEngine';
import type { NatalChartData } from '../lib/astrologyEngine';
import { HabitsMiniApp } from '../components/ui/HabitsMiniApp';
import { HabitsManager } from '../components/ui/HabitsManager';
import { calculateLifePathNumber, calculateExpressionNumber, NUMBER_MEANINGS } from '../lib/numerologyEngine';
import { 
  Sparkles, Moon, Hash, Map, Ghost, ChevronRight, LayoutDashboard, 
  Fingerprint, Activity, PenTool, Users, Sun, Star, Compass, BookOpen, Send
} from 'lucide-react';

export default function DesarrolloPersonalDashboard() {
  const [activeTab, setActiveTab] = useState('identity');
  const [userId, setUserId] = useState<string | undefined>(undefined);
  
  // ESTADOS MÍSTICOS
  const [numerologyData, setNumerologyData] = useState({ lifePath: 0, expression: 0 });
  const [chartData, setChartData] = useState<NatalChartData | null>(null);
  const [isCalculatingChart, setIsCalculatingChart] = useState(true);

  useEffect(() => {
    // 1. Buscamos el usuario real
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUserId(data.user.id);
    };
    fetchUser();

    // 2. Cargamos los datos de Numerología y Astrología
    const loadMysticData = async () => {
      // Calculamos Numerología
      const fullName = "Lucas Ezequiel Bianchi";
      const birthDate = "1983-01-27"; 
      setNumerologyData({
        lifePath: calculateLifePathNumber(birthDate),
        expression: calculateExpressionNumber(fullName)
      });

      // Traemos Carta Astral (Buenos Aires - 14:30)
      setIsCalculatingChart(true);
      const astroData = await calculateNatalChart(27, 1, 1983, 14, 30, -34.6037, -58.3816, -3);
      setChartData(astroData);
      setIsCalculatingChart(false);
    };

    loadMysticData();
  }, []);

  // Obtenemos los arquetipos basados en el cálculo numérico
  const lifePathArquetipo = NUMBER_MEANINGS[numerologyData.lifePath] || { title: 'Calculando...', description: '' };
  const expressionArquetipo = NUMBER_MEANINGS[numerologyData.expression] || { title: 'Calculando...', description: '' };

  return (
    <div className="relative min-h-screen bg-[#050608] font-sans text-white overflow-x-hidden selection:bg-purple-500/30 pb-20">
      
      {/* Auroras de Fondo */}
      <div className="fixed top-[-10%] left-[-5%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] rounded-full bg-purple-600/10 blur-[100px] md:blur-[140px] pointer-events-none animate-pulse" />
      <div className="fixed bottom-[-5%] right-[-5%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-emerald-500/5 blur-[100px] md:blur-[120px] pointer-events-none" />

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        
        {/* HEADER */}
        <header className="flex flex-col gap-6 mb-8 md:mb-12">
          <div className="flex items-center gap-3 bg-white/5 w-fit px-4 py-1.5 rounded-full border border-white/5">
            <Sparkles size={14} className="text-purple-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-200">Aether Evolution OS</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-none">
              Conscious <br className="hidden sm:block" />
              <span className="text-white/30">Expansion.</span>
            </h1>
            <button className="bg-white text-black px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-purple-400 transition-all active:scale-95 w-full sm:w-auto text-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Update Profile
            </button>
          </div>
        </header>

        {/* NAVEGACIÓN */}
        <nav className="flex items-center gap-2 bg-[#0A0C10]/80 backdrop-blur-md p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-white/5 w-full md:w-fit mb-8 md:mb-12 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${activeTab === 'overview' ? 'bg-white/10 text-white shadow-lg border border-white/10' : 'text-white/40 hover:text-white/80'}`}><LayoutDashboard size={14} /> Overview</button>
          <button onClick={() => setActiveTab('identity')} className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${activeTab === 'identity' ? 'bg-purple-500/20 text-purple-300 shadow-lg border border-purple-500/20' : 'text-white/40 hover:text-white/80'}`}><Fingerprint size={14} /> Identity Matrix</button>
          <button onClick={() => setActiveTab('shadow')} className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${activeTab === 'shadow' ? 'bg-rose-500/20 text-rose-300 shadow-lg border border-rose-500/20' : 'text-white/40 hover:text-white/80'}`}><PenTool size={14} /> Shadow Work</button>
          <button onClick={() => setActiveTab('action')} className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${activeTab === 'action' ? 'bg-emerald-500/20 text-emerald-300 shadow-lg border border-emerald-500/20' : 'text-white/40 hover:text-white/80'}`}><Activity size={14} /> Habits</button>
        </nav>

        {/* --- 1. OVERVIEW --- */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
             <HabitsMiniApp userId={userId} />
          </div>
        )}

        {/* --- 2. IDENTITY MATRIX --- */}
        {activeTab === 'identity' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
            
            {/* A. CARTA NATAL */}
            <div className="bg-[#0A0C10]/60 backdrop-blur-xl border border-purple-500/10 rounded-[32px] p-8 relative overflow-hidden group">
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-500/30 transition-all duration-700" />
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <div className="flex items-center gap-2 text-purple-400 mb-2">
                    <Moon size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Astrological Blueprint</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white">Natal Chart</h3>
                </div>
                <button className="bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-white/10 transition-colors"><ChevronRight size={18} /></button>
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="w-40 h-40 rounded-full border border-purple-500/30 flex items-center justify-center relative p-2 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                  <div className="w-full h-full rounded-full border border-dashed border-purple-500/40 animate-[spin_60s_linear_infinite] flex items-center justify-center">
                    <div className="w-3/4 h-3/4 rounded-full border border-purple-500/20 flex items-center justify-center">
                       <Sun size={24} className="text-purple-300" />
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 w-full space-y-4">
                  {isCalculatingChart || !chartData ? (
                    <div className="flex justify-center items-center h-full py-10">
                      <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
                    </div>
                  ) : (
                    <>
                      <div className="bg-white/5 rounded-2xl p-4 flex justify-between items-center border border-white/5">
                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Sun</span>
                        <span className="text-sm font-bold text-white">{chartData.sun.sign} <span className="text-purple-400 ml-1">{chartData.sun.degree.toFixed(1)}°</span></span>
                      </div>
                      <div className="bg-white/5 rounded-2xl p-4 flex justify-between items-center border border-white/5">
                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Moon</span>
                        <span className="text-sm font-bold text-white">{chartData.moon.sign} <span className="text-purple-400 ml-1">{chartData.moon.degree.toFixed(1)}°</span></span>
                      </div>
                      <div className="bg-white/5 rounded-2xl p-4 flex justify-between items-center border border-white/5">
                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Ascendant</span>
                        <span className="text-sm font-bold text-white">{chartData.ascendant.sign} <span className="text-purple-400 ml-1">{chartData.ascendant.degree.toFixed(1)}°</span></span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* B. NUMEROLOGÍA */}
            <div className="bg-[#0A0C10]/60 backdrop-blur-xl border border-blue-500/10 rounded-[32px] p-8 relative overflow-hidden group">
              <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/30 transition-all duration-700" />
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <Hash size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Pythagorean Matrix</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white">Numerology</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-3xl p-6 flex flex-col justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/60 mb-4 block">Life Path</span>
                  <div>
                    <span className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                      {numerologyData.lifePath > 0 ? numerologyData.lifePath : '-'}
                    </span>
                    <p className="text-sm font-bold text-white/60 mt-2">{lifePathArquetipo.title}</p>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 block">Expression</span>
                  <div>
                    <span className="text-5xl font-black text-white">
                      {numerologyData.expression > 0 ? numerologyData.expression : '-'}
                    </span>
                    <p className="text-sm font-bold text-white/60 mt-2">{expressionArquetipo.title}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-white/40 mt-6 relative z-10 text-center uppercase tracking-widest">Calculated for: Lucas Ezequiel Bianchi</p>
            </div>

            {/* C. ASTROCARTOGRAFÍA */}
            <div className="bg-[#0A0C10]/60 backdrop-blur-xl border border-emerald-500/10 rounded-[32px] p-8 relative overflow-hidden group">
              <div className="absolute -top-20 right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700" />
              <div className="flex items-center gap-2 text-emerald-400 mb-2 relative z-10">
                <Map size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Locational Energy</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-6 relative z-10">Astrocartography</h3>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative z-10 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Compass size={18} className="text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Auckland, NZ</h4>
                      <span className="text-[10px] text-white/40 uppercase tracking-widest">Current Location</span>
                    </div>
                  </div>
                  <div className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">
                    Jupiter Zenith
                  </div>
                </div>
                <div className="h-px w-full bg-white/5 my-2" />
                <p className="text-sm text-white/60 leading-relaxed">
                  Your current coordinates align with Jupiter, indicating a strong period for professional expansion and learning in this region.
                </p>
              </div>
            </div>

            {/* D. SYNASTRY (Compatibilidad) */}
            <div className="bg-[#0A0C10]/60 backdrop-blur-xl border border-amber-500/10 rounded-[32px] p-8 relative overflow-hidden group">
              <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-amber-500/10 to-transparent pointer-events-none" />
              <div className="flex items-center gap-2 text-amber-400 mb-2 relative z-10">
                <Users size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Relational Dynamics</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-6 relative z-10">Synastry</h3>

              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex -space-x-4">
                  <div className="w-14 h-14 rounded-full border-2 border-[#0A0C10] bg-purple-500/20 flex items-center justify-center backdrop-blur-md">
                    <span className="text-xs font-bold">You</span>
                  </div>
                  <div className="w-14 h-14 rounded-full border-2 border-[#0A0C10] bg-blue-500/20 flex items-center justify-center backdrop-blur-md">
                    <span className="text-xs font-bold">Son</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">Harmony Score</span>
                  <span className="text-2xl font-black text-amber-400">85%</span>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 relative z-10">
                <h4 className="text-xs font-bold text-white mb-2">Transit Note: Wellington, NZ</h4>
                <p className="text-xs text-white/50">His Moon trines your Mercury today. Excellent energy for deep, supportive communication during his transition.</p>
              </div>
            </div>
          </div>
        )}

        {/* --- 3. SHADOW WORK & JOURNALING --- */}
        {activeTab === 'shadow' && (
          <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center gap-2 text-rose-400 mb-2">
              <Ghost size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">The Subconscious Realm</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8">Shadow Work.</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="md:col-span-2 bg-[#0A0C10]/60 backdrop-blur-xl border border-rose-500/20 rounded-[32px] p-8 shadow-[0_0_30px_rgba(244,63,94,0.05)]">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <BookOpen size={20} className="text-rose-400" /> Daily Reflection
                </h3>
                
                <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-5 mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 block mb-2">Jungian Prompt</span>
                  <p className="text-sm text-white/80 italic">"What trait in someone else triggered a strong emotional response in you today? How does that trait exist within yourself?"</p>
                </div>

                <textarea 
                  placeholder="Begin exploring your thoughts..."
                  className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-rose-500/50 resize-none transition-all"
                />
                
                <div className="flex justify-between items-center mt-4">
                  <button className="text-xs font-bold text-white/40 hover:text-white transition-colors">Load previous</button>
                  <button className="bg-rose-500 hover:bg-rose-400 text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2">
                    <Send size={14} /> Encrypt & Save
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="bg-[#0A0C10]/60 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 flex flex-col items-center justify-center text-center h-full">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                    <Star size={24} className="text-white/40" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Active Archetype</h4>
                  <span className="text-2xl font-black text-rose-400">The Magician</span>
                  <p className="text-[10px] text-white/40 mt-3 uppercase tracking-widest">Detected via recent logs</p>
                </div>
                
                <div className="bg-gradient-to-br from-rose-500/20 to-transparent border border-rose-500/20 rounded-[32px] p-6">
                   <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-widest">Dissonance</h4>
                   <span className="text-4xl font-black text-white">4.8</span>
                   <p className="text-xs text-white/50 mt-2">Self-perception gap is widening. Time to ground.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- 4. ACTION (HabitsManager) --- */}
        {activeTab === 'action' && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
             <HabitsManager userId={userId} />
          </div>
        )}

      </main>
    </div>
  );
}