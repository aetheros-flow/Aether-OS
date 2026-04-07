import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, Fingerprint, Mail, KeyRound, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'neutral' | 'error'>('neutral');

  // Dentro de LoginPage.tsx, simplificamos el handleLogin:

const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSystemMessage(null);

    try {
      // @ts-ignore
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

    // Ya no verificamos is_approved, el RLS de la base de datos 
    // se encargará de que solo vea SUS propios datos.
    navigate('/');
    
  } catch (err: any) {
    setMessageType('error');
    setSystemMessage(err.message || "A synchronization anomaly occurred.");
  } finally {
    setLoading(false);
  }
};

  // ==========================================
  // TEMA PREMIUM INMERSIVO (Base medianoche)
  // ==========================================
  const theme = {
    // Fondo inmersivo profundo (Medianoche / Naval)
    bg: 'radial-gradient(circle at center, #1C3F60 0%, #0E1A29 100%)', 
    border: 'rgba(255,255,255,0.08)', // Bordes muy sutiles
    accent: '#76B079',       // Verde Pleasant (Aether Finanzas)
    textMain: '#FAF9F6',     // Crema ultra suave para títulos
    textMuted: 'rgba(250, 249, 246, 0.6)', // Crema difuminado para subtítulos
    inputBg: 'rgba(255, 255, 255, 0.03)', // Fondo de input casi invisible
    statusNeutral: '#FAF9F6', 
    statusError: '#FFD06F',  // Oro suave/pastel para advertencias (Aether Salud)
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center font-sans selection:bg-[#76B079] selection:text-white" 
      style={{ background: theme.bg, color: theme.textMain }}
    >
      
      <div className="w-full max-w-md p-8 md:p-12 relative z-10 animate-in fade-in zoom-in-95 duration-700 flex flex-col items-center">
        
        {/* LOGO Y SISTEMA DE ESTADO */}
        <div className="flex flex-col items-center text-center mb-16 gap-5">
          {/* Logo Aether Leaf 2.0: Abstracto y Sofisticado */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center relative mb-2">
            <div className="absolute inset-0 rounded-full blur-[30px] opacity-30" style={{ backgroundColor: theme.accent }}></div>
            <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
              <path d="M50 10C50 10 30 35 30 55C30 66.0457 38.9543 75 50 75C61.0457 75 70 66.0457 70 55C70 35 50 10 50 10Z" fill={theme.accent} fillOpacity="0.1" stroke={theme.accent} strokeWidth="3"/>
              <path d="M50 20C50 20 38 40 38 55C38 61.6274 43.3726 67 50 67C56.6274 67 62 61.6274 62 55C62 40 50 20 50 20Z" fill={theme.accent} fillOpacity="0.3" stroke={theme.accent} strokeWidth="2"/>
              <path d="M50 85V75" stroke={theme.textMuted} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          
          <h1 className="aether-title-light">Aether OS</h1>
          
          {/* System State: Silent & Integrated */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full border transition-colors duration-300" style={{ borderColor: theme.border, backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <Sparkles size={14} style={{ color: systemMessage && messageType === 'error' ? theme.statusError : theme.accent }} />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: systemMessage && messageType === 'error' ? theme.statusError : theme.textMuted }}>
              {systemMessage ? systemMessage : 'Access Status: Awaiting Approval (Mode: Nature)'}
            </p>
          </div>
        </div>

        {/* FORMULARIO DE LOGUEO */}
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-6 relative">
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
                style={{ 
                  backgroundColor: theme.inputBg, 
                  borderColor: theme.border, 
                  color: theme.textMain 
                }}
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
                style={{ 
                  backgroundColor: theme.inputBg, 
                  borderColor: theme.border, 
                  color: theme.textMain 
                }}
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* BOTÓN REDONDEADO PREMIUM (Verde Finanzas) */}
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center justify-center gap-3 px-10 py-5 rounded-full font-bold transition-all hover:scale-105 active:scale-95 text-sm shadow-2xl mt-6 group overflow-hidden relative" 
            style={{ backgroundColor: theme.accent, color: '#0E1A29' }} 
          >
            {/* Brillo sutil en hover */}
            <div className="absolute inset-0 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-white/30"></div>
            
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Fingerprint size={18} />}
            <span className="relative z-10">Synchronize</span>
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-xs font-medium" style={{ color: theme.textMuted }}>
            New consciousness?{' '}
            <Link to="/registro" className="font-bold underline-offset-4 hover:underline transition-all" style={{ color: theme.textMain }}>
              Request registration here.
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}