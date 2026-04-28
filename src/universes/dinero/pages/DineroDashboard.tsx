import React, { useState, useEffect } from 'react';
import {
  Wallet, ArrowLeft, Loader2, Upload, Target, Plus, LayoutDashboard, Receipt, Tag, Bitcoin, CalendarClock, PieChart, Sparkles, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { exportRecords } from '../lib/dinero-io';
import { analyzeImport, commitImport, type PreparedRow, type AnalysisResult } from '../lib/import-pipeline';
import { toast } from 'sonner';

import { DineroOverview } from '../components/views/DineroOverview';
import { DineroTransactions } from '../components/views/DineroTransactions';
import { DineroCategories } from '../components/views/DineroCategories';
import { DineroRadar } from '../components/views/DineroRadar';
import { DineroModals } from '../components/modals/DineroModals';
import { DineroSubscriptions } from '../components/views/DineroSubscriptions';
import ImportPreviewSheet from '../components/modals/ImportPreviewSheet';
import { SURFACE, UNIVERSE_ACCENT, alpha } from '../../../lib/universe-palette';
import AuraLayout from '../../../components/layout/AuraLayout';

export type TabType = 'dashboard' | 'transactions' | 'categories' | 'calendar' | 'budget' | 'radar';

interface Account { id: string; name: string; type: string; currency: string; balance: number; is_debt: boolean; }
interface CryptoRadarTrade { id: string; user_id: string; pair: string; direction: string; entry_price: number; exit_price: number | null; position_size: number; leverage: number; stop_loss: number | null; take_profit: number | null; commissions: number; notes: string; status: string; pnl_neto: number | null; trade_date: string; }
interface Budget { id: string; category_name: string; limit_amount: number; }

// Dinero identity — desaturated sage green (was neon #05DF72).
const ACCENT = UNIVERSE_ACCENT.dinero;
const ACCENT_SOFT = '#A8D9B3';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};
const tapPhysics = { scale: 0.96, filter: 'brightness(1.1)' };
const hoverPhysics = { scale: 1.01 };

