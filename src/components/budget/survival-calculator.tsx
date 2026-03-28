"use client";

import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertTriangle, TrendingDown } from "lucide-react";

interface RunwayPoint {
  month: number;
  baseline: number | null;
  withInflation: number | null;
}

function computeRunway(
  savings: number,
  income: number,
  expenses: number,
  inflationRate: number,
  incomeGrowth: number,
  jobLoss: boolean,
  maxMonths = 120
): { data: RunwayPoint[]; baselineMonths: number; inflationMonths: number } {
  const data: RunwayPoint[] = [];

  let balBase = savings;
  let balInfl = savings;
  let inflExpenses = expenses;
  let inflIncome = jobLoss ? 0 : income;
  const baseIncome = jobLoss ? 0 : income;

  let baselineMonths = maxMonths;
  let inflationMonths = maxMonths;

  for (let m = 0; m <= maxMonths; m++) {
    const baseVal = balBase > 0 ? Math.round(balBase) : 0;
    const inflVal = balInfl > 0 ? Math.round(balInfl) : 0;

    data.push({
      month: m,
      baseline: baselineMonths === maxMonths || m <= baselineMonths ? baseVal : null,
      withInflation: inflationMonths === maxMonths || m <= inflationMonths ? inflVal : null,
    });

    if (balBase <= 0 && baselineMonths === maxMonths) baselineMonths = m;
    if (balInfl <= 0 && inflationMonths === maxMonths) inflationMonths = m;

    balBase += baseIncome - expenses;
    balInfl += inflIncome - inflExpenses;

    // Apply annual inflation/growth adjustments
    if ((m + 1) % 12 === 0) {
      inflExpenses *= 1 + inflationRate / 100;
      if (!jobLoss) inflIncome *= 1 + incomeGrowth / 100;
    }
  }

  return { data, baselineMonths, inflationMonths };
}

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${n.toLocaleString()}`;

interface SurvivalCalculatorProps {
  initialSavings?: number;
  initialIncome?: number;
  initialExpenses?: number;
  initialInflationRate?: number;
  initialIncomeGrowth?: number;
}

export function SurvivalCalculator({
  initialSavings = 45000,
  initialIncome = 7500,
  initialExpenses = 4350,
  initialInflationRate = 3.2,
  initialIncomeGrowth = 2,
}: SurvivalCalculatorProps = {}) {
  const [savings, setSavings] = useState(String(initialSavings));
  const [income, setIncome] = useState(String(initialIncome));
  const [expenses, setExpenses] = useState(String(initialExpenses));
  const [inflationRate, setInflationRate] = useState(String(initialInflationRate));
  const [incomeGrowth, setIncomeGrowth] = useState(String(initialIncomeGrowth));
  const [jobLoss, setJobLoss] = useState(false);

  const { data, baselineMonths, inflationMonths } = useMemo(() => {
    return computeRunway(
      parseFloat(savings) || 0,
      parseFloat(income) || 0,
      parseFloat(expenses) || 0,
      parseFloat(inflationRate) || 0,
      parseFloat(incomeGrowth) || 0,
      jobLoss
    );
  }, [savings, income, expenses, inflationRate, incomeGrowth, jobLoss]);

  const monthsLost = baselineMonths - inflationMonths;
  const isSolvent = baselineMonths === 120;
  const inflationIsSolvent = inflationMonths === 120;
  const bothSolvent = isSolvent && inflationIsSolvent;

  const monthlySurplus = (parseFloat(income) || 0) - (parseFloat(expenses) || 0);
  const baseline10yr = data[120]?.baseline ?? 0;
  const inflation10yr = data[120]?.withInflation ?? 0;
  const inflationDrag10yr = baseline10yr - inflation10yr;

  const monthLabel = (m: number) =>
    m >= 120 ? "10+ yrs" : m >= 12 ? `${Math.floor(m / 12)}y ${m % 12}m` : `${m}mo`;

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-white">
            Survival Calculator &amp; Burn Rate
          </CardTitle>
          <button
            onClick={() => setJobLoss((v) => !v)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors border ${
              jobLoss
                ? "bg-red-500/20 border-red-500/40 text-red-400"
                : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <AlertTriangle className="size-3" />
            Job Loss Mode
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Savings / Emergency Fund", value: savings, set: setSavings, prefix: "$" },
            { label: "Monthly Income (after tax)", value: income, set: setIncome, prefix: "$", disabled: jobLoss },
            { label: "Monthly Expenses", value: expenses, set: setExpenses, prefix: "$" },
            { label: "Inflation Rate (%)", value: inflationRate, set: setInflationRate, prefix: "%" },
            { label: "Income Growth (%/yr)", value: incomeGrowth, set: setIncomeGrowth, prefix: "%", disabled: jobLoss },
          ].map(({ label, value, set, disabled }) => (
            <div key={label} className="space-y-1">
              <Label className="text-[10px] text-zinc-500 leading-tight">{label}</Label>
              <Input
                type="number"
                value={value}
                onChange={(e) => set(e.target.value)}
                disabled={disabled}
                className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm disabled:opacity-40"
              />
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {bothSolvent ? (
            <>
              {/* Solvent mode: show growth stats instead of runway */}
              <div className="rounded-lg bg-zinc-800/60 p-3 space-y-1">
                <p className="text-[10px] text-zinc-500">Monthly Surplus</p>
                <p className={`text-xl font-bold ${monthlySurplus > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {monthlySurplus >= 0 ? "+" : ""}{fmt(monthlySurplus)}
                </p>
                <p className="text-[10px] text-zinc-600">income minus expenses</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 p-3 space-y-1">
                <p className="text-[10px] text-zinc-500">Projected Savings (10 yr)</p>
                <p className="text-xl font-bold text-blue-400">{fmt(baseline10yr)}</p>
                <p className="text-[10px] text-zinc-600">at {incomeGrowth}% income growth</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 p-3 space-y-1">
                <p className="text-[10px] text-zinc-500">Inflation Drag (10 yr)</p>
                {inflationDrag10yr > 0 ? (
                  <>
                    <div className="flex items-center gap-1">
                      <TrendingDown className="size-4 text-red-400" />
                      <p className="text-xl font-bold text-red-400">−{fmt(inflationDrag10yr)}</p>
                    </div>
                    <p className="text-[10px] text-zinc-600">less saved vs no inflation</p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-bold text-emerald-400">—</p>
                    <p className="text-[10px] text-zinc-600">no drag at these settings</p>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Burning mode: show runway stats */}
              <div className="rounded-lg bg-zinc-800/60 p-3 space-y-1">
                <p className="text-[10px] text-zinc-500">Runway (no inflation)</p>
                <p className={`text-xl font-bold ${isSolvent ? "text-emerald-400" : "text-orange-400"}`}>
                  {isSolvent ? "Solvent" : monthLabel(baselineMonths)}
                </p>
                <p className="text-[10px] text-zinc-600">at current spend rate</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 p-3 space-y-1">
                <p className="text-[10px] text-zinc-500">Runway (with {inflationRate}% inflation)</p>
                <p className={`text-xl font-bold ${inflationIsSolvent ? "text-emerald-400" : "text-red-400"}`}>
                  {inflationIsSolvent ? "Solvent" : monthLabel(inflationMonths)}
                </p>
                <p className="text-[10px] text-zinc-600">expenses grow each year</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 p-3 space-y-1">
                <p className="text-[10px] text-zinc-500">Inflation Cost</p>
                {monthsLost > 0 ? (
                  <>
                    <div className="flex items-center gap-1">
                      <TrendingDown className="size-4 text-red-400" />
                      <p className="text-xl font-bold text-red-400">−{monthLabel(monthsLost)}</p>
                    </div>
                    <p className="text-[10px] text-zinc-600">runway lost to inflation</p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-bold text-zinc-400">—</p>
                    <p className="text-[10px] text-zinc-600">no impact at these settings</p>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v % 12 === 0 ? `Yr ${v / 12}` : ""}
            />
            <YAxis
              tickFormatter={(v) => fmt(v)}
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
              labelFormatter={(v) => `Month ${v}`}
              formatter={(v) => [fmt(Number(v)), ""]}
            />
            <ReferenceLine y={0} stroke="#52525b" strokeDasharray="4 4" />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} />
            <Line
              type="monotone"
              dataKey="baseline"
              name="No Inflation"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="withInflation"
              name={`With ${inflationRate}% Inflation`}
              stroke="#f87171"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 3"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>

        {jobLoss && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <AlertTriangle className="size-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-300">
              <span className="font-semibold">Job loss scenario active.</span> Income is set to $0.
              Runway shows how long your savings cover expenses alone, factoring in inflation-driven cost growth.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
