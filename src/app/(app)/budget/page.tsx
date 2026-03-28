"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ExpenseChart, type ExpenseCategory } from "@/components/budget/expense-chart";
import { IncomeChart } from "@/components/budget/income-chart";
import { SurvivalCalculator } from "@/components/budget/survival-calculator";
import { Flame, TrendingUp, TrendingDown } from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────
// TODO: replace with API calls

const BUDGET_SUMMARY = {
  monthlyIncome: 7_500,
  monthlyExpenses: 4_350,
  savings: 45_000,
  emergencyFundTarget: 6, // months
};

const INCOME_SOURCES = [
  { source: "Primary Salary", amount: 6_200, type: "active" },
  { source: "Freelance / Consulting", amount: 900, type: "active" },
  { source: "Dividend Income", amount: 280, type: "passive" },
  { source: "Rental Income", amount: 120, type: "passive" },
];

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { name: "Housing / Rent", amount: 2_200, color: "#3b82f6", inflationSensitivity: "medium" },
  { name: "Groceries", amount: 600, color: "#f59e0b", inflationSensitivity: "high" },
  { name: "Transport / Fuel", amount: 350, color: "#8b5cf6", inflationSensitivity: "high" },
  { name: "Utilities", amount: 180, color: "#06b6d4", inflationSensitivity: "high" },
  { name: "Healthcare", amount: 250, color: "#10b981", inflationSensitivity: "high" },
  { name: "Dining Out", amount: 300, color: "#f97316", inflationSensitivity: "medium" },
  { name: "Entertainment", amount: 200, color: "#ec4899", inflationSensitivity: "low" },
  { name: "Subscriptions", amount: 120, color: "#71717a", inflationSensitivity: "low" },
  { name: "Clothing", amount: 150, color: "#a78bfa", inflationSensitivity: "low" },
];

const CPI = 3.2; // Current annual CPI — TODO: pull from /api/inflation/cpi

// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n: number) => `$${n.toLocaleString()}`;
const fmtPct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

const SENSITIVITY_COLORS = {
  high: "text-red-400",
  medium: "text-orange-400",
  low: "text-emerald-400",
};

const SENSITIVITY_BADGE: Record<string, "destructive" | "warning" | "success"> = {
  high: "destructive",
  medium: "warning",
  low: "success",
};

