import { useState, useMemo } from 'react';
import { Plus, ArrowLeft, Receipt } from 'lucide-react';
import { Card, CardLabel, CardValue, Badge } from '../ui/AetherUI';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface DineroCategoriesProps {
  theme: any;
  transactions: any[];
  categories: Category[]; // Ahora recibimos las categorías reales de la BD
  setIsCategoryModalOpen: (val: boolean) => void; // Disparador del nuevo modal
}

export function DineroCategories({ transactions, categories, setIsCategoryModalOpen }: DineroCategoriesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Calcular gastos por categoría usando las dinámicas
  const categoriesMap = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const map: Record<string, { total: number, count: number, icon: string }> = {};
    
    // Inicializamos el mapa con las categorías de la base de datos
    categories.forEach(c => { 
      map[c.name] = { total: 0, count: 0, icon: c.icon }; 
    });

    // Sumamos los gastos
    expenses.forEach(t => {
      const cat = t.category || 'General';
      if (!map[cat]) {
        // Si hay una categoría huérfana (borrada o vieja), le ponemos pin por defecto
        map[cat] = { total: 0, count: 0, icon: '📌' }; 
      }
      map[cat].total += Number(t.amount);
      map[cat].count += 1;
    });

    return map;
  }, [transactions, categories]);

  // Filtramos para mostrar solo las categorías que tienen transacciones o que existen en la BD
  const sortedCategories = Object.entries(categoriesMap)
    .sort((a, b) => b[1].total - a[1].total)
    .filter(([name, data]) => data.count > 0 || categories.some(c => c.name === name));

  const totalExpenses = sortedCategories.reduce((acc, curr) => acc + curr[1].total, 0);

  const categoryTransactions = useMemo(() => {
    if (!selectedCategory) return [];
    return transactions
      .filter(t => t.category === selectedCategory && t.type === 'expense')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedCategory]);

  return (
    <div className="w-full max-w-7xl flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ fontFamily: "'Nunito', sans-serif" }}>
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">
          {selectedCategory ? `Category: ${selectedCategory}` : 'Spending Categories'}
        </h2>
        
        {!selectedCategory && (
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[12px] text-sm font-bold shadow-sm transition-colors"
          >
            <Plus size={16} /> New Category
          </button>
        )}
      </div>

      {selectedCategory ? (
        // --- VISTA DE DETALLE ---
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <button 
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors self-start mb-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm"
          >
            <ArrowLeft size={16} /> Back to Categories
          </button>
          
          <Card className="p-0 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Transactions</h3>
              <Badge variant="gray">{categoryTransactions.length} records</Badge>
            </div>
            <div className="flex flex-col">
              {categoryTransactions.map((t, i) => (
                <div key={t.id} className={`flex justify-between items-center p-4 hover:bg-gray-50 transition-colors ${i !== categoryTransactions.length -1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                      <Receipt size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">{t.description}</span>
                      <span className="text-[11px] text-gray-500 uppercase font-medium">
                        {new Date(t.date).toLocaleDateString()} • {t.Finanzas_accounts?.name || 'Account'}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold tabular-nums text-base text-gray-900">
                    -${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              {categoryTransactions.length === 0 && (
                <p className="text-center text-sm text-gray-500 py-10">No expenses in this category yet.</p>
              )}
            </div>
          </Card>
        </div>
      ) : (
        // --- VISTA DE GRILLA ---
        <>
          {sortedCategories.length === 0 ? (
            <Card className="py-20 items-center justify-center">
              <p className="text-sm font-bold text-gray-500">No categories recorded yet. Create one!</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedCategories.map(([catName, data]) => {
                const percentage = totalExpenses > 0 ? ((data.total / totalExpenses) * 100).toFixed(1) : '0';

                return (
                  <Card 
                    key={catName} 
                    interactive 
                    onClick={() => setSelectedCategory(catName)}
                    className="p-5 justify-between gap-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-xl shadow-sm">
                          {data.icon}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-gray-900 leading-tight">{catName}</span>
                          <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">{data.count} transactions</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <CardValue className="text-xl">${data.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</CardValue>
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{percentage}%</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}