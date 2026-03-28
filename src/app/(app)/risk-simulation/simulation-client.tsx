"use client";

import { useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { FlaskConical, TrendingUp, TrendingDown, Target, AlertTriangle } from "lucide-react";
import { BandPoint, Expense, Holding, IncomeSource, SavingsAccount, SimConfig, SimDebt, SimResult } from "@/lib/types";

interface Props {
  holdings: Holding[];
  incomeSources: IncomeSource[];
  expenses: Expense[];
  savings: SavingsAccount[];
  inflationRate: number;
  portfolioMarketValue: number;
  totalSavings: number;
  subscriptionMonthlyTotal: number;
  debts: SimDebt[];
}


// ─── Math helpers ─────────────────────────────────────────────────────────────

function normalRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function percentileOf(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function toMonthly(amount: number, frequency: string): number {
  if (frequency === "bi-weekly") return (amount * 26) / 12;
  if (frequency === "weekly") return (amount * 52) / 12;
  if (frequency === "annual") return amount / 12;
  if (frequency === "one-time") return 0;
  return amount;
}

function runMonteCarlo(cfg: SimConfig): SimResult {
  const {
    initialStocksValue,
    initialSavingsValue,
    annualSavingsRate,
    annualDrift,
    annualVolatility,
    annualInflationRate,
    monthlyIncome,
    monthlyExpenses,
    incomeGrowthRate,
    surplusInvestPct,
    debts,
    timeHorizonYears,
    numSimulations,
    includeCashFlows,
    goalTarget,
  } = cfg;

  const steps = timeHorizonYears * 12;
  const dt = 1 / 12;
  const monthlyLogDrift = (annualDrift - 0.5 * annualVolatility ** 2) * dt;
  const monthlyLogVol = annualVolatility * Math.sqrt(dt);
  const monthlySavingsGrowth = Math.pow(1 + annualSavingsRate, dt) - 1;

  // Pre-compute deterministic debt payment schedule (same across all simulations)
  const debtSchedule: number[] = [];
  const debtBalances = debts.map((d) => d.balance);
  for (let month = 1; month <= steps; month++) {
    let totalPayment = 0;
    for (let i = 0; i < debts.length; i++) {
      if (debtBalances[i] > 0) {
        const interest = debtBalances[i] * (debts[i].annualRate / 12);
        debtBalances[i] = Math.max(0, debtBalances[i] + interest - debts[i].monthlyPayment);
        totalPayment += debts[i].monthlyPayment;
      }
    }
    debtSchedule.push(totalPayment);
  }

  const yearlySnapshots: number[][] = Array.from({ length: timeHorizonYears + 1 }, () => []);
  const finalValues: number[] = [];

  for (let sim = 0; sim < numSimulations; sim++) {
    let stocks = initialStocksValue;
    let savings = initialSavingsValue;
    yearlySnapshots[0].push(stocks + savings);

    for (let month = 1; month <= steps; month++) {
      const z = normalRandom();
      stocks *= Math.exp(monthlyLogDrift + monthlyLogVol * z);
      savings *= 1 + monthlySavingsGrowth;

      if (includeCashFlows) {
        const years = (month - 1) / 12;
        const inflatedExpenses = monthlyExpenses * Math.pow(1 + annualInflationRate, years);
        const grownIncome = monthlyIncome * Math.pow(1 + incomeGrowthRate, years);
        const debtPayment = debtSchedule[month - 1];
        const surplus = grownIncome - inflatedExpenses - debtPayment;
        stocks  += surplus * surplusInvestPct;
        savings += surplus * (1 - surplusInvestPct);
      }

      // Floor stocks at 0 (can't have negative portfolio)
      if (stocks < 0) stocks = 0;

      if (month % 12 === 0) {
        yearlySnapshots[month / 12].push(stocks + savings);
      }
    }
    finalValues.push(stocks + savings);
  }

  // Build band data from year-end snapshots
  const bandData: BandPoint[] = yearlySnapshots.map((vals, year) => {
    const sorted = [...vals].sort((a, b) => a - b);
    return {
      year,
      p10: percentileOf(sorted, 10),
      p25: percentileOf(sorted, 25),
      p50: percentileOf(sorted, 50),
      p75: percentileOf(sorted, 75),
      p90: percentileOf(sorted, 90),
    };
  });

  const sortedFinals = [...finalValues].sort((a, b) => a - b);
  const medianFinal = percentileOf(sortedFinals, 50);
  const p10Final = percentileOf(sortedFinals, 10);
  const p90Final = percentileOf(sortedFinals, 90);
  const probGoal = goalTarget > 0 ? finalValues.filter((v) => v >= goalTarget).length / numSimulations : 0;
  const probRuin = finalValues.filter((v) => v <= 0).length / numSimulations;

  return { bandData, finalValues, medianFinal, p10Final, p90Final, probGoal, probRuin };
}

function buildHistogram(finalValues: number[], bins = 30): { range: string; count: number; midpoint: number }[] {
  if (finalValues.length === 0) return [];
  const min = Math.min(...finalValues);
  const max = Math.max(...finalValues);
  const binWidth = (max - min) / bins;
  const counts = Array(bins).fill(0);
  for (const v of finalValues) {
    const idx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
    counts[idx]++;
  }
  return counts.map((count, i) => {
    const lo = min + i * binWidth;
    const hi = lo + binWidth;
    const mid = (lo + hi) / 2;
    return {
      range: `${fmtK(lo)}–${fmtK(hi)}`,
      count,
      midpoint: mid,
    };
  });
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtK(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtPct(n: number, decimals = 1): string {
  return `${(n * 100).toFixed(decimals)}%`;
}

// ─── Scenario presets ─────────────────────────────────────────────────────────

const SCENARIOS = {
  base: { label: "Base", driftMult: 1,   volMult: 1,   inflationMult: 1,   description: "No adjustments — uses your drift and volatility as-is" },
  bull: { label: "Bull", driftMult: 1.2, volMult: 0.8, inflationMult: 0.7, description: "Higher drift (×1.2), lower volatility (×0.8), lower inflation (×0.7)" },
  bear: { label: "Bear", driftMult: 0.5, volMult: 1.5, inflationMult: 1.4, description: "Half drift (×0.5), higher volatility (×1.5), higher inflation (×1.4)" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SimulationClient({ incomeSources, expenses, inflationRate, portfolioMarketValue, totalSavings, subscriptionMonthlyTotal, debts: initialDebts }: Props) {
  const defaultMonthlyIncome = incomeSources.reduce((s, src) => s + toMonthly(src.amount, src.frequency), 0);
  const defaultMonthlyExpenses = expenses.reduce((s, e) => s + toMonthly(e.amount, e.frequency), 0) + subscriptionMonthlyTotal;
  const avgIncomeGrowth =
    incomeSources.length > 0
      ? incomeSources.reduce((s, src) => s + src.expectedAnnualGrowthRate, 0) / incomeSources.length / 100
      : 0.02;

  // Config state
  const [dataSource, setDataSource] = useState<"historical" | "custom">("custom");
  const [scenario, setScenario] = useState<"base" | "bull" | "bear">("base");
  const [timeHorizon, setTimeHorizon] = useState(10);
  const [numSims, setNumSims] = useState(1000);
  const [customDrift, setCustomDrift] = useState(7);
  const [customVol, setCustomVol] = useState(15);
  const [inflationInput, setInflationInput] = useState(inflationRate);
  const [includeCashFlows, setIncludeCashFlows] = useState(true);
  const [monthlyIncome, setMonthlyIncome] = useState(Math.round(defaultMonthlyIncome));
  const [monthlyExpenses, setMonthlyExpenses] = useState(Math.round(defaultMonthlyExpenses));
  const [incomeGrowth, setIncomeGrowth] = useState(parseFloat((avgIncomeGrowth * 100).toFixed(1)));
  const [stocksValue, setStocksValue] = useState(Math.round(portfolioMarketValue));
  const [savingsValue, setSavingsValue] = useState(Math.round(totalSavings));
  const [savingsRate, setSavingsRate] = useState(4);
  const [investPct, setInvestPct] = useState(100);
  const [debts, setDebts] = useState<SimDebt[]>(initialDebts);
  const [includeDebts, setIncludeDebts] = useState(true);
  const [goalTarget, setGoalTarget] = useState(0);

  // Historical data state
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  const [historicalDrift, setHistoricalDrift] = useState<number | null>(null);
  const [historicalVol, setHistoricalVol] = useState<number | null>(null);
  const [historicalError, setHistoricalError] = useState<string | null>(null);

  // Result state
  const [result, setResult] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);

  const loadHistorical = async () => {
    setLoadingHistorical(true);
    setHistoricalError(null);
    try {
      const res = await fetch("/api/portfolio/volatility");
      if (!res.ok) {
        const { error } = await res.json();
        setHistoricalError(error ?? "Failed to load");
        return;
      }
      const data = await res.json();
      setHistoricalDrift(data.annualDrift);
      setHistoricalVol(data.annualVolatility);
      if (data.currentValue > 0) setStocksValue(Math.round(data.currentValue));
    } catch {
      setHistoricalError("Network error");
    } finally {
      setLoadingHistorical(false);
    }
  };

  const runSimulation = useCallback(() => {
    setRunning(true);
    // Use setTimeout to allow UI to update before blocking computation
    setTimeout(() => {
      let drift: number;
      let vol: number;

      if (dataSource === "historical" && historicalDrift != null && historicalVol != null) {
        drift = historicalDrift / 100;
        vol = historicalVol / 100;
      } else {
        drift = customDrift / 100;
        vol = customVol / 100;
      }

      // Apply scenario multipliers from SCENARIOS config
      const s = SCENARIOS[scenario];
      drift *= s.driftMult;
      vol   *= s.volMult;
      const effectiveInflation = inflationInput * s.inflationMult;

      const cfg: SimConfig = {
        initialStocksValue: stocksValue,
        initialSavingsValue: savingsValue,
        annualSavingsRate: savingsRate / 100,
        annualDrift: drift,
        annualVolatility: vol,
        annualInflationRate: effectiveInflation / 100,
        monthlyIncome,
        monthlyExpenses,
        incomeGrowthRate: incomeGrowth / 100,
        surplusInvestPct: investPct / 100,
        debts: includeDebts ? debts : [],
        timeHorizonYears: timeHorizon,
        numSimulations: numSims,
        includeCashFlows,
        goalTarget,
      };

      const res = runMonteCarlo(cfg);
      setResult(res);
      setRunning(false);
    }, 50);
  }, [
    dataSource, historicalDrift, historicalVol, customDrift, customVol,
    scenario, stocksValue, savingsValue, savingsRate, inflationInput,
    monthlyIncome, monthlyExpenses, incomeGrowth, investPct, debts, includeDebts,
    timeHorizon, numSims, includeCashFlows, goalTarget,
  ]);

  const histogramData = result ? buildHistogram(result.finalValues, 30) : [];

  // Custom tooltip for confidence bands
  const BandTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload as BandPoint;
    return (
      <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs space-y-1">
        <p className="text-zinc-400 font-medium">Year {label}</p>
        <p className="text-emerald-400">90th: {fmt(d.p90)}</p>
        <p className="text-blue-400">75th: {fmt(d.p75)}</p>
        <p className="text-white font-semibold">Median: {fmt(d.p50)}</p>
        <p className="text-yellow-400">25th: {fmt(d.p25)}</p>
        <p className="text-red-400">10th: {fmt(d.p10)}</p>
      </div>
    );
  };

  const HistTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs space-y-1">
        <p className="text-zinc-400">{payload[0]?.payload?.range}</p>
        <p className="text-white">{payload[0]?.value} simulations</p>
        <p className="text-zinc-400">{((payload[0]?.value / numSims) * 100).toFixed(1)}% probability</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader
        title="Risk Simulation"
        description="Monte Carlo simulation of your portfolio under different scenarios"
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-6 h-full">

          {/* ── Config Panel ────────────────────────────────────────────────── */}
          <div className="w-72 shrink-0 space-y-4">

            {/* Starting Values */}
            <Card className="bg-zinc-900 border-zinc-800 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">Starting Values</h3>
              <div>
                <Label className="text-xs text-zinc-400">Stock portfolio ($) — uses GBM</Label>
                <Input
                  type="number"
                  value={stocksValue}
                  onChange={(e) => setStocksValue(Number(e.target.value))}
                  className="mt-1 bg-zinc-800 border-zinc-700 text-white text-sm h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Savings ($) — fixed rate</Label>
                <Input
                  type="number"
                  value={savingsValue}
                  onChange={(e) => setSavingsValue(Number(e.target.value))}
                  className="mt-1 bg-zinc-800 border-zinc-700 text-white text-sm h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Savings annual rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={savingsRate}
                  onChange={(e) => setSavingsRate(Number(e.target.value))}
                  className="mt-1 bg-zinc-800 border-zinc-700 text-white text-sm h-8"
                />
              </div>
              <p className="text-xs text-zinc-500">
                Total: {fmt(stocksValue + savingsValue)}
              </p>
            </Card>

            {/* Data Source */}
            <Card className="bg-zinc-900 border-zinc-800 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">Returns Model</h3>
              <div className="flex rounded-md overflow-hidden border border-zinc-700">
                {(["custom", "historical"] as const).map((src) => (
                  <button
                    key={src}
                    onClick={() => setDataSource(src)}
                    className={`flex-1 py-1.5 text-xs font-medium capitalize transition-colors ${
                      dataSource === src
                        ? "bg-zinc-700 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {src}
                  </button>
                ))}
              </div>

              {dataSource === "custom" ? (
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-zinc-400">Annual return (%)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={customDrift}
                      onChange={(e) => setCustomDrift(Number(e.target.value))}
                      className="mt-1 bg-zinc-800 border-zinc-700 text-white text-sm h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-400">Annual volatility (%)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={customVol}
                      onChange={(e) => setCustomVol(Number(e.target.value))}
                      className="mt-1 bg-zinc-800 border-zinc-700 text-white text-sm h-8"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-zinc-700 text-zinc-300 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-900 text-xs h-8"
                    onClick={loadHistorical}
                    disabled={loadingHistorical}
                  >
                    {loadingHistorical ? "Loading…" : "Load from Alpaca (1Y)"}
                  </Button>
                  {historicalError && (
                    <p className="text-xs text-red-400">{historicalError}</p>
                  )}
                  {historicalDrift != null && historicalVol != null && (
                    <div className="text-xs space-y-1 pt-1">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Annual drift</span>
                        <span className={historicalDrift >= 0 ? "text-emerald-400" : "text-red-400"}>
                          {historicalDrift >= 0 ? "+" : ""}{historicalDrift.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Volatility</span>
                        <span className="text-yellow-400">{historicalVol.toFixed(1)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Scenario */}
            <Card className="bg-zinc-900 border-zinc-800 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">Scenario</h3>
              <div className="flex rounded-md overflow-hidden border border-zinc-700">
                {(["bear", "base", "bull"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setScenario(s)}
                    className={`cursor-pointer flex-1 py-1.5 text-xs font-medium capitalize transition-colors ${
                      scenario === s
                        ? s === "bull"
                          ? "bg-emerald-700 text-white"
                          : s === "bear"
                          ? "bg-red-800 text-white"
                          : "bg-zinc-700 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {s === "bear" ? "Bear" : s === "bull" ? "Bull" : "Base"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500">{SCENARIOS[scenario].description}</p>
            </Card>

            {/* Cash Flows */}
            <Card className="bg-zinc-900 border-zinc-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Cash Flows</h3>
                <button
                  onClick={() => setIncludeCashFlows((v) => !v)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    includeCashFlows ? "bg-blue-600" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform ${
                      includeCashFlows ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              {includeCashFlows && (
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-zinc-400">Monthly income ($)</Label>
                    <Input
                      type="number"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                      className="mt-1 bg-zinc-800 border-zinc-700 text-white text-sm h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-400">Monthly expenses ($)</Label>
                    <Input
                      type="number"
                      value={monthlyExpenses}
                      onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                      className="mt-1 bg-zinc-800 border-zinc-700 text-white text-sm h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-400">Income growth (%/yr)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={incomeGrowth}
                      onChange={(e) => setIncomeGrowth(Number(e.target.value))}
                      className="mt-1 bg-zinc-800 border-zinc-700 text-white text-sm h-8"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <Label className="text-xs text-zinc-400">Surplus allocation</Label>
                      <span className="text-xs text-white font-medium">{investPct}% stocks / {100 - investPct}% savings</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={investPct}
                      onChange={(e) => setInvestPct(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none bg-zinc-700 accent-blue-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-zinc-600 mt-0.5">
                      <span>All savings</span><span>All stocks</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Debts */}
            <Card className="bg-zinc-900 border-zinc-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Debts</h3>
                <button
                  onClick={() => setIncludeDebts((v) => !v)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    includeDebts ? "bg-blue-600" : "bg-zinc-700"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform ${includeDebts ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
              {debts.length === 0 ? (
                <p className="text-xs text-zinc-500">No debts found in budget.</p>
              ) : (
                <div className="space-y-2">
                  {debts.map((d) => {
                    const monthlyRate = d.annualRate / 12;
                    const payoffMonths = monthlyRate > 0 && d.monthlyPayment > d.balance * monthlyRate
                      ? Math.ceil(Math.log(d.monthlyPayment / (d.monthlyPayment - d.balance * monthlyRate)) / Math.log(1 + monthlyRate))
                      : d.monthlyPayment > 0
                      ? Math.ceil(d.balance / d.monthlyPayment)
                      : null;
                    const payoffYears = payoffMonths ? (payoffMonths / 12).toFixed(1) : "∞";
                    return (
                      <div key={d.id} className={`rounded-md p-2.5 space-y-1.5 border ${includeDebts ? "bg-zinc-800 border-zinc-700" : "bg-zinc-800/40 border-zinc-800 opacity-50"}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-white truncate max-w-[120px]">{d.name}</span>
                          <span className="text-xs text-red-400 font-mono">${d.balance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-500">
                          <span>{(d.annualRate * 100).toFixed(1)}% interest</span>
                          <span>${d.monthlyPayment.toLocaleString()}/mo</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-500">Payoff</span>
                          <span className="text-emerald-400">{payoffYears} yrs</span>
                        </div>
                      </div>
                    );
                  })}
                  {includeDebts && (
                    <div className="flex justify-between text-xs pt-1 border-t border-zinc-800">
                      <span className="text-zinc-400">Total monthly payments</span>
                      <span className="font-mono text-red-400">
                        ${debts.reduce((s, d) => s + d.monthlyPayment, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Simulation Parameters */}
            <Card className="bg-zinc-900 border-zinc-800 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">Parameters</h3>
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs text-zinc-400">Time horizon</Label>
                  <span className="text-xs text-white font-medium">{timeHorizon} years</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={20}
                  step={1}
                  value={timeHorizon}
                  onChange={(e) => setTimeHorizon(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none bg-zinc-700 accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-zinc-600 mt-0.5">
                  <span>5yr</span><span>20yr</span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Inflation rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={inflationInput}
                  onChange={(e) => setInflationInput(Number(e.target.value))}
                  className="mt-1 bg-zinc-800 border-zinc-700 text-white text-sm h-8"
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Simulations</Label>
                <select
                  value={numSims}
                  onChange={(e) => setNumSims(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={500}>500 (fast)</option>
                  <option value={1000}>1,000</option>
                  <option value={2000}>2,000</option>
                  <option value={5000}>5,000 (slow)</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Goal target ($)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 1000000"
                  value={goalTarget || ""}
                  onChange={(e) => setGoalTarget(Number(e.target.value))}
                  className="mt-1 bg-zinc-800 border-zinc-700 text-white text-sm h-8"
                />
              </div>
            </Card>

            <Button
              onClick={runSimulation}
              disabled={running || (dataSource === "historical" && historicalDrift == null)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium"
            >
              {running ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Running…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FlaskConical className="size-4" />
                  Run Simulation
                </span>
              )}
            </Button>
          </div>

          {/* ── Results Panel ────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">
            {!result ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                <FlaskConical className="size-12 text-zinc-700" />
                <p className="text-zinc-400 text-sm">Configure and run a simulation to see results</p>
                <p className="text-zinc-600 text-xs max-w-sm">
                  The Monte Carlo engine will project {numSims.toLocaleString()} possible portfolio paths
                  over {timeHorizon} years using Geometric Brownian Motion
                </p>
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard
                    label="Median Final Value"
                    value={fmt(result.medianFinal)}
                    sub={`vs ${fmt(stocksValue + savingsValue)} today`}
                    icon={<TrendingUp className="size-4 text-blue-400" />}
                    highlight={result.medianFinal > stocksValue + savingsValue ? "positive" : "negative"}
                  />
                  <StatCard
                    label="10th Percentile"
                    value={fmt(result.p10Final)}
                    sub="Pessimistic outcome"
                    icon={<TrendingDown className="size-4 text-red-400" />}
                    highlight="negative"
                  />
                  <StatCard
                    label={goalTarget > 0 ? `Prob. of ${fmtK(goalTarget)}` : "Prob. of Goal"}
                    value={goalTarget > 0 ? fmtPct(result.probGoal) : "—"}
                    sub={goalTarget > 0 ? `${Math.round(result.probGoal * numSims)} / ${numSims} paths` : "Set a goal target"}
                    icon={<Target className="size-4 text-emerald-400" />}
                    highlight="neutral"
                  />
                  <StatCard
                    label="Probability of Ruin"
                    value={fmtPct(result.probRuin)}
                    sub="Portfolio reaches $0"
                    icon={<AlertTriangle className="size-4 text-yellow-400" />}
                    highlight={result.probRuin > 0.1 ? "negative" : "positive"}
                  />
                </div>

                {/* Confidence Bands Chart */}
                <Card className="bg-zinc-900 border-zinc-800 p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-white">Confidence Bands</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Portfolio value distribution across {numSims.toLocaleString()} simulated paths over {timeHorizon} years
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={result.bandData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradOuter" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.08} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="gradInner" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis
                        dataKey="year"
                        tick={{ fill: "#71717a", fontSize: 11 }}
                        tickFormatter={(v) => `Yr ${v}`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#71717a", fontSize: 11 }}
                        tickFormatter={fmtK}
                        axisLine={false}
                        tickLine={false}
                        width={60}
                      />
                      <Tooltip content={<BandTooltip />} />
                      {/* 10-90 band */}
                      <Area
                        type="monotone"
                        dataKey="p90"
                        stroke="none"
                        fill="url(#gradOuter)"
                        strokeWidth={0}
                        name="90th"
                      />
                      <Area
                        type="monotone"
                        dataKey="p10"
                        stroke="none"
                        fill="#18181b"
                        strokeWidth={0}
                        name="10th"
                      />
                      {/* 25-75 band */}
                      <Area
                        type="monotone"
                        dataKey="p75"
                        stroke="none"
                        fill="url(#gradInner)"
                        strokeWidth={0}
                        name="75th"
                      />
                      <Area
                        type="monotone"
                        dataKey="p25"
                        stroke="none"
                        fill="#18181b"
                        strokeWidth={0}
                        name="25th"
                      />
                      {/* Median line */}
                      <Area
                        type="monotone"
                        dataKey="p50"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="none"
                        name="Median"
                        dot={false}
                      />
                      {/* Outer boundary lines */}
                      <Area
                        type="monotone"
                        dataKey="p90"
                        stroke="#10b981"
                        strokeWidth={1}
                        strokeDasharray="4 3"
                        fill="none"
                        name="90th pct"
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="p10"
                        stroke="#ef4444"
                        strokeWidth={1}
                        strokeDasharray="4 3"
                        fill="none"
                        name="10th pct"
                        dot={false}
                      />
                      {goalTarget > 0 && (
                        <ReferenceLine
                          y={goalTarget}
                          stroke="#f59e0b"
                          strokeDasharray="6 3"
                          label={{ value: `Goal ${fmtK(goalTarget)}`, fill: "#f59e0b", fontSize: 10, position: "insideTopRight" }}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 mt-2 justify-center flex-wrap">
                    <LegendDot color="#10b981" label="90th pct (optimistic)" dashed />
                    <LegendDot color="#3b82f6" label="Median (50th)" />
                    <LegendDot color="#ef4444" label="10th pct (pessimistic)" dashed />
                  </div>
                </Card>

                {/* Histogram */}
                <Card className="bg-zinc-900 border-zinc-800 p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-white">Final Value Distribution</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Histogram of portfolio values at year {timeHorizon} across all {numSims.toLocaleString()} simulations
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={histogramData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis
                        dataKey="midpoint"
                        tick={{ fill: "#71717a", fontSize: 10 }}
                        tickFormatter={fmtK}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fill: "#71717a", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip content={<HistTooltip />} />
                      {goalTarget > 0 && (
                        <ReferenceLine
                          x={goalTarget}
                          stroke="#f59e0b"
                          strokeDasharray="5 3"
                          label={{ value: "Goal", fill: "#f59e0b", fontSize: 10, position: "top" }}
                        />
                      )}
                      <Bar
                        dataKey="count"
                        radius={[2, 2, 0, 0]}
                        fill="#3b82f6"
                        opacity={0.8}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-zinc-800">
                    <div className="text-center">
                      <p className="text-xs text-zinc-400">10th pct (worst 10%)</p>
                      <p className="text-sm font-semibold text-red-400">{fmt(result.p10Final)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-zinc-400">Median outcome</p>
                      <p className="text-sm font-semibold text-white">{fmt(result.medianFinal)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-zinc-400">90th pct (best 10%)</p>
                      <p className="text-sm font-semibold text-emerald-400">{fmt(result.p90Final)}</p>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Small helper components ──────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  highlight: "positive" | "negative" | "neutral";
}) {
  const valueColor =
    highlight === "positive" ? "text-emerald-400" : highlight === "negative" ? "text-red-400" : "text-white";
  return (
    <Card className="bg-zinc-900 border-zinc-800 p-3">
      <div className="flex items-start justify-between">
        <p className="text-xs text-zinc-400 leading-tight">{label}</p>
        {icon}
      </div>
      <p className={`text-lg font-bold mt-1 ${valueColor}`}>{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
    </Card>
  );
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="h-0.5 w-5 rounded"
        style={{
          backgroundColor: color,
          borderTop: dashed ? `2px dashed ${color}` : undefined,
          background: dashed ? "none" : color,
        }}
      />
      <span className="text-xs text-zinc-400">{label}</span>
    </div>
  );
}
