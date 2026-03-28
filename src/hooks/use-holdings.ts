"use client";

import { useState, useEffect, useCallback } from "react";

export type Holding = {
  id: string;
  ticker: string;
  name: string;
  shares: number;
  costBasisPerShare: number;
  assetClass: string;
  createdAt: string;
};

export type HoldingQuote = {
  ticker: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
};

export function useHoldings() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [quotes, setQuotes] = useState<Record<string, HoldingQuote>>({});
  const [loading, setLoading] = useState(true);

  const fetchHoldings = useCallback(async () => {
    const res = await fetch("/api/portfolio/holdings");
    if (!res.ok) return [] as Holding[];
    const data: Holding[] = await res.json();
    setHoldings(data);
    return data;
  }, []);

  const fetchPrices = useCallback(async (data: Holding[]) => {
    if (data.length === 0) return;
    const symbols = data.map((h) => h.ticker).join(",");
    const res = await fetch(`/api/market/snapshot?symbols=${encodeURIComponent(symbols)}`);
    if (!res.ok) return;
    setQuotes(await res.json());
  }, []);

  useEffect(() => {
    (async () => {
      const data = await fetchHoldings();
      await fetchPrices(data);
      setLoading(false);
    })();
  }, [fetchHoldings, fetchPrices]);

  // Refresh prices every 5 s
  useEffect(() => {
    const id = setInterval(() => fetchPrices(holdings), 5_000);
    return () => clearInterval(id);
  }, [holdings, fetchPrices]);

  // Derived portfolio stats
  const stats = (() => {
    if (holdings.length === 0) return null;
    let totalValue = 0, totalCost = 0, dayPnl = 0;
    let oldestDate: Date | null = null;
    let priced = 0;

    for (const h of holdings) {
      const q = quotes[h.ticker];
      const cost = Number(h.shares) * Number(h.costBasisPerShare);
      totalCost += cost;
      if (q?.price) {
        totalValue += Number(h.shares) * q.price;
        dayPnl += Number(h.shares) * q.change;
        priced++;
      }
      const d = new Date(h.createdAt);
      if (!oldestDate || d < oldestDate) oldestDate = d;
    }

    if (priced === 0) return null;

    const totalReturn = totalValue - totalCost;
    const totalReturnPct = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
    const dayPnlPct = totalValue > dayPnl ? (dayPnl / (totalValue - dayPnl)) * 100 : 0;
    const daysHeld = oldestDate
      ? Math.max(1, Math.floor((Date.now() - oldestDate.getTime()) / 86_400_000))
      : 365;
    const annualizedReturn =
      totalCost > 0 ? ((1 + totalReturn / totalCost) ** (365 / daysHeld) - 1) * 100 : 0;

    return { totalValue, totalCost, totalReturn, totalReturnPct, dayPnl, dayPnlPct, annualizedReturn };
  })();

  return { holdings, setHoldings, quotes, loading, stats, fetchPrices };
}
