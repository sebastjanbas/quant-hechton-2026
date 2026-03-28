"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PortfolioChart, type PerformancePoint } from "@/components/dashboard/portfolio-chart";
import { AllocationChart, buildAllocation } from "@/components/dashboard/allocation-chart";
import { TrendingUp, TrendingDown, WifiOff } from "lucide-react";
import { useMarketData } from "@/hooks/use-market-data";
import { useHoldings } from "@/hooks/use-holdings";
import { useState, useEffect } from "react";

// Market overview rows — prices come from Alpaca socket
const MARKET_CONFIG = [
  { name: "S&P 500",   ticker: "SPY",     label: "SPY" },
  { name: "Apple Inc.", ticker: "AAPL",   label: "AAPL" },
  { name: "Tesla Inc.", ticker: "TSLA",   label: "TSLA" },
  { name: "Gold",       ticker: "GLD",    label: "GLD" },
  { name: "BTC/USD",    ticker: "BTC/USD", label: "BTC/USD" },
];

const RISK_METRICS = [
  { label: "Sharpe Ratio",      value: "1.84", note: "> 1.0 is good" },
  { label: "Beta (vs S&P)",     value: "0.92", note: "Slightly defensive" },
  { label: "Max Drawdown",      value: "-14.2%", note: "Last 12 months" },
  { label: "Volatility (ann.)", value: "16.4%", note: "vs 18.1% benchmark" },
  { label: "Alpha",             value: "+4.5%", note: "vs S&P 500" },
  { label: "Sortino Ratio",     value: "2.31",  note: "Downside adj. return" },
];

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const fmtPct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;

