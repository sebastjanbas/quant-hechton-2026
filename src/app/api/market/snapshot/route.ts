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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const customSymbols = url.searchParams.get("symbols");

  // If a caller passes ?symbols=AAPL,MSFT we use those; otherwise fall back to defaults
  const stockSymbols = customSymbols
    ? customSymbols.split(",").map((s) => s.trim().toUpperCase()).filter((s) => !s.includes("/"))
    : STOCK_SYMBOLS;
  const cryptoSymbols = customSymbols
    ? customSymbols.split(",").map((s) => s.trim().toUpperCase()).filter((s) => s.includes("/"))
    : CRYPTO_SYMBOLS;

  try {
    const fetches: Promise<Response>[] = [];
    if (stockSymbols.length > 0)
      fetches.push(fetch(`${BASE}/v2/stocks/snapshots?symbols=${stockSymbols.join(",")}&feed=iex`, { headers: headers(), cache: "no-store" }));
    if (cryptoSymbols.length > 0)
      fetches.push(fetch(`${BASE}/v1beta3/crypto/us/snapshots?symbols=${cryptoSymbols.map(encodeURIComponent).join(",")}`, { headers: headers(), cache: "no-store" }));

    const [stockRes, cryptoRes] = await Promise.all(fetches);

    const result: Record<string, ReturnType<typeof normalize>> = {};

    if (stockRes && stockSymbols.length > 0) {
      if (!stockRes.ok) {
        console.error("Alpaca stocks error:", stockRes.status, await stockRes.text());
      } else {
        const stockData: Record<string, AlpacaSnapshot> = await stockRes.json();
        for (const ticker of stockSymbols) {
          if (stockData[ticker]) result[ticker] = normalize(ticker, stockData[ticker]);
        }
      }
    }

    if (cryptoRes && cryptoSymbols.length > 0) {
      if (!cryptoRes.ok) {
        console.error("Alpaca crypto error:", cryptoRes.status, await cryptoRes.text());
      } else {
        const cryptoData: { snapshots?: Record<string, AlpacaSnapshot> } = await cryptoRes.json();
        for (const sym of cryptoSymbols) {
          const snap = cryptoData.snapshots?.[sym];
          if (snap) result[sym] = normalize(sym, snap);
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Market snapshot error:", error);
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}