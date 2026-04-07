import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '../ui/AetherUI';

interface ExpensePieChartProps {
  sortedCategoriesMap: [string, number][];
}

// Paleta optimizada para el tema claro (Expensify Style)
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export function ExpensePieChart({ sortedCategoriesMap }: ExpensePieChartProps) {
  const data = useMemo(() => {
    return sortedCategoriesMap.map(([name, value]) => ({ name, value }));
  }, [sortedCategoriesMap]);

  return (
    <Card className="w-full h-[320px] p-6">
      <h3 className="text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Distribución de Gastos</h3>
      <div className="flex-1 w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              itemStyle={{ color: '#111827', fontWeight: 'bold' }}
              formatter={(value: any) => `$${Number(value).toLocaleString()}`}
            />
            <Legend 
              layout="vertical" 
              verticalAlign="middle" 
              align="right" 
              wrapperStyle={{ fontSize: '11px', color: '#4B5563' }} 
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}