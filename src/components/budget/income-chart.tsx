"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// TODO: replace with API call to /api/budget/monthly-summary
const MOCK_MONTHLY = [
  { month: "Oct", income: 7500, expenses: 4200 },
  { month: "Nov", income: 7500, expenses: 4480 },
  { month: "Dec", income: 9200, expenses: 5600 },
  { month: "Jan", income: 7500, expenses: 4350 },
  { month: "Feb", income: 7500, expenses: 4410 },
  { month: "Mar", income: 8100, expenses: 4350 },
];

export function IncomeChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={MOCK_MONTHLY} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
          formatter={(v) => [`$${Number(v).toLocaleString()}`, ""]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} />
        <Bar dataKey="income" name="Income" fill="#3b82f6" radius={[3, 3, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
