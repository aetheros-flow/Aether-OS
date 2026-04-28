import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Loader2, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useContentLanguage } from '@/context/LanguageContext';
import type { Book, Chapter } from '@/types';

interface ChatPanelProps {
  book: Book;
  chapter: Chapter;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export function ChatPanel({ book, chapter }: ChatPanelProps) {
  const { user } = useAuth();
  const { language } = useContentLanguage();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset thread when the chapter changes.
  useEffect(() => {
    setMessages([]);
    setInput('');
    setError(null);
  }, [chapter.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  // Dev-only. In production there's no Vite middleware to serve /api/chat.
  if (!import.meta.env.DEV) return null;
  if (!user) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || busy) return;
    setError(null);
    setBusy(true);

    const nextMessages: Message[] = [...messages, { role: 'user', text: trimmed }];
    setMessages(nextMessages);
    setInput('');

    try {
      const sb = getSupabase();
      const { data: sessionRes } = await sb.auth.getSession();
      const token = sessionRes.session?.access_token;
      if (!token) throw new Error('No active session.');

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          chapterId: chapter.id,
          message: trimmed,
          history: messages,
          accessToken: token,
          language,
        }),
      });
      const payload = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !payload.reply) {
        throw new Error(payload.error || `HTTP ${res.status}`);
      }
      setMessages([...nextMessages, { role: 'model', text: payload.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setMessages(messages); // rollback user message
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open AI companion"
        title="Ask the AI companion about this chapter"
        className="fixed bottom-6 right-6 z-40 flex h-12 items-center gap-2 rounded-full bg-gradient-to-br from-lumen-400 to-lumen-600 px-4 text-ink-900 shadow-soft-lg transition-all hover:scale-[1.03] hover:shadow-glow active:scale-95"
      >
        <Sparkles className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-widest">Ask</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[95] flex items-end justify-end p-0 md:items-center md:justify-end md:p-6">
          <div
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 flex h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-paper-300/70 bg-paper-50 shadow-soft-lg md:h-[70vh] md:rounded-3xl dark:border-ink-700/60 dark:bg-ink-900">
            <header className="flex items-center justify-between border-b border-paper-300/60 px-5 py-3 dark:border-ink-700/60">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-lumen-400 to-lumen-600 text-ink-900">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">Lumina AI</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-ink-300 dark:text-ink-200">
                    Ch. {chapter.order}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-paper-200 hover:text-ink-700 dark:text-ink-200 dark:hover:bg-ink-800"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="space-y-3 rounded-2xl border border-dashed border-paper-300/70 p-4 text-xs text-ink-300 dark:border-ink-700/60 dark:text-ink-200">
                  <p className="flex items-center gap-1.5 font-semibold uppercase tracking-[0.18em]">
                    <MessageCircle className="h-3 w-3" /> Try asking
                  </p>
                  <ul className="space-y-1.5 text-sm text-ink-700 dark:text-ink-100">
                    <li>— "What's the main argument here?"</li>
                    <li>— "How does this connect to chapter {Math.max(1, chapter.order - 1)}?"</li>
                    <li>— "Give me an analogy I'll remember."</li>
                  </ul>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-lumen-400/20 text-ink-900 dark:text-ink-50'
                        : 'bg-paper-200/60 text-ink-800 dark:bg-ink-800/80 dark:text-ink-50'
                    }`}
                  >
                    {m.text.split('\n').map((line, idx) => (
                      <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ))}

              {busy && (
                <div className="flex items-center gap-2 text-xs text-ink-300 dark:text-ink-200">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Lumina is thinking…
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}
            </div>

            <form
              onSubmit={onSubmit}
              className="flex items-end gap-2 border-t border-paper-300/60 p-3 dark:border-ink-700/60"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void onSubmit(e as unknown as FormEvent);
                  }
                }}
                placeholder="Ask about this chapter…"
                rows={1}
                disabled={busy}
                className="flex-1 resize-none rounded-2xl border border-paper-300/70 bg-paper-50/70 px-3 py-2 text-sm outline-none focus:border-lumen-400/70 dark:border-ink-700/60 dark:bg-ink-900/60 dark:text-ink-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || busy}
                aria-label="Send"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-lumen-500 text-paper-50 transition-colors hover:bg-lumen-400 disabled:opacity-40 dark:bg-lumen-400 dark:text-ink-900"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