function DeltaBadge({ value }: { value: number }) {
  const pos = value >= 0;
  return (
    <Badge variant={pos ? "success" : "destructive"} className="gap-1">
      {pos ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {fmtPct(value)}
    </Badge>
  );
}

export default function DashboardPage() {
  // Live market prices (WebSocket)
  const { quotes, connected, lastUpdate } = useMarketData();
  // User's holdings + computed portfolio stats
  const { holdings, quotes: holdingQuotes, stats, loading: holdingsLoading } = useHoldings();

  // Performance history
  const [perfData, setPerfData] = useState<PerformancePoint[]>([]);
  const [perfLoading, setPerfLoading] = useState(true);
  useEffect(() => {
    fetch("/api/portfolio/performance")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) ? setPerfData(d) : [])
      .catch(() => {})
      .finally(() => setPerfLoading(false));
  }, []);

  // Allocation slices derived from current holdings + live prices
  const allocationData = buildAllocation(holdings, holdingQuotes);

  // SPY day return as benchmark proxy
  const spyDayPct = quotes["SPY"]?.changePct ?? 0;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader title="Dashboard" description="Portfolio overview & market snapshot" />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── KPI row ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Total value */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">
                {holdingsLoading ? "—" : stats ? fmt(stats.totalValue) : "No holdings"}
              </p>
              {stats && (
                <div className="flex items-center gap-1.5 mt-1">
                  <DeltaBadge value={stats.dayPnlPct} />
                  <span className="text-xs text-zinc-500">today</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Day P&L */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400">Day P&amp;L</CardTitle>
            </CardHeader>
            <CardContent>
              {stats ? (
                <>
                  <p className={`text-2xl font-bold ${stats.dayPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {fmt(stats.dayPnl)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {fmtPct(stats.dayPnlPct)} from yesterday&apos;s close
                  </p>
                </>
              ) : (
                <p className="text-2xl font-bold text-white">—</p>
              )}
            </CardContent>
          </Card>

          {/* Total return */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400">Total Return</CardTitle>
            </CardHeader>
            <CardContent>
              {stats ? (
                <>
                  <p className={`text-2xl font-bold ${stats.totalReturn >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {fmt(stats.totalReturn)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">{fmtPct(stats.totalReturnPct)} since inception</p>
                </>
              ) : (
                <p className="text-2xl font-bold text-white">—</p>
              )}
            </CardContent>
          </Card>

          {/* Annualized return vs SPY */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400">Ann. Return vs SPY</CardTitle>
            </CardHeader>
            <CardContent>
              {stats ? (
                <>
                  <p className="text-2xl font-bold text-blue-400">{fmtPct(stats.annualizedReturn)}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    <span className={stats.annualizedReturn >= spyDayPct ? "text-emerald-400" : "text-red-400"}>
                      {fmtPct(stats.annualizedReturn - spyDayPct)} alpha
                    </span>
                    {" "}vs SPY {fmtPct(spyDayPct)} today
                  </p>
                </>
              ) : (
                <p className="text-2xl font-bold text-white">—</p>
              )}
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
              <PortfolioChart data={perfData} loading={perfLoading} />
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">Asset Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <AllocationChart data={allocationData} loading={holdingsLoading} />
            </CardContent>
          </Card>
        </div>

        {/* ── Holdings + Market ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* Holdings from DB */}
          <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">Top Holdings</CardTitle>
              <LiveIndicator connected={connected} lastUpdate={lastUpdate} />
            </CardHeader>
            <CardContent className="p-0">
              {holdingsLoading ? (
                <div className="py-8 text-center text-xs text-zinc-600">Loading…</div>
              ) : holdings.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-600">
                  Add positions on the Portfolio page to see them here.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="px-6 py-2 text-left  text-xs font-medium text-zinc-500">Asset</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">Shares</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">Price</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">Value</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">Weight</th>
                      <th className="px-6 py-2 text-right text-xs font-medium text-zinc-500">Day Chg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h, i) => {
                      const q = holdingQuotes[h.ticker];
                      const price = q?.price ?? 0;
                      const value = price * Number(h.shares);
                      const weight = stats?.totalValue && value > 0
                        ? (value / stats.totalValue) * 100 : 0;
                      return (
                        <tr key={h.id} className={i < holdings.length - 1 ? "border-b border-zinc-800/60" : ""}>
                          <td className="px-6 py-3">
                            <p className="font-mono text-xs font-semibold text-white">{h.ticker}</p>
                            <p className="text-xs text-zinc-500">{h.name}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-zinc-300">{Number(h.shares)}</td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-zinc-300">
                            {price > 0 ? `$${price.toFixed(2)}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-zinc-300">
                            {value > 0 ? fmt(value) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-mono text-xs text-zinc-300">{weight.toFixed(1)}%</span>
                              <Progress value={weight} className="w-14 h-1" />
                            </div>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className={`text-xs font-medium ${(q?.changePct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {q ? fmtPct(q.changePct) : "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Market overview */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">Market Overview</CardTitle>
              <LiveIndicator connected={connected} lastUpdate={lastUpdate} />
            </CardHeader>
            <CardContent className="space-y-0">
              {MARKET_CONFIG.map((m, i) => {
                const q = quotes[m.ticker];
                const price = q?.price ?? 0;
                const changePct = q?.changePct ?? 0;
                return (
                  <div key={m.ticker}>
                    <div className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-xs font-medium text-zinc-300">{m.name}</p>
                        <p className="font-mono text-[10px] text-zinc-500">{m.label}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xs text-white">
                          {price > 0 ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                        </p>
                        <p className={`font-mono text-[10px] ${changePct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {q ? fmtPct(changePct) : "—"}
                        </p>
                      </div>
                    </div>
                    {i < MARKET_CONFIG.length - 1 && <Separator className="bg-zinc-800" />}
                  </div>
                );
              })}
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

function LiveIndicator({ connected, lastUpdate }: { connected: boolean; lastUpdate: Date | null }) {
  return (
    <div className="flex items-center gap-1.5">
      {connected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] text-zinc-500">
            {lastUpdate ? lastUpdate.toLocaleTimeString() : "live"}
          </span>
        </>
      ) : (
        <>
          <WifiOff className="size-3 text-zinc-600" />
          <span className="text-[10px] text-zinc-600">connecting…</span>
        </>
      )}
    </div>
  );
}
