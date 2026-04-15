import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, ArrowRight, Home, ShoppingCart, Coffee, 
  Car, Zap, Heart, Film, Plus, Minus, Wallet,
  BookOpen, Plane, ShoppingBag, Gift, Briefcase, Shield, TrendingUp, Tag
} from 'lucide-react';
import type { TabType } from '../../pages/DineroDashboard';

interface DineroOverviewProps {
  accounts: any[];
  transactions: any[];
  cryptoTrades: any[];
  netWorthCalculated: number;
  setActiveTab: (tab: TabType) => void;
  theme: any;
  setNewTransaction: React.Dispatch<React.SetStateAction<{
    account_id: string;
    amount: string;
    type: string;
    category: string;
    description: string;
  }>>;
  setIsTransactionModalOpen: (val: boolean) => void;
}

const CATEGORY_MAP: Record<string, { icon: any, color: string }> = {
  'Housing & Utilities': { icon: Home, color: '#8B5CF6' },      
  'Groceries & Supermarket': { icon: ShoppingCart, color: '#05DF72' }, 
  'Dining out': { icon: Coffee, color: '#FE7F01' },             
  'Transportation': { icon: Car, color: '#FFD700' },            
  'Bills & Fees': { icon: Zap, color: '#FF0040' },              
  'Entertainment & Subscriptions': { icon: Film, color: '#00E5FF' }, 
  'Health & Fitness': { icon: Heart, color: '#1447E6' },        
  'Education': { icon: BookOpen, color: '#C81CDE' },            
  'Travel & Flights': { icon: Plane, color: '#38BDF8' },        
  'Shopping & Clothes': { icon: ShoppingBag, color: '#F472B6' },
  'Gifts & Donations': { icon: Gift, color: '#34D399' },        
  'Business & Work': { icon: Briefcase, color: '#94A3B8' },     
  'Insurance & Taxes': { icon: Shield, color: '#6366F1' },      
  'Investments': { icon: TrendingUp, color: '#10B981' },        
  'General': { icon: Wallet, color: '#9CA3AF' },                
};

const generateFallbackColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 70%, 55%)`; 
};

export function DineroOverview({ 
  accounts, transactions, netWorthCalculated, setActiveTab, 
  setNewTransaction, setIsTransactionModalOpen 
}: DineroOverviewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  
  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // --- LÓGICA MONEFY: Abrir modal directamente con la categoría pre-seleccionada ---
  const handleQuickAdd = (type: 'income' | 'expense', categoryStr: string = 'General') => {
    setNewTransaction((prev) => ({
      ...prev,
      type: type,
      category: categoryStr,
      amount: '',
      description: ''
    }));
    setIsTransactionModalOpen(true);
  };

  const { income, expense, categoryData } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    const catTotals: Record<string, number> = {};

    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()) {
        const amount = Number(t.amount);
        if (t.type === 'income') {
          inc += amount;
        } else if (t.type === 'expense') {
          exp += amount;
          const cat = t.category || 'General';
          catTotals[cat] = (catTotals[cat] || 0) + amount;
        }
      }
    });

    const formattedCategories = Object.entries(catTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, amount]) => {
        const mappedData = CATEGORY_MAP[name];
        const icon = mappedData ? mappedData.icon : Tag;
        const color = mappedData ? mappedData.color : generateFallbackColor(name);

        return {
          name,
          amount,
          percentage: exp > 0 ? (amount / exp) * 100 : 0,
          color: color,
          Icon: icon
        };
      });

    return { income: inc, expense: exp, categoryData: formattedCategories };
  }, [transactions, currentDate]);

  const balance = income - expense;
  const isBalanceNegative = balance < 0;

  const RADIUS = 90;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  let currentOffset = 0; 

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* 1. NAVEGADOR DE MESES */}
      <div className="flex items-center justify-between w-full max-w-md bg-white/80 backdrop-blur-xl rounded-full px-4 py-2.5 shadow-sm border border-gray-100 mb-8 mt-2">
        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
          <ArrowLeft size={16} />
        </button>
        <span className="font-extrabold text-[#2D2A26] uppercase tracking-widest text-[11px]">
          {monthName}
        </span>
        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
          <ArrowRight size={16} />
        </button>
      </div>

      {/* 2. RADIAL MONEFY-STYLE DASHBOARD */}
      <div className="relative w-full max-w-lg flex flex-col items-center justify-center bg-white/60 backdrop-blur-2xl rounded-[40px] p-8 shadow-[0_20px_40px_rgb(0,0,0,0.03)] border border-white">
        
        <div className="relative w-full aspect-square max-w-[340px] flex items-center justify-center mt-4 mb-4">
          <svg viewBox="0 0 320 320" className="w-full h-full transform -rotate-90 drop-shadow-md overflow-visible relative z-0">
            <circle cx="160" cy="160" r={RADIUS} fill="none" stroke="#F3F4F6" strokeWidth="24" />
            
            {categoryData.length > 0 ? categoryData.map((cat) => {
              const strokeDasharray = `${(cat.percentage / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
              const strokeDashoffset = -currentOffset;
              currentOffset += (cat.percentage / 100) * CIRCUMFERENCE;

              return (
                <circle
                  key={cat.name}
                  cx="160"
                  cy="160"
                  r={RADIUS}
                  fill="none"
                  stroke={cat.color}
                  strokeWidth="24"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out hover:stroke-width-[28px] cursor-pointer"
                  style={{ filter: `drop-shadow(0 0 4px ${cat.color}40)` }}
                  onClick={() => handleQuickAdd('expense', cat.name)}
                />
              );
            }) : null}
          </svg>

          {/* ÍCONOS ORBITALES (Distribución Uniforme para no amontonarse) */}
          {categoryData.map((cat: any, index: number) => {
             const totalNodes = categoryData.length;
             const angle = (index * (360 / totalNodes)) - 90; 
             const rad = angle * (Math.PI / 180);
             
             const distancePercent = 45; 
             const x = 50 + distancePercent * Math.cos(rad); 
             const y = 50 + distancePercent * Math.sin(rad);

             return (
               <div 
                 key={cat.name + 'icon'}
                 onClick={() => handleQuickAdd('expense', cat.name)}
                 className="absolute w-12 h-12 -ml-6 -mt-6 bg-white rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.08)] border border-gray-50 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer z-10"
                 style={{ left: `${x}%`, top: `${y}%` }}
                 title={`${cat.name}: $${cat.amount}`}
               >
                 <cat.Icon size={18} color={cat.color} />
               </div>
             );
          })}

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
             <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Balance</span>
             <span className={`text-3xl font-extrabold tracking-tighter ${isBalanceNegative ? 'text-rose-600' : 'text-[#2D2A26]'}`}>
               ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
             </span>
             <div className="flex items-center gap-3 mt-3">
               <div className="flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                 <span className="text-[10px] font-bold text-gray-500">${income.toLocaleString()}</span>
               </div>
               <div className="flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                 <span className="text-[10px] font-bold text-gray-500">${expense.toLocaleString()}</span>
               </div>
             </div>
          </div>
        </div>

        {/* 3. BOTONES DE ACCIÓN RÁPIDA (Abren el modal, no cambian de pestaña) */}
        <div className="flex w-full gap-4 mt-12 relative z-20">
          <button 
            onClick={() => handleQuickAdd('expense')}
            className="flex-1 flex flex-col items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 py-4 rounded-[24px] transition-all hover:-translate-y-1 shadow-sm"
          >
             <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center shadow-sm">
                <Minus size={16} className="text-white" />
             </div>
             <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-widest">Expense</span>
          </button>

          <button 
            onClick={() => handleQuickAdd('income')}
            className="flex-1 flex flex-col items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 py-4 rounded-[24px] transition-all hover:-translate-y-1 shadow-sm"
          >
             <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                <Plus size={16} className="text-white" />
             </div>
             <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest">Income</span>
          </button>
        </div>

      </div>

      <div className="w-full max-w-lg bg-[#2D2A26] rounded-[24px] p-6 mt-6 shadow-xl flex items-center justify-between">
         <div className="flex flex-col">
           <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Total Net Worth</span>
           <span className="text-xl font-extrabold text-white tracking-tight">
             ${netWorthCalculated.toLocaleString('en-US', { minimumFractionDigits: 2 })}
           </span>
         </div>
         <Wallet size={24} className="text-gray-500" />
      </div>

    </div>
  );
}