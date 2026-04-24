import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Dumbbell, Apple, Stethoscope,
  Plus, Activity, Flame, Droplets, Moon, Trophy, Loader2, Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { useSaludData } from '../hooks/useSaludData';
import type { NewMetricInput, NewWorkoutInput } from '../types';
import UniverseNavItem from '../../../core/components/UniverseNavItem';
import AetherModal from '../../../core/components/AetherModal';
import UniverseBottomNav from '../../../core/components/UniverseBottomNav';
import UniverseMobileHeader from '../../../core/components/UniverseMobileHeader';

type TabType = 'dashboard' | 'entrenamientos' | 'nutricion' | 'medico';

const WORKOUT_TYPES = ['Tenis', 'Pádel', 'Gimnasio', 'Running', 'Ciclismo', 'Yoga', 'Natación', 'Otro'];

const ACCENT = '#D97A3A';

const DEFAULT_METRIC: NewMetricInput  = { weight: '', body_fat: '', sleep_hours: '', water_liters: '', date: new Date().toISOString().split('T')[0] };
const DEFAULT_WORKOUT: NewWorkoutInput = { type: 'Tenis', duration_mins: '', intensity: 'Alta', calories_burned: '', date: new Date().toISOString().split('T')[0], time: '10:00' };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};
const tapPhysics = { scale: 0.96, filter: 'brightness(1.1)' } as const;
const hoverPhysics = { scale: 1.01 } as const;

