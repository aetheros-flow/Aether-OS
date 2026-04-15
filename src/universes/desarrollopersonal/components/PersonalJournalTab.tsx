import { useState, useEffect } from 'react';
import { Loader2, Brain, Send, Smile, Zap, Meh, Frown, Quote, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { JournalEntry } from '../types';

const MOODS = [
  { id: 'happy',   icon: Smile, color: 'text-emerald-400' },
  { id: 'focused', icon: Zap,   color: 'text-purple-400'  },
  { id: 'neutral', icon: Meh,   color: 'text-blue-400'    },
  { id: 'tired',   icon: Frown, color: 'text-orange-400'  },
] as const;

export default function PersonalJournalTab() {
  const [entries,      setEntries]      = useState<JournalEntry[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [newEntry,     setNewEntry]     = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('focused');
  const [isSaving,     setIsSaving]     = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('Desarrollo_Journal')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setEntries(data);
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleSaveEntry = async () => {
    if (!newEntry.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');
      const { error: err } = await supabase.from('Desarrollo_Journal').insert([{
        user_id: user.id,
        content: newEntry,
        mood:    selectedMood,
      }]);
      if (err) throw err;
      setNewEntry('');
      await fetchEntries();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar entrada');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('¿Eliminar esta entrada?')) return;
    try {
      const { error: err } = await supabase.from('Desarrollo_Journal').delete().eq('id', id);
      if (err) throw err;
      await fetchEntries();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar entrada');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ERROR BANNER */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold px-5 py-3 rounded-2xl">
          {error}
        </div>
      )}

      {/* WRITER */}
      <div className="bg-white/70 backdrop-blur-3xl rounded-[32px] p-8 border border-white shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <Brain size={22} className="text-purple-500" />
          <h3 className="font-serif text-2xl font-bold">Deep Work Journal</h3>
        </div>

        <textarea
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          placeholder="What concepts or reflections emerged today?"
          className="w-full h-40 bg-black/5 border-none rounded-3xl p-6 text-sm font-medium focus:ring-2 focus:ring-purple-500/20 transition-all resize-none mb-6"
        />

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex bg-black/5 p-1.5 rounded-2xl gap-2">
            {MOODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMood(m.id)}
                className={`p-3 rounded-xl transition-all ${selectedMood === m.id ? 'bg-white shadow-md scale-110' : 'opacity-40 hover:opacity-100'}`}
                aria-label={m.id}
              >
                <m.icon size={18} className={m.color} />
              </button>
            ))}
          </div>

          <button
            onClick={handleSaveEntry}
            disabled={isSaving || !newEntry.trim()}
            className="w-full md:w-auto px-10 py-4 bg-[#2D2A26] text-white rounded-2xl text-[11px] font-extrabold uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-40"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14} /> Commit to Memory</>}
          </button>
        </div>
      </div>

      {/* TIMELINE */}
      <div className="space-y-6">
        {entries.map((entry) => {
          const mood = MOODS.find(m => m.id === entry.mood) ?? MOODS[2];
          const MoodIcon = mood.icon;
          return (
            <div key={entry.id} className="group bg-white/40 hover:bg-white/80 backdrop-blur-md border border-black/5 p-8 rounded-[32px] transition-all relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/20 group-hover:bg-purple-500 transition-colors" />

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <MoodIcon size={16} className={mood.color} />
                  </div>
                  <span className="text-[10px] font-extrabold text-[#8A8681] uppercase tracking-widest">
                    {new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteEntry(entry.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-all"
                  aria-label="Eliminar entrada"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="relative">
                <Quote size={40} className="absolute -top-4 -left-4 text-black/5 pointer-events-none" />
                <p className="text-sm leading-relaxed text-[#2D2A26] font-medium pl-6">{entry.content}</p>
              </div>

              {entry.tags && entry.tags.length > 0 && (
                <div className="mt-6 flex gap-2 pl-6 flex-wrap">
                  {entry.tags.map(tag => (
                    <span key={tag} className="text-[9px] font-bold bg-white/50 px-2 py-1 rounded-md border border-black/5 text-[#8A8681]">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
