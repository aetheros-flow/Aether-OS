import { useEffect } from 'react';

interface ShortcutOptions {
  key: string;
  cmdOrCtrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  preventDefault?: boolean;
}

/**
 * Register a keyboard shortcut. Cross-platform Cmd (macOS) / Ctrl (Win/Linux)
 * via `cmdOrCtrl: true`.
 */
export function useKeyboardShortcut(
  opts: ShortcutOptions,
  handler: (e: KeyboardEvent) => void,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== opts.key.toLowerCase()) return;
      const cmd = e.metaKey || e.ctrlKey;
      if (opts.cmdOrCtrl && !cmd) return;
      if (!opts.cmdOrCtrl && cmd) return;
      if (opts.shift && !e.shiftKey) return;
      if (!opts.shift && e.shiftKey && opts.cmdOrCtrl) {
        // allow shift-free combos to still fire if shift happens to be down
        // only reject when the user explicitly opted out.
      }
      if (opts.alt && !e.altKey) return;
      if (opts.preventDefault !== false) e.preventDefault();
      handler(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [opts.key, opts.cmdOrCtrl, opts.shift, opts.alt, opts.preventDefault, handler, enabled]);
}
