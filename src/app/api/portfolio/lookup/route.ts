import { NextRequest, NextResponse } from "next/server";

const ALPACA_BASE = "https://paper-api.alpaca.markets";

// GET /api/portfolio/lookup?ticker=AAPL
// Returns { ticker, name, assetClass } or 404
export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker")?.toUpperCase();
  if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 });

  // Try stock asset first
  const res = await fetch(`${ALPACA_BASE}/v2/assets/${ticker}`, {
    headers: {
      "APCA-API-KEY-ID": process.env.APCA_API_KEY_ID!,
      "APCA-API-SECRET-KEY": process.env.APCA_API_SECRET_KEY!,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
  }

  const asset = await res.json();

  const assetClass =
    asset.class === "crypto"
      ? "crypto"
      : asset.class === "us_equity" && ticker.includes("=")
      ? "commodity"
      : asset.class === "us_equity"
      ? "equity"
      : "other";

  return NextResponse.json({
    ticker: asset.symbol as string,
    name: asset.name as string,
    assetClass,
    exchange: asset.exchange as string,
    tradable: asset.tradable as boolean,
  });
}
