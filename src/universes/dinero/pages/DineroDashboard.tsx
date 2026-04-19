import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet, ArrowLeft, Loader2, Upload, Target, Zap, Trophy, Plus, LayoutDashboard, Receipt, Tag, Bitcoin, CalendarClock, PieChart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { parseFile, exportRecords, autoCategorize } from '../lib/dinero-io';

import { DineroOverview } from '../components/views/DineroOverview';
import { DineroTransactions } from '../components/views/DineroTransactions';
import { DineroCategories } from '../components/views/DineroCategories';
import { DineroRadar } from '../components/views/DineroRadar';
import { DineroModals } from '../components/modals/DineroModals';
import { DineroSubscriptions } from '../components/views/DineroSubscriptions';

export type TabType = 'dashboard' | 'transactions' | 'categories' | 'calendar' | 'budget' | 'reports' | 'radar';

interface Account { id: string; name: string; type: string; currency: string; balance: number; is_debt: boolean; }
interface Investment { id: string; asset_name: string; symbol: string; holdings: number; avg_buy_price: number; }
interface Project { id: string; name: string; status: string; allocated_budget: number; monthly_burn: number; tech_stack: string; }
interface CryptoRadarTrade { id: string; user_id: string; pair: string; direction: string; entry_price: number; exit_price: number | null; position_size: number; leverage: number; stop_loss: number | null; take_profit: number | null; commissions: number; notes: string; status: string; pnl_neto: number | null; trade_date: string; }
interface Budget { id: string; category_name: string; limit_amount: number; }

