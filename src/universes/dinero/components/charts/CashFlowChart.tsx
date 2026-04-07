import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '../ui/AetherUI';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  date: string;
}

interface CashFlowChartProps {
  transactions: Transaction[];
}

export function CashFlowChart({ transactions }: CashFlowChartProps) {
  const data = useMemo(() => {
    const grouped = transactions.reduce((acc: any, t) => {
      const date = new Date(t.date);
      const month = date.toLocaleString('en-US', { month: 'short' });
      
      if (!acc[month]) {
        acc[month] = { name: month, income: 0, expense: 0, order: date.getMonth() };
      }
      
      if (t.type === 'income') {
        acc[month].income += Number(t.amount);
      } else {
        acc[month].expense += Number(t.amount);
      }
      return acc;
    }, {});

    return Object.values(grouped).sort((a: any, b: any) => a.order - b.order);
  }, [transactions]);

  return (
    <Card className="w-full h-[320px] p-6 justify-between">
      <h3 className="text-[11px] font-bold text-gray-500 mb-6 uppercase tracking-wider">Cash Flow</h3>
      <div className="flex-1 w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
            <Tooltip 
              cursor={{ fill: '#F3F4F6' }}
              contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              itemStyle={{ color: '#111827', fontWeight: 'bold' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: '#4B5563' }} />
            <Bar dataKey="income" name="Income" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={40} />
            <Bar dataKey="expense" name="Expenses" fill="#E02424" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}