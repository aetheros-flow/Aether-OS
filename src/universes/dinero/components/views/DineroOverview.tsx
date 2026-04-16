import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight, ArrowDownRight, Wallet, TrendingUp,
  Coffee, ShoppingCart, Home, Car, Zap, Heart, Film, ShoppingBag, BookOpen, Plane, Plus,
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { TabType } from '../../pages/DineroDashboard';
import type { Transaction } from '../../types';

// ─── Design tokens (consolidated) ────────────────────────────────────────────
const C = {
  bg:        '#e0f7e9',
  dark:      '#1a2d21',
  mid:       '#2e4939',
  green:     '#86efac',
  lime:      '#bef264',
  white:     '#ffffff',
  muted:     '#a0b0a8',
  text:      '#1a2d21',
} as const;

const PIE_COLORS = [C.dark, C.green, '#e0f7e9', C.lime, C.white];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  'Housing & Utilities':           Home,
  'Groceries & Supermarket':       ShoppingCart,
  'Dining out':                    Coffee,
  'Transportation':                Car,
  'Bills & Fees':                  Zap,
  'Entertainment & Subscriptions': Film,
  'Health & Fitness':              Heart,
  'Shopping & Clothes':            ShoppingBag,
  'Education':                     BookOpen,
  'Travel & Flights':              Plane,
  'Investments & Savings':         TrendingUp,
  'General':                       Wallet,
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface DineroOverviewProps {
  transactions: Transaction[];
  netWorthCalculated: number;
  setNewTransaction: React.Dispatch<React.SetStateAction<any>>;
  setIsTransactionModalOpen: (val: boolean) => void;
  setActiveTab?: (tab: TabType) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DineroOverview({
  transactions,
  netWorthCalculated,
  setIsTransactionModalOpen,
  setActiveTab,
}: DineroOverviewProps) {
  const now = new Date();

  // The year filter actually controls the bar chart data.
  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
    if (years.size === 0) years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const [selectedYear, setSelectedYear] = useState(() => now.getFullYear());

  const { monthlyIncome, monthlyExpense, categoryData, barChartData } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    const catTotals: Record<string, number> = {};

    const flowData: Record<string, { name: string; Income: number; Expense: number }> = {};
    MONTHS.forEach(m => { flowData[m] = { name: m, Income: 0, Expense: 0 }; });

    transactions.forEach(t => {
      const d = new Date(t.date);
      const amount = Number(t.amount);
      const monthName = MONTHS[d.getMonth()];

      // Bar chart: filter by selected year
      if (d.getFullYear() === selectedYear) {
        if (t.type === 'income')  flowData[monthName].Income  += amount;
        if (t.type === 'expense') flowData[monthName].Expense += amount;
      }

      // Current month totals & category breakdown
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        if (t.type === 'income') inc += amount;
        if (t.type === 'expense') {
          exp += amount;
          catTotals[t.category || 'General'] = (catTotals[t.category || 'General'] || 0) + amount;
        }
      }
    });

    const categoryData = Object.entries(catTotals)
      .map(([name, value]) => ({
        name,
        value,
        percentage: exp > 0 ? Math.round((value / exp) * 100).toString() : '0',
      }))
      .sort((a, b) => b.value - a.value);

    // All-zero bar data when no transactions exist — never fake random values.
    const barChartData = Object.values(flowData);

    return { monthlyIncome: inc, monthlyExpense: exp, categoryData, barChartData };
  }, [transactions, selectedYear]);

  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    [transactions],
  );

  // Donut center: show the top spending category's share, or '—' when no data.
  const donutCenter = categoryData.length > 0 ? `${categoryData[0].percentage}%` : '—';

  const hasTransactions = transactions.length > 0;
  const hasMonthlyExpenses = monthlyExpense > 0;

  return (
    <div
      className="w-full min-h-screen rounded-[40px] px-4 py-8 md:px-8 font-sans flex flex-col items-center"
      style={{ backgroundColor: C.bg }}
    >
      {/* HEADER */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold leading-tight" style={{ color: C.text }}>
          Financial Statistics &amp; Activity
        </h1>
        <button
          onClick={() => setIsTransactionModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all hover:opacity-90"
          style={{ backgroundColor: C.dark, color: C.white }}
        >
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      {/* SUMMARY STATS */}
      <div className="w-full max-w-4xl grid grid-cols-3 gap-4 mb-4">
        {[
          { label: 'Net Worth',        value: netWorthCalculated, positive: netWorthCalculated >= 0 },
          { label: 'Monthly Income',   value: monthlyIncome,      positive: true },
          { label: 'Monthly Expenses', value: monthlyExpense,     positive: false },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-[24px] p-5 flex flex-col gap-1"
            style={{ backgroundColor: C.dark }}
          >
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>
              {stat.label}
            </span>
            <div className="flex items-center gap-2">
              {stat.positive
                ? <ArrowUpRight size={16} style={{ color: C.green }} />
                : <ArrowDownRight size={16} style={{ color: C.lime }} />}
              <span className="text-xl font-bold tabular-nums" style={{ color: C.white }}>
                ${Math.abs(stat.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full max-w-4xl flex flex-col gap-4">

        {/* CASHFLOW CHART */}
        <div className="w-full rounded-[32px] p-6 shadow-xl flex flex-col" style={{ backgroundColor: C.dark }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold" style={{ color: C.white }}>Cashflow</h2>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="appearance-none py-2 pl-4 pr-8 rounded-xl text-sm outline-none border-none cursor-pointer"
              style={{ backgroundColor: C.mid, color: C.white }}
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-center space-x-6 mb-6 text-sm">
            {[{ label: 'Income', color: C.green }, { label: 'Expense', color: C.lime }].map(l => (
              <div key={l.label} className="flex items-center space-x-2">
                <span className="w-4 h-4 rounded inline-block" style={{ backgroundColor: l.color }} />
                <span style={{ color: C.white }}>{l.label}</span>
              </div>
            ))}
          </div>

          {hasTransactions ? (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={2}>
                  <Tooltip
                    cursor={{ fill: C.mid }}
                    contentStyle={{ backgroundColor: '#0B2118', borderRadius: '12px', border: 'none', color: '#fff' }}
                    formatter={(value: any) => `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: C.muted }} dy={10} />
                  <Bar dataKey="Income" fill={C.green} radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="Expense" fill={C.lime} radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center gap-3">
              <TrendingUp size={40} style={{ color: C.muted, opacity: 0.4 }} />
              <p className="text-sm font-medium" style={{ color: C.muted }}>
                No transactions yet. Add one to see your cashflow.
              </p>
            </div>
          )}
        </div>

        {/* BOTTOM GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">

          {/* SPENDING BREAKDOWN */}
          <div className="rounded-[32px] p-6 shadow-xl flex flex-col" style={{ backgroundColor: C.dark }}>
            <h2 className="text-lg font-semibold mb-6" style={{ color: C.white }}>
              Spending Breakdown
            </h2>

            {hasMonthlyExpenses ? (
              <>
                <div className="relative w-full h-[200px] flex items-center justify-center mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        innerRadius="55%"
                        outerRadius="80%"
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0B2118', borderRadius: '12px', border: 'none', color: '#fff' }}
                        formatter={(value: any) => `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label: percentage of the top category */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-white font-semibold text-xl tracking-tight">{donutCenter}</span>
                    {categoryData.length > 0 && (
                      <span className="text-[10px] font-bold text-center px-2" style={{ color: C.muted }}>
                        {categoryData[0].name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4 mt-auto">
                  {categoryData.slice(0, 5).map((cat, idx) => {
                    const Icon = CATEGORY_ICONS[cat.name] ?? Wallet;
                    const bgColors = [C.mid, C.mid, C.mid, C.lime, C.white];
                    const iconColors = [C.green, C.green, C.white, C.dark, C.dark];
                    return (
                      <div key={idx} className="flex justify-between items-center">
                        <div className="flex items-center space-x-3" style={{ color: C.muted }}>
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: bgColors[idx % 5], color: iconColors[idx % 5] }}
                          >
                            <Icon size={14} />
                          </div>
                          <span className="text-sm font-medium">{cat.name}</span>
                        </div>
                        <span className="text-sm font-semibold" style={{ color: C.white }}>
                          {cat.percentage}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10">
                <ShoppingCart size={36} style={{ color: C.muted, opacity: 0.4 }} />
                <p className="text-sm font-medium text-center" style={{ color: C.muted }}>
                  No expenses logged this month.
                </p>
              </div>
            )}
          </div>

          {/* RECENT TRANSACTIONS */}
          <div className="rounded-[32px] p-6 shadow-xl flex flex-col overflow-hidden" style={{ backgroundColor: C.dark }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold" style={{ color: C.white }}>Recent Transactions</h2>
              {setActiveTab && (
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs font-bold underline"
                  style={{ color: C.green }}
                >
                  View all
                </button>
              )}
            </div>

            {recentTransactions.length > 0 ? (
              <div className="flex flex-col gap-5 overflow-y-auto pr-2">
                {recentTransactions.map(tx => {
                  const isIncome = tx.type === 'income';
                  const Icon = CATEGORY_ICONS[tx.category] ?? Wallet;

                  const iconBg    = isIncome ? C.mid    : '#3d3d2a';
                  const iconColor = isIncome ? C.green  : C.lime;
                  const badgeBg   = isIncome ? C.green  : C.lime;
                  const badgeText = isIncome ? '#14532d' : '#713f12';
                  const badgeLabel = isIncome ? 'Income' : 'Expense';

                  return (
                    <div key={tx.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: iconBg, color: iconColor }}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[14px] font-medium truncate max-w-[120px]" style={{ color: C.white }}>
                            {tx.description || tx.category}
                          </p>
                          <p className="text-[11px]" style={{ color: C.muted }}>
                            {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="text-[14px] font-semibold" style={{ color: C.white }}>
                          {isIncome ? '+' : '-'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <span
                          className="inline-block px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{ backgroundColor: badgeBg, color: badgeText }}
                        >
                          {badgeLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10">
                <Wallet size={36} style={{ color: C.muted, opacity: 0.4 }} />
                <p className="text-sm font-medium" style={{ color: C.muted }}>
                  No transactions yet.
                </p>
                <button
                  onClick={() => setIsTransactionModalOpen(true)}
                  className="text-xs font-bold px-4 py-2 rounded-lg"
                  style={{ backgroundColor: C.mid, color: C.green }}
                >
                  Add your first transaction
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}