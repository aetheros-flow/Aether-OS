import { useState, useMemo } from 'react';
import { Wallet, TrendingUp, DollarSign, Filter, Clock, ArrowRight } from 'lucide-react';
import { CashFlowChart } from '../charts/CashFlowChart';
import { ExpensePieChart } from '../charts/ExpensePieChart';
import { Card, CardLabel, CardValue, Badge, Dropdown } from '../ui/AetherUI';

interface DineroOverviewProps {
  accounts: any[];
  transactions: any[];
  cryptoTrades: any[];
  netWorthCalculated: number;
  setActiveTab: (tab: any) => void;
  theme: any;
}

export function DineroOverview({ accounts, transactions, cryptoTrades, netWorthCalculated, setActiveTab }: DineroOverviewProps) {
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | '90days'>('all');

  const filteredTransactions = useMemo(() => {
    if (timeFilter === 'all') return transactions;
    const now = new Date();
    
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      if (timeFilter === 'month') {
        return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      }
      if (timeFilter === '90days') {
        const diffTime = Math.abs(now.getTime() - tDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 90;
      }
      return true;
    });
  }, [transactions, timeFilter]);

  const activeCryptoValue = cryptoTrades
    .filter(t => t.status === 'Open')
    .reduce((acc, t) => acc + Number(t.position_size), 0);

  const realNetWorth = netWorthCalculated + activeCryptoValue;

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
  const savingsRate = totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1) : '0.0';

  const expensesByCategoryMap: Record<string, number> = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc: Record<string, number>, curr) => {
      const cat = curr.category || 'General';
      acc[cat] = (acc[cat] || 0) + Number(curr.amount);
      return acc;
    }, {});

  const sortedCategoriesMap = Object.entries(expensesByCategoryMap).sort((a, b) => b[1] - a[1]);

  const recentActivity = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="w-full max-w-7xl flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ fontFamily: "'Nunito', sans-serif" }}>
      
      {/* Barra de Filtros Estilo Premium */}
      <div className="flex justify-between items-center w-full">
        <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">Overview</h2>
        
        {/* Usamos el nuevo Dropdown de AetherUI */}
        <Dropdown 
          value={timeFilter}
          onChange={(val) => setTimeFilter(val as any)}
          icon={<Filter size={14} className="text-gray-400" />}
          options={[
            { value: 'all', label: 'All Time' },
            { value: 'month', label: 'This Month' },
            { value: '90days', label: 'Last 90 Days' }
          ]}
        />
      </div>

      {/* Tarjetas Superiores (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <Card onClick={() => setActiveTab('reports')} className="p-6 gap-3">
          <div className="flex justify-between items-start">
            <CardLabel>Total Net Worth</CardLabel>
            <div className="p-2 bg-gray-50 rounded-lg"><DollarSign size={16} className="text-gray-500" /></div>
          </div>
          <CardValue>${realNetWorth.toLocaleString()}</CardValue>
        </Card>

        <Card onClick={() => setActiveTab('radar')} className="p-6 gap-3">
          <div className="flex justify-between items-start">
            <CardLabel>Active Crypto</CardLabel>
            <div className="p-2 bg-blue-50 rounded-lg"><TrendingUp size={16} className="text-blue-600" /></div>
          </div>
          <CardValue className="text-blue-700">${activeCryptoValue.toLocaleString()}</CardValue>
        </Card>
        
        <Card className="p-6 gap-3 border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <CardLabel>Savings Rate</CardLabel>
            <div className="p-2 bg-emerald-50 rounded-lg"><Wallet size={16} className="text-emerald-600" /></div>
          </div>
          <div className="flex items-baseline gap-1">
             <CardValue>{savingsRate}</CardValue>
             <span className="text-sm font-bold text-gray-500">%</span>
          </div>
        </Card>

        <Card onClick={() => setActiveTab('transactions')} className="p-6 gap-2 justify-between bg-gray-50/50">
          <div className="flex justify-between items-start mb-2">
            <span className="font-bold text-sm text-gray-800 truncate">Income vs Expenses</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase text-gray-500">In</span>
              <span className="text-sm font-bold text-emerald-600 tabular-nums">+${totalIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase text-gray-500">Out</span>
              <span className="text-sm font-bold text-rose-600 tabular-nums">-${totalExpense.toLocaleString()}</span>
            </div>
          </div>
        </Card>

      </div>

      {/* Sección de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CashFlowChart transactions={filteredTransactions} />
        </div>
        <div className="lg:col-span-1">
          <ExpensePieChart sortedCategoriesMap={sortedCategoriesMap} />
        </div>
      </div>

      {/* Actividad Reciente */}
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-500" />
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Recent Activity</h3>
          </div>
          <button onClick={() => setActiveTab('transactions')} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
            View all <ArrowRight size={12} />
          </button>
        </div>
        <div className="flex flex-col">
          {recentActivity.map((t, i) => (
             <div key={t.id} className={`flex justify-between items-center p-4 hover:bg-gray-50 transition-colors ${i !== recentActivity.length -1 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                    <span className={`font-bold ${t.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>{t.type === 'income' ? '+' : '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">{t.description}</span>
                    <span className="text-[11px] text-gray-500 uppercase font-medium">{t.category} • {new Date(t.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-bold tabular-nums text-base ${t.type === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount}
                  </span>
                </div>
             </div>
          ))}
          {recentActivity.length === 0 && (
             <p className="text-center text-sm text-gray-500 py-10">No transactions recorded.</p>
          )}
        </div>
      </Card>

    </div>
  );
}