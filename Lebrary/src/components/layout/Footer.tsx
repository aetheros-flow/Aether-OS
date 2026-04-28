export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-paper-300/50 bg-paper-50/60 backdrop-blur-xl dark:border-ink-700/40 dark:bg-ink-900/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-ink-300 dark:text-ink-200 md:flex-row lg:px-10">
        <p className="font-serif italic">Lumina Library &mdash; a quiet place for deep reading.</p>
        <p className="tabular-nums">&copy; {year} Lumina</p>
      </div>
    </footer>
  );
}
