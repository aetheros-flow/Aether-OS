import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Upload, Trash2, Sparkles } from 'lucide-react';
import { CANONICAL_CATEGORIES, resolveCategoryIcon } from '../../lib/category-icons';

const ACCENT = '#7EC28A';
const ACCENT_SOFT = '#A8D9B3';
const LOSS = '#E18B8B';

interface DineroModalsProps {
  isCryptoModalOpen: boolean;
  setIsCryptoModalOpen: (val: boolean) => void;
  isAccountModalOpen: boolean;
  setIsAccountModalOpen: (val: boolean) => void;
  isCsvModalOpen: boolean;
  setIsCsvModalOpen: (val: boolean) => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (val: boolean) => void;
  isEditModalOpen: boolean;
  setIsEditModalOpen: (val: boolean) => void;
  isTransactionModalOpen: boolean;
  setIsTransactionModalOpen: (val: boolean) => void;
  isCategoryModalOpen?: boolean;
  setIsCategoryModalOpen?: (val: boolean) => void;
  newCategory?: { name: string; icon: string };
  setNewCategory?: (val: any) => void;
  handleCreateCategory?: (e: React.FormEvent) => void;
  isBudgetModalOpen?: boolean;
  setIsBudgetModalOpen?: (val: boolean) => void;
  newBudget?: { category_name: string; limit_amount: string };
  setNewBudget?: (val: any) => void;
  handleSetBudget?: (e: React.FormEvent) => void;
  categories?: any[];
  isSubscriptionModalOpen?: boolean;
  setIsSubscriptionModalOpen?: (val: boolean) => void;
  newSubscription?: { name: string; amount: string; frequency: string; next_billing_date: string };
  setNewSubscription?: (val: any) => void;
  handleCreateSubscription?: (e: React.FormEvent) => void;

  newCrypto: any;
  setNewCrypto: (val: any) => void;
  newAccount: any;
  setNewAccount: (val: any) => void;
  newTransaction: any;
  setNewTransaction: (val: any) => void;
  editTransaction: any;
  setEditTransaction: (val: any) => void;

  importAccountId: string;
  setImportAccountId: (val: string) => void;
  csvFile: File | null;
  setCsvFile: (val: File | null) => void;
  customCategoryInput: string;
  setCustomCategoryInput: (val: string) => void;

  isSubmitting: boolean;
  accounts: any[];

  handleCreateCryptoTrade: (e: React.FormEvent) => void;
  handleCreateAccount: (e: React.FormEvent) => void;
  handleCsvImport: (e: React.FormEvent) => void;
  handleExport: (format: 'csv' | 'xlsx' | 'json' | 'pdf') => void;
  handleUpdateTransaction: (e: React.FormEvent) => void;
  handleDeleteTransaction: () => void;
  handleCreateTransaction: (e: React.FormEvent) => void;
}

// ─── Primitives ──────────────────────────────────────────────────────────────

function ModalShell({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 bg-black/70 backdrop-blur-md"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full ${maxWidth} rounded-t-[32px] md:rounded-[32px] p-6 md:p-7 max-h-[92vh] overflow-y-auto custom-scrollbar`}
            style={{
              backgroundColor: '#0E0E10',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 30px 80px -20px rgba(0,0,0,0.8)',
            }}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                {subtitle && (
                  <p className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500 mb-1">{subtitle}</p>
                )}
                <h2 className="font-serif text-2xl font-medium text-white tracking-tight">{title}</h2>
              </div>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                className="p-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </motion.button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500">{children}</label>;
}

const baseInputStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#fff',
};

const inputClass = 'w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none transition-colors focus:border-white/20';
const selectClass = inputClass + ' appearance-none cursor-pointer';

