import { Languages } from 'lucide-react';
import { useContentLanguage } from '@/context/LanguageContext';

export function LanguageToggle() {
  const { language, toggleLanguage } = useContentLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={`Switch reading language (currently ${language.toUpperCase()})`}
      title={`Reading language: ${language.toUpperCase()}`}
      className="group inline-flex items-center gap-2 rounded-full border border-paper-300/70 bg-paper-50/80 backdrop-blur-md px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink-700 shadow-soft transition-all duration-300 ease-smooth hover:scale-[1.03] hover:border-lumen-400/60 hover:text-lumen-500 active:scale-95 dark:border-ink-700/60 dark:bg-ink-800/70 dark:text-ink-100 dark:hover:text-lumen-400"
    >
      <Languages className="h-3.5 w-3.5 opacity-80 transition-opacity group-hover:opacity-100" />
      <span className="tabular-nums">{language}</span>
    </button>
  );
}
