import React, { useState, useMemo } from 'react';
import { BarChart2, Activity, TrendingUp } from 'lucide-react';

// Importamos los gráficos que acabás de crear en el Paso 1 y 2
import { BarChart } from './BarChart'; 
import { AreaChart } from './AreaChart'; 

// Importamos tu tipo estricto del refactor (ajustá la ruta si es necesario)
import type { Transaction } from '../../types'; 

interface CashFlowReportProps {
  transactions: Transaction[];
}

export function CashFlowReport({ transactions }: CashFlowReportProps) {
  // Estado para controlar qué gráfico se ve
  const [chartView, setChartView] = useState<'net' | 'flow' | 'trend'>('net');

  // Procesamiento de datos: Convertir transacciones reales al formato de los gráficos
  const chartData = useMemo(() => {
    const grouped: Record<string, { income: number; expense: number }> = {};
    
    // Ordenar cronológicamente
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sorted.forEach(t => {
      const dateObj = new Date(t.date);
      const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!grouped[dateStr]) {
        grouped[dateStr] = { income: 0, expense: 0 };
      }
      
      if (t.type === 'income') grouped[dateStr].income += Number(t.amount);
      if (t.type === 'expense') grouped[dateStr].expense += Number(t.amount);
    });

    // Mapear al formato final
    return Object.entries(grouped).map(([date, data]) => ({
      date,
      Income: data.income,
      Expense: data.expense,
      "Profit/Loss": data.income - data.expense, 
    }));
  }, [transactions]);

  const valueFormatter = (number: number) => 
    `${Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(number)}`;

  return (
    <div className="bg-[#0A0B0E] border border-white/5 rounded-[32px] p-6 shadow-xl relative animate-in fade-in duration-500">
      
      {/* HEADER Y TOGGLE PREMIUM */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h3 className="text-white font-bold text-xl">Cashflow Analysis</h3>
          <p className="text-[10px] font-extrabold text-white/40 uppercase tracking-widest mt-1">
            Real-time tracking
          </p>
        </div>

        <div className="flex bg-[#12151A] p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setChartView('net')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              chartView === 'net' ? 'bg-white text-[#0A0B0E] shadow-sm' : 'text-white/40 hover:text-white/80'
            }`}
          >
            <BarChart2 size={14} /> Net
          </button>
          
          <button
            onClick={() => setChartView('flow')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              chartView === 'flow' ? 'bg-white text-[#0A0B0E] shadow-sm' : 'text-white/40 hover:text-white/80'
            }`}
          >
            <Activity size={14} /> Flow
          </button>

          <button
            onClick={() => setChartView('trend')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              chartView === 'trend' ? 'bg-white text-[#0A0B0E] shadow-sm' : 'text-white/40 hover:text-white/80'
            }`}
          >
            <TrendingUp size={14} /> Trend
          </button>
        </div>
      </div>

      {/* RENDERIZADO DE GRÁFICOS */}
      <div className="w-full mt-4">
        {chartView === 'net' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <BarChart className="h-72" data={chartData} index="date" categories={["Profit/Loss"]} yAxisWidth={60} valueFormatter={valueFormatter} showLegend={false} />
          </div>
        )}

        {chartView === 'flow' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <AreaChart className="h-72" data={chartData} index="date" categories={["Income", "Expense"]} valueFormatter={valueFormatter} />
          </div>
        )}

        {chartView === 'trend' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <AreaChart className="h-72" data={chartData} index="date" categories={["Profit/Loss"]} valueFormatter={valueFormatter} />
          </div>
        )}

        {chartData.length === 0 && (
          <div className="h-72 flex items-center justify-center border-2 border-dashed border-white/5 rounded-[24px]">
            <p className="text-white/40 font-bold text-sm">No data available for this period.</p>
          </div>
        )}
      </div>
    </div>
  );
}