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

/**
 * A single sheet with all 8 universe frequency sliders at once. Opens only
 * when the user explicitly taps the "Tune" pill — the wheel itself stays
 * dedicated to navigation (tap = enter universe).
 */
export default function FrequencyTuningSheet({
  open, onClose, segments, onChange, onCommit,
}: FrequencyTuningSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 34 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, info: PanInfo) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-[28px] flex flex-col touch-pan-y pb-[calc(env(safe-area-inset-bottom,0px)+16px)]"
            style={{ background: '#1B1714', borderTop: '1px solid rgba(232,221,204,0.08)' }}
          >
            <div className="pt-3 pb-2 flex justify-center shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>

            <div className="px-5 pb-4 flex items-start justify-between shrink-0">
              <div>
                <p className="text-[10px] font-black tracking-[0.22em] uppercase text-[#A8A096]">Calibrate</p>
                <h3 className="font-serif text-2xl tracking-tight mt-1" style={{ color: '#F5EFE6' }}>
                  Frequency Tuning
                </h3>
                <p className="text-[12px] mt-1.5 leading-snug" style={{ color: '#A8A096' }}>
                  Slide each universe's score from 0 to 10. Your balance updates live.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full active:scale-90 transition-transform shrink-0"
                style={{ background: 'rgba(232,221,204,0.06)', color: '#A8A096' }}
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pt-1 pb-4">
              <div className="flex flex-col gap-5">
                {segments.map(seg => (
                  <div key={seg.id} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label
                        className="text-[11px] font-black uppercase tracking-[0.2em]"
                        style={{ color: seg.color }}
                      >
                        {seg.name}
                      </label>
                      <span
                        className="text-[12px] font-black tabular-nums px-2.5 h-6 inline-flex items-center rounded-md"
                        style={{
                          background: `${seg.color}18`,
                          color: seg.color,
                          border: `1px solid ${seg.color}40`,
                        }}
                      >
                        {seg.value}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0" max="10" step="1"
                      value={seg.value}
                      onChange={(e) => onChange(seg.id, Number(e.target.value))}
                      onMouseUp={(e) => onCommit(seg.id, Number((e.target as HTMLInputElement).value))}
                      onTouchEnd={(e) => onCommit(seg.id, Number((e.target as HTMLInputElement).value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${seg.color} 0%, ${seg.color} ${seg.value * 10}%, rgba(232,221,204,0.08) ${seg.value * 10}%, rgba(232,221,204,0.08) 100%)`,
                        accentColor: seg.color,
                      }}
                      aria-label={`Score for ${seg.name}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
