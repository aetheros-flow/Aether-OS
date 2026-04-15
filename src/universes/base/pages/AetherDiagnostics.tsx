import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Loader2, ArrowLeft, CheckCircle2, AlertTriangle, AlertOctagon, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SEGMENT_COLORS: Record<string, string> = {
  amor: '#FF0040',
  dinero: '#05DF72',
  desarrollopersonal: '#8B5CF6',
  salud: '#FE7F01',
  desarrolloprofesional: '#FFD700',
  social: '#1447E6',
  familia: '#C81CDE',
  ocio: '#00E5FF'
};

const UNIVERSE_NAMES: Record<string, string> = {
  amor: 'Love Life',
  dinero: 'Economic Situation',
  desarrollopersonal: 'Personal Growth',
  salud: 'Physical Health',
  desarrolloprofesional: 'Professional Growth',
  social: 'Social Life',
  familia: 'Family & Home',
  ocio: 'Leisure & Time'
};

interface RealityCheck {
  id: string;
  universe_id: string;
  perceived_score: number;
  ai_calculated_score: number | null;
  analysis_report: string | null;
  status: 'pending' | 'completed';
  check_date: string;
}

export default function AetherDiagnostics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<RealityCheck[]>([]);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) { navigate('/login'); return; }

      const { data, error } = await supabase
        .from('User_Reality_Check')
        .select('*')
        .eq('user_id', authData.user.id)
        .order('check_date', { ascending: false });

      if (error) throw error;

      if (data) {
        const latestChecks = data.reduce((acc: any, current: any) => {
          const x = acc.find((item: any) => item.universe_id === current.universe_id);
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, []);
        setDiagnostics(latestChecks);
      }
    } catch (error) {
      console.error("Error fetching diagnostics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDiagnostics(); }, [navigate]);

  const completedChecks = diagnostics.filter(d => d.status === 'completed' && d.ai_calculated_score !== null);
  const alignedCount = completedChecks.filter(d => Math.abs(d.perceived_score - (d.ai_calculated_score || 0)) <= 1).length;
  const minorDeviationCount = completedChecks.filter(d => {
    const diff = Math.abs(d.perceived_score - (d.ai_calculated_score || 0));
    return diff > 1 && diff <= 3;
  }).length;
  const blindspotCount = completedChecks.filter(d => Math.abs(d.perceived_score - (d.ai_calculated_score || 0)) > 3).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="w-12 h-12 animate-spin text-[#76B079]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans text-[#2D2A26] pb-20 selection:bg-purple-900 selection:text-white">
      
      <div className="max-w-4xl mx-auto pt-8 px-6 md:px-10">
        
        {/* BACK BUTTON */}
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 aether-eyebrow text-[#8A8681] uppercase tracking-widest text-[10px] font-bold hover:text-[#2D2A26] transition-colors mb-10"
        >
          <ArrowLeft size={14} /> BACK TO DASHBOARD
        </button>
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-16">
          <div className="flex flex-col gap-3">
            <h1 className="aether-title text-[#2D2A26] text-4xl md:text-5xl">Aether Diagnostics</h1>
            <p className="text-xs text-[#8A8681] font-bold tracking-widest uppercase max-w-lg leading-relaxed mt-2">
              Deep analysis of your reality. We compare your perception in the Wheel of Life with hard data from your behavior to find blind spots.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xl px-5 py-3 rounded-full shadow-lg border border-black/5 self-start">
             <BrainCircuit className="text-purple-500" size={20} />
             <div className="flex flex-col">
               <span className="text-[9px] font-bold text-[#8A8681] uppercase tracking-widest">Powered by</span>
               <span className="text-xs font-extrabold text-[#2D2A26]">Aether AI Engine</span>
             </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        {completedChecks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white/60 backdrop-blur-xl rounded-[20px] p-6 shadow-sm border border-black/5 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-[#8A8681] uppercase tracking-widest">Aligned</span>
                <CheckCircle2 size={18} className="text-[#05DF72]" />
              </div>
              <span className="font-serif text-3xl text-[#2D2A26] font-bold">{alignedCount}</span>
              <p className="text-[10px] font-bold text-[#8A8681] leading-relaxed">Perception matches reality.</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-xl rounded-[20px] p-6 shadow-sm border border-black/5 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-[#8A8681] uppercase tracking-widest">Deviation</span>
                <AlertTriangle size={18} className="text-[#FE7F01]" />
              </div>
              <span className="font-serif text-3xl text-[#2D2A26] font-bold">{minorDeviationCount}</span>
              <p className="text-[10px] font-bold text-[#8A8681] leading-relaxed">Slight optimism or pessimism.</p>
            </div>

            <div className="bg-white/60 backdrop-blur-xl rounded-[20px] p-6 shadow-sm border border-black/5 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-[#8A8681] uppercase tracking-widest">Blind Spots</span>
                <AlertOctagon size={18} className="text-[#FF0040]" />
              </div>
              <span className="font-serif text-3xl text-[#FF0040] font-bold">{blindspotCount}</span>
              <p className="text-[10px] font-bold text-[#FF0040]/70 leading-relaxed">Critical disconnection.</p>
            </div>
          </div>
        )}

        <h2 className="text-[10px] font-bold text-[#8A8681] uppercase tracking-widest mb-6">Universe Analysis</h2>
        
        {/* LIST */}
        {diagnostics.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl rounded-[20px] p-12 text-center shadow-sm border border-black/5 flex flex-col items-center gap-4">
             <BrainCircuit size={32} className="text-[#8A8681]/30" />
             <h3 className="font-serif text-xl text-[#2D2A26] font-bold">Insufficient Data</h3>
             <p className="text-xs text-[#8A8681] font-bold tracking-wide max-w-sm mx-auto leading-relaxed">
               Interact with the Wheel of Life to generate your first perceptions. Aether AI will evaluate them soon.
             </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {diagnostics.map((diag) => {
              const uName = UNIVERSE_NAMES[diag.universe_id] || diag.universe_id;
              const themeColor = SEGMENT_COLORS[diag.universe_id] || '#000';
              const isPending = diag.status === 'pending' || diag.ai_calculated_score === null;
              
              return (
                <div key={diag.id} className="bg-white/60 backdrop-blur-xl rounded-[20px] p-6 md:p-8 shadow-sm border border-black/5 flex flex-col md:flex-row gap-8 relative group">
                  
                  {/* Left Column */}
                  <div className="flex flex-col gap-6 min-w-[200px]">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: themeColor }}>{uName}</span>
                      <h3 className="font-serif text-3xl text-[#2D2A26] font-bold tracking-tight">
                        {diag.perceived_score}
                      </h3>
                      <span className="text-[10px] font-bold text-[#8A8681] uppercase tracking-widest mt-1">Your Perception</span>
                    </div>
                  </div>

                  {/* Right Column (AI Panel) */}
                  <div className="flex-1 flex flex-col bg-black/5 rounded-xl p-5 border border-black/5">
                     {isPending ? (
                       <div className="flex items-center gap-3 text-[#8A8681]">
                         <Loader2 size={16} className="animate-spin text-purple-500" />
                         <p className="text-xs font-bold tracking-wide">Aether AI is collecting data to issue a verdict...</p>
                       </div>
                     ) : (
                       <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                             <BrainCircuit size={14} className="text-purple-500" />
                             <span className="text-[10px] font-extrabold text-[#2D2A26] uppercase tracking-widest">AI Score: {diag.ai_calculated_score}</span>
                          </div>
                          <p className="text-xs text-[#8A8681] font-bold tracking-wide leading-relaxed">
                            {diag.analysis_report || "Detailed analysis report is being generated based on your recent activity patterns."}
                          </p>
                       </div>
                     )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}