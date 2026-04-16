import React, { useEffect, useRef } from 'react';
import { Loader2, Wallet, Tag, AlignLeft, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import AetherModal from '../../../../core/components/AetherModal';

interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

interface TransactionState {
  account_id: string;
  amount: string;
  type: string;
  category: string;
  description: string;
}

interface DineroQuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  newTransaction: TransactionState;
  setNewTransaction: React.Dispatch<React.SetStateAction<TransactionState>>;
  accounts: Account[];
  isSubmitting: boolean;
  onSubmit: (e: { preventDefault(): void }) => void;
}

export function DineroQuickAddModal({
  isOpen,
  onClose,
  newTransaction,
  setNewTransaction,
  accounts,
  isSubmitting,
  onSubmit
}: DineroQuickAddModalProps) {
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus en el input numérico cuando se abre el modal para escribir instantáneamente
  useEffect(() => {
    if (isOpen && amountInputRef.current) {
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const isExpense = newTransaction.type === 'expense';
  const themeColor = isExpense ? 'text-rose-500' : 'text-emerald-500';
  const bgSoft = isExpense ? 'bg-rose-50' : 'bg-emerald-50';
  const borderColor = isExpense ? 'border-rose-200 focus:border-rose-500 focus:ring-rose-100' : 'border-emerald-200 focus:border-emerald-500 focus:ring-emerald-100';

  return (
    <AetherModal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center mb-6">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${bgSoft} ${themeColor}`}>
          {isExpense ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#2D2A26]">
          {isExpense ? 'New Expense' : 'New Income'}
        </h2>
        <div className="flex items-center gap-1.5 mt-1 bg-gray-100 px-3 py-1 rounded-full">
          <Tag size={12} className="text-gray-500" />
          <span className="text-[10px] font-extrabold text-gray-600 uppercase tracking-widest">
            {newTransaction.category}
          </span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        
        {/* INPUT DE MONTO ULTRA GRANDE */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center w-full">
            <span className={`absolute left-4 text-3xl font-extrabold ${themeColor}`}>$</span>
            <input
              ref={amountInputRef}
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              className={`w-full text-center text-5xl font-black py-4 bg-transparent border-b-2 outline-none transition-all ${borderColor} text-[#2D2A26] placeholder-gray-200`}
            />
          </div>
        </div>

        {/* SELECTOR DE CUENTAS (Estilo Pills) */}
        <div className="flex flex-col gap-2 mt-2">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Account</label>
          <div className="grid grid-cols-2 gap-2">
            {accounts.map(acc => (
              <button
                key={acc.id}
                type="button"
                onClick={() => setNewTransaction({ ...newTransaction, account_id: acc.id })}
                className={`p-3 rounded-xl border flex items-center gap-2 transition-all text-left ${
                  newTransaction.account_id === acc.id 
                    ? 'border-[#2D2A26] bg-[#2D2A26] text-white shadow-md' 
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <Wallet size={16} className={newTransaction.account_id === acc.id ? 'text-white' : 'text-gray-400'} />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold truncate">{acc.name}</span>
                  <span className="text-[9px] opacity-70 truncate">${acc.balance.toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* NOTA OPCIONAL */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Note (Optional)</label>
          <div className="relative flex items-center">
            <AlignLeft size={16} className="absolute left-4 text-gray-400" />
            <input
              type="text"
              placeholder="e.g., Dinner with friends"
              value={newTransaction.description}
              onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-gray-300 transition-all text-[#2D2A26]"
            />
          </div>
        </div>

        {/* BOTON DE GUARDAR */}
        <button
          type="submit"
          disabled={isSubmitting || !newTransaction.amount}
          className={`w-full py-4 rounded-2xl text-[11px] font-extrabold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all ${
            !newTransaction.amount 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : isExpense 
                ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-200' 
                : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200'
          }`}
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Log Transaction'}
        </button>
      </form>
    </AetherModal>
  );
}