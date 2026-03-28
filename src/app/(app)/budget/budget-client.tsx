"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { SurvivalCalculator } from "@/components/budget/survival-calculator";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  createIncomeSource, updateIncomeSource, deleteIncomeSource,
  createPlannedExpense, updatePlannedExpense, deletePlannedExpense,
  createSavingsAccount, updateSavingsAccount, deleteSavingsAccount,
  createDebt, updateDebt, deleteDebt,
  createSubscription, updateSubscription, deleteSubscription,
  type IncomeSource, type PlannedExpense, type SavingsAccount, type Debt,
  type Subscription, type BudgetFinancialSettings,
} from "@/lib/actions/budget";
import { POPULAR_SERVICES } from "@/lib/subscriptions-data";

// ── Constants ─────────────────────────────────────────────────────────────────

const FREQUENCIES = ["monthly", "bi-weekly", "weekly", "annual", "one-time"];
const INCOME_TYPES = ["salary", "freelance", "rental", "dividends", "other"];
const INFLATION_SENSITIVITIES = ["high", "medium", "low", "none"];
const SAVINGS_TYPES = ["emergency_fund", "savings", "investment", "other"];
const DEBT_TYPES = ["mortgage", "credit_card", "student_loan", "auto", "personal", "other"];
type DialogMode =
  | "add-income" | "edit-income"
  | "add-expense" | "edit-expense"
  | "add-savings" | "edit-savings"
  | "add-debt" | "edit-debt"
  | "add-subscription" | "edit-subscription";

// ── Module-level helpers ──────────────────────────────────────────────────────

