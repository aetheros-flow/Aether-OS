import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import type { WheelSegment } from './LifeWheel';

interface FrequencyTuningSheetProps {
  open: boolean;
  onClose: () => void;
  segments: WheelSegment[];
  /** Called while dragging a slider (local state). */
  onChange: (id: string, value: number) => void;
  /** Called once when the user lifts the finger, to persist. */
  onCommit: (id: string, value: number) => void;
}

export default function FrequencyTuningSheet({
  open, onClose, segments, onChange, onCommit,
}: FrequencyTuningSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(4,3,2,0.72)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38, mass: 0.9 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.28 }}
            onDragEnd={(_: unknown, info: PanInfo) => {
              if (info.offset.y > 90 || info.velocity.y > 480) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col touch-pan-y"
            style={{
              maxHeight: '88vh',
              borderRadius: '28px 28px 0 0',
              background: 'rgba(8,7,6,0.97)',
              borderTop: '1px solid rgba(240,232,220,0.07)',
              boxShadow: '0 -24px 80px rgba(0,0,0,0.72), 0 -1px 0 rgba(240,232,220,0.04)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
            }}
          >
            {/* Drag handle */}
            <div className="pt-3 pb-1 flex justify-center shrink-0">
              <div
                className="w-9 h-[3px] rounded-full"
                style={{ background: 'rgba(240,232,220,0.14)' }}
              />
            </div>

            {/* Header */}
            <div className="px-6 pt-3 pb-5 flex items-start justify-between shrink-0">
              <div>
                <p
                  className="text-[9px] font-black tracking-[0.36em] uppercase"
                  style={{ color: 'rgba(240,232,220,0.30)' }}
                >
                  Calibrate · Aether OS
                </p>
                <h3
                  className="font-serif text-[22px] font-medium tracking-tight mt-1.5 leading-none"
                  style={{ color: 'rgba(240,232,220,0.88)' }}
                >
                  Frequency Tuning
                </h3>
                <p
                  className="text-[11px] mt-2 leading-relaxed"
                  style={{ color: 'rgba(240,232,220,0.32)' }}
                >
                  Adjust each universe's resonance · 0 – 10
                </p>
              </div>

              <button
                onClick={onClose}
                aria-label="Close"
                className="p-2 rounded-full transition-all duration-150 active:scale-90 shrink-0 mt-0.5"
                style={{
                  background: 'rgba(240,232,220,0.05)',
                  border: '1px solid rgba(240,232,220,0.07)',
                  color: 'rgba(240,232,220,0.38)',
                }}
              >
                <X size={13} />
              </button>
            </div>

            {/* Divider */}
            <div
              className="mx-6 mb-4 shrink-0"
              style={{ height: '1px', background: 'rgba(240,232,220,0.05)' }}
            />

            {/* Sliders */}
            <div className="flex-1 overflow-y-auto px-6 pb-2" style={{ scrollbarWidth: 'none' }}>
              <div className="flex flex-col gap-6">
                {segments.map((seg, i) => (
                  <motion.div
                    key={seg.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col gap-2.5"
                  >
                    {/* Label row */}
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] font-black uppercase tracking-[0.22em]"
                        style={{ color: seg.color }}
                      >
                        {seg.name}
                      </span>

                      {/* Score badge */}
                      <span
                        className="text-[11px] font-black tabular-nums min-w-[36px] text-center px-2 py-0.5 rounded-md"
                        style={{
                          background: `${seg.color}14`,
                          border: `1px solid ${seg.color}30`,
                          color: seg.color,
                        }}
                      >
                        {seg.value}
                      </span>
                    </div>

                    {/* Track + thumb */}
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={seg.value}
                        onChange={(e) => onChange(seg.id, Number(e.target.value))}
                        onMouseUp={(e) => onCommit(seg.id, Number((e.target as HTMLInputElement).value))}
                        onTouchEnd={(e) => onCommit(seg.id, Number((e.target as HTMLInputElement).value))}
                        aria-label={`Score for ${seg.name}`}
                        className="w-full cursor-pointer"
                        style={{
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          height: '4px',
                          borderRadius: '999px',
                          outline: 'none',
                          background: `linear-gradient(to right, ${seg.color} 0%, ${seg.color} ${seg.value * 10}%, rgba(240,232,220,0.07) ${seg.value * 10}%, rgba(240,232,220,0.07) 100%)`,
                          // thumb styles via CSS below, using accent-color as fallback
                          accentColor: seg.color,
                        }}
                      />
                    </div>

                    {/* Tick marks */}
                    <div className="flex justify-between px-0.5">
                      {Array.from({ length: 11 }, (_, t) => (
                        <div
                          key={t}
                          className="rounded-full"
                          style={{
                            width: '2px',
                            height: t % 5 === 0 ? '6px' : '3px',
                            background: t <= seg.value
                              ? `${seg.color}60`
                              : 'rgba(240,232,220,0.08)',
                            transition: 'background 200ms ease',
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Bottom padding spacer */}
              <div className="h-4" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
