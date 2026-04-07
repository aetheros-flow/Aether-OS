import { useState } from 'react';
import { ArrowLeft, LayoutDashboard, Users, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SocialDashboard() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const theme = {
    bg: '#1447E6',
    surface: '#FFFFFF',
    textMain: '#FFFFFF',
    textDark: '#2D2A26',
    textMuted: '#8A8681',
    accent: '#1447E6'
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans selection:bg-white selection:text-black relative" style={{ backgroundColor: theme.bg, color: theme.textMain }}>
       <nav className="w-full md:w-64 flex flex-col z-30 shrink-0 transition-all duration-300 border-r border-white/10" style={{ backgroundColor: theme.bg }}>
           <div className="flex items-center justify-between p-4 md:p-6 md:mb-6">
                <div className="flex items-center gap-4">
                  <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-black/10 transition-colors text-white"><ArrowLeft size={20} /></button>
                  <div>
                    <h1 className="aether-title" style={{ color: theme.textMain }}>Vida Social</h1>
                    <p className="aether-eyebrow" style={{ color: 'rgba(255,255,255,0.7)' }}>Comunidad & Entorno</p>
                  </div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-xl hover:bg-black/10 transition-colors" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
           </div>
           <div className={`flex-col gap-2 px-4 pb-4 md:flex ${isMobileMenuOpen ? 'flex' : 'hidden'}`}>
             <button className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/20 text-white font-bold tracking-wide">
                <LayoutDashboard size={20} strokeWidth={2.5} /> Resumen
             </button>
           </div>
       </nav>
       <main className="flex-1 p-4 md:p-10 overflow-y-auto pb-32 md:pb-10">
          <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
             <div>
                <p className="aether-eyebrow mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>Estado General</p>
                <div className="aether-metric-xl flex items-center gap-3" style={{ color: theme.textMain }}>
                   En Calibración <Users strokeWidth={3} className="text-white opacity-80" />
                </div>
             </div>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="aether-card h-64 flex flex-col justify-center items-center text-center col-span-full" style={{ backgroundColor: theme.surface }}>
               <h3 className="text-2xl font-bold mb-4" style={{ color: theme.textDark }}>Módulo en Construcción</h3>
               <p className="aether-eyebrow opacity-70" style={{ color: theme.textMuted }}>Próximamente desplegaremos la matriz de datos para tu Universo Social.</p>
            </div>
          </div>
       </main>
    </div>
  );
}