export default function SaludDashboard() {
  const navigate = useNavigate();
  const { metrics, workouts, loading, createMetric, createWorkout } = useSaludData();

  const [activeTab,          setActiveTab]          = useState<TabType>('dashboard');
  const [isMetricModalOpen,  setIsMetricModalOpen]  = useState(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isSubmitting,       setIsSubmitting]       = useState(false);
  const [formError,          setFormError]          = useState<string | null>(null);

  const [newMetric,  setNewMetric]  = useState<NewMetricInput>(DEFAULT_METRIC);
  const [newWorkout, setNewWorkout] = useState<NewWorkoutInput>(DEFAULT_WORKOUT);

  // ── Métricas derivadas ────────────────────────────
  const currentWeight    = metrics[0]?.weight ?? 0;
  const totalWorkoutMins = workouts.reduce((acc, w) => acc + Number(w.duration_mins), 0);

  const weightData  = [...metrics].reverse().map(m => ({
    date: new Date(m.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    peso: Number(m.weight),
  }));
  const workoutData = [...workouts].reverse().map(w => ({
    date:     new Date(w.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    calorias: Number(w.calories_burned),
    minutos:  Number(w.duration_mins),
  }));

  // ── Handlers ─────────────────────────────────────
  const handleCreateMetric = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      await createMetric(newMetric);
      setIsMetricModalOpen(false);
      setNewMetric(DEFAULT_METRIC);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateWorkout = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      await createWorkout(newWorkout);
      setIsWorkoutModalOpen(false);
      setNewWorkout(DEFAULT_WORKOUT);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (tab: TabType) => { setActiveTab(tab); };

  // ── AI Insight (heurística contextual) ─────────────
  const aiInsight = (() => {
    if (totalWorkoutMins === 0 && metrics.length === 0) {
      return 'Sin señales aún. Registrá tu primera métrica para activar tu lectura corporal.';
    }
    if (totalWorkoutMins > 180) {
      return `Llevás ${totalWorkoutMins} minutos activos. Excelente carga — vigilá descanso e hidratación.`;
    }
    if ((metrics[0]?.sleep_hours ?? 0) < 6) {
      return 'Tu último sueño está por debajo de 6h. Priorizá descanso esta noche.';
    }
    return 'Tu cuerpo se mantiene en frecuencia estable. Sumá una sesión de movilidad esta semana.';
  })();

  // ── Loading ───────────────────────────────────────
  if (loading && metrics.length === 0 && workouts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1B1714]">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: ACCENT }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans text-white relative overflow-hidden bg-[#1B1714] selection:bg-white/20">

      {/* Glows de fondo */}
      <div aria-hidden className="pointer-events-none fixed -top-40 -left-40 w-[520px] h-[520px] rounded-full blur-[140px] opacity-[0.18]" style={{ background: ACCENT }} />
      <div aria-hidden className="pointer-events-none fixed -bottom-60 right-0 w-[600px] h-[600px] rounded-full blur-[160px] opacity-[0.10]" style={{ background: ACCENT }} />
      <div aria-hidden className="pointer-events-none fixed inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <UniverseMobileHeader title="Salud Física" subtitle="Cuerpo & Energía" color="#1B1714" />

      {/* ── SIDEBAR ─────────────────────────────────── */}
      <nav className="hidden md:flex md:w-64 flex-col z-30 shrink-0 relative bg-black/40 backdrop-blur-xl border-r border-white/5">
        <div className="flex items-center gap-3 p-6 mb-2">
          <motion.button
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-white"
            aria-label="Volver"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </motion.button>
          <div className="min-w-0">
            <h1 className="font-serif text-[26px] text-white font-medium tracking-tight leading-tight truncate">Salud Física</h1>
            <p className="text-[10px] uppercase font-black tracking-[0.22em]" style={{ color: ACCENT }}>Cuerpo & Energía</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 px-3 pb-6">
          <UniverseNavItem icon={LayoutDashboard} label="Resumen"        accent={ACCENT} isActive={activeTab === 'dashboard'}      onClick={() => handleTabChange('dashboard')} />
          <UniverseNavItem icon={Dumbbell}        label="Entrenamientos" accent={ACCENT} isActive={activeTab === 'entrenamientos'} onClick={() => handleTabChange('entrenamientos')} />
          <UniverseNavItem icon={Apple}           label="Nutrición"      accent={ACCENT} isActive={activeTab === 'nutricion'}      onClick={() => handleTabChange('nutricion')} />
          <UniverseNavItem icon={Stethoscope}     label="Médicos"        accent={ACCENT} isActive={activeTab === 'medico'}         onClick={() => handleTabChange('medico')} />
        </div>
      </nav>

      {/* ── ÁREA PRINCIPAL ──────────────────────────── */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar pt-20 md:pt-10 pb-24 md:pb-10 relative z-10"
      >
        {/* Header */}
        <motion.header variants={itemVariants} className="mb-8 md:mb-10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {(activeTab === 'dashboard' || activeTab === 'entrenamientos') && (
              <motion.button
                onClick={() => activeTab === 'dashboard' ? setIsMetricModalOpen(true) : setIsWorkoutModalOpen(true)}
                whileHover={hoverPhysics}
                whileTap={tapPhysics}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-[11px] uppercase tracking-wider text-white"
                style={{
                  background: ACCENT,
                  boxShadow: `0 8px 24px ${ACCENT}40, inset 0 1px 0 rgba(255,255,255,0.15)`,
                }}
              >
                <Plus size={13} strokeWidth={3} />
                {activeTab === 'entrenamientos' ? 'Registrar' : 'Actualizar'}
              </motion.button>
            )}
          </div>
          <h2 className="font-sans text-white font-bold tracking-tight" style={{ fontSize: 'clamp(2rem, 7vw, 3.5rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            {activeTab === 'dashboard'      ? 'Tu cuerpo hoy' :
             activeTab === 'entrenamientos' ? 'Entrenamientos' :
             activeTab === 'nutricion'      ? 'Nutrición' :
             'Seguimiento médico'}
          </h2>
        </motion.header>

        {/* AI Insights Panel */}
        {activeTab === 'dashboard' && (
          <motion.section
            variants={itemVariants}
            whileHover={hoverPhysics}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="relative mb-6 rounded-[28px] p-5 md:p-6 bg-zinc-900/70 backdrop-blur-xl border border-white/5 overflow-hidden"
          >
            <div aria-hidden className="absolute inset-0 opacity-[0.10]" style={{ background: `radial-gradient(800px circle at 0% 0%, ${ACCENT}, transparent 50%)` }} />
            <div className="relative flex items-start gap-4">
              <span className="flex items-center justify-center w-10 h-10 rounded-2xl shrink-0" style={{ background: `${ACCENT}1A`, border: `1px solid ${ACCENT}40` }}>
                <Sparkles size={18} style={{ color: ACCENT }} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-black tracking-[0.22em] mb-1.5 text-zinc-500">Aether AI · Insight Corporal</p>
                <p className="text-[15px] font-medium text-white/90 leading-relaxed">{aiInsight}</p>
              </div>
            </div>
          </motion.section>
        )}

        {/* Stat chips */}
        {activeTab === 'dashboard' && (
          <motion.div variants={itemVariants} className="flex gap-2.5 flex-wrap mb-8">
            {[
              { icon: '⚖️',  label: 'Peso',         val: currentWeight ? `${currentWeight}kg` : '—' },
              { icon: '🏃',  label: 'Mins activos', val: totalWorkoutMins ? `${totalWorkoutMins}m` : '0m' },
              { icon: '💧',  label: 'Hidratación',  val: metrics[0]?.water_liters ? `${metrics[0].water_liters}L` : '—' },
              { icon: '😴',  label: 'Sueño',        val: metrics[0]?.sleep_hours ? `${metrics[0].sleep_hours}h` : '—' },
            ].map(s => (
              <motion.div
                key={s.label}
                whileHover={hoverPhysics}
                whileTap={tapPhysics}
                className="neo-chip"
              >
                <span className="text-base leading-none">{s.icon}</span>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-500 leading-tight">{s.label}</p>
                  <p className="text-[15px] font-black text-white leading-none">{s.val}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && (
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <motion.div whileHover={{ scale: 1.005, y: -2 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }} className="neo-card neo-card-lg overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black tracking-tight text-white">Evolución Corporal</h3>
                  <span className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: ACCENT }}>Últimos Registros</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717A' }} dy={10} />
                      <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717A' }} dx={-10} />
                      <Tooltip
                        contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(20,20,22,0.95)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', fontSize: '12px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#A1A1AA' }}
                      />
                      <Line type="monotone" name="Peso (KG)" dataKey="peso" stroke={ACCENT} strokeWidth={3} dot={{ r: 4, fill: '#1B1714', stroke: ACCENT, strokeWidth: 2 }} activeDot={{ r: 7, fill: ACCENT, stroke: '#fff', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <div className="grid grid-cols-2 gap-4">
                <motion.div whileHover={{ scale: 1.01, y: -2 }} whileTap={tapPhysics} className="neo-card flex flex-col gap-3">
                  <div className="flex items-center gap-2"><Moon size={18} className="text-indigo-400" /><span className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Último Sueño</span></div>
                  <span className="neo-metric">{metrics[0]?.sleep_hours ?? 0}<span className="text-2xl text-zinc-500 ml-1">h</span></span>
                </motion.div>
                <motion.div whileHover={{ scale: 1.01, y: -2 }} whileTap={tapPhysics} className="neo-card flex flex-col gap-3">
                  <div className="flex items-center gap-2"><Droplets size={18} className="text-cyan-400" /><span className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Hidratación</span></div>
                  <span className="neo-metric">{metrics[0]?.water_liters ?? 0}<span className="text-2xl text-zinc-500 ml-1">L</span></span>
                </motion.div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <motion.div whileHover={{ scale: 1.005, y: -2 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }} className="neo-card relative overflow-hidden h-[280px] flex flex-col">
                <div aria-hidden className="absolute inset-0 opacity-[0.10]" style={{ background: `radial-gradient(400px circle at 100% 0%, ${ACCENT}, transparent 60%)` }} />
                <div className="relative flex items-center gap-2 mb-2">
                  <Flame size={20} style={{ color: ACCENT }} />
                  <h3 className="text-sm font-black text-white">Gasto Energético</h3>
                </div>
                <p className="relative neo-metric mb-1">{workouts[0]?.calories_burned ?? 0}</p>
                <p className="relative text-xs font-medium mb-4 text-zinc-500">kcal quemadas ayer</p>
                <div className="relative flex-1 w-full mt-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workoutData}>
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(20,20,22,0.95)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', fontSize: '12px', fontWeight: 'bold' }} itemStyle={{ color: '#fff' }} labelStyle={{ color: '#A1A1AA' }} />
                      <Bar dataKey="calorias" name="Kcal" fill={ACCENT} radius={[4, 4, 0, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.005, y: -2 }} className="neo-card h-40">
                <h3 className="text-sm font-black text-white flex items-center gap-2"><Trophy size={18} style={{ color: ACCENT }} /> Logros</h3>
                <p className="text-sm font-medium text-zinc-500 mt-3">El motor de logros se activará pronto.</p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ── ENTRENAMIENTOS ── */}
        {activeTab === 'entrenamientos' && (
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workouts.map(w => (
              <motion.div key={w.id} whileHover={{ scale: 1.01, y: -3 }} whileTap={tapPhysics} transition={{ type: 'spring', stiffness: 280, damping: 22 }} className="neo-card neo-card-interactive">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-2xl" style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}40` }}>
                    <Activity size={22} style={{ color: ACCENT }} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300">{w.intensity}</span>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-white mb-2">{w.type}</h3>
                <p className="neo-metric">{w.duration_mins}<span className="text-sm font-medium text-zinc-500 ml-2">minutos</span></p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── PESTAÑAS EN CONSTRUCCIÓN ── */}
        {(activeTab === 'nutricion' || activeTab === 'medico') && (
          <motion.div variants={itemVariants} className="flex flex-col items-center justify-center h-72 rounded-[32px] bg-zinc-900/70 backdrop-blur-xl border border-dashed border-white/10 relative overflow-hidden">
            <div aria-hidden className="absolute inset-0 opacity-[0.08]" style={{ background: `radial-gradient(600px circle at 50% 0%, ${ACCENT}, transparent 60%)` }} />
            <span className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: `${ACCENT}1A`, border: `1px solid ${ACCENT}40` }}>
              {activeTab === 'nutricion' ? <Apple size={24} style={{ color: ACCENT }} /> : <Stethoscope size={24} style={{ color: ACCENT }} />}
            </span>
            <p className="relative font-serif text-3xl text-white font-medium tracking-tight mb-2">Módulo en calibración</p>
            <p className="relative text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Desplegando la matriz de datos pronto.</p>
          </motion.div>
        )}
      </motion.main>

      {/* ── MODAL: MÉTRICAS ─────────────────────────── */}
      <AetherModal isOpen={isMetricModalOpen} onClose={() => { setIsMetricModalOpen(false); setFormError(null); }} title="Control Físico">
        {formError && <p className="text-xs font-bold text-rose-300 mb-4 bg-rose-500/10 border border-rose-500/30 px-4 py-2.5 rounded-xl">{formError}</p>}
        <form onSubmit={handleCreateMetric} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="neo-eyebrow">Peso (KG)</label>
              <input type="number" step="0.1" required value={newMetric.weight} onChange={e => setNewMetric({ ...newMetric, weight: e.target.value })} className="neo-input font-mono" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="neo-eyebrow">Grasa (%)</label>
              <input type="number" step="0.1" value={newMetric.body_fat} onChange={e => setNewMetric({ ...newMetric, body_fat: e.target.value })} className="neo-input font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="neo-eyebrow">Sueño (Horas)</label>
              <input type="number" step="0.1" required value={newMetric.sleep_hours} onChange={e => setNewMetric({ ...newMetric, sleep_hours: e.target.value })} className="neo-input font-mono" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="neo-eyebrow">Agua (Litros)</label>
              <input type="number" step="0.1" required value={newMetric.water_liters} onChange={e => setNewMetric({ ...newMetric, water_liters: e.target.value })} className="neo-input font-mono" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Fecha</label>
            <input type="date" required value={newMetric.date} onChange={e => setNewMetric({ ...newMetric, date: e.target.value })} className="neo-input" />
          </div>
          <motion.button type="submit" disabled={isSubmitting} whileTap={tapPhysics} className="neo-btn-accent mt-3 disabled:opacity-60" style={{ background: ACCENT, boxShadow: `0 8px 32px ${ACCENT}40` }}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sincronizar Cuerpo'}
          </motion.button>
        </form>
      </AetherModal>

      {/* ── MODAL: ENTRENAMIENTO ─────────────────────── */}
      <AetherModal isOpen={isWorkoutModalOpen} onClose={() => { setIsWorkoutModalOpen(false); setFormError(null); }} title="Actividad Física">
        {formError && <p className="text-xs font-bold text-rose-300 mb-4 bg-rose-500/10 border border-rose-500/30 px-4 py-2.5 rounded-xl">{formError}</p>}
        <form onSubmit={handleCreateWorkout} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Disciplina</label>
            <select value={newWorkout.type} onChange={e => setNewWorkout({ ...newWorkout, type: e.target.value })} className="neo-input appearance-none">
              {WORKOUT_TYPES.map(w => <option key={w} value={w} className="bg-zinc-900">{w}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="neo-eyebrow">Duración (Min)</label>
              <input type="number" required value={newWorkout.duration_mins} onChange={e => setNewWorkout({ ...newWorkout, duration_mins: e.target.value })} className="neo-input font-mono" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="neo-eyebrow">Quema (Kcal)</label>
              <input type="number" value={newWorkout.calories_burned} onChange={e => setNewWorkout({ ...newWorkout, calories_burned: e.target.value })} className="neo-input font-mono" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="neo-eyebrow">Intensidad</label>
            <select value={newWorkout.intensity} onChange={e => setNewWorkout({ ...newWorkout, intensity: e.target.value })} className="neo-input appearance-none">
              <option value="Baja"  className="bg-zinc-900">Baja (Recuperación)</option>
              <option value="Media" className="bg-zinc-900">Media (Mantenimiento)</option>
              <option value="Alta"  className="bg-zinc-900">Alta (Fuerza/Partido)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="neo-eyebrow">Fecha</label>
              <input type="date" required value={newWorkout.date} onChange={e => setNewWorkout({ ...newWorkout, date: e.target.value })} className="neo-input" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="neo-eyebrow">Hora</label>
              <input type="time" required value={newWorkout.time} onChange={e => setNewWorkout({ ...newWorkout, time: e.target.value })} className="neo-input" />
            </div>
          </div>
          <motion.button type="submit" disabled={isSubmitting} whileTap={tapPhysics} className="neo-btn-accent mt-3 disabled:opacity-60" style={{ background: ACCENT, boxShadow: `0 8px 32px ${ACCENT}40` }}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar Esfuerzo'}
          </motion.button>
        </form>
      </AetherModal>

      <UniverseBottomNav
        tabs={[
          { id: 'dashboard',      label: 'Resumen',   icon: LayoutDashboard },
          { id: 'entrenamientos', label: 'Entrenos',  icon: Dumbbell        },
          { id: 'nutricion',      label: 'Nutrición', icon: Apple           },
          { id: 'medico',         label: 'Médicos',   icon: Stethoscope     },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => handleTabChange(tab as TabType)}
        activeColor={ACCENT}
        bgColor="#1B1714"
      />
    </div>
  );
}
