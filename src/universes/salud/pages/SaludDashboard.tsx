import { useState } from 'react';
import {
  ArrowLeft, LayoutDashboard, Dumbbell, Apple, Stethoscope,
  Plus, Activity, Flame, Droplets, Moon, Trophy, Loader2, Menu, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { useSaludData } from '../hooks/useSaludData';
import type { NewMetricInput, NewWorkoutInput } from '../types';
import UniverseNavItem from '../../../core/components/UniverseNavItem';
import AetherModal from '../../../core/components/AetherModal';

type TabType = 'dashboard' | 'entrenamientos' | 'nutricion' | 'medico';

const WORKOUT_TYPES = ['Tenis', 'Pádel', 'Gimnasio', 'Running', 'Ciclismo', 'Yoga', 'Natación', 'Otro'];

const THEME = {
  bg:      '#FE7F01',
  surface: '#FFFFFF',
  accent:  '#FE7F01',
  textMain:'#FFFFFF',
  textDark:'#2D2A26',
  textMuted:'#8A8681',
  danger:  '#FF8A80',
  graphBg: '#FFFFFF',
};

const DEFAULT_METRIC: NewMetricInput  = { weight: '', body_fat: '', sleep_hours: '', water_liters: '', date: new Date().toISOString().split('T')[0] };
const DEFAULT_WORKOUT: NewWorkoutInput = { type: 'Tenis', duration_mins: '', intensity: 'Alta', calories_burned: '', date: new Date().toISOString().split('T')[0], time: '10:00' };

export default function SaludDashboard() {
  const navigate = useNavigate();
  const { metrics, workouts, loading, createMetric, createWorkout } = useSaludData();

  const [activeTab,          setActiveTab]          = useState<TabType>('dashboard');
  const [isMobileMenuOpen,   setIsMobileMenuOpen]   = useState(false);
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

  const handleTabChange = (tab: TabType) => { setActiveTab(tab); setIsMobileMenuOpen(false); };

  // ── Loading ───────────────────────────────────────
  if (loading && metrics.length === 0 && workouts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: THEME.bg }}>
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans selection:bg-white selection:text-black" style={{ backgroundColor: THEME.bg, color: THEME.textMain }}>

      {/* ── SIDEBAR ─────────────────────────────────── */}
      <nav className="w-full md:w-64 flex flex-col z-30 shrink-0 border-r border-white/10" style={{ backgroundColor: THEME.bg }}>
        <div className="flex items-center justify-between p-4 md:p-6 md:mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-black/10 transition-colors text-white" aria-label="Volver">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="aether-title text-white">Salud Física</h1>
              <p className="aether-eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>Cuerpo & Energía</p>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(v => !v)} className="md:hidden p-2 rounded-xl hover:bg-black/10 transition-colors text-white/70" aria-label="Menú">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className={`flex-col gap-2 md:gap-4 px-4 pb-4 md:px-6 md:pb-6 md:flex ${isMobileMenuOpen ? 'flex animate-in fade-in slide-in-from-top-2 duration-300' : 'hidden'}`}>
          <UniverseNavItem icon={LayoutDashboard} label="Resumen"         isActive={activeTab === 'dashboard'}      onClick={() => handleTabChange('dashboard')} />
          <UniverseNavItem icon={Dumbbell}        label="Entrenamientos"  isActive={activeTab === 'entrenamientos'} onClick={() => handleTabChange('entrenamientos')} />
          <UniverseNavItem icon={Apple}           label="Nutrición"       isActive={activeTab === 'nutricion'}      onClick={() => handleTabChange('nutricion')} />
          <UniverseNavItem icon={Stethoscope}     label="Médicos"         isActive={activeTab === 'medico'}         onClick={() => handleTabChange('medico')} />
        </div>
      </nav>

      {/* ── ÁREA PRINCIPAL ──────────────────────────── */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar pb-32 md:pb-10">

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12">
          <div>
            <p className="aether-eyebrow mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {activeTab === 'dashboard' ? 'Peso Actual' : activeTab === 'entrenamientos' ? 'Minutos Activos' : activeTab === 'nutricion' ? 'Calorías Promedio' : 'Próxima Cita'}
            </p>
            <div className="flex items-baseline gap-3">
              <span className="aether-metric-xl text-white">
                {activeTab === 'dashboard' ? currentWeight : activeTab === 'entrenamientos' ? totalWorkoutMins : '—'}
              </span>
              <span className="text-xl font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {activeTab === 'dashboard' ? ' KG' : activeTab === 'entrenamientos' ? ' MIN' : ''}
              </span>
            </div>
          </div>

          {(activeTab === 'dashboard' || activeTab === 'entrenamientos') && (
            <button
              onClick={() => activeTab === 'dashboard' ? setIsMetricModalOpen(true) : setIsWorkoutModalOpen(true)}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold transition-transform hover:scale-105 active:scale-95 text-sm shadow-xl"
              style={{ backgroundColor: THEME.surface, color: THEME.accent }}
            >
              <Plus size={18} />
              {activeTab === 'entrenamientos' ? 'Registrar Actividad' : 'Actualizar Métricas'}
            </button>
          )}
        </header>

        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="aether-card p-4 md:p-5 overflow-hidden">
                <div className="flex justify-between items-center mb-6 px-2">
                  <h3 className="text-sm font-bold tracking-wide text-[#2D2A26]">Evolución Corporal</h3>
                  <span className="aether-eyebrow" style={{ color: THEME.accent }}>Últimos Registros</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEAE5" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: THEME.textMuted }} dy={10} />
                      <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: THEME.textMuted }} dx={-10} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px', fontWeight: 'bold' }} itemStyle={{ color: THEME.textDark }} />
                      <Line type="monotone" name="Peso (KG)" dataKey="peso" stroke={THEME.accent} strokeWidth={4} dot={{ r: 5, fill: THEME.graphBg, stroke: THEME.accent, strokeWidth: 2 }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="aether-card flex flex-col gap-4">
                  <div className="flex items-center gap-2"><Moon size={18} className="text-indigo-400" /><span className="aether-eyebrow">Último Sueño</span></div>
                  <span className="aether-metric-md">{metrics[0]?.sleep_hours ?? 0}h</span>
                </div>
                <div className="aether-card flex flex-col gap-4">
                  <div className="flex items-center gap-2"><Droplets size={18} className="text-cyan-400" /><span className="aether-eyebrow">Hidratación</span></div>
                  <span className="aether-metric-md">{metrics[0]?.water_liters ?? 0}L</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="aether-card relative overflow-hidden h-[280px] flex flex-col">
                <div className="flex items-center gap-2 mb-2"><Flame size={20} style={{ color: THEME.danger }} /><h3 className="text-sm font-bold">Gasto Energético</h3></div>
                <p className="aether-metric-md mb-1">{workouts[0]?.calories_burned ?? 0}</p>
                <p className="text-sm font-medium mb-4 text-[#8A8681]">kcal quemadas ayer</p>
                <div className="flex-1 w-full mt-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workoutData}>
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px', fontWeight: 'bold' }} />
                      <Bar dataKey="calorias" name="Kcal" fill={THEME.accent} radius={[4, 4, 0, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="aether-card h-40">
                <h3 className="text-sm font-bold flex items-center gap-2"><Trophy size={18} style={{ color: THEME.accent }} /> Logros</h3>
                <p className="text-sm font-medium text-[#8A8681] mt-2">El motor de logros se activará pronto.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── ENTRENAMIENTOS ── */}
        {activeTab === 'entrenamientos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workouts.map(w => (
              <div key={w.id} className="aether-card">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-[16px] bg-gray-50 border border-gray-100"><Activity size={24} style={{ color: THEME.accent }} /></div>
                  <span className="aether-eyebrow px-3 py-1.5 rounded-lg bg-gray-50">{w.intensity}</span>
                </div>
                <h3 className="text-xl font-bold mb-2">{w.type}</h3>
                <p className="aether-metric-md">{w.duration_mins} <span className="text-sm font-sans font-medium text-[#8A8681]">minutos</span></p>
              </div>
            ))}
          </div>
        )}

        {/* ── PESTAÑAS EN CONSTRUCCIÓN ── */}
        {(activeTab === 'nutricion' || activeTab === 'medico') && (
          <div className="flex flex-col items-center justify-center h-64 rounded-[32px] border-dashed border-2 border-white/20" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <p className="aether-title mb-2 text-white">Módulo en calibración</p>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Desplegando la matriz de datos pronto.</p>
          </div>
        )}
      </main>

      {/* ── MODAL: MÉTRICAS ─────────────────────────── */}
      <AetherModal isOpen={isMetricModalOpen} onClose={() => { setIsMetricModalOpen(false); setFormError(null); }} title="Control Físico">
        {formError && <p className="text-xs font-bold text-rose-500 mb-4 bg-rose-50 px-4 py-2 rounded-xl">{formError}</p>}
        <form onSubmit={handleCreateMetric} className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Peso (KG)</label>
              <input type="number" step="0.1" required value={newMetric.weight} onChange={e => setNewMetric({ ...newMetric, weight: e.target.value })} className="aether-input font-mono" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Grasa (%)</label>
              <input type="number" step="0.1" value={newMetric.body_fat} onChange={e => setNewMetric({ ...newMetric, body_fat: e.target.value })} className="aether-input font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Sueño (Horas)</label>
              <input type="number" step="0.1" required value={newMetric.sleep_hours} onChange={e => setNewMetric({ ...newMetric, sleep_hours: e.target.value })} className="aether-input font-mono" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Agua (Litros)</label>
              <input type="number" step="0.1" required value={newMetric.water_liters} onChange={e => setNewMetric({ ...newMetric, water_liters: e.target.value })} className="aether-input font-mono" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Fecha</label>
            <input type="date" required value={newMetric.date} onChange={e => setNewMetric({ ...newMetric, date: e.target.value })} className="aether-input" />
          </div>
          <button type="submit" disabled={isSubmitting} className="aether-btn mt-4 shadow-lg hover:shadow-xl disabled:opacity-60" style={{ backgroundColor: THEME.accent, color: THEME.textMain }}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sincronizar Cuerpo'}
          </button>
        </form>
      </AetherModal>

      {/* ── MODAL: ENTRENAMIENTO ─────────────────────── */}
      <AetherModal isOpen={isWorkoutModalOpen} onClose={() => { setIsWorkoutModalOpen(false); setFormError(null); }} title="Actividad Física">
        {formError && <p className="text-xs font-bold text-rose-500 mb-4 bg-rose-50 px-4 py-2 rounded-xl">{formError}</p>}
        <form onSubmit={handleCreateWorkout} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Disciplina</label>
            <select value={newWorkout.type} onChange={e => setNewWorkout({ ...newWorkout, type: e.target.value })} className="aether-input appearance-none">
              {WORKOUT_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Duración (Min)</label>
              <input type="number" required value={newWorkout.duration_mins} onChange={e => setNewWorkout({ ...newWorkout, duration_mins: e.target.value })} className="aether-input font-mono" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Quema (Kcal)</label>
              <input type="number" value={newWorkout.calories_burned} onChange={e => setNewWorkout({ ...newWorkout, calories_burned: e.target.value })} className="aether-input font-mono" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Intensidad</label>
            <select value={newWorkout.intensity} onChange={e => setNewWorkout({ ...newWorkout, intensity: e.target.value })} className="aether-input appearance-none">
              <option value="Baja">Baja (Recuperación)</option>
              <option value="Media">Media (Mantenimiento)</option>
              <option value="Alta">Alta (Fuerza/Partido)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Fecha</label>
              <input type="date" required value={newWorkout.date} onChange={e => setNewWorkout({ ...newWorkout, date: e.target.value })} className="aether-input" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Hora</label>
              <input type="time" required value={newWorkout.time} onChange={e => setNewWorkout({ ...newWorkout, time: e.target.value })} className="aether-input" />
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="aether-btn mt-4 shadow-lg hover:shadow-xl disabled:opacity-60" style={{ backgroundColor: THEME.accent, color: THEME.textMain }}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Registrar Esfuerzo'}
          </button>
        </form>
      </AetherModal>
    </div>
  );
}
