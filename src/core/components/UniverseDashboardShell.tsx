import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, LayoutDashboard, Menu, X, Sparkles, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UniverseNavItem from './UniverseNavItem';

export interface UniverseShellConfig {
  /** Color identitario del universo (HEX). Se usa solo como acento/glow. */
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
   * Compatibilidad hacia atrás. En el sistema Neo-Dark el fondo siempre
   * es negro y el color del universo se usa como acento, así que esta
   * prop ya no afecta el render. Se conserva para no romper callers.
   */
  lightBg?: boolean;
}

interface UniverseDashboardShellProps extends UniverseShellConfig {
  /** Contenido personalizado en lugar del card de "Módulo en Construcción" */
  children?: React.ReactNode;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function UniverseDashboardShell({
  color,
  title,
  subtitle,
  headerIcon: HeaderIcon,
  moduleLabel,
  children,
}: UniverseDashboardShellProps) {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row font-sans text-white relative overflow-hidden bg-[#0A0A0A] selection:bg-white/20 selection:text-white"
    >
      {/* ── GLOWS DE FONDO (color del universo, sutil) ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full blur-[140px] opacity-[0.18]"
        style={{ background: color }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-60 right-0 w-[600px] h-[600px] rounded-full blur-[160px] opacity-[0.10]"
        style={{ background: color }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* ── SIDEBAR ── */}
      <nav className="w-full md:w-64 flex flex-col z-30 shrink-0 relative bg-black/40 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/5">
        <div className="flex items-center justify-between p-4 md:p-6 md:mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <motion.button
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              className="p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft size={18} />
            </motion.button>
            <div className="min-w-0">
              <h1
                className="font-serif text-2xl md:text-[26px] font-medium tracking-tight text-white leading-tight truncate"
              >
                {title}
              </h1>
              <p
                className="text-[10px] uppercase font-black tracking-[0.22em] mt-0.5 truncate"
                style={{ color }}
              >
                {subtitle}
              </p>
            </div>
          </div>

          <motion.button
            onClick={() => setIsMobileMenuOpen(v => !v)}
            whileTap={{ scale: 0.92 }}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white/80"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        </div>

        <div
          className={`flex-col gap-2 px-3 pb-4 md:flex ${
            isMobileMenuOpen
              ? 'flex animate-in fade-in slide-in-from-top-2 duration-200'
              : 'hidden'
          }`}
        >
          <UniverseNavItem
            icon={LayoutDashboard}
            label="Overview"
            isActive
            accent={color}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        </div>
      </nav>

      {/* ── ÁREA PRINCIPAL ── */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar pb-32 md:pb-10 relative z-10"
      >
        {/* Header del universo */}
        <motion.header
          variants={itemVariants}
          className="mb-8 md:mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
        >
          <div className="min-w-0">
            <p
              className="text-[10px] uppercase font-black tracking-[0.24em] mb-3"
              style={{ color }}
            >
              General status
            </p>
            <div className="flex items-center gap-4">
              <h2 className="font-sans text-5xl md:text-6xl font-bold tracking-tight text-white leading-none">
                Calibrating
              </h2>
              <span
                className="hidden md:inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10"
                style={{ boxShadow: `inset 0 0 24px ${color}25` }}
              >
                <HeaderIcon size={22} strokeWidth={2.4} style={{ color }} />
              </span>
            </div>
          </div>
        </motion.header>

        {/* Panel de IA — aparece sólo si no hay children custom */}
        {!children && (
          <motion.section
            variants={itemVariants}
            whileHover={{ scale: 1.005 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="relative mb-8 rounded-[28px] p-5 md:p-7 bg-zinc-900/70 backdrop-blur-xl border border-white/5 overflow-hidden"
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.10]"
              style={{
                background: `radial-gradient(800px circle at 0% 0%, ${color}, transparent 50%)`,
              }}
            />
            <div className="relative flex items-start gap-4">
              <span
                className="flex items-center justify-center w-10 h-10 rounded-2xl shrink-0"
                style={{
                  background: `${color}1A`,
                  border: `1px solid ${color}40`,
                }}
              >
                <Sparkles size={18} style={{ color }} />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className="text-[10px] uppercase font-black tracking-[0.22em] mb-1.5 text-zinc-500"
                >
                  Aether AI · Insight
                </p>
                <p className="text-[15px] md:text-base font-medium text-white/90 leading-relaxed">
                  Preparing your {moduleLabel} reading. Once you log your first
                  signal, a contextual verdict and prioritised recommendations
                  will appear here.
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {children ?? (
          <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6">
            <motion.div
              whileHover={{ scale: 1.005, y: -2 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="relative rounded-[32px] p-10 md:p-14 bg-zinc-900/70 backdrop-blur-xl border border-white/5 overflow-hidden flex flex-col items-center justify-center text-center min-h-[280px]"
            >
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  background: `radial-gradient(600px circle at 50% 0%, ${color}, transparent 60%)`,
                }}
              />
              <span
                className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
                style={{
                  background: `${color}1A`,
                  border: `1px solid ${color}40`,
                  boxShadow: `0 0 40px ${color}20`,
                }}
              >
                <HeaderIcon size={26} strokeWidth={2.2} style={{ color }} />
              </span>
              <h3 className="relative font-serif text-3xl md:text-4xl font-medium tracking-tight text-white mb-3">
                Module under construction
              </h3>
              <p className="relative text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 max-w-md">
                Coming soon: the data matrix for {moduleLabel}.
              </p>
            </motion.div>
          </motion.div>
        )}
      </motion.main>
    </div>
  );
}
