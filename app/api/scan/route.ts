import { NextResponse } from "next/server";

type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1D";

type MeterSignal = "Strong sell" | "Sell" | "Neutral" | "Buy" | "Strong buy";

type Meter = {
  signal: MeterSignal;
  sell: number;
  neutral: number;
  buy: number;
};

type ScanResponse = {
  symbol: string;
  name: string;
  assetType: string;
  relatedAsset: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: string;
  rsi: number;
  macd: string;
  atr: number;
  sentiment: string;
  catalyst: string;
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
  invalidation: number;
  bias: string;
  confidence: number;
  summary: string;
  scanTime: string;
  scanDate: string;
  createdAt: string;
  timeframe: Timeframe;
  meters: {
    oscillators: Meter;
    summary: Meter;
    movingAverages: Meter;
  };
};

const mockMarketProfiles: Record<
  string,
  Omit<ScanResponse, "symbol" | "scanTime" | "scanDate" | "createdAt" | "timeframe">
> = {
  MARA: {
    name: "Marathon Digital Holdings",
    assetType: "US Equity",
    relatedAsset: "Bitcoin",
    price: 11.4,
    open: 11.09,
    high: 11.44,
    low: 10.68,
    volume: "7.23M",
    rsi: 58,
    macd: "Positive but flattening",
    atr: 0.48,
    sentiment: "Mixed-positive",
    catalyst: "Bitcoin correlation and infrastructure expansion headlines",
    support1: 11.1,
    support2: 10.68,
    resistance1: 11.5,
    resistance2: 12.0,
    invalidation: 10.68,
    bias: "Cautiously bullish",
    confidence: 64,
    meters: {
      oscillators: { signal: "Neutral", sell: 1, neutral: 9, buy: 1 },
      summary: { signal: "Buy", sell: 3, neutral: 10, buy: 13 },
      movingAverages: { signal: "Strong buy", sell: 2, neutral: 1, buy: 12 },
    },
    summary:
      "MARA is bullish intraday while holding above 11.30. A clean break and hold above 11.50 would support continuation toward 11.80–12.00. If price loses 11.10, the bullish setup weakens. Below 10.68, the setup is invalidated.",
  },

  DAX: {
    name: "Germany 40 Index",
    assetType: "Index",
    relatedAsset: "EUR/USD",
    price: 23480,
    open: 23420,
    high: 23525,
    low: 23370,
    volume: "Index volume varies",
    rsi: 61,
    macd: "Positive momentum",
    atr: 142,
    sentiment: "Constructive but sensitive to US futures",
    catalyst: "European risk-on tone and German industrial names holding bid",
    support1: 23420,
    support2: 23370,
    resistance1: 23520,
    resistance2: 23620,
    invalidation: 23370,
    bias: "Bullish above support",
    confidence: 67,
    meters: {
      oscillators: { signal: "Buy", sell: 2, neutral: 6, buy: 4 },
      summary: { signal: "Buy", sell: 2, neutral: 8, buy: 15 },
      movingAverages: { signal: "Strong buy", sell: 1, neutral: 2, buy: 14 },
    },
    summary:
      "DAX is constructive while holding above 23,420. A break above 23,520 would confirm continuation. If the index loses 23,370, the bullish intraday setup fails and a deeper pullback becomes likely.",
  },

  GOLD: {
    name: "Gold Spot",
    assetType: "Commodity",
    relatedAsset: "USD / Yields",
    price: 2335,
    open: 2328,
    high: 2342,
    low: 2319,
    volume: "Spot liquidity",
    rsi: 55,
    macd: "Neutral-positive",
    atr: 31,
    sentiment: "Defensive bid",
    catalyst: "Dollar and real-yield sensitivity",
    support1: 2325,
    support2: 2318,
    resistance1: 2345,
    resistance2: 2360,
    invalidation: 2318,
    bias: "Neutral to bullish",
    confidence: 59,
    meters: {
      oscillators: { signal: "Neutral", sell: 3, neutral: 7, buy: 3 },
      summary: { signal: "Neutral", sell: 5, neutral: 10, buy: 7 },
      movingAverages: { signal: "Buy", sell: 3, neutral: 4, buy: 9 },
    },
    summary:
      "Gold is neutral-to-bullish while holding above 2,325. A break above 2,345 improves the continuation case. Below 2,318, the setup weakens and price may revisit lower liquidity zones.",
  },

  BTC: {
    name: "Bitcoin",
    assetType: "Crypto",
    relatedAsset: "Crypto market liquidity",
    price: 76442,
    open: 75880,
    high: 77120,
    low: 75014,
    volume: "Crypto volume varies",
    rsi: 54,
    macd: "Neutral-positive",
    atr: 1850,
    sentiment: "Mixed",
    catalyst: "Risk appetite, ETF flows and dollar conditions",
    support1: 75800,
    support2: 75000,
    resistance1: 77200,
    resistance2: 78500,
    invalidation: 75000,
    bias: "Neutral to cautiously bullish",
    confidence: 57,
    meters: {
      oscillators: { signal: "Neutral", sell: 3, neutral: 8, buy: 3 },
      summary: { signal: "Buy", sell: 4, neutral: 8, buy: 11 },
      movingAverages: { signal: "Buy", sell: 3, neutral: 3, buy: 10 },
    },
    summary:
      "Bitcoin is constructive only while holding above 75,800. A clean break above 77,200 would improve the bullish case. If price loses 75,000, the intraday structure weakens and crypto-linked equities may come under pressure.",
  },
};

