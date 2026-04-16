import { useState, useEffect, useMemo } from 'react';
import {
  Wallet, ArrowLeft, Loader2, X, Menu, Upload, Target, Zap, Sparkles,
  Trophy, Plus, TrendingUp, Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DineroOverview } from '../components/views/DineroOverview';
import { DineroTransactions } from '../components/views/DineroTransactions';
import { DineroCategories } from '../components/views/DineroCategories';
import { DineroRadar } from '../components/views/DineroRadar';
import { DineroModals } from '../components/modals/DineroModals';
import { DineroSubscriptions } from '../components/views/DineroSubscriptions';
import { UniverseSelector } from '../../../components/UniverseSelector';

import { useDineroData } from '../hooks/useDineroData';
import { useDineroActions } from '../hooks/useDineroActions';
import { useAuth } from '../../../core/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { toast } from 'sonner';
import type { Transaction } from '../types';

// ─── Tab definitions (single source of truth) ──────────────────────────────────

export type TabType =
  | 'dashboard'
  | 'transactions'
  | 'categories'
  | 'subscriptions'   // previously 'calendar'
  | 'budget'
  | 'reports'
  | 'radar';

const DESKTOP_TABS: { id: TabType; label: string }[] = [
  { id: 'dashboard',     label: 'Dashboard'     },
  { id: 'transactions',  label: 'Transactions'  },
  { id: 'categories',    label: 'Categories'    },
  { id: 'radar',         label: 'Radar'         },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'budget',        label: 'Budget'        },
  { id: 'reports',       label: 'Reports'       },
];

