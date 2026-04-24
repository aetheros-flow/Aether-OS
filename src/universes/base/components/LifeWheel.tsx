import { motion } from 'framer-motion';

// ── Types ────────────────────────────────────────────────────────────────────
export interface WheelSegment {
  id: string;
  name: string;
  value: number;       // 0-10
  path?: string;
  color: string;
}

interface LifeWheelProps {
  segments: WheelSegment[];
  /** Tap a segment → navigate to that universe. THIS IS THE PRIMARY ACTION. */
  onSelectSegment: (segment: WheelSegment) => void;
  /** Optional dim-others effect on hover/focus. */
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
  /** Central KPI value. */
  centerValue: number;
  centerLabel?: string;
  /** Canvas background color (warm dark by default). */
  bgColor?: string;
}

// ── Geometry ────────────────────────────────────────────────────────────────
const VIEWBOX = 1200;
const CENTER  = VIEWBOX / 2;
const R_OUTER = 420;    // Outer wheel radius
const R_INNER = 110;    // Inner disk radius (where center KPI lives)
const GAP     = 0.025;  // Angular gap between segments (radians)
const BANDS   = 10;     // Concentric score bands per segment

// ── Helpers ─────────────────────────────────────────────────────────────────
const TOTAL = 8;
const ANGLE_PER = (2 * Math.PI) / TOTAL;

function polar(angle: number, r: number): { x: number; y: number } {
  return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
}

/**
 * Returns the stroke path for a single arc band of a segment. Arc bands are
 * concentric rings, filled when `level <= value`, faded otherwise.
 */