export default function DineroDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState<number>(0);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [cryptoTrades, setCryptoTrades] = useState<CryptoRadarTrade[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isCryptoModalOpen, setIsCryptoModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isEditSubscriptionModalOpen, setIsEditSubscriptionModalOpen] = useState(false);
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
  });
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [editTransaction, setEditTransaction] = useState<any>(null);
  const [editSubscription, setEditSubscription] = useState<any>(null);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importAccountId, setImportAccountId] = useState<string>('');

  // Import preview state: results of `analyzeImport`, shown in ImportPreviewSheet.
  const [importPreview, setImportPreview] = useState<AnalysisResult | null>(null);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);

  const [newCrypto, setNewCrypto] = useState({
    pair: '', date: new Date().toISOString().split('T')[0], time: '12:00', direction: 'Long',
    entry_price: '', exit_price: '', position_size: '', leverage: '1', stop_loss: '', take_profit: '', commissions: '', notes: '', status: 'Open', pnl_neto: ''
  });

  const TABS: { id: TabType; label: string; icon: React.ReactNode; mobileLabel: string }[] = [
    { id: 'dashboard',    label: 'Dashboard',     mobileLabel: 'Home',   icon: <LayoutDashboard size={18} /> },
    { id: 'transactions', label: 'Transactions',  mobileLabel: 'Txns',   icon: <Receipt size={18} /> },
    { id: 'categories',   label: 'Categories',    mobileLabel: 'Cats',   icon: <Tag size={18} /> },
    { id: 'calendar',     label: 'Subscriptions', mobileLabel: 'Subs',   icon: <CalendarClock size={18} /> },
    { id: 'budget',       label: 'Budget',        mobileLabel: 'Budget', icon: <PieChart size={18} /> },
    { id: 'radar',        label: 'Radar Crypto',  mobileLabel: 'Crypto', icon: <Bitcoin size={18} /> },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        { data: accs },
        { data: trans },
        { data: trades },
        { data: cats },
        { data: bdgts },
        { data: subs }
      ] = await Promise.all([
        supabase.from('Finanzas_accounts').select('*'),
        supabase.from('Finanzas_transactions').select('*, Finanzas_accounts(name)').order('date', { ascending: false }),
        supabase.from('Finanzas_crypto_radar').select('*').order('trade_date', { ascending: false }),
        supabase.from('Finanzas_categories').select('*'),
        supabase.from('Finanzas_budgets').select('*'),
        supabase.from('Finanzas_subscriptions').select('*')
      ]);

      if (accs) {
        setAccounts(accs);
        if (accs.length > 0 && newTransaction.account_id === '') {
          setNewTransaction(prev => ({ ...prev, account_id: accs[0].id }));
        }
      }
      if (trans) setTransactions(trans);
      if (trades) setCryptoTrades(trades);
      if (cats) setCategories(cats);
      if (bdgts) setBudgets(bdgts);
      if (subs) setSubscriptions(subs);

    } catch (error) {
      console.error("Error loading finances:", error);
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

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSubscription) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('Finanzas_subscriptions').update({
        name: editSubscription.name,
        amount: Number(editSubscription.amount),
        frequency: editSubscription.frequency,
        next_billing_date: editSubscription.next_billing_date,
      }).eq('id', editSubscription.id);
      if (error) throw error;
      setIsEditSubscriptionModalOpen(false);
      setEditSubscription(null);
      await fetchData();
    } catch (error: any) { alert("Update error: " + error.message); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteSubscription = async () => {
    if (!editSubscription) return;
    if (!window.confirm(`Delete the "${editSubscription.name}" subscription?`)) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('Finanzas_subscriptions').delete().eq('id', editSubscription.id);
      if (error) throw error;
      setIsEditSubscriptionModalOpen(false);
      setEditSubscription(null);
      await fetchData();
    } catch (e: any) { alert("Error deleting: " + e.message); }
    finally { setIsSubmitting(false); }
  };

  const openEditSubscription = (sub: any) => {
    // Normalize the date for the date input (yyyy-mm-dd).
    const dateStr = sub.next_billing_date
      ? new Date(sub.next_billing_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    setEditSubscription({
      ...sub,
      amount: String(sub.amount),
      next_billing_date: dateStr,
    });
    setIsEditSubscriptionModalOpen(true);
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
      const newAmount = Number(editTransaction.amount);
      const newType: 'income' | 'expense' = editTransaction.type;

      // IMPORTANT: always compute the balance delta from the ORIGINAL row (not the
      // edited draft), otherwise if the user changes type/amount we lose the old
      // values and the balance drifts. Pull the untouched original from state.
      const original = transactions.find(t => t.id === editTransaction.id);
      if (!original) throw new Error('Original transaction not found');
      const oldAmount = Number(original.amount);
      const oldType: 'income' | 'expense' = original.type;
      const accountId: string | undefined = original.account_id;

      const { error } = await supabase.from('Finanzas_transactions').update({
        category:    editTransaction.category,
        description: editTransaction.description,
        amount:      newAmount,
        type:        newType,
      }).eq('id', editTransaction.id);
      if (error) throw error;

      // Reconcile the account balance: reverse the old effect, apply the new one.
      if (accountId) {
        const account = accounts.find(a => a.id === accountId);
        if (account) {
          const reversedOld = oldType === 'income' ? account.balance - oldAmount : account.balance + oldAmount;
          const applyNew    = newType === 'income' ? reversedOld + newAmount     : reversedOld - newAmount;
          await supabase.from('Finanzas_accounts').update({ balance: applyNew }).eq('id', account.id);
        }
      }

      setIsEditModalOpen(false);
      setEditTransaction(null);
      await fetchData();
    } catch (error: any) { alert("Update error: " + error.message); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteTransaction = async () => {
    const tx = editTransaction ? transactions.find(t => t.id === editTransaction.id) : null;
    if (!tx) return;
    if (!window.confirm("Are you sure you want to delete this transaction? The account balance will be adjusted.")) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('Finanzas_transactions').delete().eq('id', tx.id);
      if (error) throw error;

      // Reverse the transaction's effect on account balance
      if (tx.account_id) {
        const account = accounts.find(a => a.id === tx.account_id);
        if (account) {
          const amt = Number(tx.amount);
          const reversed = tx.type === 'income' ? account.balance - amt : account.balance + amt;
          await supabase.from('Finanzas_accounts').update({ balance: reversed }).eq('id', account.id);
        }
      }

      setEditTransaction(null);
      setIsEditModalOpen(false);
      await fetchData();
    } catch (e: any) { alert("Error deleting: " + e.message); }
    finally { setIsSubmitting(false); }
  };

  // ── Crypto trade delete (was missing) ────────────────────────────────────
  const handleDeleteCryptoTrade = async (tradeId: string) => {
    if (!window.confirm('Delete this trade? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('Finanzas_crypto_radar').delete().eq('id', tradeId);
      if (error) throw error;
      await fetchData();
    } catch (e: any) {
      alert('Error deleting trade: ' + e.message);
    }
  };

  // ── Two-phase import: analyze (parse + categorize via AI + dedupe) → preview → commit
  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !importAccountId) {
      toast.error('Please select a valid destination account and file.');
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await checkUser();
      if (!user) return;

      const result = await analyzeImport({
        file: csvFile,
        userId: user.id,
        categories,
        existingTransactions: transactions.map(t => ({
          date: t.date,
          amount: Number(t.amount),
          description: String(t.description ?? ''),
          type: t.type,
        })),
      });

      // Close the file-picker modal and open the AI preview sheet
      setIsCsvModalOpen(false);
      setImportPreview(result);
      setImportPreviewOpen(true);

      const { total, fromAI, fromMemory, duplicates } = result.counts;
      toast.success(
        `Parsed ${total} · ${fromAI} via AI${fromMemory > 0 ? ` · ${fromMemory} from memory` : ''}${duplicates > 0 ? ` · ${duplicates} duplicate${duplicates === 1 ? '' : 's'}` : ''}`,
        { duration: 4500 },
      );
    } catch (error: any) {
      toast.error('Import error: ' + (error?.message ?? 'Unknown'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommitImport = async (rows: PreparedRow[], rememberOverrides: boolean) => {
    const user = await checkUser();
    if (!user) return;
    try {
      const { inserted, remembered } = await commitImport({
        rows,
        userId: user.id,
        accountId: importAccountId,
        rememberOverrides,
      });

      // Adjust account balance for the inserted transactions. We do this in one
      // combined delta to keep account reads minimal.
      const kept = rows.filter(r => r.selected);
      if (kept.length > 0) {
        const netDelta = kept.reduce(
          (sum, r) => sum + (r.type === 'income' ? r.amount : -r.amount),
          0,
        );
        const account = accounts.find(a => a.id === importAccountId);
        if (account) {
          await supabase.from('Finanzas_accounts')
            .update({ balance: account.balance + netDelta })
            .eq('id', account.id);
        }
      }

      toast.success(
        remembered > 0
          ? `Imported ${inserted} · learned ${remembered} new pattern${remembered === 1 ? '' : 's'}`
          : `Imported ${inserted} transaction${inserted === 1 ? '' : 's'}`,
      );
      setCsvFile(null);
      setImportPreview(null);
      await fetchData();
    } catch (err: any) {
      toast.error('Commit failed: ' + (err?.message ?? 'Unknown'));
      throw err;
    }
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

  if (loading && accounts.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: SURFACE.bg }}
      >
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: ACCENT }} />
      </div>
    );
  }

  if (onboardingStep === 1 || onboardingStep === 2) {
    return (
      <div
        className="relative min-h-screen flex items-center justify-center font-sans overflow-hidden p-4"
        style={{ background: SURFACE.bg, color: SURFACE.text }}
      >
        <div className="fixed top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${ACCENT}22 0%, transparent 70%)`, filter: 'blur(120px)' }} />
        {onboardingStep === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 rounded-3xl bg-zinc-900/80 backdrop-blur-xl border border-white/10 max-w-md w-full flex flex-col overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-white/5 flex items-center gap-4">
              <motion.button whileTap={tapPhysics} onClick={() => navigate('/')} className="p-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors"><ArrowLeft size={18} /></motion.button>
              <h2 className="font-serif text-xl font-medium tracking-tight flex-1 text-center pr-6 text-white">Add Unlinked Account</h2>
            </div>
            <form onSubmit={handleCreateAccount} className="p-6 flex flex-col gap-5">
              <p className="text-sm font-medium text-zinc-300 leading-relaxed"><b className="font-bold text-white">Let's go!</b> And don't worry—if you change your mind, you can link your account at any time.</p>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Give it a nickname</label>
                <input type="text" required placeholder="KiwiBank - Daily" value={newAccount.name} onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })} className="neo-input" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">What type of account are you adding?</label>
                <select value={newAccount.type} onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })} className="neo-input appearance-none">
                  <option value="Checking" className="bg-zinc-900">Checking</option>
                  <option value="Savings" className="bg-zinc-900">Savings</option>
                  <option value="Cash" className="bg-zinc-900">Cash</option>
                  <option value="Credit Card" className="bg-zinc-900">Credit Card</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">What is your current account balance?</label>
                <input type="number" step="0.01" required placeholder="0" value={newAccount.balance} onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })} className="neo-input font-mono" />
              </div>
              <div className="pt-4 border-t border-white/5 mt-2">
                <motion.button whileTap={tapPhysics} type="submit" disabled={isSubmitting} className="w-full py-3.5 rounded-full font-black text-sm text-black flex items-center justify-center" style={{ backgroundColor: ACCENT, boxShadow: `0 0 32px ${ACCENT}55` }}>
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Next'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
        {onboardingStep === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 rounded-3xl bg-zinc-900/80 backdrop-blur-xl border border-white/10 max-w-md w-full flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-serif text-base font-medium text-white">Add Checking, Savings, or Cash Account</h2>
            </div>
            <div className="h-40 w-full flex flex-col items-center justify-center relative overflow-hidden" style={{ background: `radial-gradient(circle at center, ${ACCENT}22, transparent 70%)` }}>
              <Wallet size={64} style={{ color: ACCENT, filter: `drop-shadow(0 0 24px ${ACCENT}88)` }} className="transform -rotate-12" />
            </div>
            <div className="p-6 flex flex-col gap-4">
              <h3 className="text-[15px] font-bold text-white">It's all about assigning the money you have right now.</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">That means money that you have in a checking account, a savings account, and/or in cash.</p>
              <div className="flex items-center justify-end gap-3 mt-4 pt-4">
                <motion.button whileTap={tapPhysics} onClick={() => setOnboardingStep(3)} className="px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-colors">Skip</motion.button>
                <motion.button whileTap={tapPhysics} onClick={() => setOnboardingStep(1)} className="px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest text-black" style={{ backgroundColor: ACCENT, boxShadow: `0 0 28px ${ACCENT}55` }}>Add Another</motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  const headerActions = (
    <div className="flex items-center gap-3">
      {activeTab === 'radar' && (
        <motion.button whileTap={tapPhysics} onClick={() => setIsCryptoModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest text-black" style={{ backgroundColor: ACCENT, boxShadow: `0 0 24px ${ACCENT}55` }}>
          <Plus size={14} strokeWidth={3} /> Log Trade
        </motion.button>
      )}
      {(activeTab === 'dashboard' || activeTab === 'transactions') && (
        <motion.button whileTap={tapPhysics} onClick={() => setIsCsvModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10 transition-colors">
          <Upload size={14} /> Quick Import
        </motion.button>
      )}
    </div>
  );

  return (
    <AuraLayout
      title="Financial Hub"
      subtitle={`Net worth · $${netWorthCalculated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      accentColor={ACCENT}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerActions={headerActions}
    >
      <div className="w-full flex justify-center pb-8">
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
        {activeTab === 'radar' && <DineroRadar cryptoTrades={cryptoTrades} onDeleteTrade={handleDeleteCryptoTrade} />}

        {activeTab === 'calendar' && (
          <DineroSubscriptions
            subscriptions={subscriptions}
            setIsSubscriptionModalOpen={setIsSubscriptionModalOpen}
            onEditSubscription={openEditSubscription}
          />
        )}

        {activeTab === 'budget' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6 w-full max-w-7xl"
          >
            <motion.div
              variants={itemVariants}
              className="rounded-3xl bg-zinc-900/60 border border-white/5 backdrop-blur-xl flex flex-col justify-center items-center py-10 relative overflow-hidden"
            >
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full pointer-events-none opacity-50" style={{ background: `radial-gradient(circle, ${ACCENT}22, transparent 70%)`, filter: 'blur(80px)' }} />
              <div className="relative z-10 flex flex-col items-center">
                <div className="p-4 rounded-2xl mb-4" style={{ backgroundColor: `${ACCENT}1F` }}>
                  <Target size={32} style={{ color: ACCENT }} />
                </div>
                <h3 className="font-serif text-2xl font-medium text-white mb-2">Smart Budgets</h3>
                <p className="text-sm text-zinc-400 max-w-md text-center font-medium">Model your monthly spending limits and avoid debt.</p>
              </div>
              <motion.button
                whileTap={tapPhysics}
                whileHover={hoverPhysics}
                onClick={() => setIsBudgetModalOpen(true)}
                className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest text-black z-10"
                style={{ backgroundColor: ACCENT, boxShadow: `0 0 24px ${ACCENT}55` }}
              >
                <Plus size={14} strokeWidth={3} /> Set Budget
              </motion.button>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {budgets.length > 0 ? budgets.map((b) => {
                const amount = expensesByCategoryMap[b.category_name] || 0;
                const max = Number(b.limit_amount);
                const percent = max > 0 ? Math.min((amount / max) * 100, 100) : 100;
                const isDanger = percent >= 80;
                const isExceeded = percent >= 100;
                const barColor = isExceeded ? '#FB7185' : isDanger ? '#FBBF24' : ACCENT;

                return (
                  <motion.div
                    key={b.id}
                    variants={itemVariants}
                    whileHover={hoverPhysics}
                    className="rounded-3xl p-6 bg-zinc-900/60 border border-white/5 backdrop-blur-xl flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-bold text-white truncate">{b.category_name}</span>
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shrink-0 bg-white/5 border border-white/5 text-zinc-400">Limit · ${max}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-3xl font-black tabular-nums tracking-tight" style={{ color: isExceeded ? '#FB7185' : '#fff' }}>
                        ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs font-bold text-zinc-400">{percent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${percent}%`, backgroundColor: barColor, boxShadow: `0 0 12px ${barColor}66` }}
                      />
                    </div>
                    {isExceeded && <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 text-center mt-1">Budget Exceeded</p>}
                  </motion.div>
                );
              }) : (
                <motion.div variants={itemVariants} className="col-span-full rounded-3xl p-10 bg-zinc-900/60 border border-white/5 backdrop-blur-xl text-center">
                  <p className="text-sm text-zinc-400 font-medium">No budgets set yet. Click "Set Budget" to start tracking your limits.</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

      </div>

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

        isEditSubscriptionModalOpen={isEditSubscriptionModalOpen} setIsEditSubscriptionModalOpen={setIsEditSubscriptionModalOpen}
        editSubscription={editSubscription} setEditSubscription={setEditSubscription}
        handleUpdateSubscription={handleUpdateSubscription}
        handleDeleteSubscription={handleDeleteSubscription}

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

      {importPreview && (
        <ImportPreviewSheet
          open={importPreviewOpen}
          onClose={() => setImportPreviewOpen(false)}
          initialRows={importPreview.rows}
          counts={importPreview.counts}
          aiWarning={importPreview.aiWarning}
          categories={categories}
          onCommit={handleCommitImport}
        />
      )}
    </AuraLayout>
  );
}
