"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Loader2, Search, Info } from "lucide-react";
import { useHoldings, type Holding } from "@/hooks/use-holdings";

// ─── Types ────────────────────────────────────────────────────────────────────
const ASSET_CLASSES = [
  { value: "equity",       label: "Equity" },
  { value: "etf",          label: "ETF" },
  { value: "fixed_income", label: "Fixed Income" },
  { value: "commodity",    label: "Commodity" },
  { value: "crypto",       label: "Crypto" },
  { value: "other",        label: "Other" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtPct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;

// ─── Info tooltip ─────────────────────────────────────────────────────────────
function InfoTip({ text }: { text: string }) {
  return (
    <span className="group/tip relative inline-flex items-center">
      <Info className="size-3 text-zinc-600 hover:text-zinc-400 cursor-help ml-1 transition-colors" />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50
        w-56 rounded-xl bg-zinc-900 border border-zinc-700/60 px-3 py-2.5
        text-xs text-zinc-300 leading-relaxed shadow-xl
        opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px
          border-[5px] border-transparent border-t-zinc-700/60" />
      </span>
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const { holdings, setHoldings, quotes, loading, stats, fetchPrices } = useHoldings();
  const [open, setOpen] = useState(false);

  async function deleteHolding(id: string) {
    await fetch(`/api/portfolio/holdings/${id}`, { method: "DELETE" });
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  }

  const totalPnlPct = stats
    ? (stats.totalReturn / stats.totalCost) * 100
    : 0;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <PageHeader title="Portfolio" description="Manage your positions" />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard label="Total Value" value={stats ? fmt(stats.totalValue) : "—"} />
          <SummaryCard label="Total Cost"  value={stats ? fmt(stats.totalCost)  : "—"} />
          <SummaryCard
            label="Total P&L"
            value={stats ? fmt(stats.totalReturn) : "—"}
            sub={stats ? fmtPct(totalPnlPct) : undefined}
            positive={stats ? stats.totalReturn >= 0 : undefined}
          />
          <SummaryCard label="Positions" value={String(holdings.length)} />
        </div>

        {/* ── Holdings table ── */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-white">Holdings</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="size-3.5" /> Add Position
                </Button>
              </DialogTrigger>

              <DialogContent className="bg-zinc-950 border-zinc-800/80 shadow-2xl p-0 gap-0 overflow-hidden sm:max-w-lg">
                <AddHoldingForm
                  onSaved={async (h) => {
                    setHoldings((prev) => {
                      const idx = prev.findIndex((x) => x.ticker === h.ticker);
                      if (idx >= 0) { const next = [...prev]; next[idx] = h; return next; }
                      return [...prev, h];
                    });
                    await fetchPrices([...holdings, h]);
                    setOpen(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-zinc-500">
                <Loader2 className="size-4 animate-spin mr-2" /> Loading…
              </div>
            ) : holdings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-zinc-500 gap-2">
                <p className="text-sm">No positions yet.</p>
                <p className="text-xs">Click "Add Position" to get started.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-6 py-2 text-left   text-xs font-medium text-zinc-500">Asset</th>
                    <th className="px-4 py-2 text-right  text-xs font-medium text-zinc-500">Shares</th>
                    <th className="px-4 py-2 text-right  text-xs font-medium text-zinc-500">Avg Cost</th>
                    <th className="px-4 py-2 text-right  text-xs font-medium text-zinc-500">Price</th>
                    <th className="px-4 py-2 text-right  text-xs font-medium text-zinc-500">Value</th>
                    <th className="px-4 py-2 text-right  text-xs font-medium text-zinc-500">P&L</th>
                    <th className="px-4 py-2 text-right  text-xs font-medium text-zinc-500">Day</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h, i) => {
                    const q = quotes[h.ticker];
                    const price = q?.price ?? 0;
                    const marketValue = price * Number(h.shares);
                    const costBasis = Number(h.costBasisPerShare) * Number(h.shares);
                    const pnl = price > 0 ? marketValue - costBasis : 0;
                    const pnlPct = costBasis > 0 && price > 0 ? (pnl / costBasis) * 100 : 0;
                    return (
                      <tr key={h.id} className={i < holdings.length - 1 ? "border-b border-zinc-800/60" : ""}>
                        <td className="px-6 py-3">
                          <p className="font-mono text-xs font-semibold text-white">{h.ticker}</p>
                          <p className="text-xs text-zinc-500 truncate max-w-[160px]">{h.name}</p>
                          <Badge variant="outline" className="mt-0.5 text-[9px] px-1 py-0 h-4 text-zinc-500 border-zinc-700">
                            {h.assetClass}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-zinc-300">{Number(h.shares)}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-zinc-400">{fmt(Number(h.costBasisPerShare))}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-white">
                          {price > 0 ? fmt(price) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-zinc-300">
                          {marketValue > 0 ? fmt(marketValue) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {price > 0 ? (
                            <div>
                              <p className={pnl >= 0 ? "text-emerald-400" : "text-red-400"}>{fmt(pnl)}</p>
                              <p className={`text-[10px] ${pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>{fmtPct(pnlPct)}</p>
                            </div>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {q ? (
                            <span className={q.changePct >= 0 ? "text-emerald-400" : "text-red-400"}>
                              {fmtPct(q.changePct)}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-2 py-3 text-center">
                          <Button variant="ghost" size="icon-sm"
                            className="text-zinc-600 hover:text-red-400"
                            onClick={() => deleteHolding(h.id)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// ─── Summary card ─────────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, positive }: {
  label: string; value: string; sub?: string; positive?: boolean;
}) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-zinc-400">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className={`text-xs mt-1 ${positive ? "text-emerald-400" : "text-red-400"}`}>{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Field label with info tip ────────────────────────────────────────────────
function FieldLabel({ htmlFor, label, tip }: { htmlFor?: string; label: string; tip: string }) {
  return (
    <div className="flex items-center gap-0.5">
      <Label htmlFor={htmlFor} className="text-zinc-300 text-xs font-medium">{label}</Label>
      <InfoTip text={tip} />
    </div>
  );
}

// ─── Add holding form (dark dialog) ──────────────────────────────────────────
function AddHoldingForm({ onSaved }: { onSaved: (h: Holding) => void }) {
  const [ticker, setTicker]         = useState("");
  const [name, setName]             = useState("");
  const [exchange, setExchange]     = useState("");
  const [shares, setShares]         = useState("");
  const [costBasis, setCostBasis]   = useState("");
  const [assetClass, setAssetClass] = useState("equity");
  const [looking, setLooking]       = useState(false);
  const [lookupErr, setLookupErr]   = useState("");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  async function lookupTicker() {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setLooking(true); setLookupErr(""); setName(""); setExchange("");
    try {
      const res = await fetch(`/api/portfolio/lookup?ticker=${t}`);
      if (!res.ok) { setLookupErr("Ticker not found on Alpaca."); return; }
      const data = await res.json();
      setName(data.name);
      setExchange(data.exchange ?? "");
      setAssetClass(data.assetClass ?? "equity");
    } catch { setLookupErr("Lookup failed."); }
    finally   { setLooking(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ticker || !name || !shares || !costBasis) { setError("All fields are required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/portfolio/holdings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: ticker.trim().toUpperCase(), name,
          shares: parseFloat(shares),
          costBasisPerShare: parseFloat(costBasis),
          assetClass,
        }),
      });
      if (!res.ok) { setError((await res.json()).error ?? "Failed to save."); return; }
      onSaved(await res.json());
    } catch { setError("Network error."); }
    finally   { setSaving(false); }
  }

  const inputCls = "bg-zinc-900 border-zinc-700/60 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-zinc-500 focus-visible:ring-zinc-500/20 h-10 text-sm";

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div className="px-6 pt-6 pb-5 border-b border-zinc-800/80">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-white">Add Position</DialogTitle>
          <p className="text-xs text-zinc-500 mt-0.5">Search for a ticker and enter your position details.</p>
        </DialogHeader>
      </div>

      <div className="px-6 py-5 space-y-5">

        {/* Ticker lookup */}
        <div className="space-y-2">
          <FieldLabel
            htmlFor="ticker"
            label="Ticker Symbol"
            tip="The stock or asset symbol listed on the exchange, e.g. AAPL for Apple or BTC/USD for Bitcoin."
          />
          <div className="flex gap-2">
            <Input
              id="ticker"
              placeholder="e.g. AAPL"
              value={ticker}
              onChange={(e) => { setTicker(e.target.value.toUpperCase()); setName(""); setLookupErr(""); }}
              className={`${inputCls} font-mono tracking-widest`}
            />
            <Button
              type="button" variant="outline" size="sm"
              onClick={lookupTicker} disabled={!ticker || looking}
              className="h-10 px-3 bg-zinc-900 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800 hover:text-white shrink-0"
            >
              {looking ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
            </Button>
          </div>
          {lookupErr && <p className="text-xs text-red-400">{lookupErr}</p>}
        </div>

        {/* Company name */}
        <div className="space-y-2">
          <FieldLabel
            htmlFor="name"
            label="Company Name"
            tip="Auto-filled when you look up a ticker. You can edit it if needed."
          />
          <Input
            id="name"
            placeholder="Look up a ticker first"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
          {exchange && (
            <p className="text-[11px] text-zinc-600 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Listed on {exchange}
            </p>
          )}
        </div>

        <Separator className="bg-zinc-800/80" />

        {/* Shares + Cost basis side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <FieldLabel
              htmlFor="shares"
              label="Number of Shares"
              tip="Total shares you own. Fractional shares are supported — e.g. 0.5 for half a share."
            />
            <Input
              id="shares" type="number" step="any" min="0"
              placeholder="e.g. 100"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel
              htmlFor="cost"
              label="Avg Cost / Share ($)"
              tip="Your average purchase price per share. If you bought at multiple prices, use the weighted average cost."
            />
            <Input
              id="cost" type="number" step="any" min="0"
              placeholder="e.g. 150.00"
              value={costBasis}
              onChange={(e) => setCostBasis(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Asset class */}
        <div className="space-y-2">
          <FieldLabel
            label="Asset Class"
            tip="The category of this investment. Used for the allocation chart on the dashboard."
          />
          <div className="flex flex-wrap gap-1.5">
            {ASSET_CLASSES.map((ac) => (
              <button
                key={ac.value} type="button"
                onClick={() => setAssetClass(ac.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  assetClass === ac.value
                    ? "bg-white text-zinc-950 border-white"
                    : "bg-zinc-900 text-zinc-400 border-zinc-700/60 hover:border-zinc-500 hover:text-zinc-300"
                }`}
              >
                {ac.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <DialogFooter className="sm:justify-end">
          <Button
            type="submit" disabled={saving || !name}
            className="w-full sm:w-auto bg-white text-zinc-950 hover:bg-zinc-100 font-medium"
          >
            {saving && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
            Save Position
          </Button>
        </DialogFooter>
      </div>
    </form>
  );
}