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

// ─── Soft Cosmos tokens (warm-dark + desaturated sage) ─────────────────────
const ACCENT = '#7EC28A';
const ACCENT_SOFT = '#A8D9B3';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Palette for donut slices — sage identity + muted variations that sit on warm-dark.
const PIE_COLORS = ['#7EC28A', '#7AB8C4', '#9F87C9', '#C090BC', '#D9B25E', '#D97A3A', '#6B8FC4', '#A8D9B3'];

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
      className="w-full max-w-6xl mx-auto px-1 md:px-0 pb-6 font-sans"
    >
      {/* HEADER */}
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500">Overview</p>
          <h1 className="font-serif text-xl md:text-2xl font-medium tracking-tight text-white">Financial pulse</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsTransactionModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors"
          style={{ backgroundColor: ACCENT, color: '#1B1714' }}
        >
          <Plus size={13} strokeWidth={2.5} /> Add
        </motion.button>
      </motion.div>

      {/* AI INSIGHT */}
      <motion.div
        variants={itemVariants}
        className="mb-3 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-3.5 flex items-start gap-2.5"
      >
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}
        >
          <Sparkles size={13} style={{ color: ACCENT }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black tracking-[0.2em] uppercase mb-0.5" style={{ color: ACCENT_SOFT }}>
            AI insight
          </p>
          <p className="text-[12px] text-zinc-200 leading-relaxed">{aiInsight}</p>
        </div>
      </motion.div>

      {/* SUMMARY STATS — single card with 3 columns to save vertical space */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-3 gap-2 mb-3 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-3"
      >
        {[
          { label: 'Net worth', value: netWorthCalculated, positive: netWorthCalculated >= 0, accent: ACCENT },
          { label: 'Income', value: monthlyIncome, positive: true, accent: ACCENT_SOFT },
          { label: 'Expenses', value: monthlyExpense, positive: false, accent: '#F87171' },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={`flex flex-col gap-1 px-1.5 ${i > 0 ? 'border-l border-white/5' : ''}`}
          >
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 truncate">
              {stat.label}
            </span>
            <div className="flex items-center gap-1">
              {stat.positive
                ? <ArrowUpRight size={12} style={{ color: stat.accent }} strokeWidth={2.5} />
                : <ArrowDownRight size={12} style={{ color: stat.accent }} strokeWidth={2.5} />}
              <span className="text-[15px] md:text-base font-bold tabular-nums text-white tracking-tight truncate">
                {formatMoney(stat.value)}
              </span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* CASHFLOW CHART */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-4 mb-3"
      >
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-[9px] font-black tracking-[0.2em] uppercase text-zinc-500">Cashflow</p>
            <h2 className="font-serif text-base font-medium text-white tracking-tight">By month</h2>
          </div>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="appearance-none py-1.5 pl-3 pr-7 rounded-full text-[11px] font-semibold outline-none border cursor-pointer"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: '#fff', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            {availableYears.map(y => (
              <option key={y} value={y} style={{ backgroundColor: '#111', color: '#fff' }}>{y}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 mb-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: ACCENT }} />
            <span className="text-zinc-400">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#F87171' }} />
            <span className="text-zinc-400">Expense</span>
          </div>
        </div>

        {hasTransactions ? (
          <div className="h-[170px] md:h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={3}>
                <Tooltip
                  cursor={{ fill: 'rgba(245,239,230,0.04)' }}
                  contentStyle={{
                    backgroundColor: '#1B1714',
                    borderRadius: '14px',
                    border: '1px solid rgba(232,221,204,0.08)',
                    color: '#F5EFE6',
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
          <div className="h-[170px] flex flex-col items-center justify-center gap-2">
            <TrendingUp size={28} className="text-zinc-600" />
            <p className="text-xs text-zinc-500">No transactions yet.</p>
          </div>
        )}
      </motion.div>

      {/* BOTTOM GRID */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* SPENDING BREAKDOWN */}
        <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-4 flex flex-col">
          <div className="mb-3">
            <p className="text-[9px] font-black tracking-[0.2em] uppercase text-zinc-500">This month</p>
            <h2 className="font-serif text-base font-medium text-white tracking-tight">Spending</h2>
          </div>

          {hasMonthlyExpenses ? (
            <>
              <div className="relative w-full h-[160px] flex items-center justify-center mb-3">
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
                        backgroundColor: '#1B1714',
                        borderRadius: '14px',
                        border: '1px solid rgba(232,221,204,0.08)',
                        color: '#F5EFE6',
                        fontSize: 12,
                      }}
                      formatter={(value: any) => `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-white font-bold text-xl tracking-tight tabular-nums">{donutCenter}</span>
                  {categoryData.length > 0 && (
                    <span className="text-[9px] font-black tracking-[0.2em] uppercase text-zinc-500 mt-0.5 text-center px-2">
                      {categoryData[0].name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mt-auto">
                {categoryData.slice(0, 5).map((cat, idx) => {
                  const { icon: Icon, color } = resolveCategoryIcon(cat.name);
                  return (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
                        >
                          <Icon size={11} color={color} />
                        </div>
                        <span className="text-[12px] font-medium text-zinc-200 truncate">{cat.name}</span>
                      </div>
                      <span className="text-[12px] font-semibold text-white tabular-nums flex-shrink-0">
                        {cat.percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8">
              <ShoppingCart size={24} className="text-zinc-600" />
              <p className="text-xs text-zinc-500 text-center">No expenses this month.</p>
            </div>
          )}
        </div>

        {/* RECENT TRANSACTIONS */}
        <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-4 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-[9px] font-black tracking-[0.2em] uppercase text-zinc-500">Activity</p>
              <h2 className="font-serif text-base font-medium text-white tracking-tight">Recent</h2>
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
            <div className="flex flex-col gap-2 overflow-y-auto pr-1">
              {recentTransactions.slice(0, 5).map(tx => {
                const isIncome = tx.type === 'income';
                const { icon: Icon, color: catColor } = resolveCategoryIcon(tx.category);
                const amountColor = isIncome ? ACCENT : '#F87171';
                return (
                  <div key={tx.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${catColor}18`, border: `1px solid ${catColor}30` }}
                      >
                        <Icon size={13} color={catColor} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <p className="text-[12px] font-medium text-white truncate leading-tight">
                          {tx.description || tx.category}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <p className="text-[12px] font-bold tabular-nums flex-shrink-0" style={{ color: amountColor }}>
                      {isIncome ? '+' : '−'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8">
              <Wallet size={24} className="text-zinc-600" />
              <p className="text-xs text-zinc-500">No transactions yet.</p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsTransactionModalOpen(true)}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
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
