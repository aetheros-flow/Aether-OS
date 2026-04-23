import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  /** Visual variant for context. "floating" for the home page, "inline" for headers. */
  variant?: 'floating' | 'inline';
  className?: string;
}

export default function ThemeToggle({ variant = 'floating', className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'inline') {
    return (
      <button
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className={`relative flex items-center justify-center w-10 h-10 rounded-full active:scale-90 transition-all ${className}`}
        style={{
          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
        }}
      >
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        >
          {isDark
            ? <Moon size={16} className="text-zinc-200" strokeWidth={2} />
            : <Sun size={16} className="text-amber-600" strokeWidth={2} />}
        </motion.div>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`fixed top-4 right-4 z-40 flex items-center justify-center w-11 h-11 rounded-full active:scale-90 transition-all ${className}`}
      style={{
        background: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.85)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.35)' : '0 4px 14px rgba(0,0,0,0.10)',
      }}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      >
        {isDark
          ? <Moon size={17} className="text-zinc-200" strokeWidth={2} />
          : <Sun size={17} className="text-amber-600" strokeWidth={2} />}
      </motion.div>
    </button>
  );
}
