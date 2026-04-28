import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import {
  Sparkles, Moon, Hash, Ghost, LayoutDashboard,
  Fingerprint, Activity, PenTool, Sun, Star, BookOpen, Send,
  ArrowLeft, Loader2, Edit3, Sunrise,
} from 'lucide-react';

import { calculateNatalChart, getSunSign, getMoonPhase } from '../lib/astrologyEngine';
import type { NatalChartData } from '../lib/astrologyEngine';
import { fetchDailyHoroscope, type DailyHoroscope, type Zodiac } from '../lib/dailyHoroscope';
import {
  calculateLifePathNumber, calculateExpressionNumber, NUMBER_MEANINGS,
} from '../lib/numerologyEngine';

import { useDesarrolloPersonalData } from '../hooks/useDesarrolloPersonalData';
import { HabitsMiniApp } from '../components/ui/HabitsMiniApp';
import { HabitsManager } from '../components/ui/HabitsManager';
import BirthDataOnboarding from '../components/ui/BirthDataOnboarding';
import AuraLayout from '../../../components/layout/AuraLayout';
import { useAuth } from '../../../core/contexts/AuthContext';

type TabType = 'overview' | 'identity' | 'shadow' | 'habits';

const ACCENT      = '#6B8FC4'; // Dusty blue — Soft Cosmos desaturated palette
const ACCENT_SOFT = '#94B1D8';

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

const SIGN_TO_KEY: Record<string, Zodiac> = {
  Aries: 'aries', Taurus: 'taurus', Gemini: 'gemini', Cancer: 'cancer',
  Leo: 'leo', Virgo: 'virgo', Libra: 'libra', Scorpio: 'scorpio',
  Sagittarius: 'sagittarius', Capricorn: 'capricorn', Aquarius: 'aquarius', Pisces: 'pisces',
};

