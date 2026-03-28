import { NextResponse } from "next/server";

const BASE = "https://data.alpaca.markets";
const STOCK_SYMBOLS = ["SPY", "QQQ", "IWM", "GLD", "AAPL", "MSFT", "NVDA", "BRK.B", "VTI", "SCHP", "TSLA"];
const CRYPTO_SYMBOLS = ["BTC/USD"];

function headers() {
  return {
    "APCA-API-KEY-ID": process.env.APCA_API_KEY_ID!,
    "APCA-API-SECRET-KEY": process.env.APCA_API_SECRET_KEY!,
  };
}

type AlpacaSnapshot = {
  latestTrade?: { p: number };
  latestQuote?: { ap: number; bp: number };
  dailyBar?: { o: number; h: number; l: number; c: number; v: number };
  prevDailyBar?: { c: number };
};

function normalize(ticker: string, snap: AlpacaSnapshot) {
  const price =
    snap.latestTrade?.p ??
    snap.latestQuote?.ap ??
    snap.dailyBar?.c ??
    0;
  const prevClose = snap.prevDailyBar?.c ?? 0;
  const change = prevClose > 0 ? price - prevClose : 0;
  const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;
  return { ticker, price, prevClose, change, changePct };
}

export async function GET() {
  try {
    const [stockRes, cryptoRes] = await Promise.all([
      fetch(
        `${BASE}/v2/stocks/snapshots?symbols=${STOCK_SYMBOLS.join(",")}&feed=iex`,
        { headers: headers(), cache: "no-store" }
      ),
      fetch(
        `${BASE}/v1beta3/crypto/us/snapshots?symbols=${CRYPTO_SYMBOLS.map(encodeURIComponent).join(",")}`,
        { headers: headers(), cache: "no-store" }
      ),
    ]);

    if (!stockRes.ok) {
      const err = await stockRes.text();
      console.error("Alpaca stocks error:", stockRes.status, err);
      return NextResponse.json({ error: "Alpaca stocks API error" }, { status: 502 });
    }
    if (!cryptoRes.ok) {
      const err = await cryptoRes.text();
      console.error("Alpaca crypto error:", cryptoRes.status, err);
      return NextResponse.json({ error: "Alpaca crypto API error" }, { status: 502 });
    }

    const stockData: Record<string, AlpacaSnapshot> = await stockRes.json();
    const cryptoData: { snapshots?: Record<string, AlpacaSnapshot> } = await cryptoRes.json();

    const result: Record<string, ReturnType<typeof normalize>> = {};

    for (const ticker of STOCK_SYMBOLS) {
      if (stockData[ticker]) {
        result[ticker] = normalize(ticker, stockData[ticker]);
      }
    }
    for (const sym of CRYPTO_SYMBOLS) {
      const snap = cryptoData.snapshots?.[sym];
      if (snap) {
        result[sym] = normalize(sym, snap);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Market snapshot error:", error);
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}