"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { completeSetup, type IncomeSourceData, type PlannedExpenseData, type SavingsAccountData, type DebtData } from "@/lib/actions/setup";
import { X, Plus, ChevronRight, ChevronLeft, Check } from "lucide-react";

const STEPS = ["Assumptions", "Income", "Expenses", "Savings & Debts"];
const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF"];
const FREQUENCIES = ["monthly", "bi-weekly", "weekly", "annual", "one-time"];
const INCOME_TYPES = ["salary", "freelance", "rental", "dividends", "other"];
const INFLATION_SENSITIVITIES = ["high", "medium", "low", "none"];
const SAVINGS_TYPES = ["emergency_fund", "savings", "investment", "other"];
const DEBT_TYPES = ["mortgage", "credit_card", "student_loan", "auto", "personal", "other"];

// ── Module-level helpers (stable across renders) ───────────────────────────

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-zinc-400">{label}</Label>
      {children}
    </div>
  );
}

function ItemList<T extends { name: string }>({ items, onRemove, renderDetail }: {
  items: T[];
  onRemove: (i: number) => void;
  renderDetail: (item: T) => string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1.5 mb-4">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between rounded-md bg-zinc-800/60 px-3 py-2 text-sm">
          <div>
            <span className="text-white font-medium">{item.name}</span>
            <span className="text-zinc-500 text-xs ml-2">{renderDetail(item)}</span>
          </div>
          <button onClick={() => onRemove(i)} className="text-zinc-600 hover:text-red-400 transition-colors">
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────

interface Props {
  userName: string;
}

export function SetupWizard({ userName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — Financial Assumptions
  const [currency, setCurrency] = useState("USD");
  const [inflationRate, setInflationRate] = useState("3.00");
  const [incomeDropScenario, setIncomeDropScenario] = useState("100");

  // Step 2 — Income Sources
  const [incomeSources, setIncomeSources] = useState<IncomeSourceData[]>([]);
  const [incomeForm, setIncomeForm] = useState({ name: "", amount: "", type: "salary", frequency: "monthly", expectedAnnualGrowthRate: "0" });

  // Step 3 — Planned Expenses
  const [expenses, setExpenses] = useState<PlannedExpenseData[]>([]);
  const [expenseForm, setExpenseForm] = useState({ name: "", amount: "", category: "", frequency: "monthly", isEssential: false, inflationSensitivity: "medium" });

  // Step 4 — Savings & Debts
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccountData[]>([]);
  const [savingsForm, setSavingsForm] = useState({ name: "", type: "savings", balance: "", targetAmount: "" });
  const [debts, setDebts] = useState<DebtData[]>([]);
  const [debtForm, setDebtForm] = useState({ name: "", type: "other", balance: "", interestRate: "", minimumPayment: "", paymentFrequency: "monthly" });

  function addIncomeSource() {
    if (!incomeForm.name || !incomeForm.amount) return;
    setIncomeSources((prev) => [...prev, {
      name: incomeForm.name,
      amount: parseFloat(incomeForm.amount),
      type: incomeForm.type,
      frequency: incomeForm.frequency,
      expectedAnnualGrowthRate: parseFloat(incomeForm.expectedAnnualGrowthRate) || 0,
    }]);
    setIncomeForm({ name: "", amount: "", type: "salary", frequency: "monthly", expectedAnnualGrowthRate: "0" });
  }

  function addExpense() {
    if (!expenseForm.name || !expenseForm.amount || !expenseForm.category) return;
    setExpenses((prev) => [...prev, {
      name: expenseForm.name,
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category,
      frequency: expenseForm.frequency,
      isEssential: expenseForm.isEssential,
      inflationSensitivity: expenseForm.inflationSensitivity,
    }]);
    setExpenseForm({ name: "", amount: "", category: "", frequency: "monthly", isEssential: false, inflationSensitivity: "medium" });
  }

  function addSavingsAccount() {
    if (!savingsForm.name || !savingsForm.balance) return;
    setSavingsAccounts((prev) => [...prev, {
      name: savingsForm.name,
      type: savingsForm.type,
      balance: parseFloat(savingsForm.balance),
      targetAmount: savingsForm.targetAmount ? parseFloat(savingsForm.targetAmount) : undefined,
    }]);
    setSavingsForm({ name: "", type: "savings", balance: "", targetAmount: "" });
  }

  function addDebt() {
    if (!debtForm.name || !debtForm.balance || !debtForm.minimumPayment) return;
    setDebts((prev) => [...prev, {
      name: debtForm.name,
      type: debtForm.type,
      balance: parseFloat(debtForm.balance),
      interestRate: parseFloat(debtForm.interestRate) || 0,
      minimumPayment: parseFloat(debtForm.minimumPayment),
      paymentFrequency: debtForm.paymentFrequency,
    }]);
    setDebtForm({ name: "", type: "other", balance: "", interestRate: "", minimumPayment: "", paymentFrequency: "monthly" });
  }

  function canAdvance() {
    if (step === 1 && incomeSources.length === 0) return false;
    if (step === 2 && expenses.length === 0) return false;
    if (step === 3 && savingsAccounts.length === 0) return false;
    return true;
  }

  async function handleComplete() {
    if (!canAdvance()) return;
    setIsSubmitting(true);
    setError(null);
    const result = await completeSetup({
      financialSettings: {
        currency,
        inflationRateAssumption: parseFloat(inflationRate) || 3,
        incomeDropScenario: parseFloat(incomeDropScenario) || 100,
      },
      incomeSources,
      plannedExpenses: expenses,
      savingsAccounts,
      debts,
    });
    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error ?? "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-1 mb-4">
            <span className="font-bold text-white tracking-tight">QUANT</span>
            <span className="font-bold text-zinc-400 tracking-tight">HECHTON</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome, {userName}</h1>
          <p className="text-sm text-zinc-400">Let&apos;s set up your financial profile. This takes about 3 minutes.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className="flex items-center gap-2 shrink-0">
                <div className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  i < step ? "bg-emerald-500 text-white" :
                  i === step ? "bg-white text-zinc-900" :
                  "bg-zinc-800 text-zinc-500"
                }`}>
                  {i < step ? <Check className="size-3.5" /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-white" : "text-zinc-500"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 transition-colors ${i < step ? "bg-emerald-500" : "bg-zinc-800"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">

          {/* Step 1 — Financial Assumptions */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white">Financial Assumptions</h2>
                <p className="text-sm text-zinc-400 mt-1">These settings drive your survival calculator and inflation analysis.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FieldRow label="Base Currency">
                  <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </FieldRow>
                <FieldRow label="Annual Inflation Assumption (%)">
                  <Input type="number" step="0.1" value={inflationRate}
                    onChange={(e) => setInflationRate(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white" />
                </FieldRow>
                <FieldRow label="Income Drop Scenario (%)">
                  <Input type="number" min="0" max="100" value={incomeDropScenario}
                    onChange={(e) => setIncomeDropScenario(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white" />
                  <p className="text-[10px] text-zinc-600 mt-1">Worst-case income loss — 100% = full job loss</p>
                </FieldRow>
              </div>
            </div>
          )}

          {/* Step 2 — Income Sources */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Income Sources</h2>
                <p className="text-sm text-zinc-400 mt-1">Add at least one income source.</p>
              </div>
              <ItemList
                items={incomeSources}
                onRemove={(i) => setIncomeSources((prev) => prev.filter((_, idx) => idx !== i))}
                renderDetail={(s) => `$${s.amount.toLocaleString()} / ${s.frequency} · ${s.type}`}
              />
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                <p className="text-xs font-medium text-zinc-400">Add source</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <FieldRow label="Name">
                    <Input value={incomeForm.name}
                      onChange={(e) => setIncomeForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Salary" className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm" />
                  </FieldRow>
                  <FieldRow label="Amount ($)">
                    <Input type="number" value={incomeForm.amount}
                      onChange={(e) => setIncomeForm((p) => ({ ...p, amount: e.target.value }))}
                      placeholder="5000" className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm" />
                  </FieldRow>
                  <FieldRow label="Type">
                    <Select value={incomeForm.type}
                      onChange={(e) => setIncomeForm((p) => ({ ...p, type: e.target.value }))} className="h-8 text-sm">
                      {INCOME_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </Select>
                  </FieldRow>
                  <FieldRow label="Frequency">
                    <Select value={incomeForm.frequency}
                      onChange={(e) => setIncomeForm((p) => ({ ...p, frequency: e.target.value }))} className="h-8 text-sm">
                      {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                    </Select>
                  </FieldRow>
                  <FieldRow label="Annual Growth Rate (%)">
                    <Input type="number" step="0.1" value={incomeForm.expectedAnnualGrowthRate}
                      onChange={(e) => setIncomeForm((p) => ({ ...p, expectedAnnualGrowthRate: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm" />
                  </FieldRow>
                </div>
                <Button size="sm" variant="outline" onClick={addIncomeSource}
                  disabled={!incomeForm.name || !incomeForm.amount} className="gap-1.5">
                  <Plus className="size-3.5" /> Add Source
                </Button>
              </div>
              {incomeSources.length === 0 && (
                <p className="text-xs text-orange-400">Add at least one income source to continue.</p>
              )}
            </div>
          )}

          {/* Step 3 — Planned Expenses */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Planned Expenses</h2>
                <p className="text-sm text-zinc-400 mt-1">Add your regular expenses. Mark essentials and inflation sensitivity.</p>
              </div>
              <ItemList
                items={expenses}
                onRemove={(i) => setExpenses((prev) => prev.filter((_, idx) => idx !== i))}
                renderDetail={(e) => `$${e.amount.toLocaleString()} / ${e.frequency} · ${e.category} · ${e.inflationSensitivity} sensitivity`}
              />
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                <p className="text-xs font-medium text-zinc-400">Add expense</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <FieldRow label="Name">
                    <Input value={expenseForm.name}
                      onChange={(e) => setExpenseForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Rent" className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm" />
                  </FieldRow>
                  <FieldRow label="Amount ($)">
                    <Input type="number" value={expenseForm.amount}
                      onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))}
                      placeholder="1500" className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm" />
                  </FieldRow>
                  <FieldRow label="Category">
                    <Input value={expenseForm.category}
                      onChange={(e) => setExpenseForm((p) => ({ ...p, category: e.target.value }))}
                      placeholder="e.g. Housing" className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm" />
                  </FieldRow>
                  <FieldRow label="Frequency">
                    <Select value={expenseForm.frequency}
                      onChange={(e) => setExpenseForm((p) => ({ ...p, frequency: e.target.value }))} className="h-8 text-sm">
                      {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                    </Select>
                  </FieldRow>
                  <FieldRow label="Inflation Sensitivity">
                    <Select value={expenseForm.inflationSensitivity}
                      onChange={(e) => setExpenseForm((p) => ({ ...p, inflationSensitivity: e.target.value }))} className="h-8 text-sm">
                      {INFLATION_SENSITIVITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </FieldRow>
                  <FieldRow label="Essential?">
                    <div className="flex items-center h-9 gap-2">
                      <input type="checkbox" id="essential" checked={expenseForm.isEssential}
                        onChange={(e) => setExpenseForm((p) => ({ ...p, isEssential: e.target.checked }))}
                        className="rounded border-zinc-700 bg-zinc-800 accent-emerald-500" />
                      <label htmlFor="essential" className="text-sm text-zinc-300 cursor-pointer">Mark as essential</label>
                    </div>
                  </FieldRow>
                </div>
                <Button size="sm" variant="outline" onClick={addExpense}
                  disabled={!expenseForm.name || !expenseForm.amount || !expenseForm.category} className="gap-1.5">
                  <Plus className="size-3.5" /> Add Expense
                </Button>
              </div>
              {expenses.length === 0 && (
                <p className="text-xs text-orange-400">Add at least one expense to continue.</p>
              )}
            </div>
          )}

          {/* Step 4 — Savings & Debts */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Savings & Debts</h2>
                <p className="text-sm text-zinc-400 mt-1">Add at least one savings account. Debts are optional.</p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-300">Savings Accounts</p>
                <ItemList
                  items={savingsAccounts}
                  onRemove={(i) => setSavingsAccounts((prev) => prev.filter((_, idx) => idx !== i))}
                  renderDetail={(a) => `$${a.balance.toLocaleString()} · ${a.type.replace("_", " ")}`}
                />
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <FieldRow label="Name">
                      <Input value={savingsForm.name}
                        onChange={(e) => setSavingsForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Emergency Fund" className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm" />
                    </FieldRow>
                    <FieldRow label="Type">
                      <Select value={savingsForm.type}
                        onChange={(e) => setSavingsForm((p) => ({ ...p, type: e.target.value }))} className="h-8 text-sm">
                        {SAVINGS_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                      </Select>
                    </FieldRow>
                    <FieldRow label="Current Balance ($)">
                      <Input type="number" value={savingsForm.balance}
                        onChange={(e) => setSavingsForm((p) => ({ ...p, balance: e.target.value }))}
                        placeholder="10000" className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm" />
                    </FieldRow>
                    <FieldRow label="Target Amount ($) — optional">
                      <Input type="number" value={savingsForm.targetAmount}
                        onChange={(e) => setSavingsForm((p) => ({ ...p, targetAmount: e.target.value }))}
                        placeholder="20000" className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm" />
                    </FieldRow>
                  </div>
                  <Button size="sm" variant="outline" onClick={addSavingsAccount}
                    disabled={!savingsForm.name || !savingsForm.balance} className="gap-1.5">
                    <Plus className="size-3.5" /> Add Account
                  </Button>
                </div>
                {savingsAccounts.length === 0 && (
                  <p className="text-xs text-orange-400">Add at least one savings account to complete setup.</p>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-300">Debts <span className="text-zinc-600 font-normal">(optional)</span></p>
                <ItemList
                  items={debts}
                  onRemove={(i) => setDebts((prev) => prev.filter((_, idx) => idx !== i))}
                  renderDetail={(d) => `$${d.balance.toLocaleString()} balance · ${d.interestRate}% APR`}
                />
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <FieldRow label="Name">
                      <Input value={debtForm.name}
                        onChange={(e) => setDebtForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Student Loan" className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm" />
                    </FieldRow>
                    <FieldRow label="Type">
                      <Select value={debtForm.type}
                        onChange={(e) => setDebtForm((p) => ({ ...p, type: e.target.value }))} className="h-8 text-sm">
                        {DEBT_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                      </Select>
                    </FieldRow>
                    <FieldRow label="Balance ($)">
                      <Input type="number" value={debtForm.balance}
                        onChange={(e) => setDebtForm((p) => ({ ...p, balance: e.target.value }))}
                        placeholder="15000" className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm" />
                    </FieldRow>
                    <FieldRow label="Interest Rate (% APR)">
                      <Input type="number" step="0.1" value={debtForm.interestRate}
                        onChange={(e) => setDebtForm((p) => ({ ...p, interestRate: e.target.value }))}
                        placeholder="6.5" className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm" />
                    </FieldRow>
                    <FieldRow label="Minimum Payment ($)">
                      <Input type="number" value={debtForm.minimumPayment}
                        onChange={(e) => setDebtForm((p) => ({ ...p, minimumPayment: e.target.value }))}
                        placeholder="250" className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm" />
                    </FieldRow>
                    <FieldRow label="Payment Frequency">
                      <Select value={debtForm.paymentFrequency}
                        onChange={(e) => setDebtForm((p) => ({ ...p, paymentFrequency: e.target.value }))} className="h-8 text-sm">
                        {FREQUENCIES.filter((f) => f !== "one-time").map((f) => <option key={f} value={f}>{f}</option>)}
                      </Select>
                    </FieldRow>
                  </div>
                  <Button size="sm" variant="outline" onClick={addDebt}
                    disabled={!debtForm.name || !debtForm.balance || !debtForm.minimumPayment} className="gap-1.5">
                    <Plus className="size-3.5" /> Add Debt
                  </Button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-400 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0} className="gap-1.5 text-zinc-400">
            <ChevronLeft className="size-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()} className="gap-1.5">
              Next <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={!canAdvance() || isSubmitting}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white">
              {isSubmitting ? "Saving..." : "Complete Setup"} {!isSubmitting && <Check className="size-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
