import React from 'react';
import { motion } from 'framer-motion';

export interface WheelSegment {
  id: string;
  name: string;
  value: number;
  path?: string;
  color: string;
}

interface PolarAreaChartProps {
  segments: WheelSegment[];
  centerValue: number;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelectSegment: (segment: WheelSegment) => void;
}

const PolarAreaChart: React.FC<PolarAreaChartProps> = ({
  segments,
  centerValue,
  hoveredId,
  onHover,
  onSelectSegment,
}) => {
  // SVG Dimensions
  const SIZE = 600;
  const CENTER = SIZE / 2;
  const MAX_RADIUS = 250;
  const MIN_RADIUS = 60; // So even a 0 score is clickable and visible around the core

  // Helper to calculate SVG path for a slice
  const getSlicePath = (
    value: number,
    index: number,
    total: number
  ) => {
    // Map value (0-10) to radius
    const score = Math.max(0, Math.min(10, value));
    const radius = MIN_RADIUS + (score / 10) * (MAX_RADIUS - MIN_RADIUS);

    // Each slice is 360 / total degrees
    const sliceAngle = 360 / total;
    
    // Calculate start and end angles in degrees.
    // -90 offsets so the first slice starts at 12 o'clock.
    const startAngle = -90 + index * sliceAngle;
    const endAngle = startAngle + sliceAngle;

    // Convert degrees to radians for math
    const startRad = (Math.PI / 180) * startAngle;
    const endRad = (Math.PI / 180) * endAngle;

    // Outer edge points
    const x1 = CENTER + radius * Math.cos(startRad);
    const y1 = CENTER + radius * Math.sin(startRad);
    
    const x2 = CENTER + radius * Math.cos(endRad);
    const y2 = CENTER + radius * Math.sin(endRad);

    // Inner edge points (creates a hole in the center for the core)
    const INNER_RADIUS = 40;
    const x3 = CENTER + INNER_RADIUS * Math.cos(endRad);
    const y3 = CENTER + INNER_RADIUS * Math.sin(endRad);
    
    const x4 = CENTER + INNER_RADIUS * Math.cos(startRad);
    const y4 = CENTER + INNER_RADIUS * Math.sin(startRad);

    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

    // Move to start of outer arc
    // Draw outer arc
    // Line to inner arc
    // Draw inner arc (sweep-flag 0 because we draw backwards)
    // Close path
    return `
      M ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArcFlag} 0 ${x4} ${y4}
      Z
    `;
  };

  const hoveredSegment = hoveredId ? segments.find((s) => s.id === hoveredId) : null;

  return (
    <div className="relative w-full aspect-square max-w-[600px] mx-auto flex items-center justify-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full h-full overflow-visible drop-shadow-sm"
      >
        {/* Draw slices */}
        {segments.map((seg, i) => {
          const isHovered = hoveredId === seg.id;
          const isFaded = hoveredId !== null && hoveredId !== seg.id;
          
          return (
            <motion.path
              key={seg.id}
              d={getSlicePath(seg.value, i, segments.length)}
              fill={seg.color}
              stroke="#FAFAFA" // Matches the background for clean separation lines
              strokeWidth="2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: isHovered ? 1.05 : 1, 
                opacity: isFaded ? 0.3 : isHovered ? 1 : 0.85,
                transformOrigin: `${CENTER}px ${CENTER}px`
              }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 30,
                opacity: { duration: 0.2 },
                default: { duration: 0.5, delay: i * 0.05 }
              }}
              onMouseEnter={() => onHover(seg.id)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelectSegment(seg)}
              className="cursor-pointer"
            />
          );
        })}
      </svg>

      {/* Central Core Element (Dynamic Text) */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
      >
        <motion.div 
          className="flex flex-col items-center justify-center bg-white rounded-full shadow-md"
          style={{ width: '120px', height: '120px' }}
          animate={{ scale: hoveredId ? 1.1 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {hoveredSegment ? (
            <>
              <motion.span 
                key={`value-${hoveredSegment.id}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-sans font-black text-3xl tracking-tighter"
                style={{ color: hoveredSegment.color }}
              >
                {hoveredSegment.value.toFixed(1)}
              </motion.span>
              <motion.span 
                key={`name-${hoveredSegment.id}`}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500 mt-0.5 text-center px-2 leading-tight"
              >
                {hoveredSegment.name}
              </motion.span>
            </>
          ) : (
            <>
              <span className="font-sans font-black text-3xl tracking-tighter text-slate-900">
                {centerValue.toFixed(1)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">
                Average
              </span>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PolarAreaChart;
