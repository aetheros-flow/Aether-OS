import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import {
  Sparkles, Moon, Hash, Map, Ghost, ChevronRight, LayoutDashboard,
  Fingerprint, Activity, PenTool, Users, Sun, Star, Compass, BookOpen, Send,
  ArrowLeft, Loader2,
} from 'lucide-react';

import { supabase } from '../../../lib/supabase';
import { calculateNatalChart } from '../lib/astrologyEngine';
import type { NatalChartData } from '../lib/astrologyEngine';
import { HabitsMiniApp } from '../components/ui/HabitsMiniApp';
import { HabitsManager } from '../components/ui/HabitsManager';
import { calculateLifePathNumber, calculateExpressionNumber, NUMBER_MEANINGS } from '../lib/numerologyEngine';
import UniverseNavItem from '../../../core/components/UniverseNavItem';
import UniverseBottomNav from '../../../core/components/UniverseBottomNav';
import UniverseMobileHeader from '../../../core/components/UniverseMobileHeader';

type TabType = 'overview' | 'identity' | 'shadow' | 'habits';

const ACCENT = '#A78BFA';
const ACCENT_SOFT = '#C4B5FD';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};
const tapPhysics = { scale: 0.96, filter: 'brightness(1.1)' };
const hoverPhysics = { scale: 1.01 };

