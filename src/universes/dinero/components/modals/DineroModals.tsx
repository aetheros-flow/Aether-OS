import React from 'react';
import { X, Loader2, Upload } from 'lucide-react';

const CATEGORIES = [
  "General",
  "Housing & Utilities",
  "Groceries & Supermarket",
  "Dining out",
  "Transportation",
  "Health & Fitness",
  "Work & IT",
  "Entertainment & Subscriptions",
  "Education",
  "Investments & Savings"
];

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

  return (
    <>
      {/* Crypto Modal */}
      {isCryptoModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-[20px] shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 text-forest-DEFAULT">
            <div className="flex justify-between items-center mb-8 border-b border-gray-50 pb-4">
              <h2 className="text-2xl font-bold">Crypto Trade Log</h2>
              <button onClick={() => setIsCryptoModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100"><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateCryptoTrade} className="flex flex-col gap-6">
              
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Pair (Ticker)</label>
                  <input type="text" required placeholder="e.g. BTCUSDT" value={newCrypto.pair} onChange={(e) => setNewCrypto({...newCrypto, pair: e.target.value.toUpperCase()})} className="px-4 py-3 bg-gray-50 border border-gray-200 outline-none focus:border-mint-DEFAULT rounded-[12px] uppercase" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Direction</label>
                  <select value={newCrypto.direction} onChange={(e) => setNewCrypto({...newCrypto, direction: e.target.value})} className="px-4 py-3 bg-gray-50 border border-gray-200 outline-none focus:border-mint-DEFAULT rounded-[12px] appearance-none cursor-pointer">
                    <option value="Long">Long</option>
                    <option value="Short">Short</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Position Size (USD)</label>
                  <input type="number" step="0.01" required placeholder="0.00" value={newCrypto.position_size} onChange={(e) => setNewCrypto({...newCrypto, position_size: e.target.value})} className="px-4 py-3 bg-gray-50 border border-gray-200 outline-none focus:border-mint-DEFAULT rounded-[12px] font-mono text-sm" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Leverage (x)</label>
                  <input type="number" step="1" required placeholder="1" value={newCrypto.leverage} onChange={(e) => setNewCrypto({...newCrypto, leverage: e.target.value})} className="px-4 py-3 bg-gray-50 border border-gray-200 outline-none focus:border-mint-DEFAULT rounded-[12px] font-mono text-sm" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Entry Price</label>
                  <input type="number" step="0.00000001" required placeholder="0.00" value={newCrypto.entry_price} onChange={(e) => setNewCrypto({...newCrypto, entry_price: e.target.value})} className="px-4 py-3 bg-gray-50 border border-gray-200 outline-none focus:border-mint-DEFAULT rounded-[12px] font-mono text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-rose-400">Stop Loss (SL)</label>
                  <input type="number" step="0.00000001" placeholder="SL Level" value={newCrypto.stop_loss} onChange={(e) => setNewCrypto({...newCrypto, stop_loss: e.target.value})} className="px-4 py-3 bg-gray-50 border border-gray-200 outline-none focus:border-rose-400 rounded-[12px] font-mono text-sm" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-mint-DEFAULT">Take Profit (TP)</label>
                  <input type="number" step="0.00000001" placeholder="TP Level" value={newCrypto.take_profit} onChange={(e) => setNewCrypto({...newCrypto, take_profit: e.target.value})} className="px-4 py-3 bg-gray-50 border border-gray-200 outline-none focus:border-mint-DEFAULT rounded-[12px] font-mono text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Trade Status</label>
                    <select value={newCrypto.status} onChange={(e) => setNewCrypto({...newCrypto, status: e.target.value})} className="px-4 py-3 bg-gray-50 border border-gray-200 outline-none focus:border-mint-DEFAULT rounded-[12px] appearance-none cursor-pointer">
                        <option value="Open">Open (Live)</option>
                        <option value="Closed">Closed (History)</option>
                    </select>
                </div>
                {newCrypto.status === 'Closed' && (
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-forest-DEFAULT">Final PnL (USD)</label>
                        <input type="number" step="0.01" required placeholder="e.g. -50 or 150" value={newCrypto.pnl_neto} onChange={(e) => setNewCrypto({...newCrypto, pnl_neto: e.target.value})} className="px-4 py-3 bg-gray-50 border border-gray-200 outline-none focus:border-mint-DEFAULT rounded-[12px] font-mono text-sm" />
                    </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex justify-between"><span>Setup & Notes</span><span>{newCrypto.notes.length}/1000</span></label>
                <textarea maxLength={1000} rows={3} placeholder="Why did you enter? Confluences, emotions..." value={newCrypto.notes} onChange={(e) => setNewCrypto({...newCrypto, notes: e.target.value})} className="px-4 py-3 bg-gray-50 border border-gray-200 outline-none focus:border-mint-DEFAULT rounded-[12px] text-sm resize-none" />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-2 rounded-[12px] font-bold shadow-md hover:shadow-lg transition-all flex justify-center items-center text-forest-DEFAULT bg-mint-DEFAULT hover:bg-mint-hover">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Trade'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Account */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-[20px] shadow-2xl border border-gray-100 max-w-md w-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-forest-DEFAULT">Add Account</h2>
              <button onClick={() => setIsAccountModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateAccount} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Account Name</label>
                <input type="text" required placeholder="e.g. Bank of America, Binance" value={newAccount.name} onChange={(e) => setNewAccount({...newAccount, name: e.target.value})} className="px-4 py-3 bg-white text-sm font-medium border border-gray-200 outline-none transition-all focus:border-mint-DEFAULT rounded-[12px] text-forest-DEFAULT" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Type</label>
                  <select value={newAccount.type} onChange={(e) => setNewAccount({...newAccount, type: e.target.value})} className="px-4 py-3 bg-white text-sm font-medium border border-gray-200 outline-none rounded-[12px] appearance-none cursor-pointer text-forest-DEFAULT">
                    <option value="Checking">Checking</option>
                    <option value="Savings">Savings</option>
                    <option value="Cash">Cash</option>
                    <option value="Crypto Exchange">Crypto Exchange</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Currency</label>
                  <select value={newAccount.currency} onChange={(e) => setNewAccount({...newAccount, currency: e.target.value})} className="px-4 py-3 bg-white text-sm font-medium border border-gray-200 outline-none rounded-[12px] appearance-none cursor-pointer text-forest-DEFAULT">
                    <option value="USD">USD</option>
                    <option value="NZD">NZD</option>
                    <option value="ARS">ARS</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Current Balance</label>
                <input type="number" step="0.01" required placeholder="0.00" value={newAccount.balance} onChange={(e) => setNewAccount({...newAccount, balance: e.target.value})} className="px-4 py-3 bg-white text-xl font-mono font-bold border border-gray-200 outline-none transition-all focus:border-mint-DEFAULT rounded-[12px] text-forest-DEFAULT" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-3.5 mt-2 rounded-[12px] font-bold shadow-md hover:shadow-lg transition-all flex justify-center items-center bg-mint-DEFAULT text-forest-DEFAULT">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: CSV Import */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-[20px] shadow-2xl border border-gray-100 max-w-md w-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-8 border-b border-gray-50 pb-4">
              <h2 className="text-xl font-bold text-forest-DEFAULT">Data Import Tool</h2>
              <button onClick={() => setIsCsvModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100"><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCsvImport} className="flex flex-col gap-6">
              <p className="text-sm font-medium text-gray-500 leading-relaxed">Select the target account for the imported records.</p>
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Target Account</label>
                <select value={importAccountId} onChange={(e) => setImportAccountId(e.target.value)} className="px-4 py-3 bg-white text-sm font-medium border border-gray-200 outline-none rounded-[12px] appearance-none text-forest-DEFAULT" required>
                  <option value="" disabled>-- Select account --</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500">File Payload</label>
                <input type="file" accept=".csv,.xlsx,.xls,.json,.pdf" required onChange={(e) => setCsvFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-black hover:file:bg-black/10 transition-all cursor-pointer" />
              </div>

              <button type="submit" disabled={isSubmitting || !csvFile || !importAccountId} className="w-full py-3.5 rounded-[12px] font-bold shadow-md hover:shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 bg-forest-DEFAULT text-white">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload size={18} /><span>Process File</span></>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Export */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-[20px] shadow-2xl border border-gray-100 max-w-sm w-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-forest-DEFAULT">Export Transactions</h2>
              <button onClick={() => setIsExportModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="flex flex-col gap-3">
               <button onClick={() => handleExport('csv')} className="py-3 font-bold text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-[12px] text-forest-DEFAULT transition-colors">Export as .CSV</button>
               <button onClick={() => handleExport('xlsx')} className="py-3 font-bold text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-[12px] text-forest-DEFAULT transition-colors">Export as .XLSX</button>
               <button onClick={() => handleExport('json')} className="py-3 font-bold text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-[12px] text-forest-DEFAULT transition-colors">Export as .JSON</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Transaction */}
      {isEditModalOpen && editTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-[20px] shadow-2xl border border-gray-100 max-w-md w-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
              <h2 className="text-xl font-bold text-forest-DEFAULT">Edit Transaction</h2>
              <button onClick={() => {setIsEditModalOpen(false); setEditTransaction(null);}} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleUpdateTransaction} className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Category</label>
                  <select value={editTransaction.category} onChange={(e) => setEditTransaction({...editTransaction, category: e.target.value})} className="px-4 py-3 bg-white text-sm font-medium border border-gray-200 outline-none rounded-[12px] appearance-none cursor-pointer text-forest-DEFAULT">
                    {!CATEGORIES.includes(editTransaction.category) && <option value={editTransaction.category}>{editTransaction.category}</option>}
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Type</label>
                  <select value={editTransaction.type} onChange={(e) => setEditTransaction({...editTransaction, type: e.target.value})} className="px-4 py-3 bg-white text-sm font-medium border border-gray-200 outline-none rounded-[12px] appearance-none cursor-pointer text-forest-DEFAULT">
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Amount</label>
                <input type="number" step="0.01" required value={editTransaction.amount} onChange={(e) => setEditTransaction({...editTransaction, amount: e.target.value})} className="px-4 py-3 bg-white text-xl font-mono font-bold border border-gray-200 outline-none transition-all focus:border-mint-DEFAULT rounded-[12px] text-forest-DEFAULT" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Details</label>
                <textarea rows={4} value={editTransaction.description} onChange={(e) => setEditTransaction({...editTransaction, description: e.target.value})} className="w-full p-4 rounded-[12px] bg-gray-50/50 border border-gray-200 outline-none transition-all focus:bg-white focus:border-mint-DEFAULT text-sm text-forest-DEFAULT resize-none" />
              </div>
              <div className="flex gap-4 mt-2">
                <button type="button" onClick={() => handleDeleteTransaction()} disabled={isSubmitting} className="py-3.5 px-6 rounded-[12px] font-bold shadow-sm hover:shadow-md transition-all flex justify-center items-center bg-red-50 text-red-600 hover:bg-red-100">Delete</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3.5 rounded-[12px] font-bold shadow-md hover:shadow-lg transition-all flex justify-center items-center bg-forest-DEFAULT text-white">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Transaction */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-[20px] shadow-2xl border border-gray-100 max-w-md w-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-forest-DEFAULT">Log Transaction</h2>
              <button onClick={() => setIsTransactionModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateTransaction} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Transaction Type</label>
                <div className="flex bg-gray-100 p-1.5 rounded-[16px]">
                  <button type="button" onClick={() => setNewTransaction({...newTransaction, type: 'expense'})} className={`flex-1 py-3 text-sm font-bold rounded-[12px] transition-all ${newTransaction.type === 'expense' ? 'bg-white shadow-sm text-rose-500' : 'text-gray-500 hover:bg-gray-200/50'}`}>Expense</button>
                  <button type="button" onClick={() => setNewTransaction({...newTransaction, type: 'income'})} className={`flex-1 py-3 text-sm font-bold rounded-[12px] transition-all ${newTransaction.type === 'income' ? 'bg-white shadow-sm text-mint-hover' : 'text-gray-500 hover:bg-gray-200/50'}`}>Income</button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Amount</label>
                <input type="number" step="0.01" required placeholder="0.00" value={newTransaction.amount} onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})} className="px-4 py-3 bg-white text-xl font-mono font-bold border border-gray-200 outline-none transition-all focus:border-mint-DEFAULT rounded-[12px] text-forest-DEFAULT" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Account</label>
                  <select required value={newTransaction.account_id} onChange={(e) => setNewTransaction({...newTransaction, account_id: e.target.value})} className="px-4 py-3 bg-white text-sm font-medium border border-gray-200 outline-none rounded-[12px] appearance-none cursor-pointer text-forest-DEFAULT">
                    <option value="" disabled>Select...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Category</label>
                  <select required value={newTransaction.category} onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})} className="px-4 py-3 bg-white text-sm font-medium border border-gray-200 outline-none rounded-[12px] appearance-none cursor-pointer text-forest-DEFAULT">
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="custom_select">Custom...</option>
                  </select>
                </div>
              </div>
              {newTransaction.category === 'custom_select' && (
                  <div className="flex flex-col gap-2 p-4 bg-sage-dark border border-sage-dark/80 rounded-[12px]">
                    <label className="text-xs font-bold uppercase tracking-wide text-forest-DEFAULT">New Category Name</label>
                    <input type="text" required placeholder="e.g. Freelance Client" value={customCategoryInput} onChange={(e) => setCustomCategoryInput(e.target.value)} className="px-4 py-2 bg-white text-sm font-medium border border-gray-200 outline-none transition-all rounded-[12px] text-forest-DEFAULT" />
                  </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Description</label>
                <input type="text" required placeholder="e.g. Supermarket, AWS Infra" value={newTransaction.description} onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})} className="px-4 py-3 bg-white text-sm font-medium border border-gray-200 outline-none rounded-[12px] text-forest-DEFAULT" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-3.5 mt-2 rounded-[12px] font-bold shadow-md hover:shadow-lg transition-all flex justify-center items-center bg-forest-DEFAULT text-white">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Category */}
      {isCategoryModalOpen && setIsCategoryModalOpen && newCategory && setNewCategory && handleCreateCategory && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-extrabold text-gray-900">New Category</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateCategory} className="p-6 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex flex-col gap-2 w-1/4">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Icon</label>
                  <input 
                    type="text" required maxLength={2} 
                    value={newCategory.icon} 
                    onChange={e => setNewCategory({...newCategory, icon: e.target.value})} 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-center text-xl outline-none focus:border-mint-DEFAULT transition-all cursor-pointer" 
                  />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Name</label>
                  <input 
                    type="text" required placeholder="e.g. Travel, Spotify..." 
                    value={newCategory.name} 
                    onChange={e => setNewCategory({...newCategory, name: e.target.value})} 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-mint-DEFAULT transition-all" 
                  />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-mint-DEFAULT hover:bg-mint-hover text-forest-DEFAULT rounded-xl text-sm font-extrabold shadow-sm transition-colors flex items-center justify-center">
                  {isSubmitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Budget Settings */}
      {isBudgetModalOpen && setIsBudgetModalOpen && newBudget && setNewBudget && handleSetBudget && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-extrabold text-gray-900">Set Category Budget</h3>
              <button onClick={() => setIsBudgetModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSetBudget} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Category</label>
                <select 
                  required 
                  value={newBudget.category_name} 
                  onChange={e => setNewBudget({...newBudget, category_name: e.target.value})} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-mint-DEFAULT transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select a category...</option>
                  {CATEGORIES.map(cat => <option key={`budget-${cat}`} value={cat}>{cat}</option>)}
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Monthly Limit (USD)</label>
                <input 
                  type="number" step="0.01" required placeholder="0.00" 
                  value={newBudget.limit_amount} 
                  onChange={e => setNewBudget({...newBudget, limit_amount: e.target.value})} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-2xl font-bold text-gray-900 outline-none focus:border-mint-DEFAULT transition-all" 
                />
              </div>

              <div className="pt-2 border-t border-gray-50 mt-2">
                <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-forest-DEFAULT hover:bg-forest-light text-white rounded-xl text-sm font-extrabold shadow-sm transition-colors flex items-center justify-center">
                  {isSubmitting ? 'Saving...' : 'Set Budget Limit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Subscriptions */}
      {isSubscriptionModalOpen && setIsSubscriptionModalOpen && newSubscription && setNewSubscription && handleCreateSubscription && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-extrabold text-gray-900">Add Subscription</h3>
              <button onClick={() => setIsSubscriptionModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleCreateSubscription} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Service Name</label>
                <input 
                  type="text" required placeholder="Netflix, Gym, Rent..." 
                  value={newSubscription.name} 
                  onChange={e => setNewSubscription({...newSubscription, name: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-mint-DEFAULT transition-all" 
                />
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Amount</label>
                  <input 
                    type="number" step="0.01" required placeholder="0.00" 
                    value={newSubscription.amount} 
                    onChange={e => setNewSubscription({...newSubscription, amount: e.target.value})} 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-mint-DEFAULT transition-all" 
                  />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Billing</label>
                  <select 
                    value={newSubscription.frequency} 
                    onChange={e => setNewSubscription({...newSubscription, frequency: e.target.value})} 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-mint-DEFAULT transition-all appearance-none"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Next Billing Date</label>
                <input 
                  type="date" required 
                  value={newSubscription.next_billing_date} 
                  onChange={e => setNewSubscription({...newSubscription, next_billing_date: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-mint-DEFAULT transition-all" 
                />
              </div>

              <div className="pt-2 border-t border-gray-50 mt-2">
                <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-forest-DEFAULT hover:bg-forest-light text-white rounded-xl text-sm font-extrabold shadow-sm transition-colors flex items-center justify-center">
                  {isSubmitting ? 'Saving...' : 'Save Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}