export default function DineroDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [isManageDropdownOpen, setIsManageDropdownOpen] = useState(false);

  // ==========================================
  // DATA STATES
  // ==========================================
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [_investments, setInvestments] = useState<Investment[]>([]);
  const [_projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [cryptoTrades, setCryptoTrades] = useState<CryptoRadarTrade[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]); // <--- SUSCRIPCIONES

  // ==========================================
  // MODALES & FORMULARIOS
  // ==========================================
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isCryptoModalOpen, setIsCryptoModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false); // <--- MODAL SUSCRIPCIONES
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newAccount, setNewAccount] = useState({ name: '', type: 'Checking', currency: 'USD', balance: '' });
  const [newTransaction, setNewTransaction] = useState({ account_id: '', amount: '', type: 'expense', category: 'General', description: '' });
  const [newCategory, setNewCategory] = useState({ name: '', icon: '📌' });
  const [newBudget, setNewBudget] = useState({ category_name: '', limit_amount: '' });
  const [newSubscription, setNewSubscription] = useState({
    name: '', amount: '', frequency: 'Monthly', next_billing_date: new Date().toISOString().split('T')[0]
  }); // <--- FORMULARIO SUSCRIPCIONES
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [editTransaction, setEditTransaction] = useState<any>(null);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importAccountId, setImportAccountId] = useState<string>('');

  const [newCrypto, setNewCrypto] = useState({
    pair: '', date: new Date().toISOString().split('T')[0], time: '12:00', direction: 'Long',
    entry_price: '', exit_price: '', position_size: '', leverage: '1', stop_loss: '', take_profit: '', commissions: '', notes: '', status: 'Open', pnl_neto: ''
  });

  const MOBILE_TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
    { id: 'transactions', label: 'Txns', icon: <Receipt size={20} /> },
    { id: 'categories', label: 'Cats', icon: <Tag size={20} /> },
    { id: 'calendar', label: 'Subs', icon: <CalendarClock size={20} /> },
    { id: 'budget', label: 'Budget', icon: <PieChart size={20} /> },
    { id: 'radar', label: 'Crypto', icon: <Bitcoin size={20} /> },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        { data: accs },
        { data: invs },
        { data: projs },
        { data: trans },
        { data: trades },
        { data: cats },
        { data: bdgts },
        { data: subs } // <--- FETCH SUSCRIPCIONES
      ] = await Promise.all([
        supabase.from('Finanzas_accounts').select('*'),
        supabase.from('Finanzas_investments').select('*'),
        supabase.from('Finanzas_projects').select('*'),
        supabase.from('Finanzas_transactions').select('*, Finanzas_accounts(name)').order('date', { ascending: false }),
        supabase.from('Finanzas_crypto_radar').select('*').order('trade_date', { ascending: false }),
        supabase.from('Finanzas_categories').select('*'),
        supabase.from('Finanzas_budgets').select('*'),
        supabase.from('Finanzas_subscriptions').select('*') // <--- FETCH SUSCRIPCIONES
      ]);

      if (accs) {
        setAccounts(accs);
        if (accs.length > 0 && newTransaction.account_id === '') {
          setNewTransaction(prev => ({ ...prev, account_id: accs[0].id }));
        }
      }
      if (invs) setInvestments(invs);
      if (projs) setProjects(projs);
      if (trans) setTransactions(trans);
      if (trades) setCryptoTrades(trades);
      if (cats) setCategories(cats);
      if (bdgts) setBudgets(bdgts);
      if (subs) setSubscriptions(subs); // <--- GUARDAMOS SUSCRIPCIONES

    } catch (error) {
      console.error("Error cargando finanzas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!loading && accounts.length === 0 && onboardingStep === 0) setOnboardingStep(1);
  }, [loading, accounts.length, onboardingStep]);

  const checkUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        navigate('/login');
        return null;
      }
      return data.user;
    } catch {
      navigate('/login');
      return null;
    }
  };

  // ==========================================
  // HANDLERS DE CREACIÓN
  // ==========================================

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await checkUser();
      if (!user) return;
      const { error } = await supabase.from('Finanzas_subscriptions').insert([{
        user_id: user.id,
        name: newSubscription.name,
        amount: Number(newSubscription.amount),
        frequency: newSubscription.frequency,
        next_billing_date: newSubscription.next_billing_date
      }]);
      if (error) throw error;
      setNewSubscription({ name: '', amount: '', frequency: 'Monthly', next_billing_date: new Date().toISOString().split('T')[0] });
      setIsSubscriptionModalOpen(false);
      await fetchData();
    } catch (error: any) { alert("Error: " + error.message); }
    finally { setIsSubmitting(false); }
  };

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await checkUser();
      if (!user) return;
      const { error } = await supabase.from('Finanzas_budgets').upsert({
        user_id: user.id,
        category_name: newBudget.category_name,
        limit_amount: Number(newBudget.limit_amount)
      }, { onConflict: 'user_id, category_name' });
      if (error) throw error;
      setNewBudget({ category_name: '', limit_amount: '' });
      setIsBudgetModalOpen(false);
      await fetchData();
    } catch (error: any) { alert("Error: " + error.message); }
    finally { setIsSubmitting(false); }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await checkUser();
      if (!user) return;
      const { error } = await supabase.from('Finanzas_categories').insert([{ user_id: user.id, name: newCategory.name, icon: newCategory.icon }]);
      if (error) throw error;
      setNewCategory({ name: '', icon: '📌' });
      setIsCategoryModalOpen(false);
      await fetchData();
    } catch (error: any) { alert("Error: " + error.message); }
    finally { setIsSubmitting(false); }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await checkUser();
      if (!user) return;
      const isDebt = newAccount.type === 'Credit Card';
      const { error } = await supabase.from('Finanzas_accounts').insert([{
        user_id: user.id, name: newAccount.name, type: newAccount.type, currency: newAccount.currency, balance: Number(newAccount.balance) || 0, is_debt: isDebt
      }]);
      if (error) throw error;
      setNewAccount({ name: '', type: 'Checking', currency: 'USD', balance: '' });
      setIsAccountModalOpen(false);
      if (onboardingStep === 1) setOnboardingStep(2);
      await fetchData();
    } catch (error: any) { alert("Error: " + error.message); }
    finally { setIsSubmitting(false); }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await checkUser();
      if (!user) return;
      const numericAmount = Number(newTransaction.amount);
      const finalCategory = newTransaction.category === 'custom_select' ? customCategoryInput : newTransaction.category;
      const { error } = await supabase.from('Finanzas_transactions').insert([{
        user_id: user.id, account_id: newTransaction.account_id, amount: numericAmount, type: newTransaction.type, category: finalCategory, description: newTransaction.description, date: new Date().toISOString()
      }]);
      if (error) throw error;
      const account = accounts.find(a => a.id === newTransaction.account_id);
      if (account) {
        const newBalance = newTransaction.type === 'income' ? account.balance + numericAmount : account.balance - numericAmount;
        await supabase.from('Finanzas_accounts').update({ balance: newBalance }).eq('id', account.id);
      }
      setNewTransaction({ ...newTransaction, amount: '', description: '', category: 'General' });
      setCustomCategoryInput('');
      setIsTransactionModalOpen(false);
      await fetchData();
    } catch (error: any) { alert("Error: " + error.message); }
    finally { setIsSubmitting(false); }
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTransaction) return;
    setIsSubmitting(true);
    try {
      const numericAmount = Number(editTransaction.amount);
      const { error } = await supabase.from('Finanzas_transactions').update({ category: editTransaction.category, description: editTransaction.description, amount: numericAmount, type: editTransaction.type }).eq('id', editTransaction.id);
      if (error) throw error;
      setIsEditModalOpen(false);
      setEditTransaction(null);
      await fetchData();
    } catch (error: any) { alert("Update error: " + error.message); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteTransaction = async () => {
    const id = editTransaction?.id;
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('Finanzas_transactions').delete().eq('id', id);
      if (error) throw error;
      setEditTransaction(null);
      setIsEditModalOpen(false);
      await fetchData();
    } catch (e: any) { alert("Error deleting: " + e.message); }
    finally { setIsSubmitting(false); }
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !importAccountId) { alert("Please select a valid destination account and file."); return; }
    setIsSubmitting(true);
    try {
      const user = await checkUser();
      if (!user) return;

      // 1. Parseamos el archivo CSV localmente
      const rawRecords = await parseFile(csvFile);
      if (rawRecords.length === 0) throw new Error("No readable transactions found in file.");

      // 2. Auto-categorize using rule-based engine
      const enrichedRecords = autoCategorize(rawRecords, categories);

      // 3. Preparamos el formato final para la base de datos
      const recordsToInsert = enrichedRecords.map((r: Record<string, unknown>) => ({
        user_id: user.id,
        account_id: importAccountId,
        amount: r.amount,
        type: r.type,
        date: r.date,
        description: r.description,
        category: r.category,
      }));

      // 4. Guardamos en Supabase
      const { error } = await supabase.from('Finanzas_transactions').insert(recordsToInsert);
      if (error) throw error;

      alert(`¡IA procesó y categorizó ${recordsToInsert.length} transacciones automáticamente! 🤖✨`);
      setCsvFile(null);
      setIsCsvModalOpen(false);
      await fetchData();
    } catch (error: any) { alert("Import error: " + error.message); }
    finally { setIsSubmitting(false); }
  };

  const handleExport = (format: 'csv' | 'xlsx' | 'json' | 'pdf') => {
    exportRecords(transactions as any, format);
    setIsExportModalOpen(false);
  };

  const handleCreateCryptoTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await checkUser();
      if (!user) return;
      const tradeDate = `${newCrypto.date}T${newCrypto.time || '00:00'}:00Z`;
      const { error } = await supabase.from('Finanzas_crypto_radar').insert([{
        user_id: user.id, pair: newCrypto.pair.toUpperCase().replace('/', ''), direction: newCrypto.direction,
        entry_price: Number(newCrypto.entry_price) || 0, exit_price: newCrypto.exit_price ? Number(newCrypto.exit_price) : null,
        position_size: Number(newCrypto.position_size) || 0, leverage: Number(newCrypto.leverage) || 1,
        stop_loss: newCrypto.stop_loss ? Number(newCrypto.stop_loss) : null, take_profit: newCrypto.take_profit ? Number(newCrypto.take_profit) : null,
        commissions: Number(newCrypto.commissions) || 0, notes: newCrypto.notes, status: newCrypto.status,
        pnl_neto: newCrypto.pnl_neto ? Number(newCrypto.pnl_neto) : 0, trade_date: tradeDate
      }]);
      if (error) throw error;
      setNewCrypto({ pair: '', date: new Date().toISOString().split('T')[0], time: '12:00', direction: 'Long', entry_price: '', exit_price: '', position_size: '', leverage: '1', stop_loss: '', take_profit: '', commissions: '', notes: '', status: 'Open', pnl_neto: '' });
      setIsCryptoModalOpen(false);
      await fetchData();
    } catch (error: any) { alert("Error: " + error.message); }
    finally { setIsSubmitting(false); }
  };

  // ==========================================
  // CÁLCULOS DINÁMICOS
  // ==========================================
  const netWorthCalculated = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);

  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const expensesByCategoryMap: Record<string, number> = currentMonthTransactions.filter(t => t.type === 'expense').reduce((acc: Record<string, number>, curr) => {
    const cat = curr.category || 'General';
    acc[cat] = (acc[cat] || 0) + Number(curr.amount);
    return acc;
  }, {});

  const totalExpensesCalculated = Object.values(expensesByCategoryMap).reduce((a, b) => a + b, 0);
  const sortedCategoriesMap = Object.entries(expensesByCategoryMap).sort((a, b) => b[1] - a[1]);

  // ==========================================
  // PANTALLAS DE ONBOARDING / LOADING
  // ==========================================
  if (loading && accounts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F9F2]">
        <Loader2 className="w-12 h-12 animate-spin text-gray-500" />
      </div>
    );
  }

  if (onboardingStep === 1 || onboardingStep === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans tracking-tight bg-gray-200">
        {onboardingStep === 1 && (
          <div className="bg-white rounded-[20px] shadow-xl border border-gray-100 max-w-md w-full flex flex-col overflow-hidden text-[#111827]">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-4">
              <button onClick={() => navigate('/')} className="text-blue-600 hover:text-blue-800 transition-colors"><ArrowLeft size={20} /></button>
              <h2 className="text-xl font-extrabold flex-1 text-center pr-6">Add Unlinked Account</h2>
            </div>
            <form onSubmit={handleCreateAccount} className="p-6 flex flex-col gap-5">
              <p className="text-sm font-medium text-gray-600 leading-relaxed"><b className="font-bold text-gray-900">Let's go!</b> And don't worry—if you change your mind, you can link your account at any time.</p>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900">Give it a nickname</label>
                <input type="text" required placeholder="KiwiBank - Daily" value={newAccount.name} onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })} className="px-4 py-3 bg-white text-sm font-medium border border-gray-200 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-gray-900 rounded-xl hover:bg-gray-50/50" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900">What type of account are you adding?</label>
                <select value={newAccount.type} onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })} className="px-4 py-3 bg-white text-sm font-medium border border-gray-200 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-gray-900 rounded-xl hover:bg-gray-50/50 appearance-none">
                  <option value="Checking">Checking</option>
                  <option value="Savings">Savings</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900">What is your current account balance?</label>
                <input type="number" step="0.01" required placeholder="0" value={newAccount.balance} onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })} className="px-4 py-3 bg-white text-sm font-medium border border-gray-200 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-gray-900 rounded-xl hover:bg-gray-50/50" />
              </div>
              <div className="pt-4 border-t border-gray-50 mt-2">
                <button type="submit" disabled={isSubmitting} className="w-full py-3.5 rounded-[12px] font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center bg-emerald-500 text-white">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Next'}
                </button>
              </div>
            </form>
          </div>
        )}
        {onboardingStep === 2 && (
          <div className="bg-white rounded-[20px] shadow-xl border border-gray-100 max-w-md w-full flex flex-col overflow-hidden text-[#111827]">
            <div className="px-6 py-4 bg-white border-b border-gray-50">
              <h2 className="text-md font-extrabold">Add Checking, Savings, or Cash Account</h2>
            </div>
            <div className="bg-emerald-50 h-40 w-full flex flex-col items-center justify-center relative overflow-hidden">
              <Wallet size={64} className="text-emerald-500 drop-shadow-sm transform -rotate-12" />
            </div>
            <div className="p-6 flex flex-col gap-4">
              <h3 className="text-[15px] font-bold text-gray-900">It's all about assigning the money you have right now.</h3>
              <p className="text-sm text-gray-500 leading-relaxed">That means money that you have in a checking account, a savings account, and/or in cash.</p>
              <div className="flex items-center justify-end gap-3 mt-4 pt-4">
                <button onClick={() => setOnboardingStep(3)} className="px-6 py-2.5 rounded-[12px] text-sm font-bold bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">Skip</button>
                <button onClick={() => setOnboardingStep(1)} className="px-5 py-2.5 rounded-[12px] text-sm font-bold shadow-sm hover:shadow-md transition-shadow bg-emerald-500 text-white">Add Another Account</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER PRINCIPAL (DASHBOARD TABS)
  // ==========================================
  return (
    <div className="min-h-screen flex flex-col font-sans relative bg-[#F4F9F2] text-gray-900">

      {/* HEADER Y NAV */}
      <nav className="w-full shrink-0 transition-all duration-300 flex flex-col z-30 shadow-md bg-[#0B2118]">
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
          <div className="flex items-center gap-8">
            <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity flex items-center gap-2">
              <span className="text-white font-extrabold text-lg tracking-tight flex items-center gap-1.5"><Zap size={20} className="text-emerald-400" /> Financial Hub</span>
            </button>
            <div className="hidden md:flex items-center gap-2 pt-1 overflow-x-auto whitespace-nowrap">
              <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>Dashboard</button>
              <button onClick={() => setActiveTab('transactions')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'transactions' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>Transactions</button>
              <button onClick={() => setActiveTab('categories')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'categories' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>Categories</button>
              <button onClick={() => setActiveTab('radar')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'radar' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>Radar Crypto</button>
              <button onClick={() => setActiveTab('calendar')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'calendar' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>Subscriptions</button>
              <button onClick={() => setActiveTab('budget')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'budget' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>Budget</button>
              <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'reports' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>Reports</button>
            </div>
          </div>
          {/* Desktop-only action buttons */}
          <div className="hidden md:flex items-center gap-3">
            {activeTab === 'radar' && (<button onClick={() => setIsCryptoModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] font-bold text-sm bg-white text-gray-900 shadow-sm"><Plus size={16} /> Log Trade</button>)}
            {(activeTab === 'dashboard' || activeTab === 'transactions') && (<button onClick={() => setIsCsvModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] font-bold text-sm bg-transparent text-white border border-white/20 shadow-sm"><Upload size={16} /> Quick Import</button>)}
          </div>
        </div>

        {/* Sub-header: desktop only */}
        <div className="hidden md:flex flex-row items-center justify-between px-6 py-3 gap-4 bg-[#021f15]">
          <h1 className="text-base font-bold text-white tracking-tight">
            {activeTab === 'dashboard' ? 'Overview' : activeTab === 'transactions' ? 'Transactions' : activeTab === 'categories' ? 'Categories' : activeTab === 'radar' ? 'Radar Crypto' : activeTab === 'budget' ? 'Budgets' : activeTab === 'reports' ? 'Reports' : 'Subscriptions'}
          </h1>
        </div>
      </nav>

      {/* ÁREA CENTRAL */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar pb-32 md:pb-10 w-full flex justify-center">
        {/* LÍNEA CORREGIDA ABAJO: Se agregan las props setNewTransaction e setIsTransactionModalOpen */}
        {activeTab === 'dashboard' && (
          <DineroOverview 
            transactions={transactions} 
            netWorthCalculated={netWorthCalculated} 
            setNewTransaction={setNewTransaction} 
            setIsTransactionModalOpen={setIsTransactionModalOpen}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'transactions' && <DineroTransactions accounts={accounts} transactions={transactions} setEditTransaction={setEditTransaction} setIsEditModalOpen={setIsEditModalOpen} setIsTransactionModalOpen={setIsTransactionModalOpen} onImportClick={() => setIsCsvModalOpen(true)} onExportClick={() => setIsExportModalOpen(true)} />}
        {activeTab === 'categories' && <DineroCategories transactions={transactions} categories={categories} setIsCategoryModalOpen={setIsCategoryModalOpen} />}
        {activeTab === 'radar' && <DineroRadar cryptoTrades={cryptoTrades} />}

        {/* PESTAÑA SUSCRIPCIONES (reemplaza Calendar) */}
        {activeTab === 'calendar' && (
          <DineroSubscriptions subscriptions={subscriptions} setIsSubscriptionModalOpen={setIsSubscriptionModalOpen} />
        )}

        {/* === PESTAÑA: BUDGETS === */}
        {activeTab === 'budget' && (
          <div className="flex flex-col gap-6 w-full max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[20px] shadow-sm flex flex-col justify-center items-center py-10 border border-gray-200/80 relative overflow-hidden">
              <Target size={40} className="text-emerald-500 mb-4" />
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Smart Budgets</h3>
              <p className="text-sm text-gray-500 max-w-md text-center font-medium">Model your monthly spending limits and avoid debt.</p>
              <button
                onClick={() => setIsBudgetModalOpen(true)}
                className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[12px] text-sm font-bold shadow-sm transition-colors"
              >
                <Plus size={16} /> Set Budget
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {budgets.length > 0 ? budgets.map((b) => {
                const amount = expensesByCategoryMap[b.category_name] || 0;
                const max = Number(b.limit_amount);
                const percent = max > 0 ? Math.min((amount / max) * 100, 100) : 100;
                const isDanger = percent >= 80;
                const isExceeded = percent >= 100;

                return (
                  <div key={b.id} className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-200/80 flex flex-col gap-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-gray-900 truncate">{b.category_name}</span>
                      <span className="text-[10px] font-bold px-3 py-1 bg-gray-100 rounded-md text-gray-600 uppercase tracking-wider shrink-0">Limit: ${max}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className={`text-2xl font-extrabold tabular-nums tracking-tight ${isDanger ? 'text-rose-600' : 'text-gray-900'}`}>${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="text-xs font-bold text-gray-500">{percent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${isExceeded ? 'bg-rose-600' : isDanger ? 'bg-orange-400' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }}></div>
                    </div>
                    {isExceeded && <p className="text-[10px] text-rose-600 font-bold uppercase text-center mt-1">Budget Exceeded</p>}
                  </div>
                );
              }) : (
                <div className="col-span-full bg-white rounded-[20px] p-10 shadow-sm border border-gray-200/80 text-center">
                  <p className="text-sm text-gray-500 font-medium">No budgets set yet. Click "Set Budget" to start tracking your limits.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (<div className="flex flex-col gap-6 w-full max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="bg-white rounded-[20px] shadow-sm flex flex-col justify-center items-center py-10 border border-gray-200/80"><Trophy size={40} className="text-yellow-400 mb-4" /><h3 className="text-xl font-extrabold text-gray-900 mb-2">Reports</h3></div></div>)}
      </main>

      {/* MODALES EXTERNALIZADOS */}
      <DineroModals
        isCryptoModalOpen={isCryptoModalOpen} setIsCryptoModalOpen={setIsCryptoModalOpen}
        isAccountModalOpen={isAccountModalOpen} setIsAccountModalOpen={setIsAccountModalOpen}
        isCsvModalOpen={isCsvModalOpen} setIsCsvModalOpen={setIsCsvModalOpen}
        isExportModalOpen={isExportModalOpen} setIsExportModalOpen={setIsExportModalOpen}
        isEditModalOpen={isEditModalOpen} setIsEditModalOpen={setIsEditModalOpen}
        isTransactionModalOpen={isTransactionModalOpen} setIsTransactionModalOpen={setIsTransactionModalOpen}

        isCategoryModalOpen={isCategoryModalOpen} setIsCategoryModalOpen={setIsCategoryModalOpen}
        newCategory={newCategory} setNewCategory={setNewCategory}
        handleCreateCategory={handleCreateCategory}

        isBudgetModalOpen={isBudgetModalOpen} setIsBudgetModalOpen={setIsBudgetModalOpen}
        newBudget={newBudget} setNewBudget={setNewBudget}
        handleSetBudget={handleSetBudget}

        isSubscriptionModalOpen={isSubscriptionModalOpen} setIsSubscriptionModalOpen={setIsSubscriptionModalOpen}
        newSubscription={newSubscription} setNewSubscription={setNewSubscription}
        handleCreateSubscription={handleCreateSubscription}

        newCrypto={newCrypto} setNewCrypto={setNewCrypto}
        newAccount={newAccount} setNewAccount={setNewAccount}
        newTransaction={newTransaction} setNewTransaction={setNewTransaction}
        editTransaction={editTransaction} setEditTransaction={setEditTransaction}
        importAccountId={importAccountId} setImportAccountId={setImportAccountId}
        csvFile={csvFile} setCsvFile={setCsvFile}
        customCategoryInput={customCategoryInput} setCustomCategoryInput={setCustomCategoryInput}
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
      />

      {/* ── Bottom Tab Bar (mobile only) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0B2118]/95 backdrop-blur-xl border-t border-white/10" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around px-2 py-2">
          {MOBILE_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[52px] ${
                activeTab === tab.id
                  ? 'text-[#A7F38F]'
                  : 'text-white/40'
              }`}
            >
              {tab.icon}
              <span className="text-[9px] font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}