function PrimaryButton({
  children,
  type = 'button',
  onClick,
  disabled,
  variant = 'primary',
  className,
}: {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'ghost';
  className?: string;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: ACCENT, color: '#1B1714' },
    danger: { backgroundColor: 'rgba(244,63,94,0.12)', color: LOSS, border: '1px solid rgba(244,63,94,0.25)' },
    ghost: { backgroundColor: 'rgba(255,255,255,0.04)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' },
  };
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`py-3.5 px-5 rounded-full text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 ${className ?? ''}`}
      style={styles[variant]}
    >
      {children}
    </motion.button>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function DineroModals({
  isCryptoModalOpen, setIsCryptoModalOpen,
  isAccountModalOpen, setIsAccountModalOpen,
  isCsvModalOpen, setIsCsvModalOpen,
  isExportModalOpen, setIsExportModalOpen,
  isEditModalOpen, setIsEditModalOpen,
  isTransactionModalOpen, setIsTransactionModalOpen,
  isCategoryModalOpen, setIsCategoryModalOpen,
  isBudgetModalOpen, setIsBudgetModalOpen,
  isSubscriptionModalOpen, setIsSubscriptionModalOpen,
  newCrypto, setNewCrypto,
  newAccount, setNewAccount,
  newTransaction, setNewTransaction,
  newCategory, setNewCategory,
  newBudget, setNewBudget,
  newSubscription, setNewSubscription,
  editTransaction, setEditTransaction,
  importAccountId, setImportAccountId,
  csvFile, setCsvFile,
  customCategoryInput, setCustomCategoryInput,
  isSubmitting,
  accounts,
  handleCreateCryptoTrade,
  handleCreateAccount,
  handleCsvImport,
  handleExport,
  handleUpdateTransaction,
  handleDeleteTransaction,
  handleCreateCategory,
  handleCreateTransaction,
  handleSetBudget,
  handleCreateSubscription,
  categories = [],
}: DineroModalsProps) {

  const previewIcon = newCategory ? resolveCategoryIcon(newCategory.name || 'General') : null;

  return (
    <>
      {/* Crypto Trade */}
      <ModalShell open={isCryptoModalOpen} onClose={() => setIsCryptoModalOpen(false)} title="Log crypto trade" subtitle="Journal" maxWidth="max-w-2xl">
        <form onSubmit={handleCreateCryptoTrade} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <FieldLabel>Pair (ticker)</FieldLabel>
              <input
                type="text" required placeholder="e.g. BTCUSDT"
                value={newCrypto.pair}
                onChange={(e) => setNewCrypto({ ...newCrypto, pair: e.target.value.toUpperCase() })}
                className={`${inputClass} uppercase font-mono`}
                style={baseInputStyle}
              />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel>Direction</FieldLabel>
              <select
                value={newCrypto.direction}
                onChange={(e) => setNewCrypto({ ...newCrypto, direction: e.target.value })}
                className={selectClass}
                style={baseInputStyle}
              >
                <option value="Long" style={{ backgroundColor: '#111' }}>Long</option>
                <option value="Short" style={{ backgroundColor: '#111' }}>Short</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <FieldLabel>Size (USD)</FieldLabel>
              <input type="number" step="0.01" required placeholder="0.00" value={newCrypto.position_size} onChange={(e) => setNewCrypto({ ...newCrypto, position_size: e.target.value })} className={`${inputClass} font-mono`} style={baseInputStyle} />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel>Leverage</FieldLabel>
              <input type="number" step="1" required placeholder="1" value={newCrypto.leverage} onChange={(e) => setNewCrypto({ ...newCrypto, leverage: e.target.value })} className={`${inputClass} font-mono`} style={baseInputStyle} />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel>Entry price</FieldLabel>
              <input type="number" step="0.00000001" required placeholder="0.00" value={newCrypto.entry_price} onChange={(e) => setNewCrypto({ ...newCrypto, entry_price: e.target.value })} className={`${inputClass} font-mono`} style={baseInputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <FieldLabel><span style={{ color: LOSS }}>Stop loss</span></FieldLabel>
              <input type="number" step="0.00000001" placeholder="SL level" value={newCrypto.stop_loss} onChange={(e) => setNewCrypto({ ...newCrypto, stop_loss: e.target.value })} className={`${inputClass} font-mono`} style={baseInputStyle} />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel><span style={{ color: ACCENT }}>Take profit</span></FieldLabel>
              <input type="number" step="0.00000001" placeholder="TP level" value={newCrypto.take_profit} onChange={(e) => setNewCrypto({ ...newCrypto, take_profit: e.target.value })} className={`${inputClass} font-mono`} style={baseInputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <FieldLabel>Status</FieldLabel>
              <select value={newCrypto.status} onChange={(e) => setNewCrypto({ ...newCrypto, status: e.target.value })} className={selectClass} style={baseInputStyle}>
                <option value="Open" style={{ backgroundColor: '#111' }}>Open (live)</option>
                <option value="Closed" style={{ backgroundColor: '#111' }}>Closed (history)</option>
              </select>
            </div>
            {newCrypto.status === 'Closed' && (
              <div className="flex flex-col gap-2">
                <FieldLabel>Final P&L (USD)</FieldLabel>
                <input type="number" step="0.01" required placeholder="-50 or 150" value={newCrypto.pnl_neto} onChange={(e) => setNewCrypto({ ...newCrypto, pnl_neto: e.target.value })} className={`${inputClass} font-mono`} style={baseInputStyle} />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel><span className="flex justify-between w-full"><span>Setup & notes</span><span>{newCrypto.notes?.length || 0}/1000</span></span></FieldLabel>
            <textarea
              maxLength={1000} rows={3}
              placeholder="Why did you enter? Confluences, emotions…"
              value={newCrypto.notes}
              onChange={(e) => setNewCrypto({ ...newCrypto, notes: e.target.value })}
              className={`${inputClass} resize-none`}
              style={baseInputStyle}
            />
          </div>

          <PrimaryButton type="submit" disabled={isSubmitting} className="w-full mt-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save trade'}
          </PrimaryButton>
        </form>
      </ModalShell>

      {/* Account */}
      <ModalShell open={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} title="Add account" subtitle="Wallet">
        <form onSubmit={handleCreateAccount} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <FieldLabel>Account name</FieldLabel>
            <input type="text" required placeholder="Bank of America, Binance…" value={newAccount.name} onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })} className={inputClass} style={baseInputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <FieldLabel>Type</FieldLabel>
              <select value={newAccount.type} onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })} className={selectClass} style={baseInputStyle}>
                {['Checking', 'Savings', 'Cash', 'Crypto Exchange', 'Credit Card'].map(t => (
                  <option key={t} value={t} style={{ backgroundColor: '#111' }}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel>Currency</FieldLabel>
              <select value={newAccount.currency} onChange={(e) => setNewAccount({ ...newAccount, currency: e.target.value })} className={selectClass} style={baseInputStyle}>
                {['USD', 'NZD', 'ARS', 'EUR'].map(c => (
                  <option key={c} value={c} style={{ backgroundColor: '#111' }}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>Current balance</FieldLabel>
            <input type="number" step="0.01" required placeholder="0.00" value={newAccount.balance} onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })} className={`${inputClass} text-xl font-bold tabular-nums`} style={baseInputStyle} />
          </div>
          <PrimaryButton type="submit" disabled={isSubmitting} className="w-full mt-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save account'}
          </PrimaryButton>
        </form>
      </ModalShell>

      {/* CSV Import */}
      <ModalShell open={isCsvModalOpen} onClose={() => setIsCsvModalOpen(false)} title="Import data" subtitle="CSV · XLSX · JSON · PDF">
        <form onSubmit={handleCsvImport} className="flex flex-col gap-5">
          <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ backgroundColor: `${ACCENT}10`, border: `1px solid ${ACCENT}25` }}>
            <Sparkles size={16} style={{ color: ACCENT }} className="mt-0.5 flex-shrink-0" />
            <p className="text-xs leading-relaxed text-zinc-300">
              AI auto-categorization will run after import. You can edit any mis-assigned category by tapping the transaction.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>Target account</FieldLabel>
            <select value={importAccountId} onChange={(e) => setImportAccountId(e.target.value)} className={selectClass} style={baseInputStyle} required>
              <option value="" disabled style={{ backgroundColor: '#111' }}>— Select account —</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id} style={{ backgroundColor: '#111' }}>{acc.name} ({acc.currency})</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>File</FieldLabel>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.json,.pdf"
              required
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border file:border-white/10 file:text-sm file:font-semibold file:bg-white/5 file:text-white hover:file:bg-white/10 transition-all cursor-pointer"
            />
          </div>
          <PrimaryButton type="submit" disabled={isSubmitting || !csvFile || !importAccountId} className="w-full">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload size={15} /> Process file</>}
          </PrimaryButton>
        </form>
      </ModalShell>

      {/* Export */}
      <ModalShell open={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="Export" subtitle="Transactions" maxWidth="max-w-sm">
        <div className="flex flex-col gap-2">
          {(['csv', 'xlsx', 'json'] as const).map(fmt => (
            <motion.button
              key={fmt}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleExport(fmt)}
              className="py-3.5 px-5 rounded-2xl text-sm font-semibold text-white text-left flex justify-between items-center"
              style={baseInputStyle}
            >
              <span>Export as .{fmt.toUpperCase()}</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Download</span>
            </motion.button>
          ))}
        </div>
      </ModalShell>

      {/* Edit Transaction */}
      <ModalShell open={isEditModalOpen && !!editTransaction} onClose={() => { setIsEditModalOpen(false); setEditTransaction(null); }} title="Edit transaction" subtitle="Ledger">
        {editTransaction && (
          <form onSubmit={handleUpdateTransaction} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <FieldLabel>Category</FieldLabel>
                <select value={editTransaction.category} onChange={(e) => setEditTransaction({ ...editTransaction, category: e.target.value })} className={selectClass} style={baseInputStyle}>
                  {CANONICAL_CATEGORIES.map(cat => <option key={cat} value={cat} style={{ backgroundColor: '#111' }}>{cat}</option>)}
                  {categories.filter(c => !CANONICAL_CATEGORIES.includes(c.name)).map(c => (
                    <option key={c.id} value={c.name} style={{ backgroundColor: '#111' }}>{c.name}</option>
                  ))}
                  {!CANONICAL_CATEGORIES.includes(editTransaction.category) &&
                    !categories.some((c: any) => c.name === editTransaction.category) && (
                      <option value={editTransaction.category} style={{ backgroundColor: '#111' }}>{editTransaction.category}</option>
                    )}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel>Type</FieldLabel>
                <select value={editTransaction.type} onChange={(e) => setEditTransaction({ ...editTransaction, type: e.target.value })} className={selectClass} style={baseInputStyle}>
                  <option value="expense" style={{ backgroundColor: '#111' }}>Expense</option>
                  <option value="income" style={{ backgroundColor: '#111' }}>Income</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel>Amount</FieldLabel>
              <input type="number" step="0.01" required value={editTransaction.amount} onChange={(e) => setEditTransaction({ ...editTransaction, amount: e.target.value })} className={`${inputClass} text-xl font-bold tabular-nums`} style={baseInputStyle} />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel>Description</FieldLabel>
              <textarea rows={3} value={editTransaction.description} onChange={(e) => setEditTransaction({ ...editTransaction, description: e.target.value })} className={`${inputClass} resize-none`} style={baseInputStyle} />
            </div>
            <div className="flex gap-3 mt-2">
              <PrimaryButton type="button" onClick={handleDeleteTransaction} disabled={isSubmitting} variant="danger">
                <Trash2 size={14} /> Delete
              </PrimaryButton>
              <PrimaryButton type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
              </PrimaryButton>
            </div>
          </form>
        )}
      </ModalShell>

      {/* Add Transaction */}
      <ModalShell open={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} title="New transaction" subtitle="Ledger">
        <form onSubmit={handleCreateTransaction} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <FieldLabel>Type</FieldLabel>
            <div className="flex p-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { key: 'expense', label: 'Expense', color: LOSS },
                { key: 'income', label: 'Income', color: ACCENT },
              ].map(opt => {
                const active = newTransaction.type === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setNewTransaction({ ...newTransaction, type: opt.key })}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-full transition-all"
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
          <div className="flex flex-col gap-2">
            <FieldLabel>Amount</FieldLabel>
            <input type="number" step="0.01" required placeholder="0.00" value={newTransaction.amount} onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })} className={`${inputClass} text-2xl font-bold tabular-nums`} style={baseInputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <FieldLabel>Account</FieldLabel>
              <select required value={newTransaction.account_id} onChange={(e) => setNewTransaction({ ...newTransaction, account_id: e.target.value })} className={selectClass} style={baseInputStyle}>
                <option value="" disabled style={{ backgroundColor: '#111' }}>Select…</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id} style={{ backgroundColor: '#111' }}>{acc.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel>Category</FieldLabel>
              <select required value={newTransaction.category} onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })} className={selectClass} style={baseInputStyle}>
                {CANONICAL_CATEGORIES.map(cat => <option key={cat} value={cat} style={{ backgroundColor: '#111' }}>{cat}</option>)}
                {categories.filter(c => !CANONICAL_CATEGORIES.includes(c.name)).map(c => (
                  <option key={c.id} value={c.name} style={{ backgroundColor: '#111' }}>{c.name}</option>
                ))}
                <option value="custom_select" style={{ backgroundColor: '#111' }}>Custom…</option>
              </select>
            </div>
          </div>
          {newTransaction.category === 'custom_select' && (
            <div className="flex flex-col gap-2 p-4 rounded-2xl" style={{ backgroundColor: `${ACCENT}10`, border: `1px solid ${ACCENT}25` }}>
              <FieldLabel><span style={{ color: ACCENT_SOFT }}>New category name</span></FieldLabel>
              <input type="text" required placeholder="e.g. Freelance Client" value={customCategoryInput} onChange={(e) => setCustomCategoryInput(e.target.value)} className={inputClass} style={baseInputStyle} />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <FieldLabel>Description</FieldLabel>
            <input type="text" required placeholder="e.g. Supermarket, AWS infra" value={newTransaction.description} onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })} className={inputClass} style={baseInputStyle} />
          </div>
          <PrimaryButton type="submit" disabled={isSubmitting} className="w-full mt-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save transaction'}
          </PrimaryButton>
        </form>
      </ModalShell>

      {/* New Category */}
      {newCategory && setNewCategory && setIsCategoryModalOpen && handleCreateCategory && (
        <ModalShell open={!!isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="New category" subtitle="Taxonomy">
          <form onSubmit={handleCreateCategory} className="flex flex-col gap-5">
            <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {previewIcon && (
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${previewIcon.color}18`, border: `1px solid ${previewIcon.color}30` }}
                >
                  <previewIcon.icon size={20} color={previewIcon.color} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500">Preview</p>
                <p className="text-sm text-white mt-0.5 truncate">{newCategory.name || 'Start typing…'}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Icon auto-resolved from name.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel>Name</FieldLabel>
              <input
                type="text" required placeholder="e.g. Travel, Spotify…"
                value={newCategory.name}
                onChange={e => setNewCategory({ ...newCategory, name: e.target.value, icon: e.target.value })}
                className={inputClass}
                style={baseInputStyle}
              />
            </div>
            <PrimaryButton type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save category'}
            </PrimaryButton>
          </form>
        </ModalShell>
      )}

      {/* Budget */}
      {newBudget && setNewBudget && setIsBudgetModalOpen && handleSetBudget && (
        <ModalShell open={!!isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} title="Set budget" subtitle="Monthly limit">
          <form onSubmit={handleSetBudget} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <FieldLabel>Category</FieldLabel>
              <select required value={newBudget.category_name} onChange={e => setNewBudget({ ...newBudget, category_name: e.target.value })} className={selectClass} style={baseInputStyle}>
                <option value="" disabled style={{ backgroundColor: '#111' }}>Select a category…</option>
                {CANONICAL_CATEGORIES.map(cat => <option key={`budget-${cat}`} value={cat} style={{ backgroundColor: '#111' }}>{cat}</option>)}
                {categories.map((c: any) => (
                  <option key={c.id} value={c.name} style={{ backgroundColor: '#111' }}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel>Monthly limit (USD)</FieldLabel>
              <input type="number" step="0.01" required placeholder="0.00" value={newBudget.limit_amount} onChange={e => setNewBudget({ ...newBudget, limit_amount: e.target.value })} className={`${inputClass} text-2xl font-bold tabular-nums`} style={baseInputStyle} />
            </div>
            <PrimaryButton type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set limit'}
            </PrimaryButton>
          </form>
        </ModalShell>
      )}

      {/* Subscription */}
      {newSubscription && setNewSubscription && setIsSubscriptionModalOpen && handleCreateSubscription && (
        <ModalShell open={!!isSubscriptionModalOpen} onClose={() => setIsSubscriptionModalOpen(false)} title="Add subscription" subtitle="Recurring">
          <form onSubmit={handleCreateSubscription} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <FieldLabel>Service name</FieldLabel>
              <input type="text" required placeholder="Netflix, Gym, Rent…" value={newSubscription.name} onChange={e => setNewSubscription({ ...newSubscription, name: e.target.value })} className={inputClass} style={baseInputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <FieldLabel>Amount</FieldLabel>
                <input type="number" step="0.01" required placeholder="0.00" value={newSubscription.amount} onChange={e => setNewSubscription({ ...newSubscription, amount: e.target.value })} className={`${inputClass} font-bold tabular-nums`} style={baseInputStyle} />
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel>Billing</FieldLabel>
                <select value={newSubscription.frequency} onChange={e => setNewSubscription({ ...newSubscription, frequency: e.target.value })} className={selectClass} style={baseInputStyle}>
                  <option value="Monthly" style={{ backgroundColor: '#111' }}>Monthly</option>
                  <option value="Yearly" style={{ backgroundColor: '#111' }}>Yearly</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel>Next billing date</FieldLabel>
              <input type="date" required value={newSubscription.next_billing_date} onChange={e => setNewSubscription({ ...newSubscription, next_billing_date: e.target.value })} className={inputClass} style={{ ...baseInputStyle, colorScheme: 'dark' }} />
            </div>
            <PrimaryButton type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save subscription'}
            </PrimaryButton>
          </form>
        </ModalShell>
      )}
    </>
  );
}
