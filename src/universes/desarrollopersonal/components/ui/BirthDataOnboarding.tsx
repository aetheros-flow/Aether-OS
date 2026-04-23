import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { X, Loader2, Check, User as UserIcon, Calendar, Clock, MapPin, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useDesarrolloPersonalData } from '../../hooks/useDesarrolloPersonalData';
import type { UserBirthData } from '../../types';

interface BirthDataOnboardingProps {
  open: boolean;
  onClose: () => void;
  accent: string;
  existing?: UserBirthData | null;
}

/**
 * Captures the data needed to compute numerology + a natal chart: full name,
 * date of birth, optional birth time (for Ascendant/Moon accuracy) and optional
 * birth city. Shows inline hints explaining WHY each field matters — no user
 * should feel lost looking at a cryptic form.
 */
export default function BirthDataOnboarding({ open, onClose, accent, existing }: BirthDataOnboardingProps) {
  const { saveBirthData } = useDesarrolloPersonalData();

  const [fullName, setFullName]   = useState(existing?.full_name ?? '');
  const [birthDate, setBirthDate] = useState(existing?.birth_date ?? '');
  const [birthTime, setBirthTime] = useState(existing?.birth_time ?? '');
  const [birthCity, setBirthCity] = useState(existing?.birth_city ?? '');
  const [busy, setBusy] = useState(false);

  // Reset when opening (pull latest "existing" values, reset busy state)
  useEffect(() => {
    if (open) {
      setFullName(existing?.full_name ?? '');
      setBirthDate(existing?.birth_date ?? '');
      setBirthTime(existing?.birth_time ?? '');
      setBirthCity(existing?.birth_city ?? '');
      setBusy(false);
    }
  }, [open, existing]);

  const canSubmit = fullName.trim().length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(birthDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      // For timezone / lat / lon we accept the fields as optional — a follow-up
      // can resolve them from the city via Nominatim. For now we persist what
      // the user provided and let the engine use defaults for the Ascendant.
      await saveBirthData({
        full_name: fullName.trim(),
        birth_date: birthDate,
        birth_time: birthTime || null,
        birth_city: birthCity.trim() || null,
        birth_latitude: null,
        birth_longitude: null,
        birth_timezone: null,
      });
      toast.success('Birth data saved');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save birth data');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info: PanInfo) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] rounded-t-[28px] bg-zinc-950 border-t border-white/8 flex flex-col pb-[calc(env(safe-area-inset-bottom,0px)+8px)] touch-pan-y"
          >
            <div className="pt-3 pb-2 flex justify-center shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="px-5 pb-3 flex items-start justify-between shrink-0">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: accent }}>
                  {existing ? 'Update' : 'Set Up'}
                </p>
                <h3 className="font-serif text-2xl text-white tracking-tight mt-1">Your Blueprint</h3>
                <p className="text-[13px] text-zinc-400 mt-1.5 leading-snug">
                  We use this to compute your numerology and natal chart — everything stays on your device + your Supabase row. Never shared.
                </p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full bg-white/5 text-zinc-400 active:scale-90 transition-transform" aria-label="Close">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-8 pt-2 flex flex-col gap-5">

              {/* Full Name */}
              <Field
                icon={UserIcon}
                label="Full birth name"
                hint="Use the name on your birth certificate — spelling matters for numerology (Expression Number is summed letter-by-letter)."
                required
              >
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Lucas Ezequiel Bianchi"
                  autoCapitalize="words"
                  required
                  className="w-full h-11 px-4 rounded-xl text-[14px] font-medium text-white placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-white/15"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </Field>

              {/* Date of birth */}
              <Field
                icon={Calendar}
                label="Date of birth"
                hint="Gives us your Sun sign, Life Path number, and daily horoscope."
                required
              >
                <input
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  required
                  className="w-full h-11 px-4 rounded-xl text-[14px] font-medium text-white placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-white/15"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </Field>

              {/* Time of birth */}
              <Field
                icon={Clock}
                label="Time of birth"
                hint="Optional, but needed for an accurate Ascendant and Moon sign. If you don't know, leave it blank — we'll use solar noon."
              >
                <input
                  type="time"
                  value={birthTime}
                  onChange={e => setBirthTime(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl text-[14px] font-medium text-white placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-white/15"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </Field>

              {/* City */}
              <Field
                icon={MapPin}
                label="Birth city"
                hint="Country too if it's a common name (e.g. 'Córdoba, AR'). We'll resolve coordinates for the natal chart later."
              >
                <input
                  type="text"
                  value={birthCity}
                  onChange={e => setBirthCity(e.target.value)}
                  placeholder="e.g. Buenos Aires, AR"
                  autoCapitalize="words"
                  className="w-full h-11 px-4 rounded-xl text-[14px] font-medium text-white placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-white/15"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </Field>

              {/* Explainer */}
              <div
                className="flex gap-3 p-3.5 rounded-2xl"
                style={{ background: `${accent}12`, border: `1px solid ${accent}30` }}
              >
                <Info size={16} className="shrink-0 mt-0.5" style={{ color: accent }} />
                <p className="text-[12px] text-zinc-300 leading-relaxed">
                  <span className="font-bold text-white">What we compute:</span> Life Path, Expression and Soul Urge numbers (numerology) · Sun, Moon and Ascendant signs (astrology) · Daily horoscope for your sign. All math runs locally — no external astrology service needed.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit || busy}
                className="mt-2 h-12 rounded-full font-bold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
                style={{
                  background: accent,
                  color: '#0A0012',
                  boxShadow: `0 6px 20px ${accent}50`,
                }}
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={2.5} />}
                {busy ? 'Saving…' : existing ? 'Update' : 'Save & continue'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ icon: Icon, label, hint, required, children }: {
  icon: typeof UserIcon;
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-zinc-500" />
        <label className="text-[10px] font-black tracking-[0.22em] uppercase text-zinc-400">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      </div>
      {children}
      {hint && <p className="text-[11px] text-zinc-500 leading-snug">{hint}</p>}
    </div>
  );
}
