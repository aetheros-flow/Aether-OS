import { useState } from 'react';
import { ArrowLeft, LayoutDashboard, Menu, X, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UniverseNavItem from './UniverseNavItem';

export interface UniverseShellConfig {
  /** Color principal del universo (fondo de nav + bg general) */
  color: string;
  /** Título en la barra lateral: "Vida Amorosa" */
  title: string;
  /** Subtítulo eyebrow: "Conexión & Relaciones" */
  subtitle: string;
  /** Ícono que aparece en el header de métricas */
  headerIcon: LucideIcon;
  /** Texto del placeholder: "tu Universo Amoroso" */
  moduleLabel: string;
  /**
   * true cuando el color de fondo es claro (Ocio cyan, Des. Prof. gold).
   * Controla si el texto y botones usan tono oscuro en vez de blanco.
   */
  lightBg?: boolean;
}

interface UniverseDashboardShellProps extends UniverseShellConfig {
  /** Contenido personalizado en lugar del card de "Módulo en Construcción" */
  children?: React.ReactNode;
}

export default function UniverseDashboardShell({
  color,
  title,
  subtitle,
  headerIcon: HeaderIcon,
  moduleLabel,
  lightBg = false,
  children,
}: UniverseDashboardShellProps) {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const textMain   = lightBg ? '#2D2A26' : '#FFFFFF';
  const textMuted  = lightBg ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)';
  const btnText    = lightBg ? 'text-[#2D2A26]' : 'text-white';
  const menuBtnClr = lightBg ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)';

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row font-sans selection:bg-white/30 selection:text-inherit relative"
      style={{ backgroundColor: color, color: textMain }}
    >
      {/* ── SIDEBAR ── */}
      <nav
        className="w-full md:w-64 flex flex-col z-30 shrink-0 transition-all duration-300 border-r border-white/10"
        style={{ backgroundColor: color }}
      >
        <div className="flex items-center justify-between p-4 md:p-6 md:mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className={`p-2 rounded-full hover:bg-black/10 transition-colors ${btnText}`}
              aria-label="Volver al inicio"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="aether-title" style={{ color: textMain }}>{title}</h1>
              <p className="aether-eyebrow" style={{ color: textMuted }}>{subtitle}</p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(v => !v)}
            className="md:hidden p-2 rounded-xl hover:bg-black/10 transition-colors"
            style={{ color: menuBtnClr }}
            aria-label="Abrir menú"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className={`flex-col gap-2 px-4 pb-4 md:flex ${isMobileMenuOpen ? 'flex animate-in fade-in slide-in-from-top-2 duration-200' : 'hidden'}`}>
          <UniverseNavItem
            icon={LayoutDashboard}
            label="Resumen"
            isActive
            onClick={() => setIsMobileMenuOpen(false)}
            lightBg={lightBg}
          />
        </div>
      </nav>

      {/* ── ÁREA PRINCIPAL ── */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar pb-32 md:pb-10">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <p className="aether-eyebrow mb-2" style={{ color: textMuted }}>Estado General</p>
            <div className="aether-metric-xl flex items-center gap-3" style={{ color: textMain }}>
              En Calibración
              <HeaderIcon strokeWidth={3} style={{ color: textMain, opacity: 0.7 }} />
            </div>
          </div>
        </header>

        {children ?? (
          <div className="grid grid-cols-1 gap-6">
            <div className="aether-card h-64 flex flex-col justify-center items-center text-center col-span-full">
              <h3 className="text-2xl font-bold mb-4 text-[#2D2A26]">Módulo en Construcción</h3>
              <p className="aether-eyebrow opacity-60 text-[#8A8681]">
                Próximamente desplegaremos la matriz de datos para {moduleLabel}.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
