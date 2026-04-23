import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon: Icon, title, subtitle }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <Icon size={48} className="text-zinc-600 mb-4" />
      <p className="text-base font-semibold text-zinc-300 max-w-xs">{title}</p>
      {subtitle && <p className="text-sm text-zinc-500 mt-2 max-w-xs">{subtitle}</p>}
    </div>
  );
}
