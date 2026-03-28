import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import db from "@/lib/db";

const ALPACA_DATA = "https://data.alpaca.markets";

function alpacaHeaders() {
  return {
    "APCA-API-KEY-ID": process.env.APCA_API_KEY_ID!,
    "APCA-API-SECRET-KEY": process.env.APCA_API_SECRET_KEY!,
  };
}

type Bar = { date: string; close: number };

async function fetchStockBars(symbols: string[], start: string, end: string): Promise<Record<string, Bar[]>> {
  const url = `${ALPACA_DATA}/v2/stocks/bars?symbols=${symbols.join(",")}&timeframe=1Day&start=${start}&end=${end}&limit=10000&feed=iex`;
  const res = await fetch(url, { headers: alpacaHeaders(), cache: "no-store" });
  if (!res.ok) return {};
  const { bars = {} } = await res.json();
  const result: Record<string, Bar[]> = {};
  for (const [ticker, rawBars] of Object.entries(bars) as [string, any[]][]) {
    result[ticker] = rawBars.map((b) => ({ date: b.t.split("T")[0], close: b.c }));
  }
  return result;
}

async function fetchCryptoBars(symbols: string[], start: string, end: string): Promise<Record<string, Bar[]>> {
  const encoded = symbols.map(encodeURIComponent).join(",");
  const url = `${ALPACA_DATA}/v1beta3/crypto/us/bars?symbols=${encoded}&timeframe=1Day&start=${start}&end=${end}&limit=10000`;
  const res = await fetch(url, { headers: alpacaHeaders(), cache: "no-store" });
  if (!res.ok) return {};
  const { bars = {} } = await res.json();
  const result: Record<string, Bar[]> = {};
  for (const [ticker, rawBars] of Object.entries(bars) as [string, any[]][]) {
    result[ticker] = rawBars.map((b) => ({ date: b.t.split("T")[0], close: b.c }));
  }
  return result;
}

// GET /api/portfolio/performance
// Returns [{ date: "YYYY-MM-DD", value: number }] for the past 12 months
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows: holdings } = await db.query(
    `SELECT ticker, shares, "costBasisPerShare", "createdAt" FROM holdings WHERE "userId" = $1`,
    [session.user.id]
  );
  if (holdings.length === 0) return NextResponse.json([]);

  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  const startStr = start.toISOString().split("T")[0];
  const endStr = end.toISOString().split("T")[0];

  const stockTickers = holdings.filter((h) => !h.ticker.includes("/")).map((h) => h.ticker);
  const cryptoTickers = holdings.filter((h) => h.ticker.includes("/")).map((h) => h.ticker);

  const [stockBars, cryptoBars] = await Promise.all([
    stockTickers.length > 0 ? fetchStockBars(stockTickers, startStr, endStr) : {},
    cryptoTickers.length > 0 ? fetchCryptoBars(cryptoTickers, startStr, endStr) : {},
  ]);

  const allBars: Record<string, Bar[]> = { ...stockBars, ...cryptoBars };

  // Collect all unique trading dates
  const dateSet = new Set<string>();
  for (const bars of Object.values(allBars)) {
    for (const bar of bars) dateSet.add(bar.date);
  }
  const sortedDates = Array.from(dateSet).sort();
  if (sortedDates.length === 0) return NextResponse.json([]);

  // Build per-ticker date→price map, forward-filling missing dates
  const priceByDate: Record<string, Record<string, number>> = {};
  for (const [ticker, bars] of Object.entries(allBars)) {
    const dateMap: Record<string, number> = {};
    for (const bar of bars) dateMap[bar.date] = bar.close;

    priceByDate[ticker] = {};
    let last = 0;
    for (const date of sortedDates) {
      if (dateMap[date]) last = dateMap[date];
      if (last > 0) priceByDate[ticker][date] = last;
    }
  }

  // Compute portfolio value for each date
  const series = sortedDates
    .map((date) => {
      let value = 0;
      for (const h of holdings) {
        const price = priceByDate[h.ticker]?.[date];
        if (price) value += Number(h.shares) * price;
      }
      return { date, value };
    })
    .filter((d) => d.value > 0);

  return NextResponse.json(series);
}
