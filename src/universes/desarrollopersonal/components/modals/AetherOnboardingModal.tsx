import React, { useState } from 'react';
import { User, Calendar, MapPin, Clock, X, Sparkles, Loader2 } from 'lucide-react';

interface AetherOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AetherOnboardingModal({ isOpen, onClose }: AetherOnboardingModalProps) {
  const [step, setStep] = useState<'form' | 'loading' | 'success'>('form');
  const [formData, setFormData] = useState({
    fullName: '',
    birthDate: '',
    birthTime: '',
    birthCity: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('loading');
    
    // Acá iría tu llamada a Supabase: supabase.from('profiles').update(formData)
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onClose();
        setStep('form');
      }, 2500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-[#050608]/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-300">
      
      {/* Contenedor: Bottom Sheet en Mobile, Modal centrado en Desktop */}
      <div className="w-full sm:max-w-md bg-[#0A0C10] sm:rounded-[32px] rounded-t-[32px] border border-white/10 p-6 sm:p-8 relative shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-500 overflow-hidden">
        
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

        <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white bg-white/5 p-2 rounded-full transition-colors z-20">
          <X size={16} />
        </button>

        {step === 'form' && (
          <div className="relative z-10 flex flex-col w-full">
            <div className="mb-8">
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <Sparkles size={16} />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Matrix Initialization</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Identity Anchor</h2>
              <p className="text-white/40 text-xs mt-2">Required to calculate your precise Numerological and Astrological profile.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Full Name */}
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input required type="text" placeholder="Full Legal Name"
                  value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                />
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input required type="date"
                    value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all [color-scheme:dark]"
                  />
                </div>
                <div className="relative">
                  <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input required type="time"
                    value={formData.birthTime} onChange={e => setFormData({...formData, birthTime: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* City */}
              <div className="relative mb-4">
                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input required type="text" placeholder="City of Birth (e.g. Buenos Aires)"
                  value={formData.birthCity} onChange={e => setFormData({...formData, birthCity: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                />
              </div>

              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] active:scale-95">
                Generate Profile
              </button>
            </form>
          </div>
        )}

        {step === 'loading' && (
          <div className="py-20 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
            <Loader2 size={48} className="text-purple-500 animate-spin mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Aligning Matrix</h3>
            <p className="text-white/40 text-sm">Calculating planetary transits and life path numbers...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-20 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <Sparkles size={32} className="text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Profile Synchronized</h3>
            <p className="text-white/40 text-sm">Your esoteric engine is now online.</p>
          </div>
        )}

      </div>
    </div>
  );
}