import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Leaf, Fingerprint, Loader2, Sparkles, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Paleta Root de Aether OS
  const theme = {
    bg: '#FAF9F6',
    surface: '#FFFFFF',
    textMain: '#2D2A26',
    textMuted: '#8A8681',
    accent: '#487D4B', // Verde naturaleza
    border: '#E8E6E1'
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isRegistering) {
        // SECUENCIA DE NACIMIENTO (REGISTRO)
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;
        
        setMessage("Petición de existencia enviada. Aguardando el veredicto del Modo Nature (Dios).");
      } else {
        // SECUENCIA DE CONEXIÓN (LOGIN)
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // VERIFICACIÓN DEL MODO NATURE
        if (authData.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_approved')
            .eq('id', authData.user.id)
            .single();

          if (profileError) throw profileError;

          if (!profile?.is_approved) {
            // Expulsar al usuario si no tiene la bendición de la Naturaleza
            await supabase.auth.signOut();
            setError("Acceso denegado: Tu consciencia aún no ha sido aprobada por el Modo Nature (Dios).");
            return;
          }

          // Acceso concedido, redirigir al núcleo
          navigate('/');
        }
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió una anomalía en la sincronización.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans selection:bg-[#487D4B] selection:text-white" style={{ backgroundColor: theme.bg, color: theme.textMain }}>
      
      {/* Fondo decorativo orgánico */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 flex items-center justify-center">
        <div className="w-[800px] h-[800px] rounded-full blur-[120px]" style={{ backgroundColor: theme.accent, opacity: 0.1 }}></div>
      </div>

      <div className="w-full max-w-md p-8 md:p-12 relative z-10">
        
        {/* Cabecera del Portal */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-sm border transition-transform duration-700 hover:rotate-180" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <Leaf size={28} style={{ color: theme.accent }} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-serif tracking-tight mb-2">Aether OS</h1>
          <p className="text-xs uppercase tracking-[0.2em] font-medium" style={{ color: theme.textMuted }}>
            Portal de Sincronización
          </p>
        </div>

        {/* Mensajes del Sistema */}
        {error && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in" style={{ backgroundColor: 'rgba(220, 38, 38, 0.05)', color: '#DC2626', border: '1px solid rgba(220, 38, 38, 0.1)' }}>
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in" style={{ backgroundColor: 'rgba(72, 125, 75, 0.05)', color: theme.accent, border: `1px solid rgba(72, 125, 75, 0.2)` }}>
            <Sparkles size={18} className="shrink-0 mt-0.5" />
            <p>{message}</p>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleAuth} className="flex flex-col gap-5">
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold" style={{ color: theme.textMuted }}>Firma Biológica (Email)</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-transparent border outline-none focus:border-[#487D4B] transition-colors shadow-sm"
              style={{ borderColor: theme.border, backgroundColor: theme.surface }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold" style={{ color: theme.textMuted }}>Clave de Consciencia</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-transparent border outline-none focus:border-[#487D4B] transition-colors shadow-sm"
              style={{ borderColor: theme.border, backgroundColor: theme.surface }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-4 rounded-2xl font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2 shadow-lg hover:shadow-xl"
            style={{ backgroundColor: theme.textMain, color: theme.bg, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Fingerprint size={18} />}
            <span>{isRegistering ? 'Solicitar Existencia' : 'Sincronizar'}</span>
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
              setMessage(null);
            }}
            className="text-xs font-medium uppercase tracking-wider underline-offset-4 hover:underline transition-all"
            style={{ color: theme.textMuted }}
          >
            {isRegistering ? 'Ya tengo la bendición. Iniciar sesión.' : 'Nueva consciencia. Solicitar registro.'}
          </button>
        </div>

      </div>
    </div>
  );
}