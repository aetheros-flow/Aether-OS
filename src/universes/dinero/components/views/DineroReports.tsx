import React from 'react';
import { Trophy, Sparkles } from 'lucide-react';

interface DineroReportsProps {
  netWorthCalculated: number;
  sortedCategoriesMap: [string, number][];
  totalExpensesCalculated: number;
}

export function DineroReports({ 
  netWorthCalculated, 
  sortedCategoriesMap, 
  totalExpensesCalculated 
}: DineroReportsProps) {
  
  const kryptoniteCategory = sortedCategoriesMap.length > 0 ? String(sortedCategoriesMap[0][0]) : 'None';
  const kryptonitePercentage = sortedCategoriesMap.length > 0 
    ? ((Number(sortedCategoriesMap[0][1]) / totalExpensesCalculated) * 100).toFixed(0) 
    : 0;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="bg-black/20 rounded-[20px] flex flex-col items-center text-center justify-center py-10 gap-2 border border-white/5 shadow-sm">
           <div className="p-4 rounded-full bg-white/5 mb-2 shadow-xl">
             <Trophy size={32} className="text-[#FFD700]" />
           </div>
           <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Financial Score</span>
           <p className="text-5xl font-mono font-light text-white">840</p>
           <span className="text-xs text-[#05DF72] font-bold">+12 pts vs Last Month</span>
        </div>

        {/* Kryptonite Card */}
        <div className="bg-white/5 rounded-[20px] p-8 flex flex-col justify-center gap-4 shadow-sm border border-white/10 hover:bg-white/10 transition-colors">
           <span className="text-xs font-bold uppercase tracking-widest text-white/50">Your Monthly Kryptonite</span>
           <h3 className="text-2xl font-bold text-white">{kryptoniteCategory}</h3>
           <p className="text-sm text-white/60">
             This category represented <span className="font-bold text-[#FF8A80]">{kryptonitePercentage}%</span> of your outflows.
           </p>
        </div>

        {/* Net Worth Card */}
        <div className="bg-white/5 rounded-[20px] p-8 flex flex-col justify-center gap-4 shadow-sm border border-white/10 hover:bg-white/10 transition-colors">
           <span className="text-xs font-bold uppercase tracking-widest text-white/50">Net Worth</span>
           <h3 className="text-3xl font-mono font-light text-white">${netWorthCalculated.toLocaleString()}</h3>
           <p className="text-sm text-white/60">Consolidated balance estimating all your current active accounts.</p>
        </div>
      </div>

      {/* Premium Banner */}
      <div className="bg-white/10 rounded-[20px] flex flex-col items-center py-12 border border-white/5 shadow-sm mt-2">
         <Sparkles size={40} className="text-white mb-4" />
         <h3 className="text-xl font-bold text-white mb-2">Premium Report Generating</h3>
         <p className="text-sm text-white/60 max-w-md text-center">
           At the end of the month, your immersive financial story will appear here like Spotify Wrapped.
         </p>
      </div>
    </div>
  );
}