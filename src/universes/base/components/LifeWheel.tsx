import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// ── Types ────────────────────────────────────────────────────────────────────
export interface WheelSegment {
  id: string;
  name: string;
  value: number;       // 0-10
  path?: string;
  color: string;       // hex
}

interface LifeWheelProps {
  segments: WheelSegment[];
  onSelectSegment: (segment: WheelSegment) => void;
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
  centerValue: number;
  centerLabel?: string;
}

// ── Geometry ─────────────────────────────────────────────────────────────────
const VIEWBOX    = 1200;
const CENTER     = 600;
const R_OUTER    = 424;
const R_INNER    = 114;
const GAP        = 0.022;
const BANDS      = 10;
const TOTAL      = 8;
const ANGLE_PER  = (2 * Math.PI) / TOTAL;
const STEP       = (R_OUTER - R_INNER) / BANDS;

// ── Helpers ──────────────────────────────────────────────────────────────────
function polar(angle: number, r: number) {
  return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
}

function arcBandPath(index: number, level: number): string {
  const start = index * ANGLE_PER - Math.PI / 2 + GAP;
  const end   = (index + 1) * ANGLE_PER - Math.PI / 2 - GAP;
  const r     = R_INNER + (level - 0.5) * STEP;
  const large = end - start <= Math.PI ? 0 : 1;
  const s = polar(start, r);
  const e = polar(end,   r);
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

function hitWedgePath(index: number): string {
  const start = index * ANGLE_PER - Math.PI / 2;
  const end   = (index + 1) * ANGLE_PER - Math.PI / 2;
  const s0 = polar(start, R_INNER);
  const s1 = polar(start, R_OUTER + 60);
  const e1 = polar(end,   R_OUTER + 60);
  const e0 = polar(end,   R_INNER);
  return `M ${s0.x} ${s0.y} L ${s1.x} ${s1.y} A ${R_OUTER+60} ${R_OUTER+60} 0 0 1 ${e1.x} ${e1.y} L ${e0.x} ${e0.y} A ${R_INNER} ${R_INNER} 0 0 0 ${s0.x} ${s0.y} Z`;
}

// Platinum specular — first 26% of the segment arc at the outermost filled band
function specularPath(index: number, level: number): string {
  const segStart = index * ANGLE_PER - Math.PI / 2 + GAP * 2;
  const span     = (ANGLE_PER - GAP * 4) * 0.26;
  const r        = R_INNER + (level - 0.5) * STEP;
  const s = polar(segStart, r);
  const e = polar(segStart + span, r);
  return `M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}`;
}

const LABEL_BREAKS: Record<string, string[]> = {
  'Love Life':           ['LOVE', 'LIFE'],
  'Economic Situation':  ['ECONOMIC', 'SITUATION'],
  'Personal Growth':     ['PERSONAL', 'GROWTH'],
  'Physical Health':     ['PHYSICAL', 'HEALTH'],
  'Professional Growth': ['PROFESSIONAL', 'GROWTH'],
  'Social Life':         ['SOCIAL', 'LIFE'],
  'Family & Home':       ['FAMILY', '& HOME'],
  'Leisure & Time':      ['LEISURE', '& TIME'],
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function LifeWheel({
  segments,
  onSelectSegment,
  hoveredId,
  onHover,
  centerValue,
  centerLabel = 'AETHER',
}: LifeWheelProps) {
  const navigate = useNavigate();

  // Center halo adopts the active segment's color
  const activeColor = hoveredId
    ? (segments.find(s => s.id === hoveredId)?.color ?? 'rgba(140,120,255,0.20)')
    : 'rgba(140,120,255,0.20)';

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      className="w-full h-auto select-none"
      style={{ overflow: 'visible' }}
      role="img"
      aria-label="Wheel of Life — tap a segment to enter its universe"
    >
      <defs>
        {/* ── Per-segment radial gradients ─────────────────────────────── */}
        {/* Gradient goes from wheel center outward — inner bands stay dim,
            outer bands glow bright, naturally matching the arc position. */}
        {segments.map(seg => (
          <radialGradient
            key={seg.id}
            id={`rgrad-${seg.id}`}
            cx={CENTER} cy={CENTER} r={R_OUTER}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%"   stopColor={seg.color} stopOpacity="0.00" />
            <stop offset="27%"  stopColor={seg.color} stopOpacity="0.16" />
            <stop offset="68%"  stopColor={seg.color} stopOpacity="0.58" />
            <stop offset="100%" stopColor={seg.color} stopOpacity="1.00" />
          </radialGradient>
        ))}

        {/* ── Glass center sphere — cool-tinted ──────────────────────── */}
        <radialGradient id="glassDisk" cx="38%" cy="32%" r="70%">
          <stop offset="0%"   stopColor="rgba(190,178,255,0.13)" />
          <stop offset="40%"  stopColor="rgba(6,4,14,0.94)" />
          <stop offset="100%" stopColor="rgba(4,2,12,0.98)" />
        </radialGradient>

        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(155,135,255,0.11)" />
          <stop offset="55%"  stopColor="rgba(155,135,255,0.03)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        <radialGradient id="glassSheen" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.30)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>

        {/* ── Blur filters ─────────────────────────────────────────────── */}
        <filter id="haloBlur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
        </filter>

        <filter id="centerHalo" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" />
        </filter>

        {/* ── Soft ambient aura ────────────────────────────────────────── */}
        <radialGradient id="wheelAura" cx="50%" cy="50%" r="50%">
          <stop offset="52%"  stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(130,110,255,0.016)" />
        </radialGradient>
      </defs>

      {/* Ambient aura ring */}
      <circle cx={CENTER} cy={CENTER} r={R_OUTER + 120} fill="url(#wheelAura)" />

      {/* ══ SEGMENTS ══════════════════════════════════════════════════════ */}
      {segments.map((seg, i) => {
        const filledLevel = Math.max(0, Math.min(10, Math.round(seg.value)));
        const isHovered   = hoveredId === seg.id;
        const anyHovered  = Boolean(hoveredId);

        return (
          <motion.g
            key={seg.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.055, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            style={{ viewTransitionName: `universe-${seg.id}` } as React.CSSProperties}
          >
            {/* ── Empty track — thin, delicate ── */}
            {Array.from({ length: BANDS }, (_, b) => {
              const level = b + 1;
              if (level <= filledLevel) return null;
              return (
                <path
                  key={`t${level}`}
                  d={arcBandPath(i, level)}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={7}
                  strokeLinecap="round"
                  opacity={isHovered ? 0.11 : anyHovered ? 0.018 : 0.040}
                  style={{ transition: 'opacity 380ms ease' }}
                />
              );
            })}

            {/* ── Filled bands — radial gradient stroke + glow ── */}
            {filledLevel > 0 && (
              <g style={{
                filter: isHovered
                  ? `drop-shadow(0 0 16px ${seg.color}C0)`
                  : `drop-shadow(0 0 7px ${seg.color}58)`,
                transition: 'filter 420ms ease',
              }}>
                {Array.from({ length: filledLevel }, (_, b) => {
                  const level   = b + 1;
                  const isOuter = level === filledLevel;
                  return (
                    <path
                      key={`f${level}`}
                      d={arcBandPath(i, level)}
                      fill="none"
                      stroke={`url(#rgrad-${seg.id})`}
                      strokeWidth={isOuter ? 14 : 10}
                      strokeLinecap="round"
                      opacity={isHovered ? 1.0 : 0.88}
                      style={{ transition: 'opacity 380ms ease, stroke-width 220ms ease' }}
                    />
                  );
                })}

                {/* Platinum specular — sheen on leading edge of outermost band */}
                <path
                  d={specularPath(i, filledLevel)}
                  fill="none"
                  stroke="white"
                  strokeWidth={4}
                  strokeLinecap="round"
                  opacity={isHovered ? 0.26 : 0.09}
                  style={{ transition: 'opacity 380ms ease' }}
                />
              </g>
            )}

            {/* ── Tip halo — blurred outer glow ── */}
            {filledLevel > 0 && (
              <path
                d={arcBandPath(i, filledLevel)}
                fill="none"
                stroke={seg.color}
                strokeWidth={34}
                strokeLinecap="round"
                opacity={isHovered ? 0.24 : 0.08}
                filter="url(#haloBlur)"
                style={{ transition: 'opacity 420ms ease' }}
              />
            )}
          </motion.g>
        );
      })}

      {/* ══ LABELS with glass backing plates ═════════════════════════════ */}
      {segments.map((seg, i) => {
        const midAngle  = i * ANGLE_PER - Math.PI / 2 + ANGLE_PER / 2;
        const { x, y }  = polar(midAngle, R_OUTER + 78);
        const cos       = Math.cos(midAngle);
        const anchor    = cos > 0.12 ? 'start' : cos < -0.12 ? 'end' : 'middle';
        const lines     = LABEL_BREAKS[seg.name] ?? [seg.name.toUpperCase()];
        const isHovered  = hoveredId === seg.id;
        const anyHovered = Boolean(hoveredId);

        // Approximate glass plate dimensions from text length
        const maxLen = Math.max(...lines.map(l => l.length));
        const plateW = maxLen * 13 + 36;
        const plateH = lines.length === 1 ? 38 : 62;
        const plateX = anchor === 'start'
          ? x - 12
          : anchor === 'end'
            ? x - plateW + 12
            : x - plateW / 2;
        const plateY = y - (lines.length === 1 ? 0 : 14) - 24;

        return (
          <g
            key={`lbl-${seg.id}`}
            className="pointer-events-none"
            opacity={isHovered ? 1 : anyHovered ? 0.26 : 0.62}
            style={{ transition: 'opacity 380ms ease' }}
          >
            {/* Glass backing plate */}
            <rect
              x={plateX} y={plateY}
              width={plateW} height={plateH}
              rx={12}
              fill="rgba(8,6,18,0.58)"
              stroke={isHovered ? `${seg.color}40` : 'rgba(150,130,255,0.07)'}
              strokeWidth={0.8}
              style={{ transition: 'stroke 380ms ease' }}
            />

            {/* Label text */}
            {lines.map((ln, li) => (
              <text
                key={li}
                x={x}
                textAnchor={anchor}
                fontSize="22"
                fontWeight="700"
                letterSpacing="2.0"
                fill={isHovered ? seg.color : '#C8C0D8'}
                className="font-sans uppercase"
                style={{ transition: 'fill 380ms ease' }}
              >
                <tspan x={x} y={y} dy={li === 0 ? (lines.length === 1 ? 0 : -14) : 30}>
                  {ln}
                </tspan>
              </text>
            ))}

            {/* Score */}
            <text
              x={x}
              y={y + (lines.length === 1 ? 26 : 40)}
              textAnchor={anchor}
              fontSize="16"
              fontWeight="500"
              fill={isHovered ? seg.color : '#5C5870'}
              style={{ transition: 'fill 380ms ease' }}
            >
              {seg.value}
            </text>
          </g>
        );
      })}

      {/* ══ CENTER HALO — reacts to hovered segment ══════════════════════ */}
      <circle
        cx={CENTER} cy={CENTER} r={R_INNER + 10}
        fill="none"
        stroke={activeColor}
        strokeWidth={14}
        opacity={hoveredId ? 0.38 : 0.14}
        filter="url(#centerHalo)"
        style={{ transition: 'stroke 420ms ease, opacity 420ms ease' }}
      />

      {/* ══ GLASS CENTER CORE (breathing) ════════════════════════════════ */}
      <motion.g
        style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
        animate={{ scale: [1, 1.017, 1] }}
        transition={{ duration: 5.5, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
      >
        <circle cx={CENTER} cy={CENTER} r={R_INNER - 4}  fill="url(#glassDisk)" />
        <circle cx={CENTER} cy={CENTER} r={R_INNER - 36} fill="url(#coreGlow)" />
        <circle cx={CENTER} cy={CENTER} r={R_INNER - 4}  fill="none"
          stroke="rgba(200,188,255,0.10)" strokeWidth={0.8} />
        <circle cx={CENTER} cy={CENTER} r={R_INNER - 20} fill="none"
          stroke="rgba(200,188,255,0.04)" strokeWidth={0.5} />
        <ellipse
          cx={CENTER - 17} cy={CENTER - 22}
          rx={21} ry={13}
          fill="url(#glassSheen)"
          transform={`rotate(-28, ${CENTER - 17}, ${CENTER - 22})`}
          opacity={0.55}
        />
      </motion.g>

      {/* Center score — outside breathing group for readability stability */}
      <text
        x={CENTER} y={CENTER - 12}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="64" fontWeight="300" fill="#F0E8DC"
        className="font-serif tabular-nums"
        style={{ letterSpacing: '-0.04em' }}
      >
        {centerValue.toFixed(1)}
      </text>
      <text
        x={CENTER} y={CENTER + 35}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="10" fontWeight="900" letterSpacing="5"
        fill="#6A6280"
        className="font-sans uppercase"
      >
        {centerLabel}
      </text>

      {/* ══ HIT TARGETS ════════════════════════════════════════════════════ */}
      {segments.map((seg, i) => (
        <path
          key={`hit-${seg.id}`}
          d={hitWedgePath(i)}
          fill="transparent"
          className="cursor-pointer"
          onClick={() => {
            onSelectSegment(seg);
            if (seg.path) navigate(seg.path, { viewTransition: true });
          }}
          onMouseEnter={() => onHover?.(seg.id)}
          onMouseLeave={() => onHover?.(null)}
          onTouchStart={() => onHover?.(seg.id)}
          onTouchEnd={() => onHover?.(null)}
        />
      ))}
    </svg>
  );
}
