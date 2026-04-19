import React from 'react';
import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function AreaChart({ data, index, categories, valueFormatter, className }: any) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" strokeOpacity={0.05} />
          <XAxis dataKey={index} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={valueFormatter} width={60} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#12151A', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '16px' }}
            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
          />
          {categories.includes('Income') && (
            <Area type="monotone" dataKey="Income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
          )}
          {categories.includes('Expense') && (
            <Area type="monotone" dataKey="Expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" />
          )}
          {categories.includes('Profit/Loss') && (
            <Area type="monotone" dataKey="Profit/Loss" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTrend)" />
          )}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}