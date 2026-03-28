import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { BudgetClient } from "./budget-client";
import type { IncomeSource, PlannedExpense, SavingsAccount, Debt, BudgetFinancialSettings, Subscription } from "@/lib/actions/budget";

export default async function BudgetPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const [incomeRes, expenseRes, savingsRes, debtRes, settingsRes, subscriptionRes] = await Promise.all([
    db.query(
      `SELECT id, name, amount, frequency, type, "isActive", "expectedAnnualGrowthRate"
       FROM income_sources WHERE "userId" = $1 ORDER BY "createdAt"`,
      [userId]
    ),
    db.query(
      `SELECT id, name, amount, frequency, category, "isEssential", "inflationSensitivity"
       FROM planned_expenses WHERE "userId" = $1 ORDER BY "createdAt"`,
      [userId]
    ),
    db.query(
      `SELECT id, name, type, balance, "targetAmount"
       FROM savings_accounts WHERE "userId" = $1 ORDER BY "createdAt"`,
      [userId]
    ),
    db.query(
      `SELECT id, name, type, balance, "interestRate", "minimumPayment", "paymentFrequency"
       FROM debts WHERE "userId" = $1 ORDER BY "createdAt"`,
      [userId]
    ),
    db.query(
      `SELECT currency, "inflationRateAssumption", "incomeDropScenario"
       FROM user_financial_settings WHERE "userId" = $1`,
      [userId]
    ),
    db.query(
      `SELECT id, name, amount, "billingCycle", category
       FROM subscriptions WHERE "userId" = $1 ORDER BY "createdAt"`,
      [userId]
    ),
  ]);

  const incomeSources: IncomeSource[] = incomeRes.rows.map((r) => ({
    ...r,
    amount: parseFloat(r.amount),
    expectedAnnualGrowthRate: parseFloat(r.expectedAnnualGrowthRate),
  }));

  const expenses: PlannedExpense[] = expenseRes.rows.map((r) => ({
    ...r,
    amount: parseFloat(r.amount),
  }));

  const savings: SavingsAccount[] = savingsRes.rows.map((r) => ({
    ...r,
    balance: parseFloat(r.balance),
    targetAmount: r.targetAmount != null ? parseFloat(r.targetAmount) : null,
  }));

  const debts: Debt[] = debtRes.rows.map((r) => ({
    ...r,
    balance: parseFloat(r.balance),
    interestRate: parseFloat(r.interestRate),
    minimumPayment: parseFloat(r.minimumPayment),
  }));

  const subscriptions: Subscription[] = subscriptionRes.rows.map((r) => ({
    ...r,
    amount: parseFloat(r.amount),
  }));

  const financialSettings: BudgetFinancialSettings = settingsRes.rows[0]
    ? {
        currency: settingsRes.rows[0].currency,
        inflationRateAssumption: parseFloat(settingsRes.rows[0].inflationRateAssumption),
        incomeDropScenario: parseFloat(settingsRes.rows[0].incomeDropScenario),
      }
    : { currency: "USD", inflationRateAssumption: 3, incomeDropScenario: 100 };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader
        title="Budget"
        description="Income, expenses, savings, debts & survival analysis"
      />
      <BudgetClient
        incomeSources={incomeSources}
        expenses={expenses}
        savings={savings}
        debts={debts}
        subscriptions={subscriptions}
        financialSettings={financialSettings}
      />
    </div>
  );
}