export default function DesarrolloPersonalDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  const { birthData, loading: birthLoading } = useDesarrolloPersonalData();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // ── Derived: numerology ────────────────────────────────────────────────
  const numerology = useMemo(() => {
    if (!birthData?.birth_date || !birthData?.full_name) {
      return { lifePath: 0, expression: 0 };
    }
    return {
      lifePath:   calculateLifePathNumber(birthData.birth_date),
      expression: calculateExpressionNumber(birthData.full_name),
    };
  }, [birthData?.birth_date, birthData?.full_name]);

  const lifePathArchetype   = NUMBER_MEANINGS[numerology.lifePath]   || { title: '—', description: '' };
  const expressionArchetype = NUMBER_MEANINGS[numerology.expression] || { title: '—', description: '' };

  // ── Derived: natal chart ───────────────────────────────────────────────
  const [chartData, setChartData] = useState<NatalChartData | null>(null);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    if (!birthData?.birth_date) { setChartData(null); return; }
    let cancelled = false;
    setChartLoading(true);

    const d = new Date(birthData.birth_date);
    const day   = d.getDate();
    const month = d.getMonth() + 1;
    const year  = d.getFullYear();

    // Use birth time if present, else solar noon as neutral default
    const [hh, mm] = (birthData.birth_time ?? '12:00').split(':').map(Number);

    // Without a coords-from-city resolver we default to equator 0,0 UTC. The
    // Ascendant won't be precise without real coords, but Sun/Moon/planets
    // remain accurate. Flag this in the UI.
    const lat = birthData.birth_latitude ?? 0;
    const lon = birthData.birth_longitude ?? 0;

    calculateNatalChart(day, month, year, hh || 12, mm || 0, lat, lon, 0)
      .then(data => { if (!cancelled) setChartData(data); })
      .finally(() => { if (!cancelled) setChartLoading(false); });

    return () => { cancelled = true; };
  }, [birthData?.birth_date, birthData?.birth_time, birthData?.birth_latitude, birthData?.birth_longitude]);

  // ── Derived: daily horoscope ───────────────────────────────────────────
  const [horoscope, setHoroscope] = useState<DailyHoroscope | null>(null);
  const [horoscopeLoading, setHoroscopeLoading] = useState(false);

  useEffect(() => {
    if (!birthData?.birth_date) { setHoroscope(null); return; }
    let cancelled = false;
    setHoroscopeLoading(true);
    const sign = getSunSign(birthData.birth_date);
    const key = SIGN_TO_KEY[sign];
    if (!key) { setHoroscopeLoading(false); return; }
    fetchDailyHoroscope(key)
      .then(h => { if (!cancelled) setHoroscope(h); })
      .finally(() => { if (!cancelled) setHoroscopeLoading(false); });
    return () => { cancelled = true; };
  }, [birthData?.birth_date]);

  // ── Open onboarding automatically when no birth data ───────────────────
  useEffect(() => {
    if (!birthLoading && !birthData && userId) {
      setOnboardingOpen(true);
    }
  }, [birthLoading, birthData, userId]);

  const moonPhase = useMemo(() => getMoonPhase(new Date()), []);
  const sunSign   = birthData?.birth_date ? getSunSign(birthData.birth_date) : null;

  const tabTitle: Record<TabType, string> = {
    overview: 'Daily Habits',
    identity: 'Identity Matrix',
    shadow:   'Shadow Work',
    habits:   'Habits Lab',
  };
  const tabSubtitle: Record<TabType, string> = {
    overview: 'Track your daily rituals and momentum',
    identity: 'Your astrological & numerological blueprint',
    shadow:   'Daily reflection and journaling',
    habits:   'Manage and analyze your habit system',
  };

  const aiInsight = useMemo(() => {
    if (!birthData) return 'Complete your blueprint to unlock your numerology, natal chart and daily horoscope.';
    if (chartLoading) return 'Calculating your astrological blueprint…';
    if (numerology.lifePath > 0) {
      return `Your Life Path ${numerology.lifePath} — "${lifePathArchetype.title}" — is the archetype guiding you today.`;
    }
    return 'Conscious expansion: explore identity, shadow and habits.';
  }, [birthData, chartLoading, numerology.lifePath, lifePathArchetype.title]);

  const tabs = [
    { id: 'overview', label: 'Overview',  icon: <LayoutDashboard /> },
    { id: 'identity', label: 'Identity',  icon: <Fingerprint /> },
    { id: 'shadow',   label: 'Shadow',    icon: <PenTool /> },
    { id: 'habits',   label: 'Habits',    icon: <Activity /> },
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      {birthData && (
        <motion.button
          onClick={() => setOnboardingOpen(true)}
          whileHover={hoverPhysics}
          whileTap={tapPhysics}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full font-black text-[11px] uppercase tracking-wider text-white"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Edit3 size={13} strokeWidth={3} /> Edit blueprint
        </motion.button>
      )}
    </div>
  );

  return (
    <AuraLayout
      title={tabTitle[activeTab]}
      subtitle={tabSubtitle[activeTab]}
      accentColor={ACCENT}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as TabType)}
      headerActions={headerActions}
    >
      <div className="flex flex-col gap-8 pb-10">

          <motion.div
            variants={itemVariants}
            className="rounded-3xl p-5 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${ACCENT}18, rgba(255,255,255,0.02))`, border: `1px solid ${ACCENT}33` }}
          >
            <div className="flex items-start gap-3 relative z-10">
              <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${ACCENT}22` }}>
                <Sparkles size={16} style={{ color: ACCENT }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: ACCENT_SOFT }}>Aether Insight</p>
                <p className="text-sm text-zinc-200 leading-relaxed">{aiInsight}</p>
                {!birthData && !birthLoading && (
                  <button
                    onClick={() => setOnboardingOpen(true)}
                    className="mt-3 px-4 h-9 rounded-full text-[12px] font-bold active:scale-95 transition-transform"
                    style={{ background: ACCENT, color: '#000', boxShadow: `0 4px 14px ${ACCENT}45` }}
                  >
                    Set up your blueprint
                  </button>
                )}
              </div>
            </div>
          </motion.div>


        {/* ── OVERVIEW ────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" key="overview" className="flex flex-col gap-6">
            <motion.div variants={itemVariants}>
              <HabitsMiniApp userId={userId} accent={ACCENT} />
            </motion.div>

            {/* Quick identity glance when blueprint exists */}
            {birthData && (
              <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <QuickStat label="Sun Sign"    value={sunSign ?? '—'}            icon={Sun}    accent={ACCENT} />
                <QuickStat label="Life Path"   value={String(numerology.lifePath || '—')} icon={Hash}  accent={ACCENT} sublabel={lifePathArchetype.title} />
                <QuickStat label="Expression" value={String(numerology.expression || '—')} icon={Star} accent={ACCENT} sublabel={expressionArchetype.title} />
                <QuickStat label="Moon"       value={moonPhase.phase}            icon={Moon}   accent={ACCENT} sublabel={`${moonPhase.illumination}% lit`} />
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── IDENTITY ────────────────────────────────────────────────── */}
        {activeTab === 'identity' && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" key="identity" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {!birthData ? (
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <EmptyBlueprint accent={ACCENT} onSetup={() => setOnboardingOpen(true)} />
              </motion.div>
            ) : (
              <>
                {/* Natal Chart card */}
                <motion.div variants={itemVariants} whileHover={hoverPhysics} className="rounded-3xl p-6 md:p-8 bg-zinc-900/60 border border-white/5 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: `${ACCENT}33` }} />
                  <div className="flex items-center gap-2 mb-2 relative z-10" style={{ color: ACCENT }}>
                    <Moon size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Natal Chart</span>
                  </div>
                  <h3 className="font-serif text-2xl font-medium text-white mb-6 relative z-10">Astrological Blueprint</h3>

                  <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                    <div className="w-36 h-36 rounded-full flex items-center justify-center relative p-2 shrink-0" style={{ border: `1px solid ${ACCENT}55`, boxShadow: `0 0 30px ${ACCENT}33` }}>
                      <div className="w-full h-full rounded-full border border-dashed animate-[spin_60s_linear_infinite] flex items-center justify-center" style={{ borderColor: `${ACCENT}66` }}>
                        <div className="w-3/4 h-3/4 rounded-full flex items-center justify-center" style={{ border: `1px solid ${ACCENT}40` }}>
                          <Sun size={24} style={{ color: ACCENT_SOFT }} />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 w-full space-y-2.5">
                      {chartLoading || !chartData ? (
                        <div className="flex justify-center items-center h-full py-10">
                          <Loader2 className="w-6 h-6 animate-spin" style={{ color: ACCENT }} />
                        </div>
                      ) : (
                        [
                          { label: 'Sun',       sign: chartData.sun.sign,       deg: chartData.sun.degree },
                          { label: 'Moon',      sign: chartData.moon.sign,      deg: chartData.moon.degree },
                          { label: 'Ascendant', sign: chartData.ascendant.sign, deg: chartData.ascendant.degree },
                        ].map(row => (
                          <div key={row.label} className="bg-white/5 rounded-2xl p-3 flex justify-between items-center border border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{row.label}</span>
                            <span className="text-sm font-bold text-white">
                              {row.sign}
                              <span className="ml-2" style={{ color: ACCENT_SOFT }}>{row.deg.toFixed(1)}°</span>
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  {!birthData.birth_latitude && (
                    <p className="text-[10px] text-zinc-500 mt-4 relative z-10 italic">
                      Note: Ascendant accuracy requires birth coordinates. Add them in your blueprint for precise values.
                    </p>
                  )}
                </motion.div>

                {/* Numerology */}
                <motion.div variants={itemVariants} whileHover={hoverPhysics} className="rounded-3xl p-6 md:p-8 bg-zinc-900/60 border border-white/5 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: `${ACCENT}22` }} />
                  <div className="flex items-center gap-2 mb-2 relative z-10" style={{ color: ACCENT }}>
                    <Hash size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Pythagorean Matrix</span>
                  </div>
                  <h3 className="font-serif text-2xl font-medium text-white mb-6 relative z-10">Numerology</h3>

                  <div className="grid grid-cols-2 gap-3 relative z-10">
                    <NumerologyCard
                      label="Life Path"
                      value={numerology.lifePath}
                      title={lifePathArchetype.title}
                      accent={ACCENT}
                      primary
                    />
                    <NumerologyCard
                      label="Expression"
                      value={numerology.expression}
                      title={expressionArchetype.title}
                      accent={ACCENT}
                    />
                  </div>

                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-6 relative z-10 text-center">
                    Calculated for: {birthData.full_name}
                  </p>

                  {lifePathArchetype.description && (
                    <div className="mt-5 p-4 rounded-2xl bg-white/5 border border-white/5 relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] mb-2" style={{ color: ACCENT_SOFT }}>
                        Archetype · Life Path {numerology.lifePath}
                      </p>
                      <p className="text-[13px] text-zinc-300 leading-relaxed">{lifePathArchetype.description}</p>
                    </div>
                  )}
                </motion.div>

                {/* Daily Horoscope */}
                <motion.div variants={itemVariants} whileHover={hoverPhysics} className="rounded-3xl p-6 md:p-8 bg-zinc-900/60 border border-white/5 backdrop-blur-xl relative overflow-hidden lg:col-span-2">
                  <div className="absolute -top-20 right-10 w-48 h-48 rounded-full blur-[80px] pointer-events-none" style={{ backgroundColor: `${ACCENT}22` }} />
                  <div className="flex items-center gap-2 mb-2 relative z-10" style={{ color: ACCENT }}>
                    <Sunrise size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Today's Horoscope · {sunSign}</span>
                  </div>
                  <h3 className="font-serif text-2xl font-medium text-white mb-5 relative z-10">Daily reading</h3>

                  <div className="relative z-10">
                    {horoscopeLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" style={{ color: ACCENT }} />
                      </div>
                    ) : horoscope ? (
                      <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[14px] text-zinc-200 leading-relaxed">{horoscope.horoscope}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mt-4">
                          Source: {horoscope.source} · {horoscope.date}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[13px] text-zinc-500">
                        Horoscope service is unreachable right now. Try again later.
                      </p>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>
        )}

        {/* ── SHADOW ──────────────────────────────────────────────────── */}
        {activeTab === 'shadow' && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" key="shadow" className="max-w-4xl mx-auto">
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 rounded-3xl p-6 md:p-8 bg-zinc-900/60 border border-rose-500/20 backdrop-blur-xl" style={{ boxShadow: '0 0 30px rgba(244,63,94,0.05)' }}>
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
                  <span className="text-[11px] text-zinc-600">Journaling persistence coming soon.</span>
                  <motion.button
                    whileTap={tapPhysics} whileHover={hoverPhysics}
                    className="bg-rose-500 hover:bg-rose-400 text-black px-5 h-10 rounded-full font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 opacity-60"
                    style={{ boxShadow: '0 0 24px rgba(244,63,94,0.45)' }}
                    disabled
                  >
                    <Send size={14} /> Save
                  </motion.button>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <div className="rounded-3xl p-6 bg-zinc-900/60 border border-white/5 backdrop-blur-xl flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mb-3 border border-white/10">
                    <Star size={22} className="text-zinc-500" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Active Archetype</h4>
                  <span className="text-2xl font-black text-rose-400">The Magician</span>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-3">Heuristic · based on recent activity</p>
                </div>

                <div className="rounded-3xl p-5 bg-gradient-to-br from-rose-500/20 to-transparent border border-rose-500/20">
                  <div className="flex items-center gap-2 text-rose-300 mb-2">
                    <Ghost size={14} />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Dissonance</h4>
                  </div>
                  <span className="text-3xl font-black text-white">—</span>
                  <p className="text-xs text-zinc-500 mt-2">Requires more journal entries to calculate.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── HABITS ──────────────────────────────────────────────────── */}
        {activeTab === 'habits' && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" key="habits">
            <HabitsManager userId={userId} accent={ACCENT} />
          </motion.div>
        )}
      </div>

      {/* Birth data onboarding */}
      <BirthDataOnboarding
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        accent={ACCENT}
        existing={birthData}
      />
    </AuraLayout>
  );
}

// ── UI atoms ─────────────────────────────────────────────────────────────────

function QuickStat({ label, value, icon: Icon, accent, sublabel }: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent: string;
  sublabel?: string;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'rgba(10,12,16,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} style={{ color: accent }} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: `${accent}AA` }}>{label}</span>
      </div>
      <span className="text-xl md:text-2xl font-black text-white leading-none block tabular-nums">{value}</span>
      {sublabel && <p className="text-[11px] font-semibold text-zinc-500 mt-2 truncate">{sublabel}</p>}
    </div>
  );
}

function NumerologyCard({ label, value, title, accent, primary }: {
  label: string;
  value: number;
  title: string;
  accent: string;
  primary?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col justify-between min-h-[140px]"
      style={primary
        ? { background: `${accent}12`, border: `1px solid ${accent}40` }
        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }
      }
    >
      <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 block" style={{ color: primary ? accent : '#71717a' }}>
        {label}
      </span>
      <div>
        <span
          className="text-5xl font-black text-white block"
          style={primary ? { filter: `drop-shadow(0 0 15px ${accent}88)` } : undefined}
        >
          {value > 0 ? value : '—'}
        </span>
        <p className="text-[13px] font-bold text-zinc-400 mt-2 leading-tight">{title}</p>
      </div>
    </div>
  );
}

function EmptyBlueprint({ accent, onSetup }: { accent: string; onSetup: () => void }) {
  return (
    <div
      className="rounded-3xl p-8 md:p-12 text-center"
      style={{ background: `linear-gradient(135deg, ${accent}10 0%, rgba(255,255,255,0.02) 60%)`, border: `1px dashed ${accent}50` }}
    >
      <div
        className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
        style={{ background: `${accent}18`, border: `1px solid ${accent}40` }}
      >
        <Fingerprint size={26} style={{ color: accent }} />
      </div>
      <h3 className="font-serif text-2xl md:text-3xl text-white tracking-tight">Your blueprint is empty</h3>
      <p className="text-[13px] text-zinc-400 mt-3 max-w-md mx-auto leading-relaxed">
        To compute your numerology, natal chart and daily horoscope we need your full birth name, date of birth, and optionally time + city for precision.
      </p>
      <button
        onClick={onSetup}
        className="mt-6 px-6 h-11 rounded-full font-bold text-[13px] active:scale-95 transition-transform inline-flex items-center gap-2"
        style={{ background: accent, color: '#000', boxShadow: `0 6px 20px ${accent}45` }}
      >
        <Sparkles size={14} />
        Set up your blueprint
      </button>
    </div>
  );
}