export default function DesarrolloPersonalDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [userId, setUserId] = useState<string | undefined>(undefined);

  const [numerologyData, setNumerologyData] = useState({ lifePath: 0, expression: 0 });
  const [chartData, setChartData] = useState<NatalChartData | null>(null);
  const [isCalculatingChart, setIsCalculatingChart] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUserId(data.user.id);
    };
    fetchUser();

    const loadMysticData = async () => {
      const fullName = "Lucas Ezequiel Bianchi";
      const birthDate = "1983-01-27";
      setNumerologyData({
        lifePath: calculateLifePathNumber(birthDate),
        expression: calculateExpressionNumber(fullName)
      });

      setIsCalculatingChart(true);
      const astroData = await calculateNatalChart(27, 1, 1983, 14, 30, -34.6037, -58.3816, -3);
      setChartData(astroData);
      setIsCalculatingChart(false);
    };

    loadMysticData();
  }, []);

  const lifePathArquetipo = NUMBER_MEANINGS[numerologyData.lifePath] || { title: 'Calculating...', description: '' };
  const expressionArquetipo = NUMBER_MEANINGS[numerologyData.expression] || { title: 'Calculating...', description: '' };

  const tabTitle: Record<TabType, string> = {
    overview: 'Daily Habits',
    identity: 'Identity Matrix',
    shadow: 'Shadow Work',
    habits: 'Habits Lab',
  };

  const tabSubtitle: Record<TabType, string> = {
    overview: 'Track your daily rituals and momentum',
    identity: 'Your astrological & numerological blueprint',
    shadow: 'Daily reflection and journaling',
    habits: 'Manage and analyze your habit system',
  };

  const aiInsight = useMemo(() => {
    if (isCalculatingChart) return 'Loading your astrological & numerological data…';
    if (numerologyData.lifePath > 0) {
      return `Your Life Path ${numerologyData.lifePath} archetype — "${lifePathArquetipo.title}" — is dominant today. Lean into it.`;
    }
    return 'Your conscious expansion universe. Explore identity, shadow, and habits.';
  }, [isCalculatingChart, numerologyData.lifePath, lifePathArquetipo.title]);

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row font-sans bg-[#0A0A0A] text-white overflow-x-hidden selection:bg-purple-500/30">
      <div className="fixed top-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none opacity-50" style={{ background: `radial-gradient(circle, ${ACCENT}33 0%, transparent 70%)`, filter: 'blur(120px)' }} />
      <div className="fixed bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none opacity-30" style={{ background: `radial-gradient(circle, #34D39922 0%, transparent 70%)`, filter: 'blur(100px)' }} />

      <UniverseMobileHeader title="Personal" subtitle="Conscious Expansion" color="#0A0A0A" />

      <nav className="hidden md:flex md:w-64 flex-col z-30 shrink-0 border-r border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-4 p-6 mb-4">
          <motion.button
            whileTap={tapPhysics}
            whileHover={hoverPhysics}
            onClick={() => navigate('/')}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft size={18} />
          </motion.button>
          <div>
            <h1 className="font-serif text-2xl font-medium tracking-tight text-white">Personal</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Conscious Expansion</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 px-4 pb-6">
          <UniverseNavItem accent={ACCENT} icon={LayoutDashboard} label="Overview"        isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <UniverseNavItem accent={ACCENT} icon={Fingerprint}    label="Identity Matrix" isActive={activeTab === 'identity'} onClick={() => setActiveTab('identity')} />
          <UniverseNavItem accent={ACCENT} icon={PenTool}        label="Shadow Work"     isActive={activeTab === 'shadow'}   onClick={() => setActiveTab('shadow')} />
          <UniverseNavItem accent={ACCENT} icon={Activity}       label="Habits"          isActive={activeTab === 'habits'}   onClick={() => setActiveTab('habits')} />
        </div>
      </nav>

      <main className="relative z-10 flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar pt-16 md:pt-10 pb-24 md:pb-10">
        <motion.header
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={activeTab}
          className="mb-8 md:mb-10"
        >
          <motion.div variants={itemVariants} className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="font-serif text-white mb-2 tracking-tight"
            style={{ fontSize: 'clamp(2rem, 6vw, 3.2rem)', lineHeight: 1.05 }}
          >
            {tabTitle[activeTab]}
          </motion.h2>
          <motion.p variants={itemVariants} className="text-sm text-zinc-400 mb-6">
            {tabSubtitle[activeTab]}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="rounded-3xl p-5 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}18, rgba(255,255,255,0.02))`,
              border: `1px solid ${ACCENT}33`,
            }}
          >
            <div className="flex items-start gap-3 relative z-10">
              <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${ACCENT}22` }}>
                <Sparkles size={16} style={{ color: ACCENT }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: ACCENT_SOFT }}>Aether Insight</p>
                <p className="text-sm text-zinc-200 leading-relaxed">{aiInsight}</p>
              </div>
            </div>
          </motion.div>
        </motion.header>

        {activeTab === 'overview' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key="overview"
          >
            <HabitsMiniApp userId={userId} />
          </motion.div>
        )}

        {activeTab === 'identity' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key="identity"
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <motion.div
              variants={itemVariants}
              whileHover={hoverPhysics}
              className="rounded-3xl p-8 bg-zinc-900/60 border border-white/5 backdrop-blur-xl relative overflow-hidden group"
            >
              <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] pointer-events-none transition-all duration-700" style={{ backgroundColor: `${ACCENT}33` }} />
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-2" style={{ color: ACCENT }}>
                    <Moon size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Astrological Blueprint</span>
                  </div>
                  <h3 className="font-serif text-2xl font-medium text-white">Natal Chart</h3>
                </div>
                <motion.button whileTap={tapPhysics} className="p-3 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors">
                  <ChevronRight size={18} />
                </motion.button>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="w-40 h-40 rounded-full flex items-center justify-center relative p-2" style={{ border: `1px solid ${ACCENT}55`, boxShadow: `0 0 30px ${ACCENT}33` }}>
                  <div className="w-full h-full rounded-full border border-dashed animate-[spin_60s_linear_infinite] flex items-center justify-center" style={{ borderColor: `${ACCENT}66` }}>
                    <div className="w-3/4 h-3/4 rounded-full flex items-center justify-center" style={{ border: `1px solid ${ACCENT}40` }}>
                       <Sun size={24} style={{ color: ACCENT_SOFT }} />
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-3">
                  {isCalculatingChart || !chartData ? (
                    <div className="flex justify-center items-center h-full py-10">
                      <Loader2 className="w-6 h-6 animate-spin" style={{ color: ACCENT }} />
                    </div>
                  ) : (
                    <>
                      {[
                        { label: 'Sun', sign: chartData.sun.sign, deg: chartData.sun.degree },
                        { label: 'Moon', sign: chartData.moon.sign, deg: chartData.moon.degree },
                        { label: 'Ascendant', sign: chartData.ascendant.sign, deg: chartData.ascendant.degree },
                      ].map(row => (
                        <div key={row.label} className="bg-white/5 rounded-2xl p-4 flex justify-between items-center border border-white/5">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{row.label}</span>
                          <span className="text-sm font-bold text-white">
                            {row.sign}
                            <span className="ml-2" style={{ color: ACCENT_SOFT }}>{row.deg.toFixed(1)}°</span>
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={hoverPhysics}
              className="rounded-3xl p-8 bg-zinc-900/60 border border-white/5 backdrop-blur-xl relative overflow-hidden group"
            >
              <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: '#60A5FA33' }} />
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <Hash size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Pythagorean Matrix</span>
                  </div>
                  <h3 className="font-serif text-2xl font-medium text-white">Numerology</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="rounded-3xl p-6 flex flex-col justify-between" style={{ background: '#3B82F60F', border: '1px solid #3B82F633' }}>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300/70 mb-4 block">Life Path</span>
                  <div>
                    <span className="text-5xl font-black text-white" style={{ filter: 'drop-shadow(0 0 15px #3B82F688)' }}>
                      {numerologyData.lifePath > 0 ? numerologyData.lifePath : '-'}
                    </span>
                    <p className="text-sm font-bold text-zinc-400 mt-2">{lifePathArquetipo.title}</p>
                  </div>
                </div>
                <div className="rounded-3xl p-6 flex flex-col justify-between bg-white/5 border border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4 block">Expression</span>
                  <div>
                    <span className="text-5xl font-black text-white">
                      {numerologyData.expression > 0 ? numerologyData.expression : '-'}
                    </span>
                    <p className="text-sm font-bold text-zinc-400 mt-2">{expressionArquetipo.title}</p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-6 relative z-10 text-center">Calculated for: Lucas Ezequiel Bianchi</p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={hoverPhysics}
              className="rounded-3xl p-8 bg-zinc-900/60 border border-white/5 backdrop-blur-xl relative overflow-hidden group"
            >
              <div className="absolute -top-20 right-10 w-48 h-48 rounded-full blur-[80px] pointer-events-none" style={{ backgroundColor: '#34D39922' }} />
              <div className="flex items-center gap-2 text-emerald-400 mb-2 relative z-10">
                <Map size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Locational Energy</span>
              </div>
              <h3 className="font-serif text-2xl font-medium text-white mb-6 relative z-10">Astrocartography</h3>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative z-10 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Compass size={18} className="text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Auckland, NZ</h4>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Current Location</span>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: '#34D39922', color: '#6EE7B7', border: '1px solid #34D39955' }}>
                    Jupiter Zenith
                  </div>
                </div>
                <div className="h-px w-full bg-white/5" />
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Your current coordinates align with Jupiter, indicating a strong period for professional expansion and learning in this region.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={hoverPhysics}
              className="rounded-3xl p-8 bg-zinc-900/60 border border-white/5 backdrop-blur-xl relative overflow-hidden group"
            >
              <div className="absolute bottom-0 left-0 w-full h-32 pointer-events-none" style={{ background: 'linear-gradient(to top, #FBBF2422, transparent)' }} />
              <div className="flex items-center gap-2 text-amber-400 mb-2 relative z-10">
                <Users size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Relational Dynamics</span>
              </div>
              <h3 className="font-serif text-2xl font-medium text-white mb-6 relative z-10">Synastry</h3>

              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex -space-x-4">
                  <div className="w-14 h-14 rounded-full border-2 border-zinc-950 bg-purple-500/30 flex items-center justify-center backdrop-blur-md">
                    <span className="text-xs font-bold">You</span>
                  </div>
                  <div className="w-14 h-14 rounded-full border-2 border-zinc-950 bg-blue-500/30 flex items-center justify-center backdrop-blur-md">
                    <span className="text-xs font-bold">Son</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block mb-1">Harmony Score</span>
                  <span className="text-2xl font-black text-amber-400">85%</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 relative z-10">
                <h4 className="text-xs font-bold text-white mb-2">Transit Note: Wellington, NZ</h4>
                <p className="text-xs text-zinc-400">His Moon trines your Mercury today. Excellent energy for deep, supportive communication during his transition.</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'shadow' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key="shadow"
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 rounded-3xl p-8 bg-zinc-900/60 border border-rose-500/20 backdrop-blur-xl" style={{ boxShadow: '0 0 30px rgba(244,63,94,0.05)' }}>
                <h3 className="font-serif text-xl font-medium text-white mb-6 flex items-center gap-3">
                  <BookOpen size={20} className="text-rose-400" /> Daily Reflection
                </h3>

                <div className="rounded-2xl p-5 mb-6" style={{ background: '#F43F5E0F', border: '1px solid #F43F5E22' }}>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 block mb-2">Jungian Prompt</span>
                  <p className="text-sm text-zinc-200 italic">"What trait in someone else triggered a strong emotional response in you today? How does that trait exist within yourself?"</p>
                </div>

                <textarea
                  placeholder="Begin exploring your thoughts..."
                  className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-rose-500/50 resize-none transition-all"
                />

                <div className="flex justify-between items-center mt-4">
                  <button className="text-xs font-bold text-zinc-500 hover:text-white transition-colors">Load previous</button>
                  <motion.button
                    whileTap={tapPhysics}
                    whileHover={hoverPhysics}
                    className="bg-rose-500 hover:bg-rose-400 text-black px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                    style={{ boxShadow: '0 0 24px rgba(244,63,94,0.45)' }}
                  >
                    <Send size={14} /> Encrypt & Save
                  </motion.button>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="rounded-3xl p-6 bg-zinc-900/60 border border-white/5 backdrop-blur-xl flex flex-col items-center justify-center text-center h-full">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                    <Star size={24} className="text-zinc-500" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Active Archetype</h4>
                  <span className="text-2xl font-black text-rose-400">The Magician</span>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-3">Detected via recent logs</p>
                </div>

                <div className="rounded-3xl p-6 bg-gradient-to-br from-rose-500/20 to-transparent border border-rose-500/20">
                  <div className="flex items-center gap-2 text-rose-300 mb-2">
                    <Ghost size={14} />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Dissonance</h4>
                  </div>
                  <span className="text-4xl font-black text-white">4.8</span>
                  <p className="text-xs text-zinc-400 mt-2">Self-perception gap is widening. Time to ground.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'habits' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key="habits"
          >
            <HabitsManager userId={userId} />
          </motion.div>
        )}
      </main>

      <UniverseBottomNav
        tabs={[
          { id: 'overview', label: 'Overview',  icon: LayoutDashboard },
          { id: 'identity', label: 'Identity',  icon: Fingerprint },
          { id: 'shadow',   label: 'Shadow',    icon: PenTool },
          { id: 'habits',   label: 'Habits',    icon: Activity },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabType)}
        activeColor={ACCENT_SOFT}
        bgColor="#0A0A0A"
      />
    </div>
  );
}