export default function BudgetPage() {
  const { monthlyIncome, monthlyExpenses, savings, emergencyFundTarget } = BUDGET_SUMMARY;
  const surplus = monthlyIncome - monthlyExpenses;
  const surplusPct = (surplus / monthlyIncome) * 100;
  const emergencyMonths = savings / monthlyExpenses;
  const emergencyProgress = Math.min(100, (emergencyMonths / emergencyFundTarget) * 100);

  // Inflation impact per category
  const totalInflationHit = EXPENSE_CATEGORIES.reduce((sum, c) => {
    return c.inflationSensitivity !== "low"
      ? sum + c.amount * (CPI / 100)
      : sum;
  }, 0);
  const annualInflationHit = totalInflationHit * 12;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader
        title="Budget"
        description="Income, expenses, inflation impact & survival analysis"
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── KPI row ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400">Monthly Income</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-400">{fmt(monthlyIncome)}</p>
              <p className="text-xs text-zinc-500 mt-1">{INCOME_SOURCES.length} sources</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400">Monthly Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-400">{fmt(monthlyExpenses)}</p>
              <p className="text-xs text-zinc-500 mt-1">{EXPENSE_CATEGORIES.length} categories</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400">Monthly Surplus</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${surplus >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {surplus >= 0 ? "+" : ""}{fmt(surplus)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">{surplusPct.toFixed(1)}% of income saved</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400">Inflation Hit / Month</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-400">+{fmt(Math.round(totalInflationHit))}</p>
              <p className="text-xs text-zinc-500 mt-1">{fmt(Math.round(annualInflationHit))} extra per year at {CPI}% CPI</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Income tracking + Expense breakdown ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* Income tracking */}
          <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">Income Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <IncomeChart />
              <div className="space-y-2 pt-1">
                {INCOME_SOURCES.map((s) => (
                  <div key={s.source} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block size-1.5 rounded-full ${s.type === "passive" ? "bg-emerald-400" : "bg-blue-400"}`} />
                      <p className="text-xs text-zinc-300">{s.source}</p>
                      <Badge variant={s.type === "passive" ? "success" : "outline"} className="text-[10px] py-0">
                        {s.type}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs text-white">{fmt(s.amount)}</p>
                      <p className="text-[10px] text-zinc-500">{((s.amount / monthlyIncome) * 100).toFixed(0)}% of income</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Expense breakdown */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ExpenseChart categories={EXPENSE_CATEGORIES} />
              <div className="space-y-2">
                {EXPENSE_CATEGORIES.map((c) => (
                  <div key={c.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="inline-block size-1.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <p className="text-xs text-zinc-300 truncate">{c.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.inflationSensitivity === "high" && (
                        <Flame className="size-3 text-red-400" />
                      )}
                      <span className="font-mono text-xs text-zinc-400">{fmt(c.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Inflation impact ── */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">Inflation Impact on Expenses</CardTitle>
              <span className="text-xs text-zinc-500">at {CPI}% CPI (YoY)</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {EXPENSE_CATEGORIES.map((c) => {
                const monthlyIncrease = c.amount * (CPI / 100);
                const annualIncrease = monthlyIncrease * 12;
                const projectedMonthly = c.amount + monthlyIncrease;
                return (
                  <div key={c.name} className="flex items-start justify-between rounded-lg bg-zinc-800/50 p-3 gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-xs font-medium text-zinc-200 truncate">{c.name}</p>
                        <Badge variant={SENSITIVITY_BADGE[c.inflationSensitivity]} className="text-[10px] py-0 shrink-0">
                          {c.inflationSensitivity}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        {fmt(c.amount)} → <span className={SENSITIVITY_COLORS[c.inflationSensitivity]}>{fmt(Math.round(projectedMonthly))}</span>/mo
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        {fmt(Math.round(annualIncrease))} extra/year
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-mono text-xs font-semibold ${SENSITIVITY_COLORS[c.inflationSensitivity]}`}>
                        +{fmt(Math.round(monthlyIncrease))}
                      </p>
                      <p className="text-[10px] text-zinc-600">per month</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Survival calculator ── */}
        <SurvivalCalculator />

        {/* ── Emergency fund tracker ── */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white">Emergency Fund Tracker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-zinc-500">Current Fund</p>
                <p className="text-xl font-bold text-white">{fmt(savings)}</p>
                <p className="text-[10px] text-zinc-600">liquid savings</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500">Current Runway</p>
                <p className={`text-xl font-bold ${emergencyMonths >= emergencyFundTarget ? "text-emerald-400" : emergencyMonths >= 3 ? "text-orange-400" : "text-red-400"}`}>
                  {emergencyMonths.toFixed(1)} mo
                </p>
                <p className="text-[10px] text-zinc-600">at {fmt(monthlyExpenses)}/mo spend</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500">Target ({emergencyFundTarget} months)</p>
                <p className="text-xl font-bold text-zinc-300">{fmt(monthlyExpenses * emergencyFundTarget)}</p>
                <p className="text-[10px] text-zinc-600">
                  {emergencyMonths >= emergencyFundTarget
                    ? "✓ Target reached"
                    : `${fmt(Math.round((monthlyExpenses * emergencyFundTarget) - savings))} to go`}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>$0</span>
                <span className="text-zinc-400 font-medium">
                  {emergencyProgress.toFixed(0)}% of {emergencyFundTarget}-month target
                </span>
                <span>{fmt(monthlyExpenses * emergencyFundTarget)}</span>
              </div>
              <Progress
                value={emergencyProgress}
                className={`h-2 ${emergencyMonths >= emergencyFundTarget ? "[&>div]:bg-emerald-500" : emergencyMonths >= 3 ? "[&>div]:bg-orange-500" : "[&>div]:bg-red-500"}`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Danger Zone", months: "< 3 mo", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                { label: "Caution", months: "3–6 mo", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
                { label: "Secure", months: "6+ mo", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
              ].map((tier) => (
                <div key={tier.label} className={`rounded-lg border p-2 ${tier.bg} ${emergencyMonths < 3 && tier.label === "Danger Zone" ? "ring-1 ring-red-500/40" : emergencyMonths >= 3 && emergencyMonths < 6 && tier.label === "Caution" ? "ring-1 ring-orange-500/40" : emergencyMonths >= 6 && tier.label === "Secure" ? "ring-1 ring-emerald-500/40" : ""}`}>
                  <p className={`text-xs font-semibold ${tier.color}`}>{tier.label}</p>
                  <p className="text-[10px] text-zinc-500">{tier.months}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
