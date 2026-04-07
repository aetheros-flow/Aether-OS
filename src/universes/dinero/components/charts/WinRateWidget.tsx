import { Target } from 'lucide-react';
import { Card, CardLabel, CardValue } from '../ui/AetherUI';

interface WinRateWidgetProps {
  winRate: string;
  totalClosedTrades: number;
}

export function WinRateWidget({ winRate, totalClosedTrades }: WinRateWidgetProps) {
  const rate = parseFloat(winRate);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;

  const isGood = rate >= 50 || isNaN(rate);
  const colorClass = isGood ? "text-emerald-500" : "text-rose-500";

  return (
    <Card interactive className="p-6 flex-row items-center justify-between h-full">
      <div className="flex flex-col gap-2">
        <CardLabel>Win Rate Tracker</CardLabel>
        <div className="flex items-baseline gap-1">
          <CardValue>{winRate}</CardValue>
          <span className="text-sm font-bold text-gray-500">%</span>
        </div>
        <span className="text-[11px] font-medium text-gray-400">{totalClosedTrades} operaciones cerradas</span>
      </div>
      
      <div className="relative flex items-center justify-center">
        {/* Círculo de fondo (Gris claro) */}
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            className="text-gray-100"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="48"
            cy="48"
          />
          {/* Círculo de progreso (Verde o Rojo) */}
          <circle
            className={`${colorClass} transition-all duration-1000 ease-out`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={isNaN(offset) ? circumference : offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="48"
            cy="48"
          />
        </svg>
        <div className="absolute flex items-center justify-center">
          <Target size={20} className={`${colorClass}`} />
        </div>
      </div>
    </Card>
  );
}