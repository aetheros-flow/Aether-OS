import { useState, useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Search, Plus, Download, Upload, Pencil } from 'lucide-react';
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

interface DineroTransactionsProps {
  accounts: any[];
  transactions: any[];
  setEditTransaction: (t: any) => void;
  setIsEditModalOpen: (val: boolean) => void;
  setIsTransactionModalOpen: (val: boolean) => void;
  onImportClick: () => void;
  onExportClick: () => void;
}

export function DineroTransactions({
  accounts,
  transactions,
  setEditTransaction,
  setIsEditModalOpen,
  setIsTransactionModalOpen,
  onImportClick,
  onExportClick,
}: DineroTransactionsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch =
        (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchAccount = filterAccount === 'all' || t.account_id === filterAccount;
      const matchType = filterType === 'all' || t.type === filterType;
      return matchSearch && matchAccount && matchType;
    });
  }, [transactions, searchTerm, filterAccount, filterType]);

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
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500 mb-1">Ledger</p>
          <h1 className="font-serif text-2xl md:text-3xl font-medium tracking-tight text-white">Transactions</h1>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsTransactionModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold"
            style={{ backgroundColor: ACCENT, color: '#1B1714' }}
          >
            <Plus size={15} strokeWidth={2.5} /> New
          </motion.button>
          <div className="flex items-center gap-1 bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-1 rounded-full">
            <button
              onClick={onImportClick}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              title="Import"
            >
              <Upload size={15} />
            </button>
            <button
              onClick={onExportClick}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              title="Export"
            >
              <Download size={15} />
            </button>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col gap-3 items-start">
        {/* Filters — compact horizontal toolbar */}
        <motion.div variants={itemVariants} className="w-full">
          <div className="rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-2.5 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[160px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-full text-xs font-medium outline-none transition-colors"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff',
                }}
              />
            </div>

            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="py-2 px-3 rounded-full text-xs font-medium outline-none appearance-none cursor-pointer max-w-[160px]"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff',
              }}
            >
              <option value="all" style={{ backgroundColor: '#111' }}>All accounts</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id} style={{ backgroundColor: '#111' }}>{acc.name}</option>
              ))}
            </select>

            <div className="flex p-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { key: 'all', label: 'All', color: '#fff' },
                { key: 'income', label: 'In', color: ACCENT },
                { key: 'expense', label: 'Out', color: '#F87171' },
              ].map(opt => {
                const active = filterType === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setFilterType(opt.key)}
                    className="px-3 py-1.5 text-[11px] font-semibold rounded-full transition-all"
                    style={{
                      backgroundColor: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: active ? opt.color : 'rgba(255,255,255,0.45)',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* List */}
        <motion.div variants={itemVariants} className="flex-1 w-full">
          <div className="rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block w-full overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black">
                    <th className="p-4 pl-6 w-36">Date</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Account</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-right pr-6">Amount</th>
                    <th className="p-4 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((t, index) => {
                    const { icon: Icon, color } = resolveCategoryIcon(t.category);
                    const isIncome = t.type === 'income';
                    return (
                      <tr
                        key={t.id}
                        onClick={() => { setEditTransaction(t); setIsEditModalOpen(true); }}
                        className={`group cursor-pointer hover:bg-white/[0.03] transition-colors ${index !== filteredTransactions.length - 1 ? 'border-b border-white/5' : ''}`}
                      >
                        <td className="p-4 pl-6">
                          <span className="text-xs font-medium text-zinc-500">
                            {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-sm text-white">{t.description}</td>
                        <td className="p-4">
                          <span
                            className="text-[11px] font-medium px-2 py-1 rounded-md"
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' }}
                          >
                            {t.Finanzas_accounts?.name || 'Unknown'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}>
                            <Icon size={11} color={color} />
                            <span className="text-[11px] font-semibold" style={{ color }}>{t.category}</span>
                          </div>
                        </td>
                        <td className={`p-4 text-right pr-6 font-bold tabular-nums`} style={{ color: isIncome ? ACCENT : '#F87171' }}>
                          {isIncome ? '+' : '−'}${Number(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-right">
                          <Pencil size={13} className="text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden flex flex-col divide-y divide-white/5">
              {filteredTransactions.map((t) => {
                const { icon: Icon, color } = resolveCategoryIcon(t.category);
                const isIncome = t.type === 'income';
                return (
                  <button
                    key={t.id}
                    onClick={() => { setEditTransaction(t); setIsEditModalOpen(true); }}
                    className="flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors w-full"
                  >
                    <div
                      className="w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
                    >
                      <Icon size={15} color={color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{t.description}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                        {t.Finanzas_accounts?.name || 'Unknown'} · {t.category}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className="text-sm font-bold tabular-nums" style={{ color: isIncome ? ACCENT : '#F87171' }}>
                        {isIncome ? '+' : '−'}${Number(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredTransactions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <Search size={28} className="text-zinc-600" />
                <p className="text-sm font-medium text-white">No transactions found</p>
                <p className="text-xs text-zinc-500">Adjust your filters or add a new record.</p>
              </div>
            )}
            <div className="px-5 py-3 border-t border-white/5 flex justify-between items-center text-[11px] font-semibold text-zinc-500">
              <span>Showing {filteredTransactions.length} records</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
