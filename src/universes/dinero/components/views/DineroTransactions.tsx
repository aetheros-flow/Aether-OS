import { useState, useMemo } from 'react';
import { Search, Plus, Filter, Download, Upload, MoreHorizontal } from 'lucide-react';
import { Card, Badge, Dropdown } from '../ui/AetherUI';

interface DineroTransactionsProps {
  accounts: any[];
  transactions: any[];
  theme: any;
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
  onExportClick
}: DineroTransactionsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchAccount = filterAccount === 'all' || t.account_id === filterAccount;
      const matchType = filterType === 'all' || t.type === filterType;
      return matchSearch && matchAccount && matchType;
    });
  }, [transactions, searchTerm, filterAccount, filterType]);

  return (
    <div className="w-full max-w-7xl flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ fontFamily: "'Nunito', sans-serif" }}>
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">Transactions</h2>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setIsTransactionModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[12px] text-sm font-bold shadow-sm transition-colors"
          >
            <Plus size={16} /> New Transaction
          </button>
          <div className="flex items-center gap-1 bg-white p-1 rounded-[12px] border border-gray-200 shadow-sm">
             <button onClick={onImportClick} className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors" title="Import CSV">
               <Upload size={16} />
             </button>
             <button onClick={onExportClick} className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors" title="Export Data">
               <Download size={16} />
             </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={16} className="text-gray-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Filters</span>
            </div>
            
            <div className="flex flex-col gap-5">
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search keywords..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-[10px] text-sm font-medium outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>

              {/* Accounts Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase text-gray-400">Account</label>
                <Dropdown 
                  value={filterAccount}
                  onChange={setFilterAccount}
                  options={[
                    { value: 'all', label: 'All Accounts' },
                    ...accounts.map(acc => ({ value: acc.id, label: acc.name }))
                  ]}
                />
              </div>

              {/* Type Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase text-gray-400">Type</label>
                <div className="flex bg-gray-100 p-1 rounded-[10px]">
                  <button 
                    onClick={() => setFilterType('all')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${filterType === 'all' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                  >All</button>
                  <button 
                    onClick={() => setFilterType('income')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${filterType === 'income' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >In</button>
                  <button 
                    onClick={() => setFilterType('expense')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${filterType === 'expense' ? 'bg-white shadow-sm text-rose-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >Out</button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card className="flex-1 p-0 overflow-hidden w-full">
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                  <th className="p-4 pl-6 font-bold w-32">Date</th>
                  <th className="p-4 font-bold">Description</th>
                  <th className="p-4 font-bold">Account</th>
                  <th className="p-4 font-bold">Category</th>
                  <th className="p-4 text-right pr-6 font-bold">Amount</th>
                  <th className="p-4 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t, index) => (
                  <tr 
                    key={t.id} 
                    onClick={() => { setEditTransaction(t); setIsEditModalOpen(true); }}
                    className={`group cursor-pointer hover:bg-gray-50 transition-colors ${index !== filteredTransactions.length - 1 ? 'border-b border-gray-50' : ''}`}
                  >
                    <td className="p-4 pl-6">
                      <span className="text-xs font-semibold text-gray-500">
                        {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-sm text-gray-900">{t.description}</td>
                    <td className="p-4">
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                        {t.Finanzas_accounts?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant={t.type === 'income' ? 'green' : 'gray'}>{t.category}</Badge>
                    </td>
                    <td className={`p-4 text-right pr-6 font-bold tabular-nums ${t.type === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {t.type === 'income' ? '+' : '-'}${Number(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-200 rounded-md opacity-0 group-hover:opacity-100 transition-all">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredTransactions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Search size={32} className="text-gray-300 mb-3" />
                <p className="text-sm font-bold text-gray-800">No transactions found</p>
                <p className="text-xs">Adjust your filters or add a new record.</p>
              </div>
            )}
          </div>
          <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center text-xs font-bold text-gray-500">
            <span>Showing {filteredTransactions.length} records</span>
          </div>
        </Card>

      </div>
    </div>
  );
}