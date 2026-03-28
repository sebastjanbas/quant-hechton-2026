"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/lib/db";

export interface FinancialSettingsData {
  currency: string;
  inflationRateAssumption: number;
  incomeDropScenario: number;
}

export interface IncomeSourceData {
  name: string;
  amount: number;
  frequency: string;
  type: string;
  expectedAnnualGrowthRate: number;
  startDate?: string;
}

export interface PlannedExpenseData {
  name: string;
  amount: number;
  frequency: string;
  category: string;
  isEssential: boolean;
  inflationSensitivity: string;
}

export interface SavingsAccountData {
  name: string;
  type: string;
  balance: number;
  targetAmount?: number;
}

export interface DebtData {
  name: string;
  type: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  paymentFrequency: string;
  dueDate?: string;
}

export interface SetupPayload {
  financialSettings: FinancialSettingsData;
  incomeSources: IncomeSourceData[];
  plannedExpenses: PlannedExpenseData[];
  savingsAccounts: SavingsAccountData[];
  debts: DebtData[];
}

async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

export async function completeSetup(
  payload: SetupPayload
): Promise<{ success: boolean; error?: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO user_financial_settings ("userId", currency, "inflationRateAssumption", "incomeDropScenario")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ("userId") DO UPDATE SET
         currency = EXCLUDED.currency,
         "inflationRateAssumption" = EXCLUDED."inflationRateAssumption",
         "incomeDropScenario" = EXCLUDED."incomeDropScenario",
         "updatedAt" = CURRENT_TIMESTAMP`,
      [
        userId,
        payload.financialSettings.currency,
        payload.financialSettings.inflationRateAssumption,
        payload.financialSettings.incomeDropScenario,
      ]
    );

    for (const source of payload.incomeSources) {
      await client.query(
        `INSERT INTO income_sources (id, "userId", name, amount, frequency, type, "expectedAnnualGrowthRate", "startDate")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          crypto.randomUUID(),
          userId,
          source.name,
          source.amount,
          source.frequency,
          source.type,
          source.expectedAnnualGrowthRate,
          source.startDate ?? null,
        ]
      );
    }

    for (const expense of payload.plannedExpenses) {
      await client.query(
        `INSERT INTO planned_expenses (id, "userId", name, amount, frequency, category, "isEssential", "inflationSensitivity")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          crypto.randomUUID(),
          userId,
          expense.name,
          expense.amount,
          expense.frequency,
          expense.category,
          expense.isEssential,
          expense.inflationSensitivity,
        ]
      );
    }

    for (const account of payload.savingsAccounts) {
      await client.query(
        `INSERT INTO savings_accounts (id, "userId", name, type, balance, "targetAmount")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          crypto.randomUUID(),
          userId,
          account.name,
          account.type,
          account.balance,
          account.targetAmount ?? null,
        ]
      );
    }

    for (const debt of payload.debts) {
      await client.query(
        `INSERT INTO debts (id, "userId", name, type, balance, "interestRate", "minimumPayment", "paymentFrequency", "dueDate")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          crypto.randomUUID(),
          userId,
          debt.name,
          debt.type,
          debt.balance,
          debt.interestRate,
          debt.minimumPayment,
          debt.paymentFrequency,
          debt.dueDate ?? null,
        ]
      );
    }

    await client.query("COMMIT");
    return { success: true };
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Setup error:", e);
    return { success: false, error: "Failed to save your data. Please try again." };
  } finally {
    client.release();
  }
}

export async function updateFinancialSettings(
  data: FinancialSettingsData
): Promise<{ success: boolean; error?: string }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    await db.query(
      `INSERT INTO user_financial_settings ("userId", currency, "inflationRateAssumption", "incomeDropScenario")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ("userId") DO UPDATE SET
         currency = EXCLUDED.currency,
         "inflationRateAssumption" = EXCLUDED."inflationRateAssumption",
         "incomeDropScenario" = EXCLUDED."incomeDropScenario",
         "updatedAt" = CURRENT_TIMESTAMP`,
      [userId, data.currency, data.inflationRateAssumption, data.incomeDropScenario]
    );
    return { success: true };
  } catch (e) {
    console.error("Financial settings update error:", e);
    return { success: false, error: "Failed to update settings." };
  }
}
