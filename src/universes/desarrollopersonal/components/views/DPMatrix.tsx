import { useState } from 'react';
import { Plus, Zap, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import AetherModal from '../../../../core/components/AetherModal';
import { useDesarrolloPersonalData } from '../../hooks/useDesarrolloPersonalData';
import type { NewSkillInput } from '../../types';

const ACCENT = '#7c3aed';
const DEFAULT_SKILL: NewSkillInput = { skill_name: '', category: 'Tech', current_level: 1, target_level: 10 };

const CATEGORIES = ['Tech', 'Creatividad', 'Liderazgo', 'Comunicación', 'Finanzas', 'Salud', 'Idiomas', 'Otro'];

export default function DPMatrix() {
  const { skills, createSkill, deleteSkill, loading } = useDesarrolloPersonalData();

  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError,    setFormError]    = useState<string | null>(null);
  const [newSkill,     setNewSkill]     = useState<NewSkillInput>(DEFAULT_SKILL);

  const handleCreate = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      await createSkill(newSkill);
      setIsModalOpen(false);
      setNewSkill(DEFAULT_SKILL);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-[#7c3aed] mb-1">SKILLS MATRIX</p>
          <h2 className="font-serif text-3xl font-bold text-[#1c0b3a]">Mastery Board</h2>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-full text-white text-[11px] font-extrabold uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
          style={{ backgroundColor: ACCENT }}
        >
          <Plus size={16} /> Add Skill
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-300" size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map(skill => (
            <div key={skill.id} className="aether-card aether-card-interactive p-8 group relative">
              <button
                onClick={() => deleteSkill(skill.id)}
                className="absolute top-4 right-4 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50 text-rose-400"
                aria-label="Delete skill"
              >
                <Trash2 size={14} />
              </button>

              <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-2xl" style={{ backgroundColor: '#7c3aed1A', color: ACCENT }}>
                  <Zap size={20} />
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-extrabold uppercase tracking-tighter text-[#7c3aed]">Level {skill.current_level}</span>
                  <h3 className="font-serif text-xl font-bold text-[#1a0533]">{skill.skill_name}</h3>
                  <span className="text-[9px] text-[#8A8681] font-bold">{skill.category}</span>
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
                <span className="text-[10px] font-bold text-[#2d1b69]/50">{skill.hours_invested ?? 0} hrs práctica</span>
                <ChevronRight size={14} className="text-[#2d1b69]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}

          {/* ADD CARD */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="group h-[200px] border-2 border-dashed border-purple-200/60 rounded-[24px] flex flex-col items-center justify-center gap-4 hover:border-[#7c3aed]/40 hover:bg-white/50 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-white/80 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={20} style={{ color: ACCENT }} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#2d1b69]/50">Add New Mastery</span>
          </button>
        </div>
      )}

      <AetherModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setFormError(null); }} title="Define Mastery">
        {formError && <p className="text-xs font-bold text-rose-500 mb-4 bg-rose-50 px-4 py-2 rounded-xl">{formError}</p>}
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Nombre del skill</label>
            <input
              required
              placeholder="Ej: System Design, Fotografía, Inglés..."
              value={newSkill.skill_name}
              className="aether-input"
              onChange={e => setNewSkill({ ...newSkill, skill_name: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Categoría</label>
            <select
              value={newSkill.category}
              onChange={e => setNewSkill({ ...newSkill, category: e.target.value })}
              className="aether-input appearance-none"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Nivel actual (1–10)</label>
              <input
                type="number" min={1} max={10} required
                value={newSkill.current_level}
                onChange={e => setNewSkill({ ...newSkill, current_level: Number(e.target.value) })}
                className="aether-input font-mono"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Nivel objetivo</label>
              <input
                type="number" min={1} max={10} required
                value={newSkill.target_level}
                onChange={e => setNewSkill({ ...newSkill, target_level: Number(e.target.value) })}
                className="aether-input font-mono"
              />
            </div>
          </div>
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-[10px] font-extrabold uppercase tracking-widest text-[#8A8681]">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-4 text-white rounded-2xl text-[10px] font-extrabold uppercase tracking-widest shadow-xl disabled:opacity-60" style={{ backgroundColor: ACCENT }}>
              {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Confirmar'}
            </button>
          </div>
        </form>
      </AetherModal>
    </div>
  );
}
