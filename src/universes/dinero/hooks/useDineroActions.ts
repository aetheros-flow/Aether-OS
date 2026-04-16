import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  newAccountSchema,
  newTransactionSchema,
  newCategorySchema,
  newBudgetSchema,
  newSubscriptionSchema,
  newCryptoSchema,
  type Transaction,
  type Category,
} from '../types';
import { parseFile, autoCategorize, exportRecords } from '../lib/dinero-io';

type FetchData = () => Promise<void>;

/**
 * Reads the current balance from the DB before writing, preventing
 * stale-state overwrites when multiple tabs/requests are open.
 *
 * NOTE: For true atomicity, deploy the SQL function in
 * src/migrations/001_atomic_balance.sql and replace this with supabase.rpc().
 */
async function adjustAccountBalance(accountId: string, delta: number): Promise<void> {
  const { data, error: fetchErr } = await supabase
    .from('Finanzas_accounts')
    .select('balance')
    .eq('id', accountId)
    .single();
  if (fetchErr) throw fetchErr;

  const { error: updateErr } = await supabase
    .from('Finanzas_accounts')
    .update({ balance: Number(data.balance) + delta })
    .eq('id', accountId);
  if (updateErr) throw updateErr;
}

/** Returns the signed delta for account balance given a transaction type. */
const txDelta = (type: string, amount: number) =>
  type === 'income' ? amount : -amount;

/** Sanitizes errors so raw DB messages are never shown in the UI. */
const sanitize = (err: unknown): string => {
  if (err instanceof z.ZodError) return err.errors[0].message;
  console.error('[DineroAction]', err);
  return 'An unexpected error occurred. Please try again.';
};