function toMonthly(amount: number, frequency: string): number {
  if (frequency === "bi-weekly") return (amount * 26) / 12;
  if (frequency === "weekly") return (amount * 52) / 12;
  if (frequency === "annual") return amount / 12;
  if (frequency === "one-time") return 0;
  return amount; // monthly
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-zinc-400">{label}</Label>
      {children}
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const SENSITIVITY_COLOR: Record<string, string> = {
  high: "text-red-400", medium: "text-orange-400", low: "text-emerald-400", none: "text-zinc-500",
};
const SENSITIVITY_BADGE: Record<string, "destructive" | "warning" | "success" | "outline"> = {
  high: "destructive", medium: "warning", low: "success", none: "outline",
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  incomeSources: IncomeSource[];
  expenses: PlannedExpense[];
  savings: SavingsAccount[];
  debts: Debt[];
  subscriptions: Subscription[];
  financialSettings: BudgetFinancialSettings;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BudgetClient({ incomeSources, expenses, savings, debts, subscriptions, financialSettings }: Props) {
  const router = useRouter();

  // Dialog state
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string | boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  // Subscription search combobox state
  const [subSearch, setSubSearch] = useState("");
  const [subDropdownOpen, setSubDropdownOpen] = useState(false);

  function setField(key: string, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function openAdd(mode: DialogMode, defaults: Record<string, string | boolean>) {
    setDialogMode(mode);
    setEditingId(null);
    setFormData(defaults);
    setDialogError(null);
  }

  function openEdit(mode: DialogMode, id: string, values: Record<string, string | boolean>) {
    setDialogMode(mode);
    setEditingId(id);
    setFormData(values);
    setDialogError(null);
  }

  function closeDialog() {
    setDialogMode(null);
    setEditingId(null);
    setFormData({});
    setDialogError(null);
    setSubSearch("");
    setSubDropdownOpen(false);
  }

  async function handleSave() {
    setIsSaving(true);
    setDialogError(null);
    let result: { success: boolean; error?: string };

    const f = formData;

    if (dialogMode === "add-income" || dialogMode === "edit-income") {
      const data = {
        name: String(f.name ?? ""),
        amount: parseFloat(String(f.amount)) || 0,
        frequency: String(f.frequency ?? "monthly"),
        type: String(f.type ?? "other"),
        isActive: f.isActive !== false,
        expectedAnnualGrowthRate: parseFloat(String(f.expectedAnnualGrowthRate)) || 0,
      };
      result = editingId ? await updateIncomeSource(editingId, data) : await createIncomeSource(data);
    } else if (dialogMode === "add-expense" || dialogMode === "edit-expense") {
      const data = {
        name: String(f.name ?? ""),
        amount: parseFloat(String(f.amount)) || 0,
        frequency: String(f.frequency ?? "monthly"),
        category: String(f.category ?? ""),
        isEssential: Boolean(f.isEssential),
        inflationSensitivity: String(f.inflationSensitivity ?? "medium"),
      };
      result = editingId ? await updatePlannedExpense(editingId, data) : await createPlannedExpense(data);
    } else if (dialogMode === "add-savings" || dialogMode === "edit-savings") {
      const data = {
        name: String(f.name ?? ""),
        type: String(f.type ?? "savings"),
        balance: parseFloat(String(f.balance)) || 0,
        targetAmount: f.targetAmount ? parseFloat(String(f.targetAmount)) : null,
      };
      result = editingId ? await updateSavingsAccount(editingId, data) : await createSavingsAccount(data);
    } else if (dialogMode === "add-subscription" || dialogMode === "edit-subscription") {
      const data = {
        name: String(f.name ?? ""),
        amount: parseFloat(String(f.amount)) || 0,
        billingCycle: String(f.billingCycle ?? "monthly"),
        category: String(f.category ?? ""),
      };
      result = editingId ? await updateSubscription(editingId, data) : await createSubscription(data);
    } else {
      const data = {
        name: String(f.name ?? ""),
        type: String(f.type ?? "other"),
        balance: parseFloat(String(f.balance)) || 0,
        interestRate: parseFloat(String(f.interestRate)) || 0,
        minimumPayment: parseFloat(String(f.minimumPayment)) || 0,
        paymentFrequency: String(f.paymentFrequency ?? "monthly"),
      };
      result = editingId ? await updateDebt(editingId, data) : await createDebt(data);
    }

    if (result.success) {
      router.refresh();
      closeDialog();
    } else {
      setDialogError(result.error ?? "Something went wrong.");
    }
    setIsSaving(false);
  }

  async function handleDelete(
    action: (id: string) => Promise<{ success: boolean; error?: string }>,
    id: string,
    label: string
  ) {
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    await action(id);
    router.refresh();
  }

  // ── Computed values ──────────────────────────────────────────────────────────

  const totalMonthlyIncome = incomeSources
    .filter((s) => s.isActive)
    .reduce((sum, s) => sum + toMonthly(s.amount, s.frequency), 0);

  const totalMonthlySubscriptions = subscriptions
    .reduce((sum, s) => sum + toMonthly(s.amount, s.billingCycle), 0);

  const totalMonthlyExpenses = expenses
    .reduce((sum, e) => sum + toMonthly(e.amount, e.frequency), 0) + totalMonthlySubscriptions;

  const surplus = totalMonthlyIncome - totalMonthlyExpenses;
  const totalSavings = savings.reduce((sum, a) => sum + a.balance, 0);
  const { inflationRateAssumption: inflationRate } = financialSettings;

  const inflationHitMonthly = expenses
    .filter((e) => e.inflationSensitivity !== "none")
    .reduce((sum, e) => sum + toMonthly(e.amount, e.frequency) * (inflationRate / 100), 0);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-6">

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-400">{fmt(totalMonthlyIncome)}</p>
            <p className="text-xs text-zinc-500 mt-1">{incomeSources.filter(s => s.isActive).length} active sources</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-400">{fmt(totalMonthlyExpenses)}</p>
            <p className="text-xs text-zinc-500 mt-1">{expenses.length} expenses · {subscriptions.length} subscriptions</p>
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
            <p className="text-xs text-zinc-500 mt-1">
              {totalMonthlyIncome > 0 ? ((surplus / totalMonthlyIncome) * 100).toFixed(1) : "0"}% of income saved
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">Inflation Hit / Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-400">+{fmt(inflationHitMonthly)}</p>
            <p className="text-xs text-zinc-500 mt-1">at {inflationRate}% CPI assumption</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Income Sources ── */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-white">Income Sources</CardTitle>
            <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
              onClick={() => openAdd("add-income", { name: "", amount: "", type: "salary", frequency: "monthly", expectedAnnualGrowthRate: "0", isActive: true })}>
              <Plus className="size-3" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {incomeSources.length === 0 ? (
            <p className="px-6 py-4 text-sm text-zinc-500">No income sources yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-6 py-2 text-left text-xs font-medium text-zinc-500">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">Type</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">Frequency</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">Monthly</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-zinc-500">Active</th>
                  <th className="px-6 py-2" />
                </tr>
              </thead>
              <tbody>
                {incomeSources.map((s, i) => (
                  <tr key={s.id} className={i < incomeSources.length - 1 ? "border-b border-zinc-800/60" : ""}>
                    <td className="px-6 py-3 text-sm text-white font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{cap(s.type)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-zinc-300">{fmt(s.amount)}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{s.frequency}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-emerald-400">{fmt(toMonthly(s.amount, s.frequency))}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium ${s.isActive ? "text-emerald-400" : "text-zinc-600"}`}>
                        {s.isActive ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit("edit-income", s.id, { name: s.name, amount: String(s.amount), type: s.type, frequency: s.frequency, expectedAnnualGrowthRate: String(s.expectedAnnualGrowthRate), isActive: s.isActive })}
                          className="text-zinc-600 hover:text-zinc-300 transition-colors">
                          <Pencil className="size-3.5" />
                        </button>
                        <button onClick={() => handleDelete(deleteIncomeSource, s.id, s.name)}
                          className="text-zinc-600 hover:text-red-400 transition-colors">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* ── Expenses ── */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-white">Planned Expenses</CardTitle>
            <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
              onClick={() => openAdd("add-expense", { name: "", amount: "", category: "", frequency: "monthly", isEssential: false, inflationSensitivity: "medium" })}>
              <Plus className="size-3" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {expenses.length === 0 ? (
            <p className="px-6 py-4 text-sm text-zinc-500">No expenses yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-6 py-2 text-left text-xs font-medium text-zinc-500">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">Category</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">Frequency</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">Monthly</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-zinc-500">Essential</th>
                  <th className="px-6 py-2" />
                </tr>
              </thead>
              <tbody>
                {expenses.map((e, i) => (
                  <tr key={e.id} className={i < expenses.length - 1 ? "border-b border-zinc-800/60" : ""}>
                    <td className="px-6 py-3 text-sm text-white font-medium">{e.name}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{e.category}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-zinc-300">{fmt(e.amount)}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{e.frequency}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-orange-400">{fmt(toMonthly(e.amount, e.frequency))}</td>
                    <td className="px-4 py-3 text-center">
                      {e.isEssential && <span className="text-xs text-blue-400">Essential</span>}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit("edit-expense", e.id, { name: e.name, amount: String(e.amount), category: e.category, frequency: e.frequency, isEssential: e.isEssential, inflationSensitivity: e.inflationSensitivity })}
                          className="text-zinc-600 hover:text-zinc-300 transition-colors">
                          <Pencil className="size-3.5" />
                        </button>
                        <button onClick={() => handleDelete(deletePlannedExpense, e.id, e.name)}
                          className="text-zinc-600 hover:text-red-400 transition-colors">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* ── Subscriptions ── */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-white">Subscriptions</CardTitle>
            <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
              onClick={() => { setSubSearch(""); openAdd("add-subscription", { name: "", amount: "", billingCycle: "monthly", category: "" }); }}>
              <Plus className="size-3" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {subscriptions.length === 0 ? (
            <p className="px-6 py-4 text-sm text-zinc-500">No subscriptions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-6 py-2 text-left text-xs font-medium text-zinc-500">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">Category</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">Cycle</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">Monthly</th>
                  <th className="px-6 py-2" />
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s, i) => (
                  <tr key={s.id} className={i < subscriptions.length - 1 ? "border-b border-zinc-800/60" : ""}>
                    <td className="px-6 py-3 text-sm text-white font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{s.category}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-zinc-300">${s.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{cap(s.billingCycle)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-orange-400">{fmt(toMonthly(s.amount, s.billingCycle))}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setSubSearch(s.name); openEdit("edit-subscription", s.id, { name: s.name, amount: String(s.amount), billingCycle: s.billingCycle, category: s.category }); }}
                          className="text-zinc-600 hover:text-zinc-300 transition-colors">
                          <Pencil className="size-3.5" />
                        </button>
                        <button onClick={() => handleDelete(deleteSubscription, s.id, s.name)}
                          className="text-zinc-600 hover:text-red-400 transition-colors">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {subscriptions.length > 0 && (
            <>
              <Separator className="bg-zinc-800" />
              <div className="flex justify-between text-xs px-6 py-3">
                <span className="text-zinc-500">Total monthly subscriptions</span>
                <span className="font-mono font-semibold text-orange-400">{fmt(totalMonthlySubscriptions)}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Savings + Debts ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Savings */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">Savings Accounts</CardTitle>
              <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
                onClick={() => openAdd("add-savings", { name: "", type: "savings", balance: "", targetAmount: "" })}>
                <Plus className="size-3" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {savings.length === 0 ? (
              <p className="text-sm text-zinc-500">No savings accounts yet.</p>
            ) : savings.map((a) => {
              const pct = a.targetAmount ? Math.min(100, (a.balance / a.targetAmount) * 100) : null;
              return (
                <div key={a.id} className="rounded-lg bg-zinc-800/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{a.name}</p>
                      <p className="text-[10px] text-zinc-500">{cap(a.type.replace("_", " "))}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-mono text-sm font-bold text-emerald-400">{fmt(a.balance)}</p>
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit("edit-savings", a.id, { name: a.name, type: a.type, balance: String(a.balance), targetAmount: a.targetAmount != null ? String(a.targetAmount) : "" })}
                          className="text-zinc-600 hover:text-zinc-300 transition-colors">
                          <Pencil className="size-3.5" />
                        </button>
                        <button onClick={() => handleDelete(deleteSavingsAccount, a.id, a.name)}
                          className="text-zinc-600 hover:text-red-400 transition-colors">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {pct !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>Target: {fmt(a.targetAmount!)}</span>
                        <span>{pct.toFixed(0)}%</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  )}
                </div>
              );
            })}
            {savings.length > 0 && (
              <>
                <Separator className="bg-zinc-800" />
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Total savings</span>
                  <span className="font-mono font-semibold text-emerald-400">{fmt(totalSavings)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Debts */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">Debts</CardTitle>
              <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
                onClick={() => openAdd("add-debt", { name: "", type: "other", balance: "", interestRate: "", minimumPayment: "", paymentFrequency: "monthly" })}>
                <Plus className="size-3" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {debts.length === 0 ? (
              <p className="text-sm text-zinc-500">No debts recorded.</p>
            ) : debts.map((d) => (
              <div key={d.id} className="rounded-lg bg-zinc-800/50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{d.name}</p>
                    <p className="text-[10px] text-zinc-500">{cap(d.type.replace("_", " "))} · {d.interestRate}% APR · min {fmt(d.minimumPayment)}/{d.paymentFrequency}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-sm font-bold text-red-400">{fmt(d.balance)}</p>
                    <div className="flex gap-1.5">
                      <button onClick={() => openEdit("edit-debt", d.id, { name: d.name, type: d.type, balance: String(d.balance), interestRate: String(d.interestRate), minimumPayment: String(d.minimumPayment), paymentFrequency: d.paymentFrequency })}
                        className="text-zinc-600 hover:text-zinc-300 transition-colors">
                        <Pencil className="size-3.5" />
                      </button>
                      <button onClick={() => handleDelete(deleteDebt, d.id, d.name)}
                        className="text-zinc-600 hover:text-red-400 transition-colors">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {debts.length > 0 && (
              <>
                <Separator className="bg-zinc-800" />
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Total debt</span>
                  <span className="font-mono font-semibold text-red-400">{fmt(debts.reduce((s, d) => s + d.balance, 0))}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Survival Calculator ── */}
      <SurvivalCalculator
        initialSavings={totalSavings}
        initialIncome={Math.round(totalMonthlyIncome)}
        initialExpenses={Math.round(totalMonthlyExpenses)}
        initialInflationRate={inflationRate}
        initialIncomeGrowth={2}
      />

      {/* ── Inflation Impact ── */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-white">Inflation Impact on Expenses</CardTitle>
            <span className="text-xs text-zinc-500">at {inflationRate}% CPI assumption</span>
          </div>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-sm text-zinc-500">Add expenses to see inflation impact.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {expenses.map((e) => {
                const monthly = toMonthly(e.amount, e.frequency);
                const monthlyIncrease = monthly * (inflationRate / 100);
                const annualIncrease = monthlyIncrease * 12;
                return (
                  <div key={e.id} className="flex items-start justify-between rounded-lg bg-zinc-800/50 p-3 gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-xs font-medium text-zinc-200 truncate">{e.name}</p>
                        <Badge variant={SENSITIVITY_BADGE[e.inflationSensitivity] ?? "outline"} className="text-[10px] py-0 shrink-0">
                          {e.inflationSensitivity}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        {fmt(monthly)} →{" "}
                        <span className={SENSITIVITY_COLOR[e.inflationSensitivity]}>
                          {fmt(monthly + monthlyIncrease)}
                        </span>/mo
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{fmt(annualIncrease)} extra/year</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-mono text-xs font-semibold ${SENSITIVITY_COLOR[e.inflationSensitivity]}`}>
                        +{fmt(monthlyIncrease)}
                      </p>
                      <p className="text-[10px] text-zinc-600">per month</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Emergency Fund Tracker ── */}
      {savings.length > 0 && totalMonthlyExpenses > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white">Emergency Fund Tracker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const target = 6;
              const months = totalSavings / totalMonthlyExpenses;
              const pct = Math.min(100, (months / target) * 100);
              return (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-500">Total Savings</p>
                      <p className="text-xl font-bold text-white">{fmt(totalSavings)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-500">Current Runway</p>
                      <p className={`text-xl font-bold ${months >= 6 ? "text-emerald-400" : months >= 3 ? "text-orange-400" : "text-red-400"}`}>
                        {months.toFixed(1)} mo
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-500">6-Month Target</p>
                      <p className="text-xl font-bold text-zinc-300">{fmt(totalMonthlyExpenses * target)}</p>
                      <p className="text-[10px] text-zinc-600">
                        {months >= target ? "✓ Target reached" : `${fmt(Math.round(totalMonthlyExpenses * target - totalSavings))} to go`}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>$0</span>
                      <span className="text-zinc-400 font-medium">{pct.toFixed(0)}% of 6-month target</span>
                      <span>{fmt(totalMonthlyExpenses * target)}</span>
                    </div>
                    <Progress value={pct} className={`h-2 ${months >= 6 ? "[&>div]:bg-emerald-500" : months >= 3 ? "[&>div]:bg-orange-500" : "[&>div]:bg-red-500"}`} />
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* ── CRUD Dialog ── */}
      <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {dialogMode?.startsWith("add") ? "Add" : "Edit"}{" "}
              {dialogMode?.includes("income") ? "Income Source"
                : dialogMode?.includes("expense") ? "Expense"
                : dialogMode?.includes("savings") ? "Savings Account"
                : dialogMode?.includes("subscription") ? "Subscription"
                : "Debt"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {/* Income form */}
            {(dialogMode === "add-income" || dialogMode === "edit-income") && (
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Name">
                  <Input value={String(formData.name ?? "")} onChange={(e) => setField("name", e.target.value)}
                    placeholder="e.g. Salary" className="bg-zinc-800 border-zinc-700 text-white" />
                </FieldRow>
                <FieldRow label="Amount ($)">
                  <Input type="number" step="100" value={String(formData.amount ?? "")} onChange={(e) => setField("amount", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white" />
                </FieldRow>
                <FieldRow label="Type">
                  <Select value={String(formData.type ?? "salary")} onChange={(e) => setField("type", e.target.value)} className="border-zinc-700">
                    {INCOME_TYPES.map((t) => <option key={t} value={t}>{cap(t)}</option>)}
                  </Select>
                </FieldRow>
                <FieldRow label="Frequency">
                  <Select value={String(formData.frequency ?? "monthly")} onChange={(e) => setField("frequency", e.target.value)} className="border-zinc-700">
                    {FREQUENCIES.map((f) => <option key={f} value={f}>{cap(f)}</option>)}
                  </Select>
                </FieldRow>
                <FieldRow label="Annual Growth Rate (%)">
                  <Input type="number" step="0.1" value={String(formData.expectedAnnualGrowthRate ?? "0")} onChange={(e) => setField("expectedAnnualGrowthRate", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white" />
                </FieldRow>
                <FieldRow label="Active?">
                  <div className="flex items-center h-9 gap-2">
                    <input type="checkbox" checked={formData.isActive !== false} onChange={(e) => setField("isActive", e.target.checked)}
                      className="accent-emerald-500" />
                    <span className="text-sm text-zinc-300">Include in totals</span>
                  </div>
                </FieldRow>
              </div>
            )}

            {/* Expense form */}
            {(dialogMode === "add-expense" || dialogMode === "edit-expense") && (
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Name">
                  <Input value={String(formData.name ?? "")} onChange={(e) => setField("name", e.target.value)}
                    placeholder="e.g. Rent" className="bg-zinc-800 border-zinc-700 text-white" />
                </FieldRow>
                <FieldRow label="Amount ($)">
                  <Input type="number" step="100" value={String(formData.amount ?? "")} onChange={(e) => setField("amount", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white" />
                </FieldRow>
                <FieldRow label="Category">
                  <Input value={String(formData.category ?? "")} onChange={(e) => setField("category", e.target.value)}
                    placeholder="e.g. Housing" className="bg-zinc-800 border-zinc-700 text-white" />
                </FieldRow>
                <FieldRow label="Frequency">
                  <Select value={String(formData.frequency ?? "monthly")} onChange={(e) => setField("frequency", e.target.value)} className="border-zinc-700">
                    {FREQUENCIES.map((f) => <option key={f} value={f}>{cap(f)}</option>)}
                  </Select>
                </FieldRow>
                <FieldRow label="Inflation Sensitivity">
                  <Select value={String(formData.inflationSensitivity ?? "medium")} onChange={(e) => setField("inflationSensitivity", e.target.value)} className="border-zinc-700">
                    {INFLATION_SENSITIVITIES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
                  </Select>
                </FieldRow>
                <FieldRow label="Essential?">
                  <div className="flex items-center h-9 gap-2">
                    <input type="checkbox" checked={Boolean(formData.isEssential)} onChange={(e) => setField("isEssential", e.target.checked)}
                      className="accent-emerald-500" />
                    <span className="text-sm text-zinc-300">Mark as essential</span>
                  </div>
                </FieldRow>
              </div>
            )}

            {/* Savings form */}
            {(dialogMode === "add-savings" || dialogMode === "edit-savings") && (
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Name">
                  <Input value={String(formData.name ?? "")} onChange={(e) => setField("name", e.target.value)}
                    placeholder="e.g. Emergency Fund" className="bg-zinc-800 border-zinc-700 text-white" />
                </FieldRow>
                <FieldRow label="Type">
                  <Select value={String(formData.type ?? "savings")} onChange={(e) => setField("type", e.target.value)} className="border-zinc-700">
                    {SAVINGS_TYPES.map((t) => <option key={t} value={t}>{cap(t.replace("_", " "))}</option>)}
                  </Select>
                </FieldRow>
                <FieldRow label="Current Balance ($)">
                  <Input type="number" step="100" value={String(formData.balance ?? "")} onChange={(e) => setField("balance", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white" />
                </FieldRow>
                <FieldRow label="Target Amount ($) — optional">
                  <Input type="number" step="100" value={String(formData.targetAmount ?? "")} onChange={(e) => setField("targetAmount", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white" />
                </FieldRow>
              </div>
            )}

            {/* Subscription form */}
            {(dialogMode === "add-subscription" || dialogMode === "edit-subscription") && (() => {
              const filtered = subSearch.length > 0
                ? POPULAR_SERVICES.filter((s) => s.name.toLowerCase().includes(subSearch.toLowerCase())).slice(0, 8)
                : [];
              return (
                <div className="space-y-3">
                  <FieldRow label="Search service">
                    <div className="relative">
                      <Input
                        value={subSearch}
                        onChange={(e) => { setSubSearch(e.target.value); setSubDropdownOpen(true); }}
                        onFocus={() => setSubDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setSubDropdownOpen(false), 150)}
                        placeholder="e.g. Netflix, Spotify…"
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                      {subDropdownOpen && filtered.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg max-h-52 overflow-y-auto">
                          {filtered.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setField("name", preset.name);
                                setField("amount", String(preset.amount));
                                setField("billingCycle", preset.billingCycle);
                                setField("category", preset.category);
                                setSubSearch(preset.name);
                                setSubDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 flex items-center justify-between gap-4"
                            >
                              <span className="text-white truncate">{preset.name}</span>
                              <span className="text-zinc-400 text-xs shrink-0">
                                {preset.category} · ${preset.amount}/{preset.billingCycle === "monthly" ? "mo" : "yr"}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </FieldRow>
                  <div className="grid grid-cols-2 gap-3">
                    <FieldRow label="Name">
                      <Input value={String(formData.name ?? "")} onChange={(e) => setField("name", e.target.value)}
                        placeholder="Custom name" className="bg-zinc-800 border-zinc-700 text-white" />
                    </FieldRow>
                    <FieldRow label="Category">
                      <Input value={String(formData.category ?? "")} onChange={(e) => setField("category", e.target.value)}
                        placeholder="e.g. Streaming" className="bg-zinc-800 border-zinc-700 text-white" />
                    </FieldRow>
                    <FieldRow label="Amount ($)">
                      <Input type="number" step="0.01" value={String(formData.amount ?? "")} onChange={(e) => setField("amount", e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white" />
                    </FieldRow>
                    <FieldRow label="Billing Cycle">
                      <Select value={String(formData.billingCycle ?? "monthly")} onChange={(e) => setField("billingCycle", e.target.value)} className="border-zinc-700">
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                      </Select>
                    </FieldRow>
                  </div>
                </div>
              );
            })()}

            {/* Debt form */}
            {(dialogMode === "add-debt" || dialogMode === "edit-debt") && (
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Name">
                  <Input value={String(formData.name ?? "")} onChange={(e) => setField("name", e.target.value)}
                    placeholder="e.g. Student Loan" className="bg-zinc-800 border-zinc-700 text-white" />
                </FieldRow>
                <FieldRow label="Type">
                  <Select value={String(formData.type ?? "other")} onChange={(e) => setField("type", e.target.value)} className="border-zinc-700">
                    {DEBT_TYPES.map((t) => <option key={t} value={t}>{cap(t.replace("_", " "))}</option>)}
                  </Select>
                </FieldRow>
                <FieldRow label="Balance ($)">
                  <Input type="number" step="100" value={String(formData.balance ?? "")} onChange={(e) => setField("balance", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white" />
                </FieldRow>
                <FieldRow label="Interest Rate (% APR)">
                  <Input type="number" step="0.1" value={String(formData.interestRate ?? "")} onChange={(e) => setField("interestRate", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white" />
                </FieldRow>
                <FieldRow label="Minimum Payment ($)">
                  <Input type="number" step="100" value={String(formData.minimumPayment ?? "")} onChange={(e) => setField("minimumPayment", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white" />
                </FieldRow>
                <FieldRow label="Payment Frequency">
                  <Select value={String(formData.paymentFrequency ?? "monthly")} onChange={(e) => setField("paymentFrequency", e.target.value)} className="border-zinc-700">
                    {FREQUENCIES.filter((f) => f !== "one-time").map((f) => <option key={f} value={f}>{f}</option>)}
                  </Select>
                </FieldRow>
              </div>
            )}

            {dialogError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{dialogError}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={closeDialog} className="text-zinc-400 hover:text-white">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-zinc-700 hover:bg-zinc-600 text-white">
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </main>
  );
}
