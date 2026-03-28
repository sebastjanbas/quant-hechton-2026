"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PortfolioChart } from "@/components/dashboard/portfolio-chart";
import { AllocationChart } from "@/components/dashboard/allocation-chart";
import { TrendingUp, TrendingDown } from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────
// TODO: replace each section with its corresponding API call

const PORTFOLIO_SUMMARY = {
  totalValue: 2_847_293,
  dayPnl: 66_891,
  dayPnlPct: 2.41,
  totalReturn: 847_293,
  totalReturnPct: 42.36,
  annualizedReturn: 18.7,
  benchmark: "S&P 500",
  benchmarkReturn: 14.2,
};

const TOP_HOLDINGS = [
  { ticker: "AAPL", name: "Apple Inc.", shares: 320, value: 68_924, weight: 24.2, dayChange: 1.8 },
  { ticker: "MSFT", name: "Microsoft Corp.", shares: 180, value: 54_612, weight: 19.2, dayChange: 0.9 },
  { ticker: "NVDA", name: "NVIDIA Corp.", shares: 95, value: 41_990, weight: 14.8, dayChange: 4.1 },
  { ticker: "BRK.B", name: "Berkshire Hathaway B", shares: 210, value: 31_752, weight: 11.2, dayChange: 0.3 },
  { ticker: "VTI", name: "Vanguard Total Market ETF", shares: 140, value: 28_420, weight: 9.9, dayChange: 1.2 },
  { ticker: "SCHP", name: "Schwab US TIPS ETF", shares: 500, value: 24_850, weight: 8.7, dayChange: -0.1 },
];

const MARKET_OVERVIEW = [
  { name: "S&P 500", ticker: "SPX", price: 5_218.19, change: 1.42 },
  { name: "NASDAQ", ticker: "NDX", price: 18_339.44, change: 2.01 },
  { name: "Russell 2000", ticker: "RUT", price: 2_073.58, change: -0.33 },
  { name: "10Y Treasury", ticker: "TNX", price: 4.28, change: -0.06, isRate: true },
  { name: "Gold", ticker: "GC=F", price: 2_187.40, change: 0.74 },
  { name: "BTC/USD", ticker: "BTC", price: 71_240, change: 3.15 },
];

const RISK_METRICS = [
  { label: "Sharpe Ratio", value: "1.84", note: "> 1.0 is good" },
  { label: "Beta (vs S&P)", value: "0.92", note: "Slightly defensive" },
  { label: "Max Drawdown", value: "-14.2%", note: "Last 12 months" },
  { label: "Volatility (ann.)", value: "16.4%", note: "vs 18.1% benchmark" },
  { label: "Alpha", value: "+4.5%", note: "vs S&P 500" },
  { label: "Sortino Ratio", value: "2.31", note: "Downside adj. return" },
];
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : `$${n.toLocaleString()}`;

const fmtPct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;

function DeltaBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <Badge variant={positive ? "success" : "destructive"} className="gap-1">
      {positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {fmtPct(value)}
    </Badge>
  );
}

export default function DashboardPage() {
  const {
    totalValue, dayPnl, dayPnlPct,
    totalReturn, totalReturnPct,
    annualizedReturn, benchmark, benchmarkReturn,
  } = PORTFOLIO_SUMMARY;
  const alpha = annualizedReturn - benchmarkReturn;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader
        title="Dashboard"
        description="Portfolio overview & market snapshot"
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── KPI row ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{fmt(totalValue)}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <DeltaBadge value={dayPnlPct} />
                <span className="text-xs text-zinc-500">today</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400">Day P&amp;L</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-400">{fmt(dayPnl)}</p>
              <p className="text-xs text-zinc-500 mt-1">{fmtPct(dayPnlPct)} from yesterday&apos;s close</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400">Total Return</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-400">{fmt(totalReturn)}</p>
              <p className="text-xs text-zinc-500 mt-1">{fmtPct(totalReturnPct)} since inception</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400">Ann. Return vs {benchmark}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-400">{fmtPct(annualizedReturn)}</p>
              <p className="text-xs text-zinc-500 mt-1">
                <span className={alpha >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {fmtPct(alpha)} alpha
                </span>
                {" "}vs {fmtPct(benchmarkReturn)} benchmark
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">Portfolio Performance (1Y)</CardTitle>
            </CardHeader>
            <CardContent>
              <PortfolioChart />
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">Asset Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <AllocationChart />
            </CardContent>
          </Card>
        </div>

        {/* ── Holdings + Market ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* Holdings table */}
          <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">Top Holdings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-6 py-2 text-left text-xs font-medium text-zinc-500">Asset</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">Shares</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">Value</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">Weight</th>
                    <th className="px-6 py-2 text-right text-xs font-medium text-zinc-500">Day Chg</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_HOLDINGS.map((h, i) => (
                    <tr
                      key={h.ticker}
                      className={i < TOP_HOLDINGS.length - 1 ? "border-b border-zinc-800/60" : ""}
                    >
                      <td className="px-6 py-3">
                        <p className="font-mono text-xs font-semibold text-white">{h.ticker}</p>
                        <p className="text-xs text-zinc-500">{h.name}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-zinc-300">{h.shares}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-zinc-300">{fmt(h.value)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-mono text-xs text-zinc-300">{h.weight}%</span>
                          <Progress value={h.weight} className="w-14 h-1" />
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className={h.dayChange >= 0 ? "text-xs font-medium text-emerald-400" : "text-xs font-medium text-red-400"}>
                          {fmtPct(h.dayChange)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Market overview */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">Market Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {MARKET_OVERVIEW.map((m, i) => (
                <div key={m.ticker}>
                  <div className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-xs font-medium text-zinc-300">{m.name}</p>
                      <p className="font-mono text-[10px] text-zinc-500">{m.ticker}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs text-white">
                        {m.isRate ? `${m.price.toFixed(2)}%` : m.price.toLocaleString()}
                      </p>
                      <p className={`font-mono text-[10px] ${m.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {fmtPct(m.change)}
                      </p>
                    </div>
                  </div>
                  {i < MARKET_OVERVIEW.length - 1 && <Separator className="bg-zinc-800" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ── Risk metrics ── */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white">Risk Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {RISK_METRICS.map((m) => (
                <div key={m.label} className="space-y-1">
                  <p className="text-xs text-zinc-500">{m.label}</p>
                  <p className="text-xl font-bold text-white">{m.value}</p>
                  <p className="text-[10px] text-zinc-600">{m.note}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
