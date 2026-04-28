import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  to?: string;
  onClick?: () => void;
}

export default function SectionHeader({ title, eyebrow, to, onClick }: SectionHeaderProps) {
  const content = (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-1">
        {eyebrow && (
          <span className="text-[10px] font-black tracking-[0.22em] uppercase" style={{ color: '#A8A096' }}>{eyebrow}</span>
        )}
        <h2 className="font-serif text-[22px] md:text-2xl font-semibold tracking-tight leading-none" style={{ color: '#F5EFE6' }}>
          {title}
        </h2>
      </div>
      {(to || onClick) && (
        <ChevronRight size={20} className="shrink-0" style={{ color: '#A8A096' }} />
      )}
    </div>
  );

  if (to) return <Link to={to} className="block">{content}</Link>;
  if (onClick) return <button onClick={onClick} className="block w-full text-left">{content}</button>;
  return content;
}
