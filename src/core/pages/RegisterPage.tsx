import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, Fingerprint, Mail, KeyRound, Sparkles, User, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'neutral' | 'error' | 'success'>('neutral');

  const handleRegister = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    setSystemMessage(null);
    setMessageType('neutral');

    if (password.length < 8) {
      setMessageType('error');
      setSystemMessage("Access Key must be at least 8 characters.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          // Esto evita el error de confirmación de email si no tienes configurado el SMTP
          emailRedirectTo: window.location.origin,
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        setMessageType('success');
        setSystemMessage("Request sent. Awaiting Nature's approval.");
        setFullName('');
        setEmail('');
        setPassword('');
      }
      
    } catch (err: any) {
      setMessageType('error');
      setSystemMessage(err.message || "Anomaly detected during registration.");
    } finally {
      setLoading(false);
    }
  };

  const theme = {
    bg: 'radial-gradient(circle at center, #1C3F60 0%, #0E1A29 100%)', 
    border: 'rgba(255,255,255,0.08)',
    accent: '#76B079',
    textMain: '#FAF9F6',
    textMuted: 'rgba(250, 249, 246, 0.6)',
    inputBg: 'rgba(255, 255, 255, 0.03)',
    statusError: '#FFD06F',
    statusSuccess: '#76B079',
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center font-sans selection:bg-[#76B079] selection:text-white" 
      style={{ background: theme.bg, color: theme.textMain }}
    >
      
      <div className="w-full max-w-md p-8 md:p-12 relative z-10 animate-in fade-in zoom-in-95 duration-700 flex flex-col items-center">
        
        {/* LOGO Y ESTADO */}
        <div className="flex flex-col items-center text-center mb-10 gap-5">
          <Link to="/login" className="absolute top-0 left-0 p-2 rounded-full hover:bg-white/5 transition-colors text-white/50 hover:text-white">
            <ArrowLeft size={20} />
          </Link>

          <div className="w-16 h-16 rounded-full flex items-center justify-center relative mb-2">
            <div className="absolute inset-0 rounded-full blur-[25px] opacity-20" style={{ backgroundColor: theme.accent }}></div>
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
              <path d="M50 10C50 10 30 35 30 55C30 66.0457 38.9543 75 50 75C61.0457 75 70 66.0457 70 55C70 35 50 10 50 10Z" fill={theme.accent} fillOpacity="0.1" stroke={theme.accent} strokeWidth="3"/>
              <path d="M50 20C50 20 38 40 38 55C38 61.6274 43.3726 67 50 67C56.6274 67 62 61.6274 62 55C62 40 50 20 50 20Z" fill={theme.accent} fillOpacity="0.3" stroke={theme.accent} strokeWidth="2"/>
            </svg>
          </div>
          
          <h1 className="aether-title-light text-2xl">New Consciousness</h1>
          
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full border" style={{ borderColor: theme.border, backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <Sparkles size={14} style={{ color: messageType === 'error' ? theme.statusError : theme.accent }} />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ 
              color: messageType === 'error' ? theme.statusError : (messageType === 'success' ? theme.statusSuccess : theme.textMuted) 
            }}>
              {systemMessage ? systemMessage : 'Portal: Request Existence'}
            </p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="w-full flex flex-col gap-5">
          <div className="flex flex-col gap-2.5 relative">
            <label className="aether-eyebrow-light pl-1">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-5 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted }} />
              <input 
                type="text" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-12 pr-6 py-4 rounded-full border outline-none transition-all text-sm placeholder:opacity-30"
                style={{ backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain }}
                placeholder="Lucas Bianchi"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2.5 relative">
            <label className="aether-eyebrow-light pl-1">Biological Signature (Email)</label>
            <div className="relative">
              <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted }} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-6 py-4 rounded-full border outline-none transition-all font-mono text-sm placeholder:opacity-30"
                style={{ backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain }}
                placeholder="signature@aether.os"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2.5 relative">
            <label className="aether-eyebrow-light pl-1">Access Key</label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-5 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted }} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-6 py-4 rounded-full border outline-none transition-all font-mono text-sm placeholder:opacity-30"
                style={{ backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textMain }}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center justify-center gap-3 px-10 py-5 rounded-full font-bold transition-all hover:scale-105 active:scale-95 text-sm shadow-2xl mt-4 group overflow-hidden relative" 
            style={{ backgroundColor: theme.accent, color: '#0E1A29' }} 
          >
            <div className="absolute inset-0 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-white/30"></div>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Fingerprint size={18} />}
            <span className="relative z-10">Request Existence</span>
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-xs font-medium" style={{ color: theme.textMuted }}>
            Already blessed?{' '}
            <Link to="/login" className="font-bold underline-offset-4 hover:underline transition-all" style={{ color: theme.textMain }}>
              Synchronize here.
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}