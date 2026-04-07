import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TOTAL_SEGMENTS = 8;
const RADIUS = 300;
const INNER_RADIUS = 70;
const CENTER_X = 550;
const CENTER_Y = 550;

export interface Segment {
  id: string;
  name: string;
  level: number;
  value: number;
  path: string;
}

const initialSegments: Segment[] = [
  { id: 'amor', name: 'Vida Amorosa', level: 0, value: 0, path: '/amor' },
  { id: 'dinero', name: 'Situación Económica', level: 0, value: 0, path: '/dinero' },
  { id: 'desarrollopersonal', name: 'Desarrollo Personal', level: 0, value: 0, path: '/desarrollopersonal' },
  { id: 'salud', name: 'Salud Física', level: 0, value: 0, path: '/salud' },
  { id: 'desarrolloprofesional', name: 'Desarrollo Profesional', level: 0, value: 0, path: '/desarrolloprofesional' },
  { id: 'social', name: 'Vida Social', level: 0, value: 0, path: '/social' },
  { id: 'familia', name: 'Familia y Hogar', level: 0, value: 0, path: '/familia' },
  { id: 'ocio', name: 'Ocio y Tiempo', level: 0, value: 0, path: '/ocio' },
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
  const gap = 0.03; // Espacio entre universos
  const startAngle = index * anglePerSegment - Math.PI / 2 + gap;
  const endAngle = (index + 1) * anglePerSegment - Math.PI / 2 - gap;
  
  // 10 Niveles concéntricos
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
  
  const textRadius = RADIUS + 50; 
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

  // step size = 23, width 14 deja un espacio (gap) de ~9px. Limpio y nítido.
  // Utilidad para separar palabras largas en distintas líneas (tspan)
  const renderWrappedText = (text: string, x: number) => {
    if (text === 'Situación Económica') return <><tspan x={x} dy="-0.6em">SITUACIÓN</tspan><tspan x={x} dy="1.2em">ECONÓMICA</tspan></>;
    if (text === 'Desarrollo Personal') return <><tspan x={x} dy="-0.6em">DESARROLLO</tspan><tspan x={x} dy="1.2em">PERSONAL</tspan></>;
    if (text === 'Salud Física') return <><tspan x={x} dy="-0.6em">SALUD</tspan><tspan x={x} dy="1.2em">FÍSICA</tspan></>;
    if (text === 'Desarrollo Profesional') return <><tspan x={x} dy="-0.6em">DESARROLLO</tspan><tspan x={x} dy="1.2em">PROFESIONAL</tspan></>;
    if (text === 'Vida Social') return <><tspan x={x} dy="-0.6em">VIDA</tspan><tspan x={x} dy="1.2em">SOCIAL</tspan></>;
    if (text === 'Familia y Hogar') return <><tspan x={x} dy="-0.6em">FAMILIA</tspan><tspan x={x} dy="1.2em">Y HOGAR</tspan></>;
    if (text === 'Ocio y Tiempo') return <><tspan x={x} dy="-0.6em">OCIO Y</tspan><tspan x={x} dy="1.2em">TIEMPO</tspan></>;
    if (text === 'Vida Amorosa') return <><tspan x={x} dy="-0.6em">VIDA</tspan><tspan x={x} dy="1.2em">AMOROSA</tspan></>;
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
        return (
          <path
            key={level}
            d={getLevelStrokePath(index, level)}
            fill="none"
            stroke={color}
            strokeWidth={14}
            strokeLinecap="round"
            opacity={isFilled ? (isHovered ? 1 : 0.8) : (isHovered ? 0.3 : 0.1)}
            className="transition-all duration-500"
            style={{ filter: isFilled && isHovered ? `drop-shadow(0 0 10px ${color}A0)` : 'none' }}
          />
        );
      })}
      
      <text
        x={textX}
        y={textY}
        className="font-sans font-bold uppercase tracking-widest transition-colors duration-300 pointer-events-none"
        fontSize="40"
        fill={isHovered ? '#1A1C19' : '#FAF9F6'}
        textAnchor={anchor}
        dominantBaseline="middle"
        opacity={isHovered ? 1 : 0.8}
        style={{ filter: isHovered ? `drop-shadow(0 0 4px rgba(0,0,0,0.5))` : 'none' }}
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
  const [dbRecordId, setDbRecordId] = useState<string | null>(null);

  // Fondo default off-white (Light Theme)
  const defaultBg = '#FAF9F6'; 
  const targetBgColor = defaultBg; // Mantendremos el fondo blanco siempre para mantener el diseño limpio de la captura 1.

  const fetchWheelData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data, error } = await supabase
        .from('UserWheel')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const lastWheel = data[0];
        setDbRecordId(lastWheel.id);
        const updatedWheel = initialSegments.map(seg => {
          const rawNum = lastWheel[seg.id] || 0;
          return { ...seg, value: rawNum, level: getLevelFromNumber(rawNum) };
        });
        setUserWheel(updatedWheel);
      } else {
         // Create a new record if none exists
         const { data: newRecord, error: insertError } = await supabase
           .from('UserWheel')
           .insert([{ user_id: user.id }])
           .select()
           .single();
           
         if (insertError) throw insertError;
         setDbRecordId(newRecord.id);
      }
    } catch (error) { 
      console.error(error); 
    } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWheelData(); }, [navigate]);

  const handleSliderChange = async (segmentId: string, newValue: number) => {
    // Actualización optimista de la UI
    setUserWheel(prev => prev.map(s => 
      s.id === segmentId ? { ...s, value: newValue, level: getLevelFromNumber(newValue) } : s
    ));

    if (!dbRecordId) return;

    try {
      const { error } = await supabase
        .from('UserWheel')
        .update({ [segmentId]: newValue })
        .eq('id', dbRecordId);
        
      if (error) throw error;
    } catch (error) {
      console.error("Error saving wheel value", error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]"><Loader2 className="w-12 h-12 animate-spin text-[#76B079]" /></div>;
  }

  return (
    <div 
      className="min-h-screen font-sans text-[#2D2A26] relative transition-colors duration-500 ease-in-out flex flex-col md:flex-row selection:bg-purple-900 selection:text-white"
      style={{ backgroundColor: targetBgColor }}
    >
      {/* Área Central (La Rueda) */}
      <div className="flex-1 flex flex-col items-center p-6 md:p-10">
          <header className="flex justify-between items-center w-full max-w-4xl mb-10 bg-[#FAF9F6] py-3 px-6 rounded-full shadow-lg border border-gray-100 z-50">
            <h1 className="aether-title text-[#2D2A26]">Aether OS</h1>
            <button className="px-5 py-2 rounded-full font-medium text-xs transition-transform active:scale-95 bg-gray-100 text-[#2D2A26] border border-gray-200">
              BUEN DÍA, LUCAS
            </button>
          </header>

          <main className="flex-1 w-full flex flex-col items-center justify-center gap-6 mt-4 md:mt-0 relative pb-10">
            <div className="flex flex-col items-center gap-2 absolute top-0">
              <p className="aether-eyebrow text-[#8A8681] uppercase tracking-widest text-xs font-bold">
                {hoveredSegment ? hoveredSegment.name : 'DASHBOARD CENTRAL'}
              </p>
            </div>
            
            <div className="relative w-full flex-1 flex items-center justify-center transition-transform duration-500 mx-auto">
              <svg viewBox="0 0 1100 1100" className="w-[140%] sm:w-[90%] md:h-[75vh] max-h-[85vh] h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.10)] overflow-visible">
                {/* Gajos dinámicos con efecto premium */}
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
                
                {/* Centro blanco elegante */}
                <circle cx={CENTER_X} cy={CENTER_Y} r={INNER_RADIUS - 15} fill="#FAF9F6" opacity={0.05} />
                <circle cx={CENTER_X} cy={CENTER_Y} r={12} fill="#FAF9F6" />
              </svg>
            </div>
          </main>
      </div>

      {/* Panel Lateral Derecho (Ajuste de Frecuencias) */}
      <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-black/5 p-6 md:p-8 flex flex-col gap-6 bg-white/60 backdrop-blur-xl">
         <div className="mb-4">
            <h2 className="font-serif text-xl mb-1 text-[#2D2A26] font-bold">Ajuste de Frecuencias</h2>
            <p className="text-xs text-[#8A8681] font-bold tracking-wide">Modificando: {hoveredSegment ? hoveredSegment.name : 'General'}</p>
         </div>
         
         <div className="flex flex-col gap-6 overflow-y-auto hide-scrollbar pb-10">
            {userWheel.map((seg) => (
                <div 
                  key={seg.id} 
                  className="flex flex-col gap-3 group transition-opacity duration-300"
                  style={{ opacity: hoveredSegment && hoveredSegment.id !== seg.id ? 0.3 : 1 }}
                  onMouseEnter={() => setHoveredSegment(seg)}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: SEGMENT_COLORS[seg.id] }}>
                            {seg.name}
                        </label>
                        <span className="text-xs font-mono font-bold bg-black/5 text-[#2D2A26] px-3 py-1 rounded-lg">
                            {seg.value}
                        </span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        value={seg.value}
                        onChange={(e) => handleSliderChange(seg.id, Number(e.target.value))}
                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: SEGMENT_COLORS[seg.id] }}
                    />
                </div>
            ))}
         </div>
      </aside>

    </div>
  );
}