export function useDineroActions(userId: string | undefined, fetchData: FetchData) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const guard = (): boolean => {
    if (!userId) {
      toast.error('Session expired. Please log in again.');
      return false;
    }
    return true;
  };

  const run = async (fn: () => Promise<void>): Promise<void> => {
    setIsSubmitting(true);
    try { await fn(); } finally { setIsSubmitting(false); }
  };

  // ─── Accounts ────────────────────────────────────────────────────────────────

  const createAccount = async (
    input: { name: string; type: string; currency: string; balance: string },
    onSuccess: () => void,
  ) => {
    if (!guard()) return;
    await run(async () => {
      try {
        const parsed = newAccountSchema.parse(input);
        const { error } = await supabase.from('Finanzas_accounts').insert([{
          user_id: userId,
          name: parsed.name,
          type: parsed.type,
          currency: parsed.currency,
          balance: parsed.balance,
          is_debt: parsed.type === 'Credit Card',
        }]);
        if (error) throw error;
        toast.success('Account registered!');
        onSuccess();
        await fetchData();
      } catch (err) { toast.error(sanitize(err)); }
    });
  };

  // ─── Transactions ────────────────────────────────────────────────────────────

  const createTransaction = async (
    input: { account_id: string; amount: string; type: string; category: string; description: string },
    customCategory: string,
    onSuccess: () => void,
  ) => {
    if (!guard()) return;
    await run(async () => {
      try {
        const finalCategory =
          input.category === 'custom_select' ? customCategory : input.category;
        const parsed = newTransactionSchema.parse({ ...input, category: finalCategory });
        const { error } = await supabase.from('Finanzas_transactions').insert([{
          user_id: userId, ...parsed, date: new Date().toISOString(),
        }]);
        if (error) throw error;
        // Adjust balance using a fresh DB read to avoid stale-state race conditions.
        await adjustAccountBalance(parsed.account_id, txDelta(parsed.type, parsed.amount));
        toast.success('Transaction logged');
        onSuccess();
        await fetchData();
      } catch (err) { toast.error(sanitize(err)); }
    });
  };

  /**
   * Updates a transaction AND correctly reverses the original balance effect
   * before applying the new one. Requires the original (pre-edit) transaction.
   */
  const updateTransaction = async (
    original: Transaction,
    draft: { amount: string; type: string; category: string; description: string },
    onSuccess: () => void,
  ) => {
    await run(async () => {
      try {
        const newAmount = Number(draft.amount);
        if (isNaN(newAmount) || newAmount <= 0) throw new Error('Amount must be a positive number.');

        const { error } = await supabase
          .from('Finanzas_transactions')
          .update({
            category: draft.category,
            description: draft.description,
            amount: newAmount,
            type: draft.type,
          })
          .eq('id', original.id);
        if (error) throw error;

        // Net delta = undo original effect + apply new effect
        const delta =
          -txDelta(original.type, Number(original.amount)) +
          txDelta(draft.type, newAmount);
        await adjustAccountBalance(original.account_id, delta);

        toast.success('Transaction updated');
        onSuccess();
        await fetchData();
      } catch (err) { toast.error(sanitize(err)); }
    });
  };

  /**
   * Deletes a transaction AND reverses the account balance effect.
   * Requires the original (pre-delete) transaction object.
   */
  const deleteTransaction = async (original: Transaction, onSuccess: () => void) => {
    await run(async () => {
      try {
        const { error } = await supabase
          .from('Finanzas_transactions')
          .delete()
          .eq('id', original.id);
        if (error) throw error;

        // Reverse the balance effect of this transaction.
        await adjustAccountBalance(
          original.account_id,
          -txDelta(original.type, Number(original.amount)),
        );
        toast.success('Transaction deleted');
        onSuccess();
        await fetchData();
      } catch (err) { toast.error(sanitize(err)); }
    });
  };

  // ─── Crypto Radar ────────────────────────────────────────────────────────────

  const createCryptoTrade = async (input: unknown, onSuccess: () => void) => {
    if (!guard()) return;
    await run(async () => {
      try {
        const parsed = newCryptoSchema.parse(input);
        const localDT = `${parsed.date}T${parsed.time || '00:00'}`;
        const tradeDate = new Date(localDT);
        const safeIso = isNaN(tradeDate.getTime())
          ? new Date().toISOString()
          : tradeDate.toISOString();

        const { error } = await supabase.from('Finanzas_crypto_radar').insert([{
          user_id: userId,
          pair: parsed.pair.toUpperCase().replace('/', ''),
          direction: parsed.direction,
          entry_price: parsed.entry_price,
          exit_price: parsed.exit_price || null,
          position_size: parsed.position_size,
          leverage: parsed.leverage,
          stop_loss: parsed.stop_loss || null,
          take_profit: parsed.take_profit || null,
          commissions: parsed.commissions,
          notes: parsed.notes,
          status: parsed.status,
          pnl_neto: parsed.pnl_neto || 0,
          trade_date: safeIso,
        }]);
        if (error) throw error;
        toast.success('Trade logged');
        onSuccess();
        await fetchData();
      } catch (err) { toast.error(sanitize(err)); }
    });
  };

  // ─── Categories / Budgets / Subscriptions ───────────────────────────────────

  const createCategory = async (
    input: { name: string; icon: string },
    onSuccess: () => void,
  ) => {
    if (!guard()) return;
    await run(async () => {
      try {
        const parsed = newCategorySchema.parse(input);
        const { error } = await supabase
          .from('Finanzas_categories')
          .insert([{ user_id: userId, ...parsed }]);
        if (error) throw error;
        toast.success('Category saved');
        onSuccess();
        await fetchData();
      } catch (err) { toast.error(sanitize(err)); }
    });
  };

  const setBudget = async (
    input: { category_name: string; limit_amount: string },
    onSuccess: () => void,
  ) => {
    if (!guard()) return;
    await run(async () => {
      try {
        const parsed = newBudgetSchema.parse(input);
        const { error } = await supabase
          .from('Finanzas_budgets')
          .upsert({ user_id: userId, ...parsed }, { onConflict: 'user_id, category_name' });
        if (error) throw error;
        toast.success('Budget applied');
        onSuccess();
        await fetchData();
      } catch (err) { toast.error(sanitize(err)); }
    });
  };

  const createSubscription = async (
    input: { name: string; amount: string; frequency: string; next_billing_date: string },
    onSuccess: () => void,
  ) => {
    if (!guard()) return;
    await run(async () => {
      try {
        const parsed = newSubscriptionSchema.parse(input);
        const { error } = await supabase
          .from('Finanzas_subscriptions')
          .insert([{ user_id: userId, ...parsed }]);
        if (error) throw error;
        toast.success('Subscription saved!');
        onSuccess();
        await fetchData();
      } catch (err) { toast.error(sanitize(err)); }
    });
  };

  // ─── Import / Export ─────────────────────────────────────────────────────────

  const importFile = async (
    file: File,
    importAccountId: string,
    categories: Category[],
    onSuccess: () => void,
  ) => {
    if (!guard()) return;
    await run(async () => {
      try {
        const rawRecords = await parseFile(file);
        if (rawRecords.length === 0)
          throw new Error('No readable transactions found in the file.');

        const enriched = autoCategorize(rawRecords, categories);
        const records = enriched.map(r => ({
          user_id: userId,
          account_id: importAccountId,
          amount: r.amount,
          type: r.type,
          date: r.date,
          description: r.description,
          category: r.suggestedCategory,
        }));

        const { error } = await supabase.from('Finanzas_transactions').insert(records);
        if (error) throw error;
        toast.success(`Imported ${records.length} transactions.`);
        onSuccess();
        await fetchData();
      } catch (err) { toast.error(sanitize(err)); }
    });
  };

  const exportData = (txs: Transaction[], format: 'csv' | 'xlsx' | 'json' | 'pdf') => {
    exportRecords(txs as any, format);
    toast.success('Export initiated');
  };

  return {
    isSubmitting,
    createAccount,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createCryptoTrade,
    createCategory,
    setBudget,
    createSubscription,
    importFile,
    exportData,
  };
}
