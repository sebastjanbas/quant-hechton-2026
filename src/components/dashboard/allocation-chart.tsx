"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2 } from "lucide-react";

export type AllocationSlice = { name: string; value: number; color: string };

const CLASS_COLORS: Record<string, string> = {
  equity:       "#10b981",
  etf:          "#3b82f6",
  fixed_income: "#f59e0b",
  commodity:    "#f97316",
  crypto:       "#8b5cf6",
  cash:         "#71717a",
  other:        "#ec4899",
};

export function assetClassColor(cls: string): string {
  return CLASS_COLORS[cls] ?? "#71717a";
}

// Human-readable label for asset class keys
function classLabel(cls: string): string {
  const map: Record<string, string> = {
    equity: "Equity", etf: "ETF", fixed_income: "Fixed Income",
    commodity: "Commodity", crypto: "Crypto", cash: "Cash", other: "Other",
  };
  return map[cls] ?? cls;
}

interface Props {
  data: AllocationSlice[];
  loading: boolean;
}

export function AllocationChart({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[220px] text-zinc-600">
        <Loader2 className="size-4 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-zinc-600 text-xs">
        Add holdings to see allocation.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%" cy="45%"
          innerRadius={60} outerRadius={85}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
          formatter={(v) => [`${Number(v).toFixed(1)}%`, "Weight"]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Helper: build AllocationSlice[] from holdings + quotes
export function buildAllocation(
  holdings: { ticker: string; shares: number | string; assetClass: string }[],
  quotes: Record<string, { price: number }>
): AllocationSlice[] {
  const byClass: Record<string, number> = {};
  for (const h of holdings) {
    const price = quotes[h.ticker]?.price ?? 0;
    if (price === 0) continue;
    const value = Number(h.shares) * price;
    byClass[h.assetClass] = (byClass[h.assetClass] ?? 0) + value;
  }
  const total = Object.values(byClass).reduce((s, v) => s + v, 0);
  if (total === 0) return [];
  return Object.entries(byClass).map(([cls, value]) => ({
    name: classLabel(cls),
    value: parseFloat(((value / total) * 100).toFixed(1)),
    color: assetClassColor(cls),
  }));
}
