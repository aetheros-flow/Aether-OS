import { useState } from 'react';
import { ArrowLeft, Loader2, Plus, Target, BookOpen, Heart, Star, Globe, DollarSign, Zap, Sparkles, Layers, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useDesarrolloPersonalData } from '../hooks/useDesarrolloPersonalData';
import type { NewSkillInput, NewIkigaiInput } from '../types';
import AetherModal from '../../../core/components/AetherModal';
import PersonalJournalTab from '../components/PersonalJournalTab';

type ActiveTab = 'matrix' | 'ikigai' | 'journal';

const ACCENT = '#8B5CF6';

const getIkigaiVerdict = (checks: { love: boolean; good: boolean; need: boolean; pay: boolean }) => {
  const { love, good, need, pay } = checks;
  if (love && good && need && pay) return { label: 'IKIGAI',     color: 'text-emerald-500', desc: 'Alignment found.'           };
  if (love && need)                return { label: 'MISSION',    color: 'text-rose-500',    desc: 'Spiritually fulfilling.'     };
  if (good && pay)                 return { label: 'PROFESSION', color: 'text-blue-500',    desc: 'Secure but requires soul.'   };
  if (love && good)                return { label: 'PASSION',    color: 'text-orange-500',  desc: 'Great hobby, no market yet.' };
  return                                  { label: 'ACTIVITY',   color: 'text-gray-400',    desc: 'Keep exploring.'             };
};

const DEFAULT_SKILL:  NewSkillInput  = { skill_name: '', category: 'Tech', current_level: 1, target_level: 10 };
const DEFAULT_IKIGAI: NewIkigaiInput = { activity_name: '', love_it: false, good_at_it: false, world_needs_it: false, paid_for_it: false };

const TABS = [
  { id: 'matrix',  label: 'Matrix',  icon: Layers   },
  { id: 'ikigai',  label: 'Ikigai',  icon: Target   },
  { id: 'journal', label: 'Journal', icon: BookOpen  },
] as const;

