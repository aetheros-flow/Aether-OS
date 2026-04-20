import React, { useMemo, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  ArrowUpRight, ArrowDownRight, Wallet, TrendingUp,
  ShoppingCart, Plus, Sparkles,
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { TabType } from '../../pages/DineroDashboard';
import type { Transaction } from '../../types';
import { resolveCategoryIcon } from '../../lib/category-icons';

// ─── Neo-Dark tokens ─────────────────────────────────────────────────────────
const ACCENT = '#05DF72';
const ACCENT_SOFT = '#86EFAC';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Palette for donut slices — keeps green identity but varies hue for readability.
const PIE_COLORS = ['#05DF72', '#22D3EE', '#A78BFA', '#F472B6', '#FBBF24', '#F97316', '#60A5FA', '#34D399'];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

interface DineroOverviewProps {
  transactions: Transaction[];
  netWorthCalculated: number;
  setNewTransaction: React.Dispatch<React.SetStateAction<any>>;
  setIsTransactionModalOpen: (val: boolean) => void;
  setActiveTab?: (tab: TabType) => void;
}

export function DineroOverview({
  transactions,
  netWorthCalculated,
  setIsTransactionModalOpen,
  setActiveTab,
}: DineroOverviewProps) {
  const now = new Date();

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

      if (d.getFullYear() === selectedYear) {
        if (t.type === 'income') flowData[monthName].Income += amount;
        if (t.type === 'expense') flowData[monthName].Expense += amount;
      }

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

    return { monthlyIncome: inc, monthlyExpense: exp, categoryData, barChartData: Object.values(flowData) };
  }, [transactions, selectedYear]);

  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6),
    [transactions],
  );

  const donutCenter = categoryData.length > 0 ? `${categoryData[0].percentage}%` : '—';
  const hasTransactions = transactions.length > 0;
  const hasMonthlyExpenses = monthlyExpense > 0;

  const aiInsight = useMemo(() => {
    if (!hasTransactions) return 'No data yet. Log your first transaction to unlock insights.';
    if (monthlyExpense === 0) return `You have ${transactions.length} transactions. No expenses logged this month.`;
    if (monthlyIncome > 0 && monthlyExpense > monthlyIncome) {
      return `Expenses exceed income this month by $${(monthlyExpense - monthlyIncome).toFixed(0)}. Consider reviewing the top category.`;
    }
    if (categoryData.length > 0) {
      return `"${categoryData[0].name}" is ${categoryData[0].percentage}% of this month's spend — your dominant outflow.`;
    }
    return 'Steady month. Cashflow is within your usual range.';
  }, [hasTransactions, monthlyExpense, monthlyIncome, categoryData, transactions.length]);

  const formatMoney = (n: number) =>
    `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-6xl mx-auto px-1 md:px-0 pb-8 font-sans"
    >
      {/* HEADER */}
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500 mb-1">Overview</p>
          <h1 className="font-serif text-2xl md:text-3xl font-medium tracking-tight text-white">Financial pulse</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsTransactionModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors"
          style={{ backgroundColor: ACCENT, color: '#0A0A0A' }}
        >
          <Plus size={15} strokeWidth={2.5} /> Add
        </motion.button>
      </motion.div>

      {/* AI INSIGHT */}
      <motion.div
        variants={itemVariants}
        className="mb-5 rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-5 flex items-start gap-3"
      >
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}
        >
          <Sparkles size={16} style={{ color: ACCENT }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-1" style={{ color: ACCENT_SOFT }}>
            AI insight
          </p>
          <p className="text-sm text-zinc-200 leading-relaxed">{aiInsight}</p>
        </div>
      </motion.div>

      {/* SUMMARY STATS */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Net worth', value: netWorthCalculated, positive: netWorthCalculated >= 0, accent: ACCENT },
          { label: 'Income (month)', value: monthlyIncome, positive: true, accent: ACCENT_SOFT },
          { label: 'Expenses (month)', value: monthlyExpense, positive: false, accent: '#F87171' },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-5 flex flex-col gap-2"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              {stat.label}
            </span>
            <div className="flex items-center gap-2">
              {stat.positive
                ? <ArrowUpRight size={16} style={{ color: stat.accent }} strokeWidth={2.5} />
                : <ArrowDownRight size={16} style={{ color: stat.accent }} strokeWidth={2.5} />}
              <span className="text-2xl font-bold tabular-nums text-white tracking-tight">
                {formatMoney(stat.value)}
              </span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* CASHFLOW CHART */}
      <motion.div
        variants={itemVariants}
        className="rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-5 md:p-6 mb-5"
      >
        <div className="flex justify-between items-center mb-5">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500 mb-1">Cashflow</p>
            <h2 className="font-serif text-xl font-medium text-white tracking-tight">By month</h2>
          </div>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="appearance-none py-2 pl-4 pr-8 rounded-full text-xs font-semibold outline-none border cursor-pointer"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: '#fff', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            {availableYears.map(y => (
              <option key={y} value={y} style={{ backgroundColor: '#111', color: '#fff' }}>{y}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-5 mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: ACCENT }} />
            <span className="text-zinc-400">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#F87171' }} />
            <span className="text-zinc-400">Expense</span>
          </div>
        </div>

        {hasTransactions ? (
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={3}>
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{
                    backgroundColor: '#0A0A0A',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontSize: 12,
                  }}
                  formatter={(value: any) => `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                  dy={8}
                />
                <Bar dataKey="Income" fill={ACCENT} radius={[6, 6, 0, 0]} barSize={10} />
                <Bar dataKey="Expense" fill="#F87171" radius={[6, 6, 0, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[220px] flex flex-col items-center justify-center gap-3">
            <TrendingUp size={36} className="text-zinc-600" />
            <p className="text-sm text-zinc-500">No transactions yet.</p>
          </div>
        )}
      </motion.div>

      {/* BOTTOM GRID */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* SPENDING BREAKDOWN */}
        <div className="rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-5 md:p-6 flex flex-col">
          <div className="mb-4">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500 mb-1">This month</p>
            <h2 className="font-serif text-xl font-medium text-white tracking-tight">Spending</h2>
          </div>

          {hasMonthlyExpenses ? (
            <>
              <div className="relative w-full h-[200px] flex items-center justify-center mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      innerRadius="60%"
                      outerRadius="85%"
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0A0A0A',
                        borderRadius: '14px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#fff',
                        fontSize: 12,
                      }}
                      formatter={(value: any) => `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-white font-bold text-2xl tracking-tight tabular-nums">{donutCenter}</span>
                  {categoryData.length > 0 && (
                    <span className="text-[9px] font-black tracking-[0.2em] uppercase text-zinc-500 mt-1 text-center px-2">
                      {categoryData[0].name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2.5 mt-auto">
                {categoryData.slice(0, 5).map((cat, idx) => {
                  const { icon: Icon, color } = resolveCategoryIcon(cat.name);
                  return (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
                        >
                          <Icon size={14} color={color} />
                        </div>
                        <span className="text-sm font-medium text-zinc-200 truncate">{cat.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-white tabular-nums flex-shrink-0">
                        {cat.percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10">
              <ShoppingCart size={32} className="text-zinc-600" />
              <p className="text-sm text-zinc-500 text-center">No expenses this month.</p>
            </div>
          )}
        </div>

        {/* RECENT TRANSACTIONS */}
        <div className="rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-5 md:p-6 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500 mb-1">Activity</p>
              <h2 className="font-serif text-xl font-medium text-white tracking-tight">Recent</h2>
            </div>
            {setActiveTab && (
              <button
                onClick={() => setActiveTab('transactions')}
                className="text-xs font-semibold underline underline-offset-2"
                style={{ color: ACCENT_SOFT }}
              >
                View all
              </button>
            )}
          </div>

          {recentTransactions.length > 0 ? (
            <div className="flex flex-col gap-3 overflow-y-auto pr-1">
              {recentTransactions.map(tx => {
                const isIncome = tx.type === 'income';
                const { icon: Icon, color: catColor } = resolveCategoryIcon(tx.category);
                const amountColor = isIncome ? ACCENT : '#F87171';
                return (
                  <div key={tx.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${catColor}18`, border: `1px solid ${catColor}30` }}
                      >
                        <Icon size={16} color={catColor} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <p className="text-[14px] font-medium text-white truncate">
                          {tx.description || tx.category}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <p className="text-[14px] font-bold tabular-nums flex-shrink-0" style={{ color: amountColor }}>
                      {isIncome ? '+' : '−'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10">
              <Wallet size={32} className="text-zinc-600" />
              <p className="text-sm text-zinc-500">No transactions yet.</p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsTransactionModalOpen(true)}
                className="text-xs font-semibold px-4 py-2 rounded-full"
                style={{ backgroundColor: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}30` }}
              >
                Add your first
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
