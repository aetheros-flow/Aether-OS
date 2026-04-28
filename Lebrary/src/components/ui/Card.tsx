import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
}

export function Card({ children, interactive = false, className = '', ...rest }: CardProps) {
  const base =
    'rounded-3xl border border-paper-300/70 bg-paper-50/75 backdrop-blur-md ' +
    'shadow-soft dark:border-ink-700/60 dark:bg-ink-800/70 ' +
    'transition-all duration-300 ease-smooth';
  const hover = interactive
    ? 'hover:shadow-soft-lg hover:-translate-y-0.5 hover:border-lumen-400/40 cursor-pointer'
    : '';

  return (
    <div className={`${base} ${hover} ${className}`} {...rest}>
      {children}
    </div>
  );
}
