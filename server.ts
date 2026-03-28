import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import WebSocket from "ws";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const STOCK_SYMBOLS = ["SPY", "QQQ", "IWM", "GLD", "AAPL", "MSFT", "NVDA", "BRK.B", "VTI", "SCHP", "TSLA"];
const CRYPTO_SYMBOLS = ["BTC/USD"];
const ALL_SYMBOLS = [...STOCK_SYMBOLS, ...CRYPTO_SYMBOLS];

const ALPACA_BASE = "https://data.alpaca.markets";
const ALPACA_STOCK_WS = "wss://stream.data.alpaca.markets/v2/iex";
const ALPACA_CRYPTO_WS = "wss://stream.data.alpaca.markets/v1beta3/crypto/us";

type Quote = {
  ticker: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
};

// Server-side price cache — shared across all Socket.IO clients
const priceCache: Record<string, Quote> = {};

function alpacaHeaders() {
  return {
    "APCA-API-KEY-ID": process.env.APCA_API_KEY_ID!,
    "APCA-API-SECRET-KEY": process.env.APCA_API_SECRET_KEY!,
  };
}

function normalize(ticker: string, snap: Record<string, any>): Quote {
  const price =
    snap.latestTrade?.p ?? snap.latestQuote?.ap ?? snap.dailyBar?.c ?? 0;
  const prevClose = snap.prevDailyBar?.c ?? 0;
  const change = prevClose > 0 ? price - prevClose : 0;
  const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;
  return { ticker, price, prevClose, change, changePct };
}

async function loadSnapshot() {
  try {
    const [stockRes, cryptoRes] = await Promise.all([
      fetch(
        `${ALPACA_BASE}/v2/stocks/snapshots?symbols=${STOCK_SYMBOLS.join(",")}&feed=iex`,
        { headers: alpacaHeaders() }
      ),
      fetch(
        `${ALPACA_BASE}/v1beta3/crypto/us/snapshots?symbols=${CRYPTO_SYMBOLS.map(encodeURIComponent).join(",")}`,
        { headers: alpacaHeaders() }
      ),
    ]);

    if (stockRes.ok) {
      const stocks: Record<string, any> = await stockRes.json();
      for (const ticker of STOCK_SYMBOLS) {
        if (stocks[ticker]) priceCache[ticker] = normalize(ticker, stocks[ticker]);
      }
    }
    if (cryptoRes.ok) {
      const { snapshots }: { snapshots?: Record<string, any> } = await cryptoRes.json();
      for (const sym of CRYPTO_SYMBOLS) {
        if (snapshots?.[sym]) priceCache[sym] = normalize(sym, snapshots[sym]);
      }
    }
    console.log(`[snapshot] cached ${Object.keys(priceCache).length}/${ALL_SYMBOLS.length} symbols`);
  } catch (err) {
    console.error("[snapshot] fetch failed:", err);
  }
}

function updateCache(ticker: string, price: number) {
  const existing = priceCache[ticker];
  if (!existing) return;
  const change = existing.prevClose > 0 ? price - existing.prevClose : 0;
  const changePct = existing.prevClose > 0 ? (change / existing.prevClose) * 100 : 0;
  priceCache[ticker] = { ...existing, price, change, changePct };
}

function connectAlpacaStocks(io: SocketIOServer) {
  const ws = new WebSocket(ALPACA_STOCK_WS);

  ws.on("open", () => {
    ws.send(JSON.stringify({
      action: "auth",
      key: process.env.APCA_API_KEY_ID,
      secret: process.env.APCA_API_SECRET_KEY,
    }));
  });

  ws.on("message", (raw) => {
    const messages: Array<Record<string, any>> = JSON.parse(raw.toString());
    for (const msg of messages) {
      if (msg.T === "success" && msg.msg === "authenticated") {
        ws.send(JSON.stringify({ action: "subscribe", trades: STOCK_SYMBOLS }));
        console.log("[Alpaca stocks] authenticated & subscribed");
      } else if (msg.T === "t") {
        updateCache(msg.S as string, msg.p as number);
        io.emit("trade", priceCache[msg.S as string]);
      }
    }
  });

  ws.on("close", () => {
    console.log("[Alpaca stocks] disconnected — reconnecting in 5s");
    setTimeout(() => connectAlpacaStocks(io), 5_000);
  });

  ws.on("error", (err) => {
    console.error("[Alpaca stocks] error:", err.message);
    ws.close();
  });
}

function connectAlpacaCrypto(io: SocketIOServer) {
  const ws = new WebSocket(ALPACA_CRYPTO_WS);

  ws.on("open", () => {
    ws.send(JSON.stringify({
      action: "auth",
      key: process.env.APCA_API_KEY_ID,
      secret: process.env.APCA_API_SECRET_KEY,
    }));
  });

  ws.on("message", (raw) => {
    const messages: Array<Record<string, any>> = JSON.parse(raw.toString());
    for (const msg of messages) {
      if (msg.T === "success" && msg.msg === "authenticated") {
        ws.send(JSON.stringify({ action: "subscribe", trades: CRYPTO_SYMBOLS }));
        console.log("[Alpaca crypto] authenticated & subscribed");
      } else if (msg.T === "t") {
        updateCache(msg.S as string, msg.p as number);
        io.emit("trade", priceCache[msg.S as string]);
      }
    }
  });

  ws.on("close", () => {
    console.log("[Alpaca crypto] disconnected — reconnecting in 5s");
    setTimeout(() => connectAlpacaCrypto(io), 5_000);
  });

  ws.on("error", (err) => {
    console.error("[Alpaca crypto] error:", err.message);
    ws.close();
  });
}

app.prepare().then(async () => {
  // Load initial prices before accepting connections
  await loadSnapshot();

  const httpServer = createServer((req, res) => {
    if (req.url?.startsWith("/api/socket")) return;
    const parsedUrl = parse(req.url!, true);
    void handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
    path: "/api/socket",
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] client connected: ${socket.id}`);
    // Send the full cached snapshot immediately so the client doesn't need REST
    socket.emit("snapshot", priceCache);
    // Allow clients to request a resync (e.g. after hot reload)
    socket.on("resync", () => socket.emit("snapshot", priceCache));
    socket.on("disconnect", () =>
      console.log(`[Socket.IO] client disconnected: ${socket.id}`)
    );
  });

  connectAlpacaStocks(io);
  connectAlpacaCrypto(io);

  const PORT = parseInt(process.env.PORT ?? "3000", 10);
  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