function arcBandPath(index: number, level: number): string {
  const start = index * ANGLE_PER - Math.PI / 2 + GAP;
  const end   = (index + 1) * ANGLE_PER - Math.PI / 2 - GAP;
  const step  = (R_OUTER - R_INNER) / BANDS;
  const r     = R_INNER + (level - 0.5) * step;
  const large = end - start <= Math.PI ? 0 : 1;
  const s = polar(start, r);
  const e = polar(end,   r);
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

/** Full wedge for the invisible hit target (whole segment is tappable). */
function hitWedgePath(index: number): string {
  const start = index * ANGLE_PER - Math.PI / 2;
  const end   = (index + 1) * ANGLE_PER - Math.PI / 2;
  const s0 = polar(start, R_INNER);
  const s1 = polar(start, R_OUTER + 40);
  const e1 = polar(end,   R_OUTER + 40);
  const e0 = polar(end,   R_INNER);
  return `M ${s0.x} ${s0.y} L ${s1.x} ${s1.y} A ${R_OUTER + 40} ${R_OUTER + 40} 0 0 1 ${e1.x} ${e1.y} L ${e0.x} ${e0.y} A ${R_INNER} ${R_INNER} 0 0 0 ${s0.x} ${s0.y} Z`;
}

function wrapLabel(name: string): string[] {
  const BREAKS: Record<string, string[]> = {
    'Love Life':           ['LOVE', 'LIFE'],
    'Economic Situation':  ['ECONOMIC', 'SITUATION'],
    'Personal Growth':     ['PERSONAL', 'GROWTH'],
    'Physical Health':     ['PHYSICAL', 'HEALTH'],
    'Professional Growth': ['PROFESSIONAL', 'GROWTH'],
    'Social Life':         ['SOCIAL', 'LIFE'],
    'Family & Home':       ['FAMILY', '& HOME'],
    'Leisure & Time':      ['LEISURE', '& TIME'],
  };
  return BREAKS[name] ?? [name.toUpperCase()];
}

// ── Component ────────────────────────────────────────────────────────────────
export default function LifeWheel({
  segments,
  onSelectSegment,
  hoveredId,
  onHover,
  centerValue,
  centerLabel = 'BALANCE',
}: LifeWheelProps) {
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      className="w-full h-auto overflow-visible select-none"
      role="img"
      aria-label="Wheel of Life — tap a segment to enter its universe"
    >
      <defs>
        <radialGradient id="centerDisk" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#2A231D" />
          <stop offset="100%" stopColor="#1B1714" />
        </radialGradient>
      </defs>

      {/* ── Arc band segments ───────────────────────────────────────────── */}
      {segments.map((seg, i) => {
        const isHovered = hoveredId === seg.id;
        const anyHovered = Boolean(hoveredId);
        const filledLevel = Math.max(0, Math.min(10, Math.round(seg.value)));

        return (
          <g key={seg.id}>
            {Array.from({ length: BANDS }, (_, b) => {
              const level = b + 1;
              const isFilled = level <= filledLevel;

              // Subtle depth — outer bands a touch lighter so the wheel feels layered
              const depthMod = 1 - (level * 0.01);
              const filledOpacity = (isHovered ? 1.0 : 0.82) * depthMod;
              const emptyOpacity  = isHovered ? 0.08 : (anyHovered ? 0.025 : 0.045);

              return (
                <path
                  key={level}
                  d={arcBandPath(i, level)}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={18}
                  strokeLinecap="round"
                  opacity={isFilled ? filledOpacity : emptyOpacity}
                  style={{ transition: 'opacity 400ms ease, stroke-width 200ms ease' }}
                />
              );
            })}
          </g>
        );
      })}

      {/* ── Labels outside the wheel ────────────────────────────────────── */}
      {segments.map((seg, i) => {
        const midAngle = i * ANGLE_PER - Math.PI / 2 + ANGLE_PER / 2;
        const { x, y } = polar(midAngle, R_OUTER + 70);
        const cos = Math.cos(midAngle);
        const anchor = cos > 0.1 ? 'start' : cos < -0.1 ? 'end' : 'middle';
        const lines = wrapLabel(seg.name);
        const isHovered = hoveredId === seg.id;
        const anyHovered = Boolean(hoveredId);

        return (
          <g key={`label-${seg.id}`} className="pointer-events-none">
            <text
              x={x} y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="28"
              fontWeight="800"
              letterSpacing="2.4"
              fill={isHovered ? seg.color : '#E8DDCC'}
              opacity={isHovered ? 1 : (anyHovered ? 0.35 : 0.72)}
              className="font-sans uppercase"
              style={{ transition: 'fill 400ms ease, opacity 400ms ease' }}
            >
              {lines.map((ln, idx) => (
                <tspan key={idx} x={x} dy={idx === 0 ? (lines.length === 1 ? 0 : -16) : 32}>
                  {ln}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}

      {/* ── Inner disk + center KPI ─────────────────────────────────────── */}
      <motion.g
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <circle
          cx={CENTER} cy={CENTER}
          r={R_INNER - 8}
          fill="url(#centerDisk)"
          stroke="rgba(232,221,204,0.08)"
          strokeWidth="1"
        />
        <text
          x={CENTER} y={CENTER - 12}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="66"
          fontWeight="500"
          fill="#F5EFE6"
          className="font-serif tabular-nums"
          style={{ letterSpacing: '-0.03em' }}
        >
          {centerValue.toFixed(1)}
        </text>
        <text
          x={CENTER} y={CENTER + 36}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="11"
          fontWeight="800"
          letterSpacing="4"
          fill="#A8A096"
          className="font-sans uppercase"
        >
          {centerLabel}
        </text>
      </motion.g>

      {/* ── Invisible hit wedges (full segment is tappable → navigates) ── */}
      {segments.map((seg, i) => (
        <path
          key={`hit-${seg.id}`}
          d={hitWedgePath(i)}
          fill="transparent"
          onClick={() => onSelectSegment(seg)}
          onMouseEnter={() => onHover?.(seg.id)}
          onMouseLeave={() => onHover?.(null)}
          className="cursor-pointer"
        />
      ))}
    </svg>
  );
}
