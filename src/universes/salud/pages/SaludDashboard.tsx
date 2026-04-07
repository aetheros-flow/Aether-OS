import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  LayoutDashboard,
  Dumbbell,
  Apple,
  Stethoscope,
  Plus,
  Activity,
  Flame,
  Droplets,
  Moon,
  Trophy,
  Loader2,
  X,
  Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type TabType = 'dashboard' | 'entrenamientos' | 'nutricion' | 'medico';

interface Metric { id: string; weight: number; body_fat: number; sleep_hours: number; water_liters: number; date: string; }
interface Workout { id: string; type: string; duration_mins: number; intensity: string; calories_burned: number; date: string; }
interface Nutrition { id: string; meal_type: string; description: string; calories: number; protein: number; carbs: number; fats: number; date: string; }
interface Medical { id: string; title: string; specialty: string; date: string; status: string; }

const WORKOUT_TYPES = ["Tenis", "Pádel", "Gimnasio", "Running", "Ciclismo", "Yoga", "Natación", "Otro"];

export default function SaludDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [nutrition, setNutrition] = useState<Nutrition[]>([]);
  const [medical, setMedical] = useState<Medical[]>([]);

  // Modales
  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newMetric, setNewMetric] = useState({ weight: '', body_fat: '', sleep_hours: '', water_liters: '', date: new Date().toISOString().split('T')[0] });
  const [newWorkout, setNewWorkout] = useState({ type: 'Tenis', duration_mins: '', intensity: 'Alta', calories_burned: '', date: new Date().toISOString().split('T')[0], time: '10:00' });

  // ==========================================
  // TEMA PREMIUM INMERSIVO (Estilo Expensify)
  // ==========================================
  const theme = {
    bg: '#FE7F01',          // 🧡 Fondo Completo Vibrante (Identidad de Salud Física)
    surface: '#FFFFFF',     // Blanco puro para las tarjetas
    border: '#F0EFEA',      // Bordes casi invisibles
    accent: '#FE7F01',      // Naranja Vibrante para detalles y gráficos
    textMain: '#FFFFFF',    // Blanco para textos sobre el fondo vibrante
    textDark: '#2D2A26',    // Carbón para el texto dentro de las tarjetas
    textMuted: '#8A8681',   // Gris cálido
    danger: '#FF8A80',      // Rojo pastel/soft
    graphBg: '#FFFFFF',     // Fondo blanco obligatorio para gráficos
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ { data: m }, { data: w }, { data: n }, { data: med } ] = await Promise.all([
        supabase.from('Salud_metrics').select('*').order('date', { ascending: false }).limit(7),
        supabase.from('Salud_workouts').select('*').order('date', { ascending: false }).limit(7), 
        supabase.from('Salud_nutrition').select('*').order('date', { ascending: false }).limit(20),
        supabase.from('Salud_medical').select('*').order('date', { ascending: true })
      ]);
      if (m) setMetrics(m);
      if (w) setWorkouts(w);
      if (n) setNutrition(n);
      if (med) setMedical(med);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("Necesitas sincronizar tu consciencia (loguearte)."); return null; }
    return user;
  };

  const handleCreateMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await checkUser();
      if (!user) return;
      const { error } = await supabase.from('Salud_metrics').insert([{
        user_id: user.id, weight: Number(newMetric.weight), body_fat: Number(newMetric.body_fat), sleep_hours: Number(newMetric.sleep_hours), water_liters: Number(newMetric.water_liters), date: newMetric.date
      }]);
      if (error) throw error;
      setIsMetricModalOpen(false);
      setNewMetric({ weight: '', body_fat: '', sleep_hours: '', water_liters: '', date: new Date().toISOString().split('T')[0] });
      await fetchData();
    } catch (error: any) { alert(error.message); } 
    finally { setIsSubmitting(false); }
  };

  const handleCreateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await checkUser();
      if (!user) return;
      const dateTimeString = `${newWorkout.date}T${newWorkout.time || '00:00'}:00Z`;
      const { error } = await supabase.from('Salud_workouts').insert([{
        user_id: user.id, type: newWorkout.type, duration_mins: Number(newWorkout.duration_mins), intensity: newWorkout.intensity, calories_burned: Number(newWorkout.calories_burned), date: dateTimeString
      }]);
      if (error) throw error;
      setIsWorkoutModalOpen(false);
      setNewWorkout({ type: 'Tenis', duration_mins: '', intensity: 'Alta', calories_burned: '', date: new Date().toISOString().split('T')[0], time: '10:00' });
      await fetchData();
    } catch (error: any) { alert(error.message); } 
    finally { setIsSubmitting(false); }
  };

  const currentWeight = metrics.length > 0 ? metrics[0].weight : 0;
  const totalWorkoutMins = workouts.reduce((acc, curr) => acc + Number(curr.duration_mins), 0);

  // Preparación de Datos para los Gráficos (Invertimos para orden cronológico)
  const weightData = [...metrics].reverse().map(m => ({
    date: new Date(m.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    peso: Number(m.weight)
  }));

  const workoutData = [...workouts].reverse().map(w => ({
    date: new Date(w.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    calorias: Number(w.calories_burned),
    minutos: Number(w.duration_mins)
  }));

  if (loading && metrics.length === 0 && workouts.length === 0) {
    return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}><Loader2 className="w-12 h-12 animate-spin text-white" /></div>;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans selection:bg-white selection:text-black relative" style={{ backgroundColor: theme.bg, color: theme.textMain }}>
      
      {/* SIDEBAR */}
      <nav className="w-full md:w-64 flex flex-col z-30 shrink-0 transition-all duration-300 border-r border-white/10" style={{ backgroundColor: theme.bg }}>
        <div className="flex items-center justify-between p-4 md:p-6 md:mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-black/10 transition-colors text-white"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="aether-title" style={{ color: theme.textMain }}>Salud Física</h1>
              <p className="aether-eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>Cuerpo & Energía</p>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-xl hover:bg-black/10 transition-colors" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className={`flex-col gap-2 md:gap-4 px-4 pb-4 md:px-6 md:pb-6 md:flex ${isMobileMenuOpen ? 'flex animate-in fade-in slide-in-from-top-2 duration-300' : 'hidden'}`}>
          <NavItem icon={LayoutDashboard} label="Resumen" isActive={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} theme={theme} />
          <NavItem icon={Dumbbell} label="Entrenamientos" isActive={activeTab === 'entrenamientos'} onClick={() => { setActiveTab('entrenamientos'); setIsMobileMenuOpen(false); }} theme={theme} />
          <NavItem icon={Apple} label="Nutrición" isActive={activeTab === 'nutricion'} onClick={() => { setActiveTab('nutricion'); setIsMobileMenuOpen(false); }} theme={theme} />
          <NavItem icon={Stethoscope} label="Médicos" isActive={activeTab === 'medico'} onClick={() => { setActiveTab('medico'); setIsMobileMenuOpen(false); }} theme={theme} />
        </div>
      </nav>

      {/* ÁREA CENTRAL */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar pb-32 md:pb-10">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12">
          <div>
            <p className="aether-eyebrow mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {activeTab === 'dashboard' ? 'Peso Actual' : activeTab === 'entrenamientos' ? 'Minutos Activos' : activeTab === 'nutricion' ? 'Calorías Promedio' : 'Próxima Cita'}
            </p>
            <div className="flex items-baseline gap-3">
              <span className="aether-metric-xl" style={{ color: theme.textMain }}>
                {activeTab === 'dashboard' ? currentWeight : activeTab === 'entrenamientos' ? totalWorkoutMins : '0'}
              </span>
              <span className="text-xl font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {activeTab === 'dashboard' ? ' KG' : activeTab === 'entrenamientos' ? ' MIN' : ''}
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => {
              if (activeTab === 'dashboard') setIsMetricModalOpen(true);
              if (activeTab === 'entrenamientos') setIsWorkoutModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold transition-transform hover:scale-105 active:scale-95 text-sm shadow-xl" 
            style={{ backgroundColor: theme.surface, color: theme.accent }}
          >
            <Plus size={18} />
            <span>
              {activeTab === 'entrenamientos' ? 'Registrar Actividad' : 'Actualizar Métricas'}
            </span>
          </button>
        </header>

        {/* DASHBOARD PRINCIPAL */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMNA IZQUIERDA (Principal) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Gráfico de Evolución Corporal */}
              <div className="aether-card p-4 md:p-5 overflow-hidden" style={{ backgroundColor: theme.graphBg, borderColor: 'transparent' }}>
                 <div className="flex justify-between items-center mb-6 px-2">
                   <h3 className="text-sm font-bold tracking-wide text-[#2D2A26]">Evolución Corporal</h3>
                   <span className="aether-eyebrow" style={{ color: theme.accent }}>Últimos Registros</span>
                 </div>
                 <div className="h-56 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={weightData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEAE5" />
                       <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: theme.textMuted }} dy={10} />
                       <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: theme.textMuted }} dx={-10} />
                       <Tooltip 
                         contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px', fontWeight: 'bold' }} 
                         itemStyle={{ color: theme.textDark }}
                       />
                       <Line type="monotone" name="Peso (KG)" dataKey="peso" stroke={theme.accent} strokeWidth={4} dot={{ r: 5, fill: theme.graphBg, stroke: theme.accent, strokeWidth: 2 }} activeDot={{ r: 7 }} />
                     </LineChart>
                   </ResponsiveContainer>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="aether-card flex flex-col gap-4" style={{ backgroundColor: theme.surface }}>
                  <div className="flex items-center gap-2">
                    <Moon size={18} className="text-indigo-400" />
                    <span className="aether-eyebrow" style={{ color: theme.textMuted }}>Último Sueño</span>
                  </div>
                  <span className="aether-metric-md" style={{ color: theme.textDark }}>{metrics.length > 0 ? metrics[0].sleep_hours : 0}h</span>
                </div>
                <div className="aether-card flex flex-col gap-4" style={{ backgroundColor: theme.surface }}>
                  <div className="flex items-center gap-2">
                    <Droplets size={18} className="text-cyan-400" />
                    <span className="aether-eyebrow" style={{ color: theme.textMuted }}>Hidratación</span>
                  </div>
                  <span className="aether-metric-md" style={{ color: theme.textDark }}>{metrics.length > 0 ? metrics[0].water_liters : 0}L</span>
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA (Secundaria) */}
            <div className="flex flex-col gap-6">
              
              {/* Gráfico de Barras: Gasto Energético */}
              <div className="aether-card relative overflow-hidden h-[280px] flex flex-col" style={{ backgroundColor: theme.surface }}>
                <div className="flex items-center gap-2 mb-2 relative z-10">
                  <Flame size={20} style={{ color: theme.danger || theme.accent }} />
                  <h3 className="text-sm font-bold tracking-wide" style={{ color: theme.textDark }}>Gasto Energético</h3>
                </div>
                <p className="aether-metric-md mb-1 relative z-10" style={{ color: theme.textDark }}>{workouts.length > 0 ? workouts[0].calories_burned : 0}</p>
                <p className="text-sm font-medium mb-4 relative z-10" style={{ color: theme.textMuted }}>kcal quemadas ayer</p>
                
                {/* Gráfico de barras incrustado */}
                <div className="flex-1 w-full mt-auto relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workoutData}>
                      <Tooltip 
                        cursor={{ fill: 'rgba(0,0,0,0.03)' }} 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px', fontWeight: 'bold' }} 
                      />
                      <Bar dataKey="calorias" name="Kcal" fill={theme.accent} radius={[4, 4, 0, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="aether-card h-40" style={{ backgroundColor: theme.surface }}>
                <h3 className="text-sm font-bold tracking-wide flex items-center gap-2" style={{ color: theme.textDark }}><Trophy size={18} style={{ color: theme.accent }}/> Logros</h3>
                <p className="text-sm font-medium" style={{ color: theme.textMuted }}>El motor de logros se activará pronto.</p>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑAS EN CONSTRUCCIÓN */}
        {activeTab === 'entrenamientos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workouts.map(w => (
               <div key={w.id} className="aether-card" style={{ backgroundColor: theme.surface }}>
                 <div className="flex justify-between items-start mb-6">
                   <div className="p-3 rounded-[16px] bg-gray-50 border border-gray-100"><Activity size={24} style={{ color: theme.accent }}/></div>
                   <span className="aether-eyebrow px-3 py-1.5 rounded-lg bg-gray-50 text-[#8A8681]">{w.intensity}</span>
                 </div>
                 <h3 className="text-xl font-bold mb-2" style={{ color: theme.textDark }}>{w.type}</h3>
                 <p className="aether-metric-md" style={{ color: theme.textDark }}>{w.duration_mins} <span className="text-sm font-sans font-medium" style={{ color: theme.textMuted }}>minutos</span></p>
               </div>
            ))}
          </div>
        )}
        {(activeTab === 'nutricion' || activeTab === 'medico') && (
           <div className="flex flex-col items-center justify-center h-64 rounded-[32px] border-dashed border-2 border-white/20" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
             <p className="aether-title mb-2 text-white">Módulo en calibración</p>
             <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Desplegando la matriz de datos pronto.</p>
           </div>
        )}
      </main>

      {/* ==========================================
          MODAL: ACTUALIZAR MÉTRICAS
          ========================================== */}
      {isMetricModalOpen && (
        <div className="aether-modal-backdrop">
          <div className="aether-modal-panel w-full max-w-md">
            <div className="flex justify-between items-center mb-8">
              <h2 className="aether-title text-[#2D2A26]">Control Físico</h2>
              <button onClick={() => setIsMetricModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 text-[#8A8681]"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateMetric} className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="aether-eyebrow">Peso (KG)</label>
                  <input type="number" step="0.1" required value={newMetric.weight} onChange={(e) => setNewMetric({...newMetric, weight: e.target.value})} className="aether-input font-mono text-[#2D2A26]" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="aether-eyebrow">Grasa (%)</label>
                  <input type="number" step="0.1" value={newMetric.body_fat} onChange={(e) => setNewMetric({...newMetric, body_fat: e.target.value})} className="aether-input font-mono text-[#2D2A26]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="aether-eyebrow">Sueño (Horas)</label>
                  <input type="number" step="0.1" required value={newMetric.sleep_hours} onChange={(e) => setNewMetric({...newMetric, sleep_hours: e.target.value})} className="aether-input font-mono text-[#2D2A26]" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="aether-eyebrow">Agua (Litros)</label>
                  <input type="number" step="0.1" required value={newMetric.water_liters} onChange={(e) => setNewMetric({...newMetric, water_liters: e.target.value})} className="aether-input font-mono text-[#2D2A26]" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="aether-eyebrow">Fecha</label>
                <input type="date" required value={newMetric.date} onChange={(e) => setNewMetric({...newMetric, date: e.target.value})} className="aether-input text-[#2D2A26]" />
              </div>
              <button type="submit" disabled={isSubmitting} className="aether-btn mt-4 shadow-lg hover:shadow-xl" style={{ backgroundColor: theme.accent, color: theme.textMain, opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sincronizar Cuerpo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: REGISTRAR ENTRENAMIENTO
          ========================================== */}
      {isWorkoutModalOpen && (
        <div className="aether-modal-backdrop">
          <div className="aether-modal-panel w-full max-w-md">
            <div className="flex justify-between items-center mb-8">
              <h2 className="aether-title text-[#2D2A26]">Actividad Física</h2>
              <button onClick={() => setIsWorkoutModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 text-[#8A8681]"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateWorkout} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="aether-eyebrow">Disciplina</label>
                <select value={newWorkout.type} onChange={(e) => setNewWorkout({...newWorkout, type: e.target.value})} className="aether-input appearance-none text-[#2D2A26]">
                  {WORKOUT_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="aether-eyebrow">Duración (Min)</label>
                  <input type="number" required value={newWorkout.duration_mins} onChange={(e) => setNewWorkout({...newWorkout, duration_mins: e.target.value})} className="aether-input font-mono text-[#2D2A26]" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="aether-eyebrow">Quema (Kcal)</label>
                  <input type="number" value={newWorkout.calories_burned} onChange={(e) => setNewWorkout({...newWorkout, calories_burned: e.target.value})} className="aether-input font-mono text-[#2D2A26]" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="aether-eyebrow">Intensidad</label>
                <select value={newWorkout.intensity} onChange={(e) => setNewWorkout({...newWorkout, intensity: e.target.value})} className="aether-input appearance-none text-[#2D2A26]">
                  <option value="Baja">Baja (Recuperación)</option>
                  <option value="Media">Media (Mantenimiento)</option>
                  <option value="Alta">Alta (Fuerza/Partido)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="aether-eyebrow">Fecha</label>
                  <input type="date" required value={newWorkout.date} onChange={(e) => setNewWorkout({...newWorkout, date: e.target.value})} className="aether-input text-[#2D2A26]" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="aether-eyebrow">Hora</label>
                  <input type="time" required value={newWorkout.time} onChange={(e) => setNewWorkout({...newWorkout, time: e.target.value})} className="aether-input text-[#2D2A26]" />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="aether-btn mt-4 shadow-lg hover:shadow-xl" style={{ backgroundColor: theme.accent, color: theme.textMain, opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Registrar Esfuerzo'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// COMPONENTES AUXILIARES IN-FILE
function NavItem({ icon: Icon, label, isActive, onClick, theme }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 px-4 md:px-5 py-3.5 md:py-4 rounded-2xl transition-all duration-300 ${isActive ? 'bg-white/20 active:scale-95' : 'hover:bg-black/10'}`} style={{ color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)' }}>
      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} style={{ color: '#FFFFFF' }} />
      <span className="text-sm font-bold tracking-wide">{label}</span>
    </button>
  );
}