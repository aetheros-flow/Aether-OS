import React from 'react';
import { Target } from 'lucide-react';

interface DineroBudgetProps {
  sortedCategoriesMap: [string, number][];
}

export function DineroBudget({ sortedCategoriesMap }: DineroBudgetProps) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/10 rounded-[20px] flex flex-col justify-center items-center py-10 shadow-sm border border-white/10">
         <Target size={40} className="text-white/50 mb-4" />
         <h3 className="text-xl font-bold text-white mb-2">Smart Budgets</h3>
         <p className="text-sm text-white/60 max-w-md text-center">Model your monthly spending limits to avoid debt.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedCategoriesMap.length > 0 ? sortedCategoriesMap.map((item) => {
           const cat = String(item[0]);
           const amount = Number(item[1]);
           const max = Math.ceil((amount + 200) / 100) * 100; // Mock limit
           const percent = Math.min((amount / max) * 100, 100);
           const isDanger = percent > 80;
           
           return (
             <div key={cat} className="bg-white/5 rounded-[20px] p-6 shadow-sm border border-white/10 flex flex-col gap-4 hover:bg-white/10 transition-all">
               <div className="flex justify-between items-center">
                  <span className="font-bold text-white">{cat}</span>
                  <span className="text-xs font-bold px-3 py-1.5 bg-black/20 rounded-[12px] text-white/70">Limit: ${max}</span>
               </div>
               <div className="flex justify-between items-end">
                  <span className={`text-2xl font-mono font-light tracking-tight ${isDanger ? 'text-[#FF8A80]' : 'text-white'}`}>
                    ${amount.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-white/60">{percent.toFixed(0)}%</span>
               </div>
               <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${isDanger ? 'bg-[#FF8A80]' : 'bg-white'}`} 
                    style={{ width: `${percent}%` }}
                  ></div>
               </div>
             </div>
           );
        }) : (
          <p className="col-span-full text-center p-10 text-sm text-white/60">No tracked expenses to model budgets yet.</p>
        )}
      </div>
    </div>
  );
}