"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

export interface ExpenseCategory {
  name: string;
  amount: number;
  color: string;
  inflationSensitivity: "high" | "medium" | "low";
}

interface ExpenseChartProps {
  categories: ExpenseCategory[];
}

export function ExpenseChart({ categories }: ExpenseChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={categories}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={2}
          dataKey="amount"
        >
          {categories.map((c) => (
            <Cell key={c.name} fill={c.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
          formatter={(v) => [`$${Number(v).toLocaleString()}`, "Monthly"]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
