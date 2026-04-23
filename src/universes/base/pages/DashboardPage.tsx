import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { Loader2, BrainCircuit, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../../core/components/ThemeToggle';

const TOTAL_SEGMENTS = 8;
const RADIUS = 300;
const INNER_RADIUS = 70;
// Ampliamos el centro y el lienzo para que los textos tengan margen de respiración
const CENTER_X = 600;
const CENTER_Y = 600;

export interface Segment {
  id: string;
  name: string;
  level: number;
  value: number;
  path: string;
}

const initialSegments: Segment[] = [
  { id: 'amor', name: 'Love Life', level: 0, value: 0, path: '/amor' },
  { id: 'dinero', name: 'Economic Situation', level: 0, value: 0, path: '/dinero' },
  { id: 'desarrollopersonal', name: 'Personal Growth', level: 0, value: 0, path: '/desarrollopersonal' },
  { id: 'salud', name: 'Physical Health', level: 0, value: 0, path: '/salud' },
  { id: 'desarrolloprofesional', name: 'Professional Growth', level: 0, value: 0, path: '/desarrolloprofesional' },
  { id: 'social', name: 'Social Life', level: 0, value: 0, path: '/social' },
  { id: 'familia', name: 'Family & Home', level: 0, value: 0, path: '/familia' },
  { id: 'ocio', name: 'Leisure & Time', level: 0, value: 0, path: '/ocio' },
];

const getLevelFromNumber = (num: number): number => {
  return num === 0 ? 0 : Math.ceil(num);
};

// ==========================================
// PALETA OFICIAL DE LA RUEDA (Códigos HEX)
// ==========================================
const SEGMENT_COLORS: Record<string, string> = {
  amor: '#FF0040',
  dinero: '#05DF72',
  desarrollopersonal: '#8B5CF6',
  salud: '#FE7F01',
  desarrolloprofesional: '#FFD700',
  social: '#1447E6',
  familia: '#C81CDE',
  ocio: '#00E5FF'
};

const getLevelStrokePath = (index: number, level: number) => {
  const anglePerSegment = (2 * Math.PI) / TOTAL_SEGMENTS;
  const gap = 0.03;
  const startAngle = index * anglePerSegment - Math.PI / 2 + gap;
  const endAngle = (index + 1) * anglePerSegment - Math.PI / 2 - gap;

  const step = (RADIUS - INNER_RADIUS) / 10;
  const ringRadius = INNER_RADIUS + (level - 0.5) * step;

  const largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1';

  return `
    M ${CENTER_X + ringRadius * Math.cos(startAngle)} ${CENTER_Y + ringRadius * Math.sin(startAngle)}
    A ${ringRadius} ${ringRadius} 0 ${largeArcFlag} 1 ${CENTER_X + ringRadius * Math.cos(endAngle)} ${CENTER_Y + ringRadius * Math.sin(endAngle)}
  `;
};

interface WheelSegmentProps {
  segment: Segment;
  index: number;
  color: string;
  isHovered: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const WheelSegment = ({ segment, index, color, isHovered, onSelect, onMouseEnter, onMouseLeave }: WheelSegmentProps) => {
  const anglePerSegment = (2 * Math.PI) / TOTAL_SEGMENTS;
  const midAngle = index * anglePerSegment - Math.PI / 2 + anglePerSegment / 2;

  const textRadius = RADIUS + 45;
  const textX = CENTER_X + textRadius * Math.cos(midAngle);
  const textY = CENTER_Y + textRadius * Math.sin(midAngle);

  const isRight = Math.cos(midAngle) > 0.1;
  const isLeft = Math.cos(midAngle) < -0.1;
  const anchor = isRight ? 'start' : isLeft ? 'end' : 'middle';

  const invisibleHoverWedge = `
    M ${CENTER_X} ${CENTER_Y}
    L ${CENTER_X + (RADIUS+40) * Math.cos(index * anglePerSegment - Math.PI/2)} ${CENTER_Y + (RADIUS+40) * Math.sin(index * anglePerSegment - Math.PI/2)}
    A ${RADIUS+40} ${RADIUS+40} 0 0 1 ${CENTER_X + (RADIUS+40) * Math.cos((index+1) * anglePerSegment - Math.PI/2)} ${CENTER_Y + (RADIUS+40) * Math.sin((index+1) * anglePerSegment - Math.PI/2)}
    Z
  `;

  const renderWrappedText = (text: string, x: number) => {
    if (text === 'Economic Situation') return <><tspan x={x} dy="-0.6em">ECONOMIC</tspan><tspan x={x} dy="1.2em">SITUATION</tspan></>;
    if (text === 'Personal Growth') return <><tspan x={x} dy="-0.6em">PERSONAL</tspan><tspan x={x} dy="1.2em">GROWTH</tspan></>;
    if (text === 'Physical Health') return <><tspan x={x} dy="-0.6em">PHYSICAL</tspan><tspan x={x} dy="1.2em">HEALTH</tspan></>;
    if (text === 'Professional Growth') return <><tspan x={x} dy="-0.6em">PROFESSIONAL</tspan><tspan x={x} dy="1.2em">GROWTH</tspan></>;
    if (text === 'Social Life') return <><tspan x={x} dy="-0.6em">SOCIAL</tspan><tspan x={x} dy="1.2em">LIFE</tspan></>;
    if (text === 'Family & Home') return <><tspan x={x} dy="-0.6em">FAMILY</tspan><tspan x={x} dy="1.2em">& HOME</tspan></>;
    if (text === 'Leisure & Time') return <><tspan x={x} dy="-0.6em">LEISURE</tspan><tspan x={x} dy="1.2em">& TIME</tspan></>;
    if (text === 'Love Life') return <><tspan x={x} dy="-0.6em">LOVE</tspan><tspan x={x} dy="1.2em">LIFE</tspan></>;
    return <tspan x={x} dy="0">{text}</tspan>;
  };

  return (
    <g
        onClick={onSelect}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="cursor-pointer group"
    >
      <path d={invisibleHoverWedge} fill="transparent" />

      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
        const isFilled = level <= segment.level;

        const depthOpacity = 0.95 - (level * 0.02);
        const activeOpacity = isHovered ? 1 : depthOpacity;
        const inactiveOpacity = isHovered ? 0.10 : 0.04;

        return (
          <path
            key={level}
            d={getLevelStrokePath(index, level)}
            fill="none"
            stroke={color}
            strokeWidth={14}
            strokeLinecap="round"
            opacity={isFilled ? activeOpacity : inactiveOpacity}
            className="transition-all duration-500"
            style={{
              filter: isFilled
                ? `drop-shadow(0 0 ${isHovered ? '14px' : '6px'} ${color}90)`
                : 'none'
            }}
          />
        );
      })}

      <text
        x={textX}
        y={textY}
        className="font-sans font-black uppercase tracking-widest transition-all duration-500 pointer-events-none"
        fontSize="34"
        fill={isHovered ? '#ffffff' : '#52525B'}
        textAnchor={anchor}
        dominantBaseline="middle"
        opacity={isHovered ? 1 : 0.5}
        style={{
          filter: isHovered ? `drop-shadow(0 0 12px ${color}80)` : 'none',
        }}
      >
        {renderWrappedText(segment.name, textX)}
      </text>
    </g>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userWheel, setUserWheel] = useState<Segment[]>(initialSegments);
  const [hoveredSegment, setHoveredSegment] = useState<Segment | null>(null);
  const [userName, setUserName] = useState<string>('');

  const fetchWheelData = async () => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) { navigate('/login'); return; }

      const fullName: string = authData.user.user_metadata?.full_name ?? '';
      setUserName(fullName.split(' ')[0]);

      const { data, error } = await supabase
        .from('UserWheel')
        .select('*')
        .eq('user_id', authData.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const lastWheel = data[0];
        const updatedWheel = initialSegments.map(seg => {
          const rawNum = lastWheel[seg.id] || 0;
          return { ...seg, value: rawNum, level: getLevelFromNumber(rawNum) };
        });
        setUserWheel(updatedWheel);
      } else {
         await supabase.from('UserWheel').insert([{ user_id: authData.user.id }]);
      }
    } catch (error) {
      console.error(error);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWheelData(); }, [navigate]);

  const handleLocalChange = (segmentId: string, newValue: number) => {
    setUserWheel(prev => prev.map(s =>
      s.id === segmentId ? { ...s, value: newValue, level: getLevelFromNumber(newValue) } : s
    ));
  };

  const handleSaveToDB = async (segmentId: string, newValue: number) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) return;

      const { error: wheelError } = await supabase
        .from('UserWheel')
        .update({ [segmentId]: newValue })
        .eq('user_id', authData.user.id);

      if (wheelError) throw wheelError;

      const { error: realityError } = await supabase
        .from('User_Reality_Check')
        .insert([{
          user_id: authData.user.id,
          universe_id: segmentId,
          perceived_score: newValue,
          status: 'pending'
        }]);

      if (realityError) {
        console.error("Error saving reality check:", realityError);
      }
    } catch (error) {
      console.error("Error saving wheel value", error);
    }
  };

  // Aether Score: promedio de todos los segmentos
  const aetherScore = userWheel.length > 0
    ? Math.round(userWheel.reduce((sum, s) => sum + s.value, 0) / userWheel.length * 10) / 10
    : 0;

  const accentColor = hoveredSegment ? SEGMENT_COLORS[hoveredSegment.id] : '#FFFFFF';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <Loader2 className="w-10 h-10 animate-spin text-white/70" />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-white relative overflow-x-hidden flex flex-col bg-[#0A0A0A] selection:bg-white/20 selection:text-white">

      <ThemeToggle variant="floating" />

      {/* ── GLOWS DE FONDO REACTIVOS ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[160px] transition-all duration-700 opacity-25"
        style={{ background: accentColor }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -bottom-60 -right-40 w-[700px] h-[700px] rounded-full blur-[180px] transition-all duration-700 opacity-15"
        style={{ background: accentColor }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* ── HEADER ─────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full relative z-30"
      >
        <div className="w-full max-w-7xl mx-auto px-4 md:px-10 pt-4 md:pt-6 pb-2">
          <div className="flex justify-between items-center w-full py-3 px-5 md:px-7 rounded-full bg-zinc-900/60 backdrop-blur-xl border border-white/5">

            <h1 className="font-serif text-xl md:text-2xl font-medium tracking-tight text-white">
              Aether OS
            </h1>

            <div className="flex items-center gap-3">
              {userName && (
                <span className="hidden sm:block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                  Good morning, <span className="text-zinc-300">{userName}</span>
                </span>
              )}

              <motion.button
                onClick={() => navigate('/diagnostics')}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96, filter: 'brightness(1.1)' }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.18em] bg-white/5 backdrop-blur-sm border border-white/10 text-white hover:bg-white/10 transition-colors"
              >
                <BrainCircuit size={14} />
                <span className="hidden sm:inline">AI Diagnostics</span>
                <span className="sm:hidden">AI Diag</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ── MAIN ────────────────────────────────────────── */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-0 lg:gap-16 px-4 md:px-10 pt-0 pb-6 md:py-8 relative z-10"
      >
        {/* WHEEL SECTION */}
        <motion.div
          variants={itemVariants}
          className="flex-1 w-full flex flex-col items-center justify-center relative min-h-[40vh] lg:min-h-[50vh]"
        >
          <p
            className="text-[10px] font-black uppercase tracking-[0.24em] mb-1 mt-3 lg:mt-0 transition-colors duration-500"
            style={{ color: hoveredSegment ? accentColor : '#71717A' }}
          >
            {hoveredSegment ? hoveredSegment.name : 'Wheel of Life'}
          </p>

          <div className="relative w-full max-w-[620px] flex items-center justify-center mx-auto">
            <svg viewBox="0 0 1200 1200" className="w-full h-auto overflow-visible">
              {userWheel.map((segment, index) => (
                <WheelSegment
                  key={segment.id}
                  segment={segment}
                  index={index}
                  color={SEGMENT_COLORS[segment.id]}
                  isHovered={hoveredSegment?.id === segment.id}
                  onSelect={() => { navigate(segment.path); }}
                  onMouseEnter={() => setHoveredSegment(segment)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              ))}
              {/* Inner circle (dark) */}
              <defs>
                <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1C1C1E" stopOpacity="1" />
                  <stop offset="100%" stopColor="#0A0A0A" stopOpacity="1" />
                </radialGradient>
              </defs>
              <circle cx={CENTER_X} cy={CENTER_Y} r={INNER_RADIUS - 6} fill="url(#centerGradient)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text
                x={CENTER_X}
                y={CENTER_Y - 10}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="56"
                fontWeight="800"
                fill="#ffffff"
                className="font-sans"
                style={{ letterSpacing: '-0.04em' }}
              >
                {aetherScore}
              </text>
              <text
                x={CENTER_X}
                y={CENTER_Y + 32}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="11"
                fontWeight="900"
                fill="#A1A1AA"
                letterSpacing="4"
                className="font-sans uppercase"
              >
                AETHER SCORE
              </text>
            </svg>
          </div>
        </motion.div>

        {/* SIDEBAR — FREQUENCY TUNING */}
        <motion.aside
          variants={itemVariants}
          className="w-full max-w-[420px] bg-zinc-900/70 backdrop-blur-xl rounded-[32px] p-6 lg:p-7 border border-white/5 flex flex-col gap-5 relative z-20 -mt-6 lg:mt-0 overflow-hidden"
        >
          {/* AI Insight strip arriba del Frequency Tuning */}
          <div className="relative flex items-start gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            <span
              className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0 transition-colors duration-500"
              style={{
                background: `${accentColor}1A`,
                border: `1px solid ${accentColor}40`,
              }}
            >
              <Sparkles size={14} style={{ color: accentColor }} />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] uppercase font-black tracking-[0.22em] text-zinc-500 mb-1">
                Aether AI · Veredicto
              </p>
              <p className="text-xs font-medium text-white/85 leading-relaxed">
                {hoveredSegment
                  ? `Tu universo "${hoveredSegment.name}" marca ${hoveredSegment.value}/10. Calibrá esta frecuencia para ver el impacto.`
                  : `Tu Aether Score es ${aetherScore}. Mové las frecuencias para sintonizar tu balance vital.`}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start text-left">
            <p
              className="text-[10px] font-black tracking-[0.22em] uppercase mb-1.5 transition-colors duration-500"
              style={{ color: hoveredSegment ? accentColor : '#71717A' }}
            >
              {hoveredSegment ? `Tuning: ${hoveredSegment.name}` : 'Calibrate Your Life Balance'}
            </p>
            <h2 className="font-serif text-2xl lg:text-[28px] text-white font-medium tracking-tight">
              Frequency Tuning
            </h2>
          </div>

          <div className="flex flex-col gap-3.5 lg:gap-4">
            {userWheel.map((seg) => {
              const segColor = SEGMENT_COLORS[seg.id];
              const dim = hoveredSegment && hoveredSegment.id !== seg.id;
              return (
                <motion.div
                  key={seg.id}
                  className="flex flex-col gap-2 transition-opacity duration-300"
                  style={{ opacity: dim ? 0.25 : 1 }}
                  onMouseEnter={() => setHoveredSegment(seg)}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                  <div className="flex justify-between items-center">
                    <label
                      className="text-[10px] font-black uppercase tracking-[0.22em]"
                      style={{ color: segColor }}
                    >
                      {seg.name}
                    </label>
                    <span
                      className="text-[11px] font-black tabular-nums px-2.5 py-0.5 rounded-md text-white"
                      style={{
                        background: `${segColor}20`,
                        border: `1px solid ${segColor}40`,
                      }}
                    >
                      {seg.value}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={seg.value}
                    onChange={(e) => handleLocalChange(seg.id, Number(e.target.value))}
                    onMouseUp={(e) => handleSaveToDB(seg.id, Number((e.target as HTMLInputElement).value))}
                    onTouchEnd={(e) => handleSaveToDB(seg.id, Number((e.target as HTMLInputElement).value))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer transition-all hover:h-2"
                    style={{ accentColor: segColor }}
                  />
                </motion.div>
              );
            })}
          </div>
        </motion.aside>

      </motion.main>
    </div>
  );
}