const MOBILE_TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',     label: 'Dashboard',     icon: <Target size={18} />    },
  { id: 'transactions',  label: 'Transactions',  icon: <Wallet size={18} />    },
  { id: 'categories',    label: 'Categories',    icon: <Sparkles size={18} />  },
  { id: 'radar',         label: 'Radar',         icon: <TrendingUp size={18} />},
  { id: 'subscriptions', label: 'Subscriptions', icon: <Clock size={18} />     },
  { id: 'budget',        label: 'Budget',        icon: <Target size={18} />    },
  { id: 'reports',       label: 'Reports',       icon: <Trophy size={18} />    },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function DineroDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { accounts, transactions, cryptoTrades, categories, budgets, subscriptions, loading, fetchData } =
    useDineroData();
  const actions = useDineroActions(user?.id, fetchData);
  const { isSubmitting } = actions;

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(0);

  // ── Modal open/close ─────────────────────────────────────────────────────────
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isCryptoModalOpen, setIsCryptoModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // ── Form state ───────────────────────────────────────────────────────────────
  const [newAccount, setNewAccount] = useState({ name: '', type: 'Checking', currency: 'USD', balance: '' });
  const [newTransaction, setNewTransaction] = useState({ account_id: '', amount: '', type: 'expense', category: 'General', description: '' });
  const [newCategory, setNewCategory] = useState({ name: '', icon: '📌' });
  const [newBudget, setNewBudget] = useState({ category_name: '', limit_amount: '' });
  const [newSubscription, setNewSubscription] = useState({ name: '', amount: '', frequency: 'Monthly', next_billing_date: new Date().toISOString().split('T')[0] });
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importAccountId, setImportAccountId] = useState<string>('');

  /**
   * editTransaction is the MUTABLE form draft — what the user is typing in the modal.
   * The ORIGINAL (pre-edit) snapshot is retrieved from the `transactions` array by ID
   * so that balance reversal always uses the correct DB value, never stale form state.
   */
  const [editTransaction, setEditTransaction] = useState<any>(null);

  const [newCrypto, setNewCrypto] = useState({
    pair: '', date: new Date().toISOString().split('T')[0], time: '12:00',
    direction: 'Long', entry_price: '', exit_price: '', position_size: '',
    leverage: '1', stop_loss: '', take_profit: '', commissions: '', notes: '',
    status: 'Open', pnl_neto: '',
  });

  // ── Side effects ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!loading && accounts.length === 0 && onboardingStep === 0) setOnboardingStep(1);
    if (!loading && newTransaction.account_id === '' && accounts.length > 0) {
      setNewTransaction(prev => ({ ...prev, account_id: accounts[0].id }));
    }
  }, [loading, accounts.length, onboardingStep]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isMobileMenuOpen]);

  // ── Derived data ─────────────────────────────────────────────────────────────

  const netWorthCalculated = useMemo(
    () => accounts.reduce((acc, curr) => acc + (curr.is_debt ? -Number(curr.balance) : Number(curr.balance)), 0),
    [accounts],
  );

  const currentMonthTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [transactions]);

  const expensesByCategoryMap = useMemo(
    () => currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce<Record<string, number>>((acc, curr) => {
        const cat = curr.category || 'General';
        acc[cat] = (acc[cat] || 0) + Number(curr.amount);
        return acc;
      }, {}),
    [currentMonthTransactions],
  );

  /**
   * Retrieve the immutable original transaction from the DB-sourced array.
   * This is used by update/delete to compute correct balance deltas.
   */
  const getOriginalTx = (id: string): Transaction | undefined =>
    transactions.find(t => t.id === id);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleTabChange = (tab: TabType) => { setActiveTab(tab); setIsMobileMenuOpen(false); };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    await actions.createAccount(newAccount, () => {
      setNewAccount({ name: '', type: 'Checking', currency: 'USD', balance: '' });
      setIsAccountModalOpen(false);
      if (onboardingStep === 1) setOnboardingStep(2);
    });
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    await actions.createTransaction(newTransaction, customCategoryInput, () => {
      setNewTransaction(prev => ({ ...prev, amount: '', description: '', category: 'General' }));
      setCustomCategoryInput('');
      setIsTransactionModalOpen(false);
    });
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTransaction?.id) return;
    const original = getOriginalTx(editTransaction.id);
    if (!original) { toast.error('Could not find the original transaction.'); return; }
    await actions.updateTransaction(original, editTransaction, () => {
      setEditTransaction(null);
      setIsEditModalOpen(false);
    });
  };

  const handleDeleteTransaction = () => {
    if (!editTransaction?.id) return;
    const original = getOriginalTx(editTransaction.id);
    if (!original) { toast.error('Could not find the original transaction.'); return; }
    toast('Delete this transaction?', {
      action: {
        label: 'Delete',
        onClick: () => actions.deleteTransaction(original, () => {
          setEditTransaction(null);
          setIsEditModalOpen(false);
        }),
      },
      cancel: { label: 'Cancel', onClick: () => {} },
    });
  };

  const handleCreateCryptoTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    await actions.createCryptoTrade(newCrypto, () => {
      setNewCrypto({ pair: '', date: new Date().toISOString().split('T')[0], time: '12:00', direction: 'Long', entry_price: '', exit_price: '', position_size: '', leverage: '1', stop_loss: '', take_profit: '', commissions: '', notes: '', status: 'Open', pnl_neto: '' });
      setIsCryptoModalOpen(false);
    });
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    await actions.createCategory(newCategory, () => {
      setNewCategory({ name: '', icon: '📌' });
      setIsCategoryModalOpen(false);
    });
  };

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    await actions.setBudget(newBudget, () => {
      setNewBudget({ category_name: '', limit_amount: '' });
      setIsBudgetModalOpen(false);
    });
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    await actions.createSubscription(newSubscription, () => {
      setNewSubscription({ name: '', amount: '', frequency: 'Monthly', next_billing_date: new Date().toISOString().split('T')[0] });
      setIsSubscriptionModalOpen(false);
    });
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !importAccountId) { toast.error('Please select an account and a file.'); return; }
    await actions.importFile(csvFile, importAccountId, categories, () => {
      setCsvFile(null);
      setImportAccountId('');
      setIsCsvModalOpen(false);
    });
  };

  const handleExport = (format: 'csv' | 'xlsx' | 'json' | 'pdf') => {
    actions.exportData(transactions, format);
    setIsExportModalOpen(false);
  };

  // ── Loading / Onboarding ──────────────────────────────────────────────────────

  if (loading && accounts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (onboardingStep === 1 || onboardingStep === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans tracking-tight bg-[#F4F9F2]" style={{ fontFamily: "'Nunito', sans-serif" }}>
        {onboardingStep === 1 && (
          <div className="bg-white rounded-[20px] shadow-xl border border-gray-100 max-w-md w-full flex flex-col overflow-hidden text-[#111827]">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-4">
              <button onClick={() => navigate('/')} className="text-forest-DEFAULT hover:text-forest-light transition-colors"><ArrowLeft size={20} /></button>
              <h2 className="text-xl font-extrabold flex-1 text-center pr-6">Add Your First Account</h2>
            </div>
            <form onSubmit={handleCreateAccount} className="p-6 flex flex-col gap-5">
              <p className="text-sm font-medium text-gray-600 leading-relaxed"><b className="font-bold text-gray-900">Let's go!</b> You can link more accounts anytime.</p>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900">Account Nickname</label>
                <input type="text" required placeholder="e.g. KiwiBank Daily" value={newAccount.name} onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })} className="px-4 py-3 bg-white text-sm font-medium border border-gray-200 outline-none transition-all focus:border-mint-hover focus:ring-2 focus:ring-sage-dark rounded-xl" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900">Account Type</label>
                <select value={newAccount.type} onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })} className="px-4 py-3 bg-white text-sm font-medium border border-gray-200 outline-none transition-all focus:border-mint-hover rounded-xl">
                  <option value="Checking">Checking</option>
                  <option value="Savings">Savings</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900">Current Balance</label>
                <input type="number" step="0.01" required placeholder="0.00" value={newAccount.balance} onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })} className="px-4 py-3 bg-white text-sm font-medium border border-gray-200 outline-none transition-all focus:border-mint-hover rounded-xl" />
              </div>
              <div className="pt-4 border-t border-gray-50 mt-2">
                <button type="submit" disabled={isSubmitting} className="w-full py-3.5 rounded-[12px] font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center bg-mint-DEFAULT hover:bg-mint-hover text-forest-DEFAULT">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Next →'}
                </button>
              </div>
            </form>
          </div>
        )}
        {onboardingStep === 2 && (
          <div className="bg-white rounded-[20px] shadow-xl border border-gray-100 max-w-md w-full flex flex-col overflow-hidden text-[#111827]">
            <div className="px-6 py-4 bg-white border-b border-gray-50">
              <h2 className="text-md font-extrabold">Assign Your Assets</h2>
            </div>
            <div className="bg-sage-dark h-40 w-full flex flex-col items-center justify-center">
              <Wallet size={64} className="text-forest-DEFAULT drop-shadow-sm -rotate-12" />
            </div>
            <div className="p-6 flex flex-col gap-4">
              <h3 className="text-[15px] font-bold text-gray-900">Track all your balances in one place.</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Add checking accounts, savings, and credit cards for an accurate Net Worth view.</p>
              <div className="flex items-center justify-end gap-3 mt-4 pt-4">
                <button onClick={() => setOnboardingStep(3)} className="px-6 py-2.5 rounded-[12px] text-sm font-bold bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">Skip</button>
                <button onClick={() => setOnboardingStep(1)} className="px-5 py-2.5 rounded-[12px] text-sm font-bold shadow-sm hover:shadow-md transition-shadow bg-mint-DEFAULT hover:bg-mint-hover text-forest-DEFAULT">Add Another</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col font-sans relative bg-[#F4F9F2]" style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* ── Top navigation ── */}
      {/* ── Top navigation ── */}
      <nav className="w-full shrink-0 flex flex-col z-30 shadow-md bg-[#0B2118]">
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
          <div className="flex items-center gap-8">
            
            {/* ✨ COMPONENTE GLOBAL INYECTADO ✨ */}
            <UniverseSelector />

            {/* Desktop tab bar */}
            <div className="hidden md:flex items-center gap-1 pt-1">
              {DESKTOP_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-white/80 rounded-xl hover:bg-white/10 transition-colors">
            <Menu size={24} />
          </button>
        </div>

        {/* Sub-header with title + context actions */}
        <div className="flex flex-col md:flex-row items-center justify-between px-6 py-5 gap-4 md:gap-0 bg-[#163E2E]">
          <h1 className="text-[22px] font-extrabold text-white tracking-tight w-full text-center md:text-left capitalize">
            {activeTab}
          </h1>
          <div className="flex items-center w-full md:w-auto justify-center md:justify-end gap-3">
            {activeTab === 'radar' && (
              <button onClick={() => setIsCryptoModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] font-bold text-sm bg-white text-gray-900 shadow-sm">
                <Plus size={16} /> Log Trade
              </button>
            )}
            {(activeTab === 'dashboard' || activeTab === 'transactions') && (
              <button onClick={() => setIsCsvModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] font-bold text-sm bg-transparent text-white border border-white/20 shadow-sm">
                <Upload size={16} /> Quick Import
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer overlay ── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <div className={`fixed top-0 left-0 h-full w-4/5 max-w-sm bg-white z-50 transform transition-transform duration-300 ease-out md:hidden shadow-2xl flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <span className="text-gray-900 font-extrabold text-xl tracking-tight flex items-center gap-2">
            <Zap size={24} className="text-mint-DEFAULT" /> Financial Hub
          </span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto py-2">
          {MOBILE_TABS.map(item => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex items-center gap-3 px-6 py-4 text-sm font-extrabold transition-colors ${activeTab === item.id ? 'bg-sage-dark text-forest-DEFAULT border-r-4 border-mint-DEFAULT' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar pb-32 md:pb-10 w-full flex justify-center">

        {activeTab === 'dashboard' && (
          <DineroOverview
            transactions={transactions}
            netWorthCalculated={netWorthCalculated}
            setNewTransaction={setNewTransaction}
            setIsTransactionModalOpen={setIsTransactionModalOpen}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'transactions' && (
          <DineroTransactions
            accounts={accounts}
            transactions={transactions}
            theme={{ bg: '#F4F9F2', surface: '#FFFFFF', textMain: '#111827', textMuted: '#6B7280', accent: '#A7F38F', danger: '#E02424', graphBg: '#FFFFFF', textDark: '#111827', sidebarBg: '#0B2118', sidebarText: '#FFFFFF', sidebarActive: '#163E2E' }}
            setEditTransaction={setEditTransaction}
            setIsEditModalOpen={setIsEditModalOpen}
            setIsTransactionModalOpen={setIsTransactionModalOpen}
            onImportClick={() => setIsCsvModalOpen(true)}
            onExportClick={() => setIsExportModalOpen(true)}
          />
        )}

        {activeTab === 'categories' && (
          <DineroCategories
            theme={{ bg: '#F4F9F2', surface: '#FFFFFF', textMain: '#111827', textMuted: '#6B7280', accent: '#A7F38F', danger: '#E02424', graphBg: '#FFFFFF', textDark: '#111827', sidebarBg: '#0B2118', sidebarText: '#FFFFFF', sidebarActive: '#163E2E' }}
            transactions={transactions}
            categories={categories}
            setIsCategoryModalOpen={setIsCategoryModalOpen}
          />
        )}

        {activeTab === 'radar' && <DineroRadar cryptoTrades={cryptoTrades} />}

        {activeTab === 'subscriptions' && (
          <DineroSubscriptions subscriptions={[]} setIsSubscriptionModalOpen={setIsSubscriptionModalOpen} />
        )}

        {/* ── Budget tab ── */}
        {activeTab === 'budget' && (
          <div className="flex flex-col gap-6 w-full max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[20px] shadow-sm flex flex-col justify-center items-center py-10 border border-gray-200/80 relative overflow-hidden">
              <Target size={40} className="text-mint-hover mb-4" />
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Smart Budgets</h3>
              <p className="text-sm text-gray-500 max-w-md text-center font-medium">Set monthly spending limits per category and track progress in real-time.</p>
              <button
                onClick={() => setIsBudgetModalOpen(true)}
                className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 px-4 py-2 bg-forest-DEFAULT hover:bg-forest-light text-white rounded-[12px] text-sm font-bold shadow-sm transition-colors"
              >
                <Plus size={16} /> Set Budget
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {budgets.length > 0 ? (
                budgets.map(b => {
                  const amount = expensesByCategoryMap[b.category_name] || 0;
                  const max = Number(b.limit_amount);
                  const percent = max > 0 ? Math.min((amount / max) * 100, 100) : 0;
                  const isDanger = percent >= 80;
                  const isExceeded = percent >= 100;

                  return (
                    <div key={b.id} className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-200/80 flex flex-col gap-4 hover:shadow-md transition-all">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-gray-900 truncate">{b.category_name}</span>
                        <span className="text-[10px] font-bold px-3 py-1 bg-gray-100 rounded-md text-gray-600 uppercase tracking-wider shrink-0">Limit: ${max}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className={`text-2xl font-extrabold tabular-nums tracking-tight ${isDanger ? 'text-rose-600' : 'text-gray-900'}`}>
                          ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs font-bold text-gray-500">{percent.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${isExceeded ? 'bg-rose-600' : isDanger ? 'bg-orange-400' : 'bg-mint-hover'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      {isExceeded && <p className="text-[10px] text-rose-600 font-bold uppercase text-center mt-1">Budget Exceeded</p>}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full bg-white rounded-[20px] p-10 shadow-sm border border-gray-200/80 text-center">
                  <p className="text-sm text-gray-500 font-medium">No budgets set yet. Click "Set Budget" to start tracking your limits.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Reports tab ── */}
        {activeTab === 'reports' && (
          <div className="flex flex-col items-center justify-center gap-6 w-full max-w-2xl py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Trophy size={48} className="text-mint-DEFAULT" />
            <h3 className="text-2xl font-extrabold text-gray-900 text-center">Reports &amp; Analytics</h3>
            <p className="text-sm text-gray-500 text-center max-w-md font-medium leading-relaxed">
              Advanced reporting features are coming soon — including monthly summaries, net worth trends, savings rate, and more.
            </p>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-forest-DEFAULT hover:bg-forest-light text-white rounded-[14px] font-bold text-sm shadow-md transition-colors"
            >
              <Upload size={16} /> Export Your Data
            </button>
          </div>
        )}

      </main>

      {/* ── All modals ── */}
      <DineroModals
        isCryptoModalOpen={isCryptoModalOpen}         setIsCryptoModalOpen={setIsCryptoModalOpen}
        isAccountModalOpen={isAccountModalOpen}        setIsAccountModalOpen={setIsAccountModalOpen}
        isCsvModalOpen={isCsvModalOpen}               setIsCsvModalOpen={setIsCsvModalOpen}
        isExportModalOpen={isExportModalOpen}          setIsExportModalOpen={setIsExportModalOpen}
        isEditModalOpen={isEditModalOpen}              setIsEditModalOpen={setIsEditModalOpen}
        isTransactionModalOpen={isTransactionModalOpen} setIsTransactionModalOpen={setIsTransactionModalOpen}
        isCategoryModalOpen={isCategoryModalOpen}     setIsCategoryModalOpen={setIsCategoryModalOpen}
        isBudgetModalOpen={isBudgetModalOpen}         setIsBudgetModalOpen={setIsBudgetModalOpen}
        isSubscriptionModalOpen={isSubscriptionModalOpen} setIsSubscriptionModalOpen={setIsSubscriptionModalOpen}
        newCrypto={newCrypto}                         setNewCrypto={setNewCrypto}
        newAccount={newAccount}                       setNewAccount={setNewAccount}
        newTransaction={newTransaction}               setNewTransaction={setNewTransaction}
        newCategory={newCategory}                     setNewCategory={setNewCategory}
        newBudget={newBudget}                         setNewBudget={setNewBudget}
        newSubscription={newSubscription}             setNewSubscription={setNewSubscription}
        editTransaction={editTransaction}             setEditTransaction={setEditTransaction}
        importAccountId={importAccountId}             setImportAccountId={setImportAccountId}
        csvFile={csvFile}                             setCsvFile={setCsvFile}
        customCategoryInput={customCategoryInput}     setCustomCategoryInput={setCustomCategoryInput}
        isSubmitting={isSubmitting}
        accounts={accounts}
        categories={categories}
        handleCreateCryptoTrade={handleCreateCryptoTrade}
        handleCreateAccount={handleCreateAccount}
        handleCsvImport={handleCsvImport}
        handleExport={handleExport}
        handleUpdateTransaction={handleUpdateTransaction}
        handleDeleteTransaction={handleDeleteTransaction}
        handleCreateTransaction={handleCreateTransaction}
        handleCreateCategory={handleCreateCategory}
        handleSetBudget={handleSetBudget}
        handleCreateSubscription={handleCreateSubscription}
      />
    </div>
  );
}