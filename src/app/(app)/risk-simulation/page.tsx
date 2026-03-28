import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { SimulationClient } from "./simulation-client";

const ALPACA_DATA = "https://data.alpaca.markets";

function alpacaHeaders() {
  return {
    "APCA-API-KEY-ID": process.env.APCA_API_KEY_ID!,
    "APCA-API-SECRET-KEY": process.env.APCA_API_SECRET_KEY!,
  };
}

async function fetchCurrentPrices(tickers: string[]): Promise<Record<string, number>> {
  const stockTickers = tickers.filter((t) => !t.includes("/"));
  const cryptoTickers = tickers.filter((t) => t.includes("/"));
  const prices: Record<string, number> = {};

  await Promise.all([
    stockTickers.length > 0
      ? fetch(`${ALPACA_DATA}/v2/stocks/snapshots?symbols=${stockTickers.join(",")}&feed=iex`, {
          headers: alpacaHeaders(),
          cache: "no-store",
        })
          .then((r) => r.json())
          .then((data) => {
            for (const [ticker, snap] of Object.entries(data) as [string, any][]) {
              prices[ticker] = snap.latestTrade?.p ?? snap.dailyBar?.c ?? 0;
            }
          })
          .catch(() => {})
      : Promise.resolve(),
    cryptoTickers.length > 0
      ? fetch(
          `${ALPACA_DATA}/v1beta3/crypto/us/snapshots?symbols=${cryptoTickers.map(encodeURIComponent).join(",")}`,
          { headers: alpacaHeaders(), cache: "no-store" }
        )
          .then((r) => r.json())
          .then((data) => {
            for (const [ticker, snap] of Object.entries(data?.snapshots ?? {}) as [string, any][]) {
              prices[ticker] = snap.latestTrade?.p ?? snap.dailyBar?.c ?? 0;
            }
          })
          .catch(() => {})
      : Promise.resolve(),
  ]);

  return prices;
}

export default async function RiskSimulationPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const userId = session.user.id;

  const [holdingsRes, incomeRes, expensesRes, savingsRes, settingsRes, subscriptionsRes, debtsRes] = await Promise.all([
    db.query(
      `SELECT id, ticker, name, shares, "costBasisPerShare", "assetClass", "createdAt" FROM holdings WHERE "userId" = $1`,
      [userId]
    ),
    db.query(
      `SELECT id, name, amount, frequency, type, "isActive", "expectedAnnualGrowthRate" FROM income_sources WHERE "userId" = $1 AND "isActive" = true`,
      [userId]
    ),
    db.query(
      `SELECT id, name, amount, frequency, category, "isEssential", "inflationSensitivity" FROM planned_expenses WHERE "userId" = $1`,
      [userId]
    ),
    db.query(
      `SELECT id, name, type, balance, "targetAmount" FROM savings_accounts WHERE "userId" = $1`,
      [userId]
    ),
    db.query(
      `SELECT "inflationRateAssumption", "incomeDropScenario" FROM user_financial_settings WHERE "userId" = $1`,
      [userId]
    ),
    db.query(
      `SELECT amount, "billingCycle" FROM subscriptions WHERE "userId" = $1`,
      [userId]
    ),
    db.query(
      `SELECT id, name, balance, "interestRate", "minimumPayment", "paymentFrequency" FROM debts WHERE "userId" = $1`,
      [userId]
    ),
  ]);

  const holdings = holdingsRes.rows.map((h) => ({
    ...h,
    shares: Number(h.shares),
    costBasisPerShare: Number(h.costBasisPerShare),
  }));

  const savings = savingsRes.rows.map((r) => ({
    ...r,
    balance: Number(r.balance),
    targetAmount: r.targetAmount != null ? Number(r.targetAmount) : null,
  }));

  // Fetch live prices to compute current market value
  const tickers = holdings.map((h) => h.ticker);
  const prices = tickers.length > 0 ? await fetchCurrentPrices(tickers) : {};

  const portfolioMarketValue = holdings.reduce((sum, h) => {
    const price = prices[h.ticker] ?? h.costBasisPerShare;
    return sum + h.shares * price;
  }, 0);

  const totalSavings = savings.reduce((sum, a) => sum + a.balance, 0);

  const settings = settingsRes.rows[0] ?? { inflationRateAssumption: 3, incomeDropScenario: 100 };

  function toMonthly(amount: number, billingCycle: string): number {
    if (billingCycle === "annual") return amount / 12;
    if (billingCycle === "weekly") return (amount * 52) / 12;
    if (billingCycle === "bi-weekly") return (amount * 26) / 12;
    return amount; // monthly default
  }

  const subscriptionMonthlyTotal = subscriptionsRes.rows.reduce(
    (sum: number, s: any) => sum + toMonthly(Number(s.amount), s.billingCycle),
    0
  );

  return (
    <SimulationClient
      holdings={holdings}
      incomeSources={incomeRes.rows.map((r) => ({
        ...r,
        amount: Number(r.amount),
        expectedAnnualGrowthRate: Number(r.expectedAnnualGrowthRate),
      }))}
      expenses={expensesRes.rows.map((r) => ({ ...r, amount: Number(r.amount) }))}
      savings={savings}
      inflationRate={Number(settings.inflationRateAssumption)}
      portfolioMarketValue={Math.round(portfolioMarketValue)}
      totalSavings={Math.round(totalSavings)}
      subscriptionMonthlyTotal={Math.round(subscriptionMonthlyTotal)}
      debts={debtsRes.rows.map((d) => ({
        id: d.id,
        name: d.name,
        balance: Number(d.balance),
        annualRate: Number(d.interestRate) / 100,
        monthlyPayment: d.paymentFrequency === "monthly"
          ? Number(d.minimumPayment)
          : d.paymentFrequency === "bi-weekly"
          ? (Number(d.minimumPayment) * 26) / 12
          : d.paymentFrequency === "weekly"
          ? (Number(d.minimumPayment) * 52) / 12
          : Number(d.minimumPayment) / 12,
      }))}
    />
  );
}
