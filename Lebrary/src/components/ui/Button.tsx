import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-full ' +
  'transition-all duration-200 ease-smooth active:scale-[0.97] hover:scale-[1.02] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-lumen-400 focus-visible:ring-offset-paper-100 dark:focus-visible:ring-offset-ink-900 ' +
  'disabled:pointer-events-none disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary:
    'bg-lumen-500 text-paper-50 shadow-soft hover:shadow-glow hover:bg-lumen-400 dark:bg-lumen-400 dark:text-ink-900 dark:hover:bg-lumen-300',
  secondary:
    'bg-paper-50/80 backdrop-blur text-ink-800 border border-paper-300 hover:bg-paper-50 dark:bg-ink-800/80 dark:text-ink-50 dark:border-ink-700 dark:hover:bg-ink-700',
  ghost:
    'bg-transparent text-ink-700 hover:bg-paper-200/70 dark:text-ink-100 dark:hover:bg-ink-800/80',
};

const sizes: Record<Size, string> = {
  sm: 'text-sm px-3.5 py-1.5',
  md: 'text-sm px-5 py-2.5',
  lg: 'text-base px-7 py-3.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', leadingIcon, trailingIcon, className = '', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
});