export default function PersonalGrowthPage() {
  const navigate = useNavigate();
  const { skills, ikigaiLogs, loading, createSkill, createIkigaiLog } = useDesarrolloPersonalData();

  const [activeTab,         setActiveTab]         = useState<ActiveTab>('matrix');
  const [isSkillModalOpen,  setIsSkillModalOpen]  = useState(false);
  const [isIkigaiModalOpen, setIsIkigaiModalOpen] = useState(false);
  const [isSubmitting,      setIsSubmitting]      = useState(false);
  const [formError,         setFormError]         = useState<string | null>(null);
  const [newSkill,          setNewSkill]          = useState<NewSkillInput>(DEFAULT_SKILL);
  const [newIkigai,         setNewIkigai]         = useState<NewIkigaiInput>(DEFAULT_IKIGAI);

  const handleCreateSkill = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      await createSkill(newSkill);
      setIsSkillModalOpen(false);
      setNewSkill(DEFAULT_SKILL);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateIkigai = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      await createIkigaiLog(newIkigai);
      setIsIkigaiModalOpen(false);
      setNewIkigai(DEFAULT_IKIGAI);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #e8e4ff 0%, #f5f0ff 40%, #faf9ff 100%)' }}>
        <Loader2 className="animate-spin" size={40} style={{ color: ACCENT }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#2D2A26] font-sans selection:bg-purple-200" style={{ background: 'linear-gradient(180deg, #e8e4ff 0%, #f5f0ff 40%, #faf9ff 100%)' }}>

      {/* BACKGROUND GLOWS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-200/40 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-violet-100/30 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-10 relative z-10">

        {/* NAV HEADER */}
        <div className="flex justify-between items-center mb-12">
          <button onClick={() => navigate('/')} className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:shadow-md transition-all border border-black/5" aria-label="Volver">
            <ArrowLeft size={18} />
          </button>

          <div className="flex bg-white/50 backdrop-blur-xl p-1.5 rounded-full border border-purple-200/40 shadow-inner">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition-all duration-200 ${activeTab === tab.id ? 'bg-[#2d1b69] text-white shadow-lg' : 'text-[#2d1b69]/50 hover:text-[#2d1b69]/80'}`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>

          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <Sparkles size={18} />
          </div>
        </div>

        {/* HEADER */}
        <div className="mb-16">
          <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight mb-4" style={{ color: '#1a0533' }}>Evolution</h1>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: '#7c3aed', opacity: 0.7 }}>Module: Human Potential / Leveling UP</p>
        </div>

        {/* ── MATRIX TAB ── */}
        {activeTab === 'matrix' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={() => setIsSkillModalOpen(true)}
              className="group h-[200px] border-2 border-dashed border-purple-200/60 rounded-[24px] flex flex-col items-center justify-center gap-4 hover:border-[#7c3aed]/40 hover:bg-white/50 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-white/80 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus size={20} style={{ color: '#7c3aed' }} />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#2d1b69]/50">Add New Mastery</span>
            </button>

            {skills.map(skill => (
              <div key={skill.id} className="bg-white/70 backdrop-blur-sm rounded-[24px] p-8 border border-purple-100 shadow-sm hover:shadow-lg hover:bg-white/90 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-2xl" style={{ backgroundColor: '#7c3aed1A', color: '#7c3aed' }}><Zap size={20} /></div>
                  <div className="text-right">
                    <span className="text-[9px] font-extrabold uppercase tracking-tighter" style={{ color: '#7c3aed' }}>Level {skill.current_level}</span>
                    <h3 className="font-serif text-xl font-bold text-[#1a0533]">{skill.skill_name}</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-bold uppercase text-[#2d1b69]/50">
                    <span>Progress</span>
                    <span>{Math.round((skill.current_level / skill.target_level) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-purple-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${(skill.current_level / skill.target_level) * 100}%`, background: 'linear-gradient(to right, #7c3aed, #818cf8)' }}
                    />
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-purple-100/60 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-[#2d1b69]/50">{skill.hours_invested ?? 0} Hours Practice</span>
                  <ChevronRight size={14} className="text-[#2d1b69]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── IKIGAI TAB ── */}
        {activeTab === 'ikigai' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-[32px] p-10 text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl" style={{ background: 'linear-gradient(135deg, #1c0b3a 0%, #2d1b69 100%)' }}>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-serif font-bold mb-2">Purpose Alignment</h2>
                <p className="text-white/60 text-sm">Every action is a vote for the person you want to become. Are you voting correctly?</p>
              </div>
              <button
                onClick={() => setIsIkigaiModalOpen(true)}
                className="px-8 py-4 text-white rounded-full text-[11px] font-extrabold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                style={{ backgroundColor: '#7c3aed' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#6d28d9')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7c3aed')}
              >
                Log Daily Activity
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {ikigaiLogs.map(log => {
                const verdict = getIkigaiVerdict({ love: log.love_it, good: log.good_at_it, need: log.world_needs_it, pay: log.paid_for_it });
                return (
                  <div key={log.id} className="bg-white/60 backdrop-blur-md border border-purple-100 p-6 rounded-[24px] flex items-center justify-between group hover:bg-white/90 transition-all shadow-sm">
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${verdict.color} bg-white shadow-sm`}>
                        <Target size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{log.activity_name}</h4>
                        <p className="text-[10px] text-[#8A8681] font-bold uppercase tracking-widest">{new Date(log.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="flex gap-2">
                        <Heart      size={14} className={log.love_it        ? 'text-rose-500    fill-rose-500'    : 'text-gray-200'} />
                        <Star       size={14} className={log.good_at_it     ? 'text-amber-400   fill-amber-400'   : 'text-gray-200'} />
                        <Globe      size={14} className={log.world_needs_it ? 'text-blue-500    fill-blue-500'    : 'text-gray-200'} />
                        <DollarSign size={14} className={log.paid_for_it    ? 'text-emerald-500 fill-emerald-500' : 'text-gray-200'} />
                      </div>
                      <div className="text-right hidden sm:block">
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${verdict.color}`}>{verdict.label}</span>
                        <p className="text-[10px] font-medium text-[#8A8681] italic">{verdict.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── JOURNAL TAB ── */}
        {activeTab === 'journal' && <PersonalJournalTab />}

      </div>

      {/* ── MODAL: NUEVA SKILL ── */}
      <AetherModal isOpen={isSkillModalOpen} onClose={() => { setIsSkillModalOpen(false); setFormError(null); }} title="Define Mastery">
        {formError && <p className="text-xs font-bold text-rose-500 mb-4 bg-rose-50 px-4 py-2 rounded-xl">{formError}</p>}
        <form onSubmit={handleCreateSkill} className="space-y-6">
          <input
            required
            placeholder="Mastery Name (e.g. System Design)"
            value={newSkill.skill_name}
            className="w-full bg-[#FAF9F6] border-none rounded-2xl px-6 py-5 text-sm font-bold outline-none focus:ring-2 transition-all"
            style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
            onChange={e => setNewSkill({ ...newSkill, skill_name: e.target.value })}
          />
          <div className="flex gap-4">
            <button type="button" onClick={() => setIsSkillModalOpen(false)} className="flex-1 py-5 text-[10px] font-extrabold uppercase tracking-widest text-[#8A8681]">Abort</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-5 text-white rounded-2xl text-[10px] font-extrabold uppercase tracking-widest shadow-xl disabled:opacity-60" style={{ backgroundColor: ACCENT }}>
              {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Confirm'}
            </button>
          </div>
        </form>
      </AetherModal>

      {/* ── MODAL: LOG IKIGAI ── */}
      <AetherModal isOpen={isIkigaiModalOpen} onClose={() => { setIsIkigaiModalOpen(false); setFormError(null); }} title="Daily Activity">
        {formError && <p className="text-xs font-bold text-rose-500 mb-4 bg-rose-50 px-4 py-2 rounded-xl">{formError}</p>}
        <form onSubmit={handleCreateIkigai} className="space-y-6">
          <div className="space-y-2">
            <label className="aether-eyebrow">What did you do?</label>
            <input
              required
              value={newIkigai.activity_name}
              onChange={e => setNewIkigai({ ...newIkigai, activity_name: e.target.value })}
              placeholder="Coding Aether OS, Italian class..."
              className="w-full bg-[#FAF9F6] border-none rounded-2xl px-6 py-5 text-sm font-bold outline-none focus:ring-2 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {([
              { key: 'love_it',        label: 'I Love it',      icon: Heart       },
              { key: 'good_at_it',     label: 'Good at it',     icon: Star        },
              { key: 'world_needs_it', label: 'World needs it', icon: Globe       },
              { key: 'paid_for_it',    label: 'Paid for it',    icon: DollarSign  },
            ] as const).map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => setNewIkigai({ ...newIkigai, [item.key]: !newIkigai[item.key] })}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${newIkigai[item.key] ? 'bg-purple-50 border-[#8B5CF6] text-[#8B5CF6]' : 'bg-[#FAF9F6] border-black/5 text-[#8A8681]'}`}
              >
                <item.icon size={14} />
                <span className="text-[10px] font-extrabold uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setIsIkigaiModalOpen(false)} className="flex-1 py-5 text-[10px] font-extrabold uppercase tracking-widest text-[#8A8681]">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-5 bg-[#2D2A26] text-white rounded-2xl text-[10px] font-extrabold uppercase tracking-widest shadow-lg disabled:opacity-60">
              {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Log Activity'}
            </button>
          </div>
        </form>
      </AetherModal>
    </div>
  );
}
