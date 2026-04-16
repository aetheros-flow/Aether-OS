import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../core/contexts/AuthContext';
import type { Account, Investment, Project, Transaction, CryptoRadarTrade, Category, Budget, Subscription } from '../types';
import { toast } from 'sonner';

export function useDineroData() {
  const { user } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cryptoTrades, setCryptoTrades] = useState<CryptoRadarTrade[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const uid = user.id;
      const [
        accsRes,
        invsRes,
        projsRes,
        transRes,
        tradesRes,
        catsRes,
        bdgtsRes,
        subsRes,
      ] = await Promise.all([
        // All queries are scoped to the current user — do NOT remove the .eq() filters.
        // Supabase RLS is a second layer, not the only one.
        supabase.from('Finanzas_accounts').select('*').eq('user_id', uid),
        supabase.from('Finanzas_investments').select('*').eq('user_id', uid),
        supabase.from('Finanzas_projects').select('*').eq('user_id', uid),
        supabase.from('Finanzas_transactions').select('*, Finanzas_accounts(name)').eq('user_id', uid).order('date', { ascending: false }),
        supabase.from('Finanzas_crypto_radar').select('*').eq('user_id', uid).order('trade_date', { ascending: false }),
        supabase.from('Finanzas_categories').select('*').eq('user_id', uid),
        supabase.from('Finanzas_budgets').select('*').eq('user_id', uid),
        supabase.from('Finanzas_subscriptions').select('*').eq('user_id', uid),
      ]);

      const errors = [
        accsRes.error, invsRes.error, projsRes.error, transRes.error,
        tradesRes.error, catsRes.error, bdgtsRes.error, subsRes.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        console.error('Errors fetching dinero data:', errors);
        toast.error('Could not load some financial data. Please refresh.');
      }

      if (accsRes.data)  setAccounts(accsRes.data);
      if (invsRes.data)  setInvestments(invsRes.data);
      if (projsRes.data) setProjects(projsRes.data);
      if (transRes.data) setTransactions(transRes.data as Transaction[]);
      if (tradesRes.data) setCryptoTrades(tradesRes.data);
      if (catsRes.data)  setCategories(catsRes.data);
      if (bdgtsRes.data) setBudgets(bdgtsRes.data);
      if (subsRes.data)  setSubscriptions(subsRes.data);
    } catch (error) {
      console.error('Fatal error loading finances:', error);
      toast.error('Could not connect to financial data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    accounts, investments, projects, transactions, cryptoTrades,
    categories, budgets, subscriptions, loading, fetchData,
  };
}
