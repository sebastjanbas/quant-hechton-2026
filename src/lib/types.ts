
export interface Holding {
  id: string;
  ticker: string;
  name: string;
  shares: number;
  costBasisPerShare: number;
  assetClass: string;
  createdAt: string;
}

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  expectedAnnualGrowthRate: number;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  inflationSensitivity: string;
}

export interface SavingsAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  targetAmount: number | null;
}


export interface SimDebt {
  id: string;
  name: string;
  balance: number;
  annualRate: number;    // as decimal, e.g. 0.03 = 3%
  monthlyPayment: number;
}

export interface SimConfig {
  initialStocksValue: number;   // current market value of holdings — subject to GBM
  initialSavingsValue: number;  // savings account balances — grows at fixed rate
  annualSavingsRate: number;    // as decimal, e.g. 0.04 = 4% HYSA
  annualDrift: number;          // as decimal, e.g. 0.10 = 10%
  annualVolatility: number;     // as decimal
  annualInflationRate: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  incomeGrowthRate: number;     // as decimal
  surplusInvestPct: number;     // 0–1: fraction of monthly surplus invested in stocks (rest goes to savings)
  debts: SimDebt[];             // debt obligations deducted from surplus each month until paid off
  timeHorizonYears: number;
  numSimulations: number;
  includeCashFlows: boolean;
  goalTarget: number;
}

export interface BandPoint {
  year: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface SimResult {
  bandData: BandPoint[];
  finalValues: number[];
  medianFinal: number;
  p10Final: number;
  p90Final: number;
  probGoal: number;
  probRuin: number;
}
