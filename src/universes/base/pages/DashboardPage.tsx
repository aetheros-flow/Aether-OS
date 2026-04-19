import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Loader2, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

  // Acercamos un poco el texto a la rueda y bajamos la fuente para evitar desbordes en móvil
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

        // Efecto Premium: Profundidad dinámica en la opacidad
        const depthOpacity = 0.95 - (level * 0.02);
        const activeOpacity = isHovered ? 1 : depthOpacity;
        const inactiveOpacity = isHovered ? 0.08 : 0.03;

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
                ? `drop-shadow(0 0 ${isHovered ? '10px' : '4px'} ${color}60)`
                : 'none'
            }}
          />
        );
      })}

      <text
        x={textX}
        y={textY}
        className="font-sans font-bold uppercase tracking-widest transition-all duration-500 pointer-events-none"
        fontSize="34"
        fill={isHovered ? "#ffffff" : "#6B7280"}
        textAnchor={anchor}
        dominantBaseline="middle"
        opacity={isHovered ? 1 : 0.35}
      >
        {renderWrappedText(segment.name, textX)}
      </text>
    </g>
  );
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0118]">
        <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-white relative overflow-x-hidden flex flex-col bg-[#0d0118] selection:bg-purple-500 selection:text-white">

      {/* ── HEADER ─────────────────────────────────────── */}
      <header className="w-full relative z-30">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-10 pt-4 md:pt-6 pb-2">
          <div className="flex justify-between items-center w-full py-3 px-5 md:px-8 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">

            {/* Logo */}
            <h1 className="font-serif text-xl md:text-2xl font-medium tracking-tight text-white">
              Aether OS
            </h1>

            <div className="flex items-center gap-3">
              {/* Saludo — menor prominencia */}
              {userName && (
                <span className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                  Good morning, {userName}
                </span>
              )}

              {/* AI Diagnostics — glassmorphism */}
              <button
                onClick={() => navigate('/diagnostics')}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-extrabold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/15"
              >
                <BrainCircuit size={15} />
                <span className="hidden sm:inline">AI Diagnostics</span>
                <span className="sm:hidden">AI Diag</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN ────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-0 lg:gap-20 px-4 md:px-10 pt-0 pb-4 md:py-8 relative z-10">

        {/* WHEEL SECTION */}
        <div className="flex-1 w-full flex flex-col items-center justify-center relative min-h-[40vh] lg:min-h-[50vh]">

          {/* Eyebrow label */}
          <p className="aether-eyebrow-light mb-1 mt-3 lg:mt-0">
            {hoveredSegment ? hoveredSegment.name : 'Wheel of Life'}
          </p>

          {/* SVG Wheel */}
          <div className="relative w-full max-w-[620px] flex items-center justify-center mx-auto">
            <svg viewBox="0 0 1200 1200" className="w-full h-auto drop-shadow-2xl overflow-visible">
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
              <circle cx={CENTER_X} cy={CENTER_Y} r={INNER_RADIUS - 10} fill="#0d0118" opacity={0.9} />
              {/* Aether Score text in center */}
              <text
                x={CENTER_X}
                y={CENTER_Y - 8}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="52"
                fontWeight="700"
                fill="#ffffff"
                opacity={0.9}
                className="font-sans"
              >
                {aetherScore}
              </text>
              <text
                x={CENTER_X}
                y={CENTER_Y + 30}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="18"
                fontWeight="700"
                fill="#ffffff"
                opacity={0.3}
                letterSpacing="3"
                className="font-sans uppercase"
              >
                SCORE
              </text>
            </svg>
          </div>
        </div>

        {/* SIDEBAR — FREQUENCY TUNING */}
        <aside className="w-full max-w-[420px] bg-white/5 backdrop-blur-xl rounded-[32px] p-6 lg:p-8 border border-white/10 flex flex-col gap-4 lg:gap-5 relative z-20 -mt-10 lg:mt-0">

          <div className="mb-0 lg:mb-1 flex flex-col items-center lg:items-start text-center lg:text-left">
            <h2 className="font-serif text-2xl lg:text-3xl mb-0.5 text-white font-bold tracking-tight">
              Frequency Tuning
            </h2>
            <p className="text-[10px] lg:text-xs font-extrabold tracking-widest uppercase text-white/40">
              {hoveredSegment ? `Tuning: ${hoveredSegment.name}` : 'Calibrate Your Life Balance'}
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:gap-4">
            {userWheel.map((seg) => (
              <div
                key={seg.id}
                className="flex flex-col gap-1.5 lg:gap-2 transition-opacity duration-300"
                style={{ opacity: hoveredSegment && hoveredSegment.id !== seg.id ? 0.25 : 1 }}
                onMouseEnter={() => setHoveredSegment(seg)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                <div className="flex justify-between items-center">
                  <label
                    className="text-[11px] lg:text-xs font-extrabold uppercase tracking-widest"
                    style={{ color: SEGMENT_COLORS[seg.id] }}
                  >
                    {seg.name}
                  </label>
                  <span className="text-xs font-extrabold bg-white/10 text-white px-2.5 py-0.5 rounded-md">
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
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer transition-all hover:h-2 mt-1"
                  style={{ accentColor: SEGMENT_COLORS[seg.id] }}
                />
              </div>
            ))}
          </div>
        </aside>

      </main>
    </div>
  );
}
