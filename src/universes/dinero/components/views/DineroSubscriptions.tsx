import { useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Plus, Calendar, CreditCard, AlertCircle } from 'lucide-react';

const ACCENT = '#05DF72';
const ACCENT_SOFT = '#86EFAC';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

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
  const monthlyFixedCost = useMemo(() => {
    return subscriptions
      .filter(s => s.status === 'Active')
      .reduce((acc, sub) => {
        const amount = Number(sub.amount);
        if (sub.frequency === 'Yearly') return acc + amount / 12;
        return acc + amount;
      }, 0);
  }, [subscriptions]);

  const upcomingBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [...subscriptions]
      .filter(s => s.status === 'Active')
      .sort((a, b) => new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime())
      .map(sub => {
        const billingDate = new Date(sub.next_billing_date);
        const diffDays = Math.ceil((billingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { ...sub, days_left: diffDays };
      });
  }, [subscriptions]);

  const activeCount = subscriptions.filter(s => s.status === 'Active').length;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-6xl mx-auto px-1 md:px-0 pb-8 font-sans flex flex-col gap-5"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500 mb-1">Recurring</p>
          <h1 className="font-serif text-2xl md:text-3xl font-medium tracking-tight text-white">Subscriptions</h1>
          <p className="text-sm text-zinc-400 mt-1">Track fixed monthly bills and services.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsSubscriptionModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold"
          style={{ backgroundColor: ACCENT, color: '#0A0A0A' }}
        >
          <Plus size={15} strokeWidth={2.5} /> Add
        </motion.button>
      </motion.div>

      {/* KPI cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-6 relative overflow-hidden">
          <div
            className="absolute -top-20 -right-20 w-52 h-52 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: ACCENT }}
          />
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Monthly fixed cost</span>
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}
              >
                <CreditCard size={15} style={{ color: ACCENT }} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <h2 className="text-4xl font-bold tabular-nums tracking-tight text-white">
                ${monthlyFixedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <span className="text-sm font-semibold text-zinc-500">/mo</span>
            </div>
            <p className="text-xs text-zinc-500 mt-3">Yearly subscriptions pro-rated.</p>
          </div>
        </div>

        <div className="rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Active services</span>
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${ACCENT_SOFT}15`, border: `1px solid ${ACCENT_SOFT}30` }}
            >
              <Calendar size={15} style={{ color: ACCENT_SOFT }} />
            </div>
          </div>
          <h2 className="text-4xl font-bold tabular-nums tracking-tight text-white">{activeCount}</h2>
          <p className="text-xs text-zinc-500 mt-3">Currently billing.</p>
        </div>
      </motion.div>

      {/* Upcoming bills */}
      <motion.div variants={itemVariants} className="rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Upcoming</p>
          <h3 className="font-serif text-lg font-medium text-white tracking-tight">Next bills</h3>
        </div>

        <div className="flex flex-col divide-y divide-white/5">
          {upcomingBills.length === 0 ? (
            <div className="text-center py-16">
              <Calendar size={32} className="mx-auto text-zinc-600 mb-3" />
              <p className="text-white font-medium">No upcoming bills</p>
              <p className="text-zinc-500 text-xs mt-1">Add your first subscription to track fixed costs.</p>
            </div>
          ) : (
            upcomingBills.map((sub) => {
              const isUrgent = sub.days_left >= 0 && sub.days_left <= 3;
              const isPastDue = sub.days_left < 0;
              return (
                <div key={sub.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-5 hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold uppercase"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.85)',
                      }}
                    >
                      {sub.name.substring(0, 2)}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{sub.name}</span>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider"
                          style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}
                        >
                          {sub.frequency}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 mt-0.5">
                        {new Date(sub.next_billing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-5">
                    <div className="flex flex-col items-end">
                      {isPastDue ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider" style={{ backgroundColor: 'rgba(244,63,94,0.15)', color: '#F87171' }}>
                          <AlertCircle size={11} /> Past due
                        </span>
                      ) : isUrgent ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider" style={{ backgroundColor: 'rgba(251,146,60,0.15)', color: '#FB923C' }}>
                          Due in {sub.days_left}d
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          In {sub.days_left}d
                        </span>
                      )}
                      <span className="font-bold tabular-nums text-base text-white mt-1">
                        ${Number(sub.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
