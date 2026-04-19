import { useMemo } from 'react';
import { Plus, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { Card, CardLabel, CardValue, Badge } from '../ui/AetherUI';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  next_billing_date: string;
  status: string;
}

interface DineroSubscriptionsProps {
  subscriptions: Subscription[];
  setIsSubscriptionModalOpen: (val: boolean) => void;
}

export function DineroSubscriptions({ subscriptions, setIsSubscriptionModalOpen }: DineroSubscriptionsProps) {
  
  // Calcular el costo FIJO MENSUAL real (dividiendo los anuales por 12)
  const monthlyFixedCost = useMemo(() => {
    return subscriptions
      .filter(s => s.status === 'Active')
      .reduce((acc, sub) => {
        const amount = Number(sub.amount);
        if (sub.frequency === 'Yearly') return acc + (amount / 12);
        return acc + amount; // Asumimos que los demás son 'Monthly'
      }, 0);
  }, [subscriptions]);

  // Ordenar por próxima fecha de cobro
  const upcomingBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...subscriptions]
      .filter(s => s.status === 'Active')
      .sort((a, b) => new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime())
      .map(sub => {
        const billingDate = new Date(sub.next_billing_date);
        const diffTime = billingDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { ...sub, days_left: diffDays };
      });
  }, [subscriptions]);

  return (
    <div className="w-full max-w-7xl flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col">
          <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">Recurring Expenses</h2>
          <p className="text-sm font-medium text-gray-500">Track your subscriptions and fixed monthly bills.</p>
        </div>
        <button 
          onClick={() => setIsSubscriptionModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-[12px] text-sm font-bold shadow-sm transition-colors"
        >
          <Plus size={16} /> Add Subscription
        </button>
      </div>

      {/* KPIs SUPERIORES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 gap-3 bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-xl">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Fixed Monthly</span>
            <div className="p-2 bg-white/10 rounded-lg"><CreditCard size={16} className="text-gray-300" /></div>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <h2 className="text-4xl font-extrabold tabular-nums tracking-tight">${monthlyFixedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <span className="text-sm font-bold text-gray-400">/mo</span>
          </div>
          <p className="text-xs text-gray-400 mt-2 font-medium">Includes pro-rated yearly subscriptions.</p>
        </Card>

        <Card className="p-6 gap-3">
          <div className="flex justify-between items-start">
            <CardLabel>Active Services</CardLabel>
            <div className="p-2 bg-emerald-50 rounded-lg"><Calendar size={16} className="text-emerald-600" /></div>
          </div>
          <CardValue className="mt-2">{subscriptions.filter(s => s.status === 'Active').length}</CardValue>
        </Card>
      </div>

      {/* LISTA DE PRÓXIMOS COBROS */}
      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Upcoming Bills</h3>
        </div>
        
        <div className="flex flex-col">
          {upcomingBills.length === 0 ? (
             <div className="text-center py-16">
               <Calendar size={40} className="mx-auto text-gray-300 mb-4" />
               <p className="text-gray-900 font-bold">No upcoming bills</p>
               <p className="text-gray-500 text-sm mt-2">Add your first subscription to track your fixed costs.</p>
             </div>
          ) : (
            upcomingBills.map((sub, index) => {
              const isUrgent = sub.days_left >= 0 && sub.days_left <= 3;
              const isPastDue = sub.days_left < 0;

              return (
                <div key={sub.id} className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 hover:bg-gray-50 transition-colors ${index !== upcomingBills.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 font-bold uppercase shadow-sm">
                      {sub.name.substring(0, 2)}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-gray-900">{sub.name}</span>
                        <Badge variant="gray">{sub.frequency}</Badge>
                      </div>
                      <span className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-1">
                        Billing Date: {new Date(sub.next_billing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6">
                    <div className="flex flex-col items-end">
                      {isPastDue ? (
                         <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                           <AlertCircle size={12} /> Past Due
                         </span>
                      ) : isUrgent ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                           Due in {sub.days_left} {sub.days_left === 1 ? 'day' : 'days'}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                           In {sub.days_left} days
                        </span>
                      )}
                      <span className="font-extrabold tabular-nums text-lg text-gray-900 mt-1">
                        ${Number(sub.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </Card>

    </div>
  );
}