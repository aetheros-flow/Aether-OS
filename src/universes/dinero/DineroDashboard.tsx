import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  LineChart, 
  FolderKanban, 
  LayoutDashboard,
  Plus,
  Flame,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Tipos para estructurar la UI
type TabType = 'dashboard' | 'billeteras' | 'inversiones' | 'proyectos';

export default function DineroDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Paleta del Universo (Verde Bosque / Salvia)
  const theme = {
    bg: '#0F1D10',
    surface: '#162918',
    border: 'rgba(72, 125, 75, 0.2)',
    accent: '#487D4B',
    accentHover: '#5C9A60',
    textMain: '#FFFFFF',
    textMuted: 'rgba(255, 255, 255, 0.5)'
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans selection:bg-[#487D4B] selection:text-white" style={{ backgroundColor: theme.bg, color: theme.textMain }}>
      
      {/* SIDEBAR (Desktop) / TOPBAR (Mobile) */}
      <nav 
        className="w-full md:w-64 flex flex-row md:flex-col justify-between md:justify-start border-b md:border-b-0 md:border-r p-4 md:p-6 z-20 shrink-0 overflow-x-auto hide-scrollbar"
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center gap-4 mb-0 md:mb-12 shrink-0">
          <button 
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-serif tracking-tight">Finanzas</h1>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: theme.accent }}>Liquidez & Capital</p>
          </div>
        </div>

        {/* Links de Navegación */}
        <div className="flex flex-row md:flex-col gap-2 md:gap-4 ml-8 md:ml-0 shrink-0">
          <NavItem icon={LayoutDashboard} label="Resumen" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} theme={theme} />
          <NavItem icon={Wallet} label="Cuentas" isActive={activeTab === 'billeteras'} onClick={() => setActiveTab('billeteras')} theme={theme} />
          <NavItem icon={LineChart} label="Radar Cripto" isActive={activeTab === 'inversiones'} onClick={() => setActiveTab('inversiones')} theme={theme} />
          <NavItem icon={FolderKanban} label="Proyectos" isActive={activeTab === 'proyectos'} onClick={() => setActiveTab('proyectos')} theme={theme} />
        </div>
      </nav>

      {/* ÁREA CENTRAL DE CONTENIDO */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar pb-32 md:pb-10">
        
        {/* Cabecera del Dashboard */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] mb-2 font-medium" style={{ color: theme.textMuted }}>Patrimonio Neto Total</p>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl md:text-6xl font-light font-mono tracking-tighter">45,250</span>
              <span className="text-xl font-mono" style={{ color: theme.accent }}>.00 NZD</span>
            </div>
          </div>
          
          <button 
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-transform hover:scale-105 active:scale-95 text-sm"
            style={{ backgroundColor: theme.accent, color: '#FFF' }}
          >
            <Plus size={18} />
            <span>Registrar Movimiento</span>
          </button>
        </header>

        {/* GRILLA DE MÓDULOS (Dashboard Principal) */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* MÓDULO 1: Cash Flow & Burn Rate (Ocupa 2 columnas) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              <div className="grid grid-cols-2 gap-4">
                {/* Ingresos del mes */}
                <div className="p-6 rounded-2xl border flex flex-col gap-4" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                  <div className="flex items-center gap-2" style={{ color: theme.textMuted }}>
                    <ArrowDownRight size={16} className="text-emerald-400" />
                    <span className="text-xs uppercase tracking-wider">Ingresos (30d)</span>
                  </div>
                  <span className="text-2xl font-mono text-emerald-400">+ $7,200.00</span>
                </div>
                
                {/* Gastos del mes */}
                <div className="p-6 rounded-2xl border flex flex-col gap-4" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                  <div className="flex items-center gap-2" style={{ color: theme.textMuted }}>
                    <ArrowUpRight size={16} className="text-rose-400" />
                    <span className="text-xs uppercase tracking-wider">Gastos (30d)</span>
                  </div>
                  <span className="text-2xl font-mono text-rose-400">- $3,140.50</span>
                </div>
              </div>

              {/* Tabla Premium de Transacciones */}
              <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: theme.border }}>
                  <h3 className="text-sm font-medium tracking-wide">Últimos Movimientos</h3>
                  <button className="text-xs underline hover:text-white transition-colors" style={{ color: theme.textMuted }}>Ver todos</button>
                </div>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: theme.border, color: theme.textMuted }}>
                        <th className="p-4 font-normal text-xs uppercase tracking-widest">Fecha</th>
                        <th className="p-4 font-normal text-xs uppercase tracking-widest">Concepto</th>
                        <th className="p-4 font-normal text-xs uppercase tracking-widest text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      <TransactionRow date="28 Mar" title="LEB Systems (AWS Infra)" type="out" amount="45.00" theme={theme} />
                      <TransactionRow date="27 Mar" title="Supermercado" type="out" amount="120.30" theme={theme} />
                      <TransactionRow date="25 Mar" title="DCA Bitcoin" type="out" amount="500.00" theme={theme} />
                      <TransactionRow date="24 Mar" title="Servicios IT" type="in" amount="1,850.00" theme={theme} />
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* COLUMNA LATERAL (Módulos 2 y 3) */}
            <div className="flex flex-col gap-6">
              
              {/* Alerta de Burn Rate (Motor de reducción de gastos) */}
              <div className="p-6 rounded-2xl border relative overflow-hidden group" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
                <div className="flex items-center gap-2 mb-4">
                  <Flame size={18} className="text-rose-400" />
                  <h3 className="text-sm font-medium tracking-wide">Burn Rate Actual</h3>
                </div>
                <p className="text-3xl font-mono tracking-tight mb-2">$104.68 <span className="text-sm font-sans" style={{ color: theme.textMuted }}>/ día</span></p>
                <p className="text-xs font-light leading-relaxed text-rose-200/70">
                  Ritmo elevado. Proyección de cierre con 12% menos de ahorro que el mes pasado. Oportunidad de ajuste detectada en salidas.
                </p>
              </div>

              {/* Sandbox de Proyectos (Estimación) */}
              <div className="p-6 rounded-2xl border flex flex-col gap-5" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <h3 className="text-sm font-medium tracking-wide flex items-center gap-2">
                  <FolderKanban size={16} style={{ color: theme.accent }} />
                  Runway de Proyectos
                </h3>
                
                <ProjectItem name="Boca App (API & Backend)" cost="25.00" runway="18 meses" theme={theme} />
                <ProjectItem name="Aether OS (Supabase)" cost="0.00" runway="Infinito" theme={theme} />
              </div>

            </div>
          </div>
        )}

        {/* Pestañas en construcción */}
        {activeTab !== 'dashboard' && (
          <div className="flex flex-col items-center justify-center h-64 border rounded-2xl border-dashed" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
            <p className="text-lg font-serif mb-2" style={{ color: theme.accent }}>Módulo {activeTab} en calibración</p>
            <p className="text-sm" style={{ color: theme.textMuted }}>La arquitectura de datos está siendo desplegada.</p>
          </div>
        )}

      </main>
    </div>
  );
}

// COMPONENTES AUXILIARES PARA MANTENER EL CÓDIGO LIMPIO

function NavItem({ icon: Icon, label, isActive, onClick, theme }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
      style={{ color: isActive ? '#FFF' : theme.textMuted }}
    >
      <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} style={{ color: isActive ? theme.accent : 'inherit' }} />
      <span className="text-sm font-medium tracking-wide">{label}</span>
    </button>
  );
}

function TransactionRow({ date, title, type, amount, theme }: any) {
  const isIncome = type === 'in';
  return (
    <tr className="border-b transition-colors hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
      <td className="p-4 text-xs font-mono" style={{ color: theme.textMuted }}>{date}</td>
      <td className="p-4 text-sm">{title}</td>
      <td className={`p-4 text-right font-mono text-sm ${isIncome ? 'text-emerald-400' : ''}`}>
        {isIncome ? '+' : '-'} {amount}
      </td>
    </tr>
  );
}

function ProjectItem({ name, cost, runway, theme }: any) {
  return (
    <div className="flex flex-col gap-1 pb-4 border-b last:border-0 last:pb-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-xs font-mono" style={{ color: theme.textMuted }}>${cost}/mo</span>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-emerald-500">Runway: {runway}</span>
    </div>
  );
}