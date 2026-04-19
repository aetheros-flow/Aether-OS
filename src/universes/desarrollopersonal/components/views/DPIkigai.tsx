import { useState } from 'react';
import { Heart, Star, Globe, DollarSign, Target, Loader2, Plus } from 'lucide-react';
import AetherModal from '../../../../core/components/AetherModal';
import { useDesarrolloPersonalData } from '../../hooks/useDesarrolloPersonalData';
import type { NewIkigaiInput } from '../../types';

const DEFAULT_IKIGAI: NewIkigaiInput = { activity_name: '', love_it: false, good_at_it: false, world_needs_it: false, paid_for_it: false };

const getVerdict = (checks: { love: boolean; good: boolean; need: boolean; pay: boolean }) => {
  const { love, good, need, pay } = checks;
  if (love && good && need && pay) return { label: 'IKIGAI',     color: 'text-emerald-500',  bg: 'bg-emerald-50',  desc: 'Pleno alineamiento.' };
  if (love && need)                return { label: 'MISIÓN',     color: 'text-rose-500',     bg: 'bg-rose-50',     desc: 'Espiritualmente enriquecedor.' };
  if (good && pay)                 return { label: 'PROFESIÓN',  color: 'text-blue-500',     bg: 'bg-blue-50',     desc: 'Seguro pero falta alma.' };
  if (love && good)                return { label: 'PASIÓN',     color: 'text-orange-500',   bg: 'bg-orange-50',   desc: 'Gran hobby, sin mercado aún.' };
  if (need && pay)                 return { label: 'VOCACIÓN',   color: 'text-violet-500',   bg: 'bg-violet-50',   desc: 'El mundo lo necesita.' };
  return                                  { label: 'ACTIVIDAD',  color: 'text-gray-400',     bg: 'bg-gray-50',     desc: 'Seguí explorando.' };
};

export default function DPIkigai() {
  const { ikigaiLogs, createIkigaiLog } = useDesarrolloPersonalData();

  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError,    setFormError]    = useState<string | null>(null);
  const [newIkigai,    setNewIkigai]    = useState<NewIkigaiInput>(DEFAULT_IKIGAI);

  const handleCreate = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      await createIkigaiLog(newIkigai);
      setIsModalOpen(false);
      setNewIkigai(DEFAULT_IKIGAI);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ikigai score — average of last 30 logs
  const recentLogs = ikigaiLogs.slice(0, 30);
  const avgAlignment = recentLogs.length > 0
    ? Math.round((recentLogs.reduce((sum, l) => sum + [l.love_it, l.good_at_it, l.world_needs_it, l.paid_for_it].filter(Boolean).length, 0) / (recentLogs.length * 4)) * 100)
    : 0;

  return (
    <div className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* HERO */}
      <div className="rounded-[32px] p-8 md:p-10 text-white shadow-2xl mb-8" style={{ background: 'linear-gradient(135deg, #1c0b3a 0%, #2d1b69 100%)' }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-white/60 mb-2">PURPOSE ENGINE</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2">Ikigai Tracker</h2>
            <p className="text-white/60 text-sm">Cada acción es un voto por la persona que querés ser.</p>
            {avgAlignment > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <div className="h-2 flex-1 bg-white/20 rounded-full overflow-hidden max-w-[200px]">
                  <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000" style={{ width: `${avgAlignment}%` }} />
                </div>
                <span className="text-sm font-black text-emerald-300">{avgAlignment}% aligned</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-8 py-4 text-white rounded-full text-[11px] font-extrabold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
            style={{ backgroundColor: '#7c3aed' }}
          >
            <Plus size={16} /> Log Activity
          </button>
        </div>
      </div>

      {/* LOG LIST */}
      <div className="space-y-3">
        {ikigaiLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 rounded-[24px] border-2 border-dashed border-purple-200">
            <Target size={32} className="text-purple-300 mb-3" />
            <p className="text-sm font-bold text-[#8A8681]">Todavía no hay actividades. Loguea la primera.</p>
          </div>
        )}

        {ikigaiLogs.map(log => {
          const verdict = getVerdict({ love: log.love_it, good: log.good_at_it, need: log.world_needs_it, pay: log.paid_for_it });
          return (
            <div key={log.id} className="bg-white rounded-[20px] border border-purple-100 p-5 flex items-center justify-between hover:shadow-md transition-all group">
              <div className="flex items-center gap-5">
                <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center shrink-0 ${verdict.bg}`}>
                  <Target size={18} className={verdict.color} />
                </div>
                <div>
                  <h4 className="font-bold text-[#1c0b3a]">{log.activity_name}</h4>
                  <p className="text-[10px] text-[#8A8681] font-bold uppercase tracking-widest">
                    {new Date(log.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
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

      <AetherModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setFormError(null); }} title="Log de Actividad">
        {formError && <p className="text-xs font-bold text-rose-500 mb-4 bg-rose-50 px-4 py-2 rounded-xl">{formError}</p>}
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">¿Qué hiciste?</label>
            <input
              required
              value={newIkigai.activity_name}
              onChange={e => setNewIkigai({ ...newIkigai, activity_name: e.target.value })}
              placeholder="Codear Aether OS, clase de italiano..."
              className="aether-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: 'love_it',        label: 'Lo amo',           icon: Heart      },
              { key: 'good_at_it',     label: 'Soy bueno',        icon: Star       },
              { key: 'world_needs_it', label: 'El mundo lo pide', icon: Globe      },
              { key: 'paid_for_it',    label: 'Te pagan',         icon: DollarSign },
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
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-[10px] font-extrabold uppercase tracking-widest text-[#8A8681]">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-[#2D2A26] text-white rounded-2xl text-[10px] font-extrabold uppercase tracking-widest shadow-lg disabled:opacity-60">
              {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Registrar'}
            </button>
          </div>
        </form>
      </AetherModal>
    </div>
  );
}
