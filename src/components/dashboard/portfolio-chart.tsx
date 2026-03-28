"use client";

import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Loader2 } from "lucide-react";

export type PerformancePoint = { date: string; value: number };

function fmtY(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function fmtTooltip(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(2)}K`;
  return `$${v.toFixed(2)}`;
}

// Thin out to at most ~52 points so the x-axis stays readable
function downsample(data: PerformancePoint[], maxPoints = 52): PerformancePoint[] {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => i % step === 0 || i === data.length - 1);
}

// Format date label depending on span
function dateLabel(dateStr: string, totalDays: number): string {
  const d = new Date(dateStr);
  if (totalDays <= 60)  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (totalDays <= 365) return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

interface Props {
  data: PerformancePoint[];
  loading: boolean;
}

export function PortfolioChart({ data, loading }: Props) {
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
        Add holdings to see performance history.
      </div>
    );
  }

  const totalDays = Math.round(
    (new Date(data[data.length - 1].date).getTime() - new Date(data[0].date).getTime()) / 86_400_000
  );

  const display = downsample(data).map((p) => ({
    ...p,
    label: dateLabel(p.date, totalDays),
  }));

  const isPositive = data[data.length - 1].value >= data[0].value;
  const lineColor = isPositive ? "#10b981" : "#f87171";
  const gradId = "portfolioGrad";

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={display} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={lineColor} stopOpacity={0.2} />
            <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#71717a", fontSize: 10 }}
          axisLine={false} tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={fmtY}
          tick={{ fill: "#71717a", fontSize: 10 }}
          axisLine={false} tickLine={false}
          width={60}
          domain={["auto", "auto"]}
        />
        <Tooltip
          contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#a1a1aa" }}
          formatter={(v) => [fmtTooltip(Number(v)), "Portfolio"]}
        />
        <Area
          type="monotone" dataKey="value"
          stroke={lineColor} strokeWidth={2}
          fill={`url(#${gradId})`}
          dot={false}
          activeDot={{ r: 4, fill: lineColor }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}