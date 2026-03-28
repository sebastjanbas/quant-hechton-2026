"use client";

import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

export interface TickerQuote {
  ticker: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
}

type QuoteMap = Record<string, TickerQuote>;

let socketSingleton: Socket | null = null;

function getSocket(): Socket {
  if (!socketSingleton) {
    socketSingleton = io({
      path: "/api/socket",
      transports: ["websocket"],
      reconnectionDelayMax: 10_000,
    });
  }
  return socketSingleton;
}

export function useMarketData() {
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    // Full snapshot emitted by the server on connection (and after reconnect)
    const onSnapshot = (data: QuoteMap) => {
      setQuotes(data);
      setLastUpdate(new Date());
    };

    // Incremental update — single ticker emitted on each Alpaca trade
    const onTrade = (quote: TickerQuote) => {
      setQuotes((prev) => ({ ...prev, [quote.ticker]: quote }));
      setLastUpdate(new Date());
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("snapshot", onSnapshot);
    socket.on("trade", onTrade);

    if (socket.connected) {
      setConnected(true);
      // If already connected (e.g. hot reload), ask server to resend snapshot
      socket.emit("resync");
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("snapshot", onSnapshot);
      socket.off("trade", onTrade);
    };
  }, []);

  return { quotes, connected, lastUpdate };
}
