import { useState, useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Plus, ArrowLeft, Receipt } from 'lucide-react';
import { resolveCategoryIcon } from '../../lib/category-icons';

const ACCENT = '#7EC28A';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface DineroCategoriesProps {
  transactions: any[];
  categories: Category[];
  setIsCategoryModalOpen: (val: boolean) => void;
}

export function DineroCategories({ transactions, categories, setIsCategoryModalOpen }: DineroCategoriesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categoriesMap = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const map: Record<string, { total: number; count: number }> = {};
    categories.forEach(c => { map[c.name] = { total: 0, count: 0 }; });
    expenses.forEach(t => {
      const cat = t.category || 'General';
      if (!map[cat]) map[cat] = { total: 0, count: 0 };
      map[cat].total += Number(t.amount);
      map[cat].count += 1;
    });
    return map;
  }, [transactions, categories]);

  const sortedCategories = Object.entries(categoriesMap)
    .sort((a, b) => b[1].total - a[1].total)
    .filter(([name, data]) => data.count > 0 || categories.some(c => c.name === name));

  const totalExpenses = sortedCategories.reduce((acc, curr) => acc + curr[1].total, 0);

  const categoryTransactions = useMemo(() => {
    if (!selectedCategory) return [];
    return transactions
      .filter(t => t.category === selectedCategory && t.type === 'expense')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedCategory]);

  const selectedIcon = selectedCategory ? resolveCategoryIcon(selectedCategory) : null;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-6xl mx-auto px-1 md:px-0 pb-8 font-sans flex flex-col gap-5"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500 mb-1">
            {selectedCategory ? 'Category' : 'By type'}
          </p>
          <h1 className="font-serif text-2xl md:text-3xl font-medium tracking-tight text-white">
            {selectedCategory ?? 'Categories'}
          </h1>
        </div>
        {!selectedCategory && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold"
            style={{ backgroundColor: ACCENT, color: '#1B1714' }}
          >
            <Plus size={15} strokeWidth={2.5} /> New category
          </motion.button>
        )}
      </motion.div>

      {selectedCategory ? (
        // DETAIL VIEW
        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors self-start px-4 py-2 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 overflow-hidden">
            <div className="p-5 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {selectedIcon && (
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${selectedIcon.color}18`, border: `1px solid ${selectedIcon.color}30` }}
                  >
                    <selectedIcon.icon size={16} color={selectedIcon.color} />
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Transactions</p>
                  <p className="text-sm font-medium text-white">{categoryTransactions.length} records</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col divide-y divide-white/5">
              {categoryTransactions.map((t) => (
                <div key={t.id} className="flex justify-between items-center p-4 hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)' }}
                    >
                      <Receipt size={15} color="#F87171" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-white truncate">{t.description}</span>
                      <span className="text-[11px] text-zinc-500">
                        {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {t.Finanzas_accounts?.name || 'Account'}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold tabular-nums text-sm" style={{ color: '#F87171' }}>
                    −${Number(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              {categoryTransactions.length === 0 && (
                <p className="text-center text-sm text-zinc-500 py-12">No expenses in this category yet.</p>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        // GRID
        <>
          {sortedCategories.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 py-20 flex flex-col items-center justify-center gap-2"
            >
              <p className="text-sm font-medium text-white">No categories yet</p>
              <p className="text-xs text-zinc-500">Create your first one.</p>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {sortedCategories.map(([catName, data]) => {
                const percentage = totalExpenses > 0 ? ((data.total / totalExpenses) * 100).toFixed(1) : '0';
                const { icon: Icon, color } = resolveCategoryIcon(catName);

                return (
                  <motion.button
                    key={catName}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategory(catName)}
                    className="text-left rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-5 flex flex-col justify-between gap-4 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
                      >
                        <Icon size={18} color={color} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm text-white leading-tight truncate">{catName}</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-0.5">
                          {data.count} {data.count === 1 ? 'txn' : 'txns'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-end">
                      <span className="text-xl font-bold text-white tabular-nums tracking-tight">
                        ${data.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span
                        className="text-[11px] font-semibold px-2 py-1 rounded-md tabular-nums"
                        style={{ backgroundColor: `${color}15`, color }}
                      >
                        {percentage}%
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