function isTimeframe(value: string | null): value is Timeframe {
  return value === "1m" || value === "5m" || value === "15m" || value === "1h" || value === "4h" || value === "1D";
}

function getFallbackProfile(symbol: string): Omit<ScanResponse, "symbol" | "scanTime" | "scanDate" | "createdAt" | "timeframe"> {
  return {
    name: `${symbol} Market Instrument`,
    assetType: "Manual mapping required",
    relatedAsset: "Market context",
    price: 100,
    open: 99.2,
    high: 101.8,
    low: 98.6,
    volume: "Pending API",
    rsi: 52,
    macd: "Neutral",
    atr: 2.4,
    sentiment: "Pending live sentiment feed",
    catalyst: "No live news connected yet",
    support1: 99,
    support2: 97.8,
    resistance1: 102,
    resistance2: 104.5,
    invalidation: 97.8,
    bias: "Neutral / waiting for confirmation",
    confidence: 50,
    meters: {
      oscillators: { signal: "Neutral", sell: 3, neutral: 8, buy: 3 },
      summary: { signal: "Neutral", sell: 5, neutral: 9, buy: 5 },
      movingAverages: { signal: "Neutral", sell: 5, neutral: 5, buy: 5 },
    },
    summary:
      "This is a placeholder scan. Once live APIs are connected, this card will return current price, indicators, sentiment, support, resistance, invalidation and trading bias.",
  };
}

function confidenceAdjustment(timeframe: Timeframe) {
  switch (timeframe) {
    case "1m":
      return -4;
    case "5m":
      return 0;
    case "15m":
      return 2;
    case "1h":
      return 4;
    case "4h":
      return 3;
    case "1D":
      return 1;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const rawSymbol = searchParams.get("symbol");
  const rawTimeframe = searchParams.get("timeframe");

  const symbol = rawSymbol?.trim().toUpperCase();

  if (!symbol) {
    return NextResponse.json(
      {
        error: "Missing symbol",
        message: "Please provide a symbol, for example /api/scan?symbol=MARA&timeframe=5m",
      },
      { status: 400 }
    );
  }

  const timeframe: Timeframe = isTimeframe(rawTimeframe) ? rawTimeframe : "5m";
  const base = mockMarketProfiles[symbol] ?? getFallbackProfile(symbol);

  const now = new Date();
  const adjustment = confidenceAdjustment(timeframe);

  const response: ScanResponse = {
    ...base,
    symbol,
    timeframe,
    confidence: Math.max(1, Math.min(99, base.confidence + adjustment)),
    scanTime: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    scanDate: now.toLocaleDateString(),
    createdAt: now.toISOString(),
  };

  return NextResponse.json(response);
}
