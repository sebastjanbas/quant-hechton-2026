"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

// TODO: replace with API call to /api/portfolio/allocation
const MOCK_ALLOCATION = [
  { name: "US Equities", value: 42, color: "#10b981" },
  { name: "Int'l Equities", value: 18, color: "#3b82f6" },
  { name: "Fixed Income", value: 20, color: "#f59e0b" },
  { name: "Real Assets", value: 10, color: "#8b5cf6" },
  { name: "Cash & Alt", value: 10, color: "#71717a" },
];

export function AllocationChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={MOCK_ALLOCATION}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={88}
          paddingAngle={2}
          dataKey="value"
        >
          {MOCK_ALLOCATION.map((entry) => (
            <Cell key={entry.name} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
          formatter={(v) => [`${Number(v)}%`, "Weight"]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
