import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { Loader2, BrainCircuit, Sliders } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../../core/components/ThemeToggle';
import LifeWheel, { type WheelSegment } from '../components/LifeWheel';
import FrequencyTuningSheet from '../components/FrequencyTuningSheet';

// ── Warm palette ─────────────────────────────────────────────────────────────
// Background + text tokens tuned to feel warm and inviting (not clinical).
const BG        = '#1B1714';
const BG_CARD   = '#221D19';
const TEXT_MAIN = '#F5EFE6';
const TEXT_MUTED = '#A8A096';
const BORDER    = 'rgba(232,221,204,0.08)';

// Universe colors — kept identifiable but ~20% less saturated than before so
// they feel premium rather than neon. The dashboard is where these live; each
// universe page keeps its own full-saturation identity internally.
const SEGMENT_COLORS: Record<string, string> = {
  amor:                 '#E05A7A', // dusty rose
  dinero:               '#7EC28A', // sage green
  desarrollopersonal:   '#6B8FC4', // dusty blue
  salud:                '#D97A3A', // warm terracotta
  desarrolloprofesional:'#D9B25E', // amber gold
  social:               '#9F87C9', // muted lavender
  familia:              '#C090BC', // dusty plum
  ocio:                 '#D97265', // coral clay
};

interface DashSegment extends WheelSegment {
  path: string;
}

const INITIAL: DashSegment[] = [
  { id: 'amor',                  name: 'Love Life',            value: 0, color: SEGMENT_COLORS.amor,                  path: '/amor' },
  { id: 'dinero',                name: 'Economic Situation',   value: 0, color: SEGMENT_COLORS.dinero,                path: '/dinero' },
  { id: 'desarrollopersonal',    name: 'Personal Growth',      value: 0, color: SEGMENT_COLORS.desarrollopersonal,    path: '/desarrollopersonal' },
  { id: 'salud',                 name: 'Physical Health',      value: 0, color: SEGMENT_COLORS.salud,                 path: '/salud' },
  { id: 'desarrolloprofesional', name: 'Professional Growth',  value: 0, color: SEGMENT_COLORS.desarrolloprofesional, path: '/desarrolloprofesional' },
  { id: 'social',                name: 'Social Life',          value: 0, color: SEGMENT_COLORS.social,                path: '/social' },
  { id: 'familia',               name: 'Family & Home',        value: 0, color: SEGMENT_COLORS.familia,               path: '/familia' },
  { id: 'ocio',                  name: 'Leisure & Time',       value: 0, color: SEGMENT_COLORS.ocio,                  path: '/ocio' },
];

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState<DashSegment[]>(INITIAL);
  const [userName, setUserName] = useState<string>('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tuneOpen, setTuneOpen] = useState(false);

  // ── Load from Supabase ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData?.user) { navigate('/login'); return; }

        const fullName: string = authData.user.user_metadata?.full_name ?? '';
        setUserName(fullName.split(' ')[0]);

        const { data: wheelRows } = await supabase
          .from('UserWheel').select('*').eq('user_id', authData.user.id)
          .order('created_at', { ascending: false }).limit(1);

        if (wheelRows && wheelRows.length > 0) {
          const row = wheelRows[0];
          setSegments(prev => prev.map(s => ({ ...s, value: Number(row[s.id] ?? 0) })));
        } else {
          await supabase.from('UserWheel').insert([{ user_id: authData.user.id }]);
        }
      } catch (err) {
        console.error('[Dashboard] load error', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  // ── Local slider drag (instant feedback) ─────────────────────────────
  const handleLocalChange = (id: string, value: number) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, value } : s));
  };

  // ── Commit to DB on slider release ────────────────────────────────────
  const handleCommit = async (id: string, value: number) => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      await supabase.from('UserWheel').update({ [id]: value }).eq('user_id', authData.user.id);
      await supabase.from('User_Reality_Check').insert([{
        user_id: authData.user.id,
        universe_id: id,
        perceived_score: value,
        status: 'pending',
      }]);
    } catch (err) {
      console.error('[Dashboard] save error', err);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────
  const aetherScore = useMemo(() => {
    if (segments.length === 0) return 0;
    const sum = segments.reduce((s, x) => s + x.value, 0);
    return Math.round((sum / segments.length) * 10) / 10;
  }, [segments]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 6)  return 'Good night';
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: TEXT_MUTED }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans relative overflow-x-hidden flex flex-col"
      style={{ background: BG, color: TEXT_MAIN }}
    >
      <ThemeToggle variant="floating" />

      {/* Soft warm ambient — one subtle glow, no more */}
      <div
        aria-hidden
        className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-[160px] opacity-30"
        style={{ background: 'radial-gradient(circle, #3A2F26 0%, transparent 65%)' }}
      />

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full relative z-30"
      >
        <div className="w-full max-w-5xl mx-auto px-4 md:px-8 pt-4 md:pt-6 pb-2">
          <div
            className="flex justify-between items-center w-full py-3 px-5 md:px-6 rounded-full"
            style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="font-serif text-xl md:text-2xl font-medium tracking-tight truncate" style={{ color: TEXT_MAIN }}>
                Aether OS
              </h1>
              {userName && (
                <span className="hidden sm:block text-[11px] font-semibold" style={{ color: TEXT_MUTED }}>
                  · {greeting}, {userName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setTuneOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-bold tracking-wide active:scale-95 transition-transform"
                style={{ background: 'rgba(245,239,230,0.06)', border: `1px solid ${BORDER}`, color: TEXT_MAIN }}
                aria-label="Tune frequencies"
              >
                <Sliders size={13} />
                <span className="hidden sm:inline">Tune</span>
              </button>
              <button
                onClick={() => navigate('/diagnostics')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-bold tracking-wide active:scale-95 transition-transform"
                style={{ background: 'rgba(245,239,230,0.06)', border: `1px solid ${BORDER}`, color: TEXT_MAIN }}
              >
                <BrainCircuit size={13} />
                <span className="hidden sm:inline">AI Diagnostics</span>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ── MAIN WHEEL ─────────────────────────────────────────────────── */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex-1 w-full max-w-3xl mx-auto flex flex-col items-center justify-center px-4 md:px-8 pt-2 pb-6 md:py-8 relative z-10"
      >
        {/* Subtle eyebrow */}
        <p className="text-[10px] font-black tracking-[0.24em] uppercase mb-1 transition-colors duration-300" style={{ color: hoveredId ? segments.find(s => s.id === hoveredId)?.color : TEXT_MUTED }}>
          {hoveredId ? segments.find(s => s.id === hoveredId)?.name ?? 'Wheel of Life' : 'Wheel of Life'}
        </p>
        <p className="text-[12px] mb-2" style={{ color: TEXT_MUTED }}>
          Tap a universe to enter it
        </p>

        <div className="w-full max-w-[560px]">
          <LifeWheel
            segments={segments}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onSelectSegment={(s) => {
              const target = segments.find(x => x.id === s.id);
              // viewTransition triggers document.startViewTransition under the
              // hood, morphing the tapped segment into the universe hero glow.
              if (target?.path) navigate(target.path, { viewTransition: true });
            }}
            centerValue={aetherScore}
            centerLabel="BALANCE"
          />
        </div>
      </motion.main>

      {/* ── Tune sheet (opens only when the user asks) ──────────────────── */}
      <FrequencyTuningSheet
        open={tuneOpen}
        onClose={() => setTuneOpen(false)}
        segments={segments}
        onChange={handleLocalChange}
        onCommit={handleCommit}
      />
    </div>
  );
}
