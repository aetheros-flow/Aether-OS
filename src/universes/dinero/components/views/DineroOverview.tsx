import React, { useMemo } from 'react';
import { 
  ArrowUpRight, ArrowDownRight, Wallet, Target, TrendingUp, 
  Coffee, ShoppingCart, Home, Car, Zap, Heart, Film, ShoppingBag, BookOpen, Plane 
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { TabType } from '../../pages/DineroDashboard';

interface DineroOverviewProps {
  transactions: any[];
  netWorthCalculated: number;
  setNewTransaction: Function;
  setIsTransactionModalOpen: (val: boolean) => void;
  setActiveTab?: (tab: TabType) => void;
}

const CATEGORY_MAP: Record<string, { icon: any, color: string, bg: string }> = {
  'Housing & Utilities': { icon: Home, color: 'text-forest-light', bg: 'bg-sage-dark' },
  'Groceries & Supermarket': { icon: ShoppingCart, color: 'text-forest-light', bg: 'bg-sage-dark' },
  'Dining out': { icon: Coffee, color: 'text-forest-light', bg: 'bg-sage-dark' },
  'Transportation': { icon: Car, color: 'text-forest-light', bg: 'bg-sage-dark' },
  'Bills & Fees': { icon: Zap, color: 'text-forest-light', bg: 'bg-sage-dark' },
  'Entertainment & Subscriptions': { icon: Film, color: 'text-forest-light', bg: 'bg-sage-dark' },
  'Health & Fitness': { icon: Heart, color: 'text-forest-light', bg: 'bg-sage-dark' },
  'Shopping & Clothes': { icon: ShoppingBag, color: 'text-forest-light', bg: 'bg-sage-dark' },
  'Education': { icon: BookOpen, color: 'text-forest-light', bg: 'bg-sage-dark' },
  'Travel & Flights': { icon: Plane, color: 'text-forest-light', bg: 'bg-sage-dark' },
  'Investments': { icon: TrendingUp, color: 'text-forest-light', bg: 'bg-sage-dark' },
  'General': { icon: Wallet, color: 'text-forest-light', bg: 'bg-sage-dark' },
};

const PIE_COLORS = ['#0B2118', '#163E2E', '#A7F38F', '#2D3A35', '#E2EDE0', '#6EE7B7'];

export function DineroOverview({ 
  transactions, 
  netWorthCalculated, 
  setNewTransaction, 
  setIsTransactionModalOpen,
  setActiveTab
}: DineroOverviewProps) {
  
  const now = new Date();

  const { monthlyIncome, monthlyExpense, categoryData, barChartData } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    const catTotals: Record<string, number> = {};
    const flowData: Record<string, { name: string; Income: number; Expense: number }> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      flowData[dayName] = { name: dayName, Income: 0, Expense: 0 };
    }

    transactions.forEach(t => {
      const d = new Date(t.date);
      const amount = Number(t.amount);
      
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        if (t.type === 'income') inc += amount;
        if (t.type === 'expense') {
          exp += amount;
          catTotals[t.category || 'General'] = (catTotals[t.category || 'General'] || 0) + amount;
        }
      }

      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays <= 7) {
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        if (flowData[dayName]) {
          if (t.type === 'income') flowData[dayName].Income += amount;
          if (t.type === 'expense') flowData[dayName].Expense += amount;
        }
      }
    });

    const formattedCategories = Object.entries(catTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { 
      monthlyIncome: inc, 
      monthlyExpense: exp, 
      categoryData: formattedCategories,
      barChartData: Object.values(flowData)
    };
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [transactions]);

  const handleQuickAdd = (type: 'income' | 'expense') => {
    setNewTransaction((prev: any) => ({
      ...prev, type: type, category: 'General', amount: '', description: ''
    }));
    setIsTransactionModalOpen(true);
  };

  return (
    // CONTENEDOR PRINCIPAL: Flex column en Mobile, Grid avanzado en Desktop (xl)
    <div className="w-full max-w-7xl mx-auto flex flex-col xl:flex-row gap-4 md:gap-8 font-sans animate-in fade-in zoom-in-95 duration-500 pb-24 md:pb-10">
      
      {/* COLUMNA IZQUIERDA (Ocupa más espacio en Desktop) */}
      <div className="flex-1 flex flex-col gap-4 md:gap-8">
        
        {/* HERO CARD (Forest) - Adaptación: Menos padding en mobile, radios adaptativos */}
        <div className="bg-forest rounded-[28px] md:rounded-5xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 md:w-80 h-48 md:h-80 bg-mint/10 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-[10px] md:text-xs font-bold text-mint uppercase tracking-[0.2em] mb-1 md:mb-2">Total Net Worth</p>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                ${netWorthCalculated.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h1>
            </div>

            <div className="flex gap-2 md:gap-4 w-full md:w-auto">
              <button 
                onClick={() => handleQuickAdd('income')} 
                className="flex-1 md:flex-none md:px-8 bg-mint text-forest font-black uppercase tracking-widest text-[9px] md:text-[11px] py-4 rounded-[20px] md:rounded-2xl flex items-center justify-center gap-2 hover:bg-mint-hover transition-colors shadow-lg shadow-mint/20"
              >
                <ArrowUpRight size={16} /> Income
              </button>
              <button 
                onClick={() => handleQuickAdd('expense')} 
                className="flex-1 md:flex-none md:px-8 bg-forest-light border border-white/10 text-white font-black uppercase tracking-widest text-[9px] md:text-[11px] py-4 rounded-[20px] md:rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
              >
                <ArrowDownRight size={16} /> Expense
              </button>
            </div>
          </div>
        </div>

        {/* CASHFLOW BAR CHART - Adaptación: Scroll horizontal en mobile si es necesario */}
        <div className="bg-white rounded-[28px] md:rounded-4xl p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-sage-dark flex flex-col gap-6 w-full overflow-hidden">
          <div className="flex justify-between items-center">
            <h3 className="text-charcoal font-black text-lg md:text-xl">Money Flow</h3>
            <span className="text-[9px] md:text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.15em] bg-sage p-2 rounded-lg">Last 7 Days</span>
          </div>
          
          <div className="h-[180px] md:h-[250px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <Tooltip 
                  cursor={{ fill: '#F4F9F2' }} 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', fontWeight: 'bold' }} 
                />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#A0AAB2', fontWeight: 700 }} dy={10} />
                <Bar dataKey="Income" fill="#A7F38F" radius={[6, 6, 0, 0]} barSize={16} />
                <Bar dataKey="Expense" fill="#0B2118" radius={[6, 6, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* COLUMNA DERECHA (Sidebar fija en Desktop, Stack en Mobile) */}
      <div className="w-full xl:w-[400px] flex flex-col gap-4 md:gap-8">
        
        {/* SPENDING OVERVIEW (Donut Chart) */}
        <div className="bg-white rounded-[28px] md:rounded-4xl p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-sage-dark flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-6">
            <h3 className="text-charcoal font-black text-lg md:text-xl">Spending</h3>
            <button className="text-[9px] font-black text-mint uppercase tracking-widest bg-forest px-3 py-1.5 rounded-full">This Month</button>
          </div>

          <div className="relative w-full h-[180px] md:h-[220px] flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} innerRadius="70%" outerRadius="90%" paddingAngle={4} dataKey="value" stroke="none">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center text-gray-300">
                <Target size={32} className="mb-2" />
                <span className="text-[10px] uppercase tracking-widest font-bold">No Data</span>
              </div>
            )}
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
              <span className="text-charcoal font-black text-2xl md:text-3xl tracking-tighter">${monthlyExpense.toLocaleString()}</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Out</span>
            </div>
          </div>
        </div>

        {/* RECENT TRANSACTIONS */}
        <div className="bg-white rounded-[28px] md:rounded-4xl p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-sage-dark flex-1">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-charcoal font-black text-lg md:text-xl">Transactions</h3>
            <button onClick={() => setActiveTab && setActiveTab('transactions')} className="w-8 h-8 rounded-full bg-sage-dark flex items-center justify-center hover:bg-mint/30 transition-colors">
               <ArrowUpRight size={14} className="text-forest" />
            </button>
          </div>

          <div className="flex flex-col gap-5 md:gap-4">
            {recentTransactions.map((tx) => {
              const isExpense = tx.type === 'expense';
              const catData = CATEGORY_MAP[tx.category] || CATEGORY_MAP['General'];
              const Icon = catData.icon;

              return (
                <div key={tx.id} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center ${catData.bg} transition-colors group-hover:bg-mint/20`}>
                      <Icon size={18} className={catData.color} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-charcoal font-black text-sm">{tx.category}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <span className={`text-sm md:text-base font-black tracking-tighter ${isExpense ? 'text-charcoal' : 'text-emerald-500'}`}>
                    {isExpense ? '-' : '+'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}