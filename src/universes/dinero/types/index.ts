import { z } from 'zod';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  is_debt: boolean;
}

export interface Investment {
  id: string;
  asset_name: string;
  symbol: string;
  holdings: number;
  avg_buy_price: number;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  status: string;
  allocated_budget: number;
  monthly_burn: number;
  tech_stack: string;
}

export interface CryptoRadarTrade {
  id: string;
  user_id: string;
  pair: string;
  direction: string;
  entry_price: number;
  exit_price: number | null;
  position_size: number;
  leverage: number;
  stop_loss: number | null;
  take_profit: number | null;
  commissions: number;
  notes: string;
  status: string;
  pnl_neto: number | null;
  trade_date: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_name: string;
  limit_amount: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  amount: number;
  type: string;
  date: string;
  description: string;
  category: string;
  Finanzas_accounts?: {
    name: string;
  };
}

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  frequency: string;
  next_billing_date: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
}

// Zod schemas for input validation
export const newAccountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  type: z.enum(['Checking', 'Savings', 'Cash', 'Credit Card']),
  currency: z.string().min(1),
  balance: z.coerce.number().min(0, "Balance cannot be negative"),
});

export const newTransactionSchema = z.object({
  account_id: z.string().uuid("Invalid Account ID"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
});

export const newCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().min(1, "Icon is required"),
});

export const newBudgetSchema = z.object({
  category_name: z.string().min(1, "Category name is required"),
  limit_amount: z.coerce.number().positive("Limit must be positive"),
});

export const newSubscriptionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  frequency: z.enum(['Monthly', 'Yearly', 'Weekly']),
  next_billing_date: z.string(),
});

export const newCryptoSchema = z.object({
  pair: z.string().min(1, "Pair is required (e.g. BTCUSDT)"),
  date: z.string(),
  time: z.string(),
  direction: z.enum(['Long', 'Short']),
  entry_price: z.coerce.number().positive("Entry price must be positive"),
  exit_price: z.coerce.number().nonnegative().optional().or(z.literal('')),
  position_size: z.coerce.number().positive("Position size must be positive"),
  leverage: z.coerce.number().min(1).default(1),
  stop_loss: z.coerce.number().nonnegative().optional().or(z.literal('')),
  take_profit: z.coerce.number().nonnegative().optional().or(z.literal('')),
  commissions: z.coerce.number().nonnegative().default(0),
  notes: z.string().optional(),
  status: z.enum(['Open', 'Closed', 'Cancelled']),
  pnl_neto: z.coerce.number().optional().or(z.literal('')),
});
