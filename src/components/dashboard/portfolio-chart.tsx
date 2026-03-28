"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// TODO: replace with API call to /api/portfolio/performance?range=1y
const MOCK_PERFORMANCE_DATA = [
  { date: "Apr", value: 1_980_000 },
  { date: "May", value: 2_020_000 },
  { date: "Jun", value: 1_960_000 },
  { date: "Jul", value: 2_100_000 },
  { date: "Aug", value: 2_150_000 },
  { date: "Sep", value: 2_080_000 },
  { date: "Oct", value: 2_210_000 },
  { date: "Nov", value: 2_340_000 },
  { date: "Dec", value: 2_290_000 },
  { date: "Jan", value: 2_450_000 },
  { date: "Feb", value: 2_720_000 },
  { date: "Mar", value: 2_847_293 },
];

const fmt = (v: number) =>
  "$" + (v / 1_000_000).toFixed(2) + "M";

export function PortfolioChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={MOCK_PERFORMANCE_DATA} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmt}
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <Tooltip
          contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#a1a1aa" }}
          formatter={(v) => [fmt(Number(v)), "Value"]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#portfolioGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#10b981" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
