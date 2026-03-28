"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/lib/db";

async function getUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

type ActionResult = { success: boolean; error?: string };

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  type: string;
  isActive: boolean;
  expectedAnnualGrowthRate: number;
}

export interface PlannedExpense {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  category: string;
  isEssential: boolean;
  inflationSensitivity: string;
}

export interface SavingsAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  targetAmount: number | null;
}

export interface Debt {
  id: string;
  name: string;
  type: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  paymentFrequency: string;
}

export interface BudgetFinancialSettings {
  currency: string;
  inflationRateAssumption: number;
  incomeDropScenario: number;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: string;
  category: string;
}

// ── Income Sources ─────────────────────────────────────────────────────────────

export async function createIncomeSource(
  data: Omit<IncomeSource, "id">
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  try {
    await db.query(
      `INSERT INTO income_sources (id, "userId", name, amount, frequency, type, "isActive", "expectedAnnualGrowthRate")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [crypto.randomUUID(), userId, data.name, data.amount, data.frequency, data.type, data.isActive, data.expectedAnnualGrowthRate]
    );
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to create income source." };
  }
}

export async function updateIncomeSource(
  id: string,
  data: Omit<IncomeSource, "id">
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  try {
    await db.query(
      `UPDATE income_sources SET name=$1, amount=$2, frequency=$3, type=$4, "isActive"=$5, "expectedAnnualGrowthRate"=$6, "updatedAt"=CURRENT_TIMESTAMP
       WHERE id=$7 AND "userId"=$8`,
      [data.name, data.amount, data.frequency, data.type, data.isActive, data.expectedAnnualGrowthRate, id, userId]
    );
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to update income source." };
  }
}

export async function deleteIncomeSource(id: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  try {
    await db.query(`DELETE FROM income_sources WHERE id=$1 AND "userId"=$2`, [id, userId]);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to delete income source." };
  }
}

// ── Planned Expenses ──────────────────────────────────────────────────────────

export async function createPlannedExpense(
  data: Omit<PlannedExpense, "id">
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  try {
    await db.query(
      `INSERT INTO planned_expenses (id, "userId", name, amount, frequency, category, "isEssential", "inflationSensitivity")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [crypto.randomUUID(), userId, data.name, data.amount, data.frequency, data.category, data.isEssential, data.inflationSensitivity]
    );
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to create expense." };
  }
}

export async function updatePlannedExpense(
  id: string,
  data: Omit<PlannedExpense, "id">
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  try {
    await db.query(
      `UPDATE planned_expenses SET name=$1, amount=$2, frequency=$3, category=$4, "isEssential"=$5, "inflationSensitivity"=$6, "updatedAt"=CURRENT_TIMESTAMP
       WHERE id=$7 AND "userId"=$8`,
      [data.name, data.amount, data.frequency, data.category, data.isEssential, data.inflationSensitivity, id, userId]
    );
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to update expense." };
  }
}

export async function deletePlannedExpense(id: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  try {
    await db.query(`DELETE FROM planned_expenses WHERE id=$1 AND "userId"=$2`, [id, userId]);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to delete expense." };
  }
}

// ── Savings Accounts ──────────────────────────────────────────────────────────

export async function createSavingsAccount(
  data: Omit<SavingsAccount, "id">
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  try {
    await db.query(
      `INSERT INTO savings_accounts (id, "userId", name, type, balance, "targetAmount")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [crypto.randomUUID(), userId, data.name, data.type, data.balance, data.targetAmount ?? null]
    );
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to create savings account." };
  }
}

export async function updateSavingsAccount(
  id: string,
  data: Omit<SavingsAccount, "id">
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  try {
    await db.query(
      `UPDATE savings_accounts SET name=$1, type=$2, balance=$3, "targetAmount"=$4, "updatedAt"=CURRENT_TIMESTAMP
       WHERE id=$5 AND "userId"=$6`,
      [data.name, data.type, data.balance, data.targetAmount ?? null, id, userId]
    );
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to update savings account." };
  }
}

export async function deleteSavingsAccount(id: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  try {
    await db.query(`DELETE FROM savings_accounts WHERE id=$1 AND "userId"=$2`, [id, userId]);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to delete savings account." };
  }
}

// ── Debts ─────────────────────────────────────────────────────────────────────

export async function createDebt(data: Omit<Debt, "id">): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  try {
    await db.query(
      `INSERT INTO debts (id, "userId", name, type, balance, "interestRate", "minimumPayment", "paymentFrequency")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [crypto.randomUUID(), userId, data.name, data.type, data.balance, data.interestRate, data.minimumPayment, data.paymentFrequency]
    );
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to create debt." };
  }
}

export async function updateDebt(
  id: string,
  data: Omit<Debt, "id">
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  try {
    await db.query(
      `UPDATE debts SET name=$1, type=$2, balance=$3, "interestRate"=$4, "minimumPayment"=$5, "paymentFrequency"=$6, "updatedAt"=CURRENT_TIMESTAMP
       WHERE id=$7 AND "userId"=$8`,
      [data.name, data.type, data.balance, data.interestRate, data.minimumPayment, data.paymentFrequency, id, userId]
    );
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to update debt." };
  }
}

export async function deleteDebt(id: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  try {
    await db.query(`DELETE FROM debts WHERE id=$1 AND "userId"=$2`, [id, userId]);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to delete debt." };
  }
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

export async function createSubscription(
  data: Omit<Subscription, "id">
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  try {
    await db.query(
      `INSERT INTO subscriptions (id, "userId", name, amount, "billingCycle", category)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [crypto.randomUUID(), userId, data.name, data.amount, data.billingCycle, data.category]
    );
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to create subscription." };
  }
}

export async function updateSubscription(
  id: string,
  data: Omit<Subscription, "id">
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  try {
    await db.query(
      `UPDATE subscriptions SET name=$1, amount=$2, "billingCycle"=$3, category=$4, "updatedAt"=CURRENT_TIMESTAMP
       WHERE id=$5 AND "userId"=$6`,
      [data.name, data.amount, data.billingCycle, data.category, id, userId]
    );
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to update subscription." };
  }
}

export async function deleteSubscription(id: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Unauthorized" };
  try {
    await db.query(`DELETE FROM subscriptions WHERE id=$1 AND "userId"=$2`, [id, userId]);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to delete subscription." };
  }
}
