import { NextResponse } from "next/server";

type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1D";

type MeterSignal = "Strong sell" | "Sell" | "Neutral" | "Buy" | "Strong buy";

type Meter = {
  signal: MeterSignal;
  sell: number;
  neutral: number;
  buy: number;
};

type NewsItem = {
  headline: string;
  source: string;
  url?: string;
  datetime?: string;
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
  source: "live" | "fallback";
  warning?: string;
  news: NewsItem[];
  meters: {
    oscillators: Meter;
    summary: Meter;
    movingAverages: Meter;
  };
};

type BatchResponse = {
  scans: ScanResponse[];
  requestedSymbols: string[];
  acceptedSymbols: string[];
  rejectedSymbols: string[];
  timeframe: Timeframe;
  maxSymbols: number;
  createdAt: string;
};

type Candle = {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
};

type NumericCandle = {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type TwelveQuote = {
  symbol?: string;
  name?: string;
  exchange?: string;
  mic_code?: string;
  currency?: string;
  datetime?: string;
  timestamp?: number;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
  previous_close?: string;
  change?: string;
  percent_change?: string;
  average_volume?: string;
  is_market_open?: boolean;
  fifty_two_week?: {
    low?: string;
    high?: string;
  };
  status?: string;
  message?: string;
  code?: number;
};

type TwelveTimeSeries = {
  meta?: {
    symbol?: string;
    interval?: string;
    currency?: string;
    exchange_timezone?: string;
    exchange?: string;
    mic_code?: string;
    type?: string;
  };
  values?: Candle[];
  status?: string;
  message?: string;
  code?: number;
};

const API_BASE = "https://api.twelvedata.com";
const MAX_SYMBOLS = 5;

const mockMarketProfiles: Record<
  string,
  Omit<ScanResponse, "symbol" | "scanTime" | "scanDate" | "createdAt" | "timeframe" | "source" | "warning">
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
    catalyst: "Bitcoin correlation and crypto miner sector sensitivity",
    support1: 11.1,
    support2: 10.68,
    resistance1: 11.5,
    resistance2: 12.0,
    invalidation: 10.68,
    bias: "Cautiously bullish",
    confidence: 64,
    news: [
      {
        headline: "News feed ready for live connection",
        source: "SignalIX",
      },
    ],
    meters: {
      oscillators: { signal: "Neutral", sell: 1, neutral: 9, buy: 1 },
      summary: { signal: "Buy", sell: 3, neutral: 10, buy: 13 },
      movingAverages: { signal: "Strong buy", sell: 2, neutral: 1, buy: 12 },
    },
    summary:
      "MARA is bullish intraday while holding above 11.30. A clean break and hold above 11.50 would support continuation toward 11.80–12.00. If price loses 11.10, the bullish setup weakens. Below 10.68, the setup is invalidated.",
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
    catalyst: "Crypto liquidity, ETF flows, dollar conditions and risk appetite",
    support1: 75800,
    support2: 75000,
    resistance1: 77200,
    resistance2: 78500,
    invalidation: 75000,
    bias: "Neutral to cautiously bullish",
    confidence: 57,
    news: [
      {
        headline: "Crypto news feed pending broader crypto-news provider",
        source: "SignalIX",
      },
    ],
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

function toTwelveInterval(timeframe: Timeframe) {
  switch (timeframe) {
    case "1m":
      return "1min";
    case "5m":
      return "5min";
    case "15m":
      return "15min";
    case "1h":
      return "1h";
    case "4h":
      return "4h";
    case "1D":
      return "1day";
  }
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

function safeNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "");
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function round(value: number, digits = 2) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatVolume(value: unknown) {
  const number = safeNumber(value, 0);

  if (number >= 1_000_000_000) return `${round(number / 1_000_000_000, 2)}B`;
  if (number >= 1_000_000) return `${round(number / 1_000_000, 2)}M`;
  if (number >= 1_000) return `${round(number / 1_000, 2)}K`;
  if (number > 0) return String(round(number, 0));

  return "N/A";
}

function normalizeSymbol(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

function parseSymbols(request: Request) {
  const { searchParams } = new URL(request.url);

  const rawSymbols = searchParams.get("symbols") || searchParams.get("symbol") || "";

  const requestedSymbols = rawSymbols
    .split(",")
    .map(normalizeSymbol)
    .filter(Boolean);

  const uniqueSymbols = Array.from(new Set(requestedSymbols));

  const acceptedSymbols = uniqueSymbols.slice(0, MAX_SYMBOLS);
  const rejectedSymbols = uniqueSymbols.slice(MAX_SYMBOLS);

  return {
    requestedSymbols: uniqueSymbols,
    acceptedSymbols,
    rejectedSymbols,
  };
}

function getFallbackProfile(
  symbol: string
): Omit<ScanResponse, "symbol" | "scanTime" | "scanDate" | "createdAt" | "timeframe" | "source" | "warning"> {
  return (
    mockMarketProfiles[symbol] ?? {
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
      news: [
        {
          headline: "News feed not connected for this symbol yet",
          source: "SignalIX",
        },
      ],
      meters: {
        oscillators: { signal: "Neutral", sell: 3, neutral: 8, buy: 3 },
        summary: { signal: "Neutral", sell: 5, neutral: 9, buy: 5 },
        movingAverages: { signal: "Neutral", sell: 5, neutral: 5, buy: 5 },
      },
      summary:
        "This is a placeholder scan. Once live APIs are connected for this symbol, SignalIX will return current price, indicators, sentiment, support, resistance, invalidation and trading bias.",
    }
  );
}

function buildFallbackScan(symbol: string, timeframe: Timeframe, warning?: string): ScanResponse {
  const now = new Date();
  const base = getFallbackProfile(symbol);
  const adjustment = confidenceAdjustment(timeframe);

  return {
    ...base,
    symbol,
    timeframe,
    source: "fallback",
    warning,
    confidence: Math.max(1, Math.min(99, base.confidence + adjustment)),
    scanTime: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    scanDate: now.toLocaleDateString(),
    createdAt: now.toISOString(),
  };
}

async function fetchTwelve<T>(endpoint: string, params: Record<string, string>) {
  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    throw new Error("Missing TWELVE_DATA_API_KEY environment variable.");
  }

  const url = new URL(`${API_BASE}/${endpoint}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  url.searchParams.set("apikey", apiKey);

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Twelve Data request failed: ${response.status}`);
  }

  const data = (await response.json()) as T & {
    status?: string;
    message?: string;
    code?: number;
  };

  if (data.status === "error") {
    throw new Error(data.message || "Twelve Data returned an error.");
  }

  return data;
}

function candlesToNumeric(candles: Candle[]) {
  return candles
    .map((candle) => ({
      datetime: candle.datetime,
      open: safeNumber(candle.open),
      high: safeNumber(candle.high),
      low: safeNumber(candle.low),
      close: safeNumber(candle.close),
      volume: safeNumber(candle.volume),
    }))
    .filter((candle) => candle.open > 0 && candle.high > 0 && candle.low > 0 && candle.close > 0);
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateSma(values: number[], period: number) {
  if (values.length < period) return values.length ? average(values) : 0;
  return average(values.slice(-period));
}

function calculateEma(values: number[], period: number) {
  if (values.length === 0) return 0;

  const multiplier = 2 / (period + 1);
  let ema = values[0];

  for (let i = 1; i < values.length; i += 1) {
    ema = values[i] * multiplier + ema * (1 - multiplier);
  }

  return ema;
}

function calculateRsi(closes: number[], period = 14) {
  if (closes.length <= period) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = closes.length - period; i < closes.length; i += 1) {
    const change = closes[i] - closes[i - 1];

    if (change >= 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const averageGain = gains / period;
  const averageLoss = losses / period;

  if (averageLoss === 0) return 100;

  const rs = averageGain / averageLoss;
  return 100 - 100 / (1 + rs);
}

function calculateMacd(closes: number[]) {
  if (closes.length < 35) {
    return {
      macd: 0,
      signal: 0,
      hist: 0,
    };
  }

  const macdSeries: number[] = [];

  for (let i = 26; i <= closes.length; i += 1) {
    const slice = closes.slice(0, i);
    const ema12 = calculateEma(slice, 12);
    const ema26 = calculateEma(slice, 26);
    macdSeries.push(ema12 - ema26);
  }

  const macd = macdSeries[macdSeries.length - 1] ?? 0;
  const signal = calculateEma(macdSeries, 9);
  const hist = macd - signal;

  return {
    macd,
    signal,
    hist,
  };
}

function calculateAtr(candles: NumericCandle[], fallback: number) {
  if (candles.length < 2) return fallback;

  const trueRanges: number[] = [];

  for (let i = 1; i < candles.length; i += 1) {
    const current = candles[i];
    const previous = candles[i - 1];

    const trueRange = Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close)
    );

    trueRanges.push(trueRange);
  }

  const recent = trueRanges.slice(-14);
  if (recent.length === 0) return fallback;

  return round(average(recent), 2);
}

function calculateSupportResistance(candles: NumericCandle[], currentPrice: number) {
  const recent = candles.slice(-30);

  const lows = recent
    .map((candle) => candle.low)
    .filter((value) => value > 0)
    .sort((a, b) => a - b);

  const highs = recent
    .map((candle) => candle.high)
    .filter((value) => value > 0)
    .sort((a, b) => b - a);

  const below = lows.filter((value) => value < currentPrice);
  const above = highs.filter((value) => value > currentPrice);

  const support1 = below.length ? below[below.length - 1] : lows[0] ?? currentPrice * 0.99;
  const support2 = below.length > 1 ? below[Math.max(0, below.length - 3)] : currentPrice * 0.985;

  const resistance1 = above.length ? above[above.length - 1] : highs[0] ?? currentPrice * 1.01;
  const resistance2 = above.length > 1 ? above[Math.max(0, above.length - 3)] : currentPrice * 1.015;

  return {
    support1: round(support1, 2),
    support2: round(support2, 2),
    resistance1: round(resistance1, 2),
    resistance2: round(resistance2, 2),
    invalidation: round(support2, 2),
  };
}

function analyseRsi(rsi: number): MeterSignal {
  if (rsi >= 75) return "Strong buy";
  if (rsi >= 60) return "Buy";
  if (rsi <= 25) return "Strong sell";
  if (rsi <= 40) return "Sell";
  return "Neutral";
}

function analyseMacd(macd: number, signal: number, hist: number): MeterSignal {
  if (macd > signal && hist > 0) return "Buy";
  if (macd < signal && hist < 0) return "Sell";
  return "Neutral";
}

function analyseMovingAverage(price: number, ma: number): MeterSignal {
  if (!ma) return "Neutral";

  const distance = ((price - ma) / ma) * 100;

  if (distance > 2) return "Strong buy";
  if (distance > 0) return "Buy";
  if (distance < -2) return "Strong sell";
  if (distance < 0) return "Sell";

  return "Neutral";
}

function signalToCounts(signal: MeterSignal, total = 15): Meter {
  switch (signal) {
    case "Strong buy":
      return { signal, sell: 1, neutral: 2, buy: total - 3 };
    case "Buy":
      return { signal, sell: 3, neutral: 4, buy: total - 7 };
    case "Neutral":
      return { signal, sell: 4, neutral: total - 8, buy: 4 };
    case "Sell":
      return { signal, sell: total - 7, neutral: 4, buy: 3 };
    case "Strong sell":
      return { signal, sell: total - 3, neutral: 2, buy: 1 };
  }
}

function scoreSignal(signal: MeterSignal) {
  switch (signal) {
    case "Strong sell":
      return -2;
    case "Sell":
      return -1;
    case "Neutral":
      return 0;
    case "Buy":
      return 1;
    case "Strong buy":
      return 2;
  }
}

function signalFromScore(score: number): MeterSignal {
  if (score >= 1.5) return "Strong buy";
  if (score >= 0.5) return "Buy";
  if (score <= -1.5) return "Strong sell";
  if (score <= -0.5) return "Sell";
  return "Neutral";
}

function buildBias(summarySignal: MeterSignal, support1: number, resistance1: number) {
  if (summarySignal === "Strong buy") return `Strong buy above ${support1}`;
  if (summarySignal === "Buy") return `Bullish above ${support1}`;
  if (summarySignal === "Strong sell") return `Strong sell below ${resistance1}`;
  if (summarySignal === "Sell") return `Bearish below ${resistance1}`;
  return "Neutral / waiting for confirmation";
}

function buildConfidence(summarySignal: MeterSignal, rsi: number, price: number, support1: number, resistance1: number, timeframe: Timeframe) {
  let confidence = 50 + Math.abs(scoreSignal(summarySignal)) * 12 + confidenceAdjustment(timeframe);

  if (rsi > 55 && price > support1) confidence += 4;
  if (rsi < 45 && price < resistance1) confidence += 4;
  if (price > resistance1) confidence += 5;
  if (price < support1) confidence += 5;

  return Math.max(1, Math.min(99, Math.round(confidence)));
}

function compactSummary({
  symbol,
  price,
  support1,
  support2,
  resistance1,
  resistance2,
  invalidation,
  summarySignal,
  rsi,
  macdText,
  timeframe,
}: {
  symbol: string;
  price: number;
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
  invalidation: number;
  summarySignal: MeterSignal;
  rsi: number;
  macdText: string;
  timeframe: Timeframe;
}) {
  if (summarySignal === "Buy" || summarySignal === "Strong buy") {
    return `${symbol} is bullish on ${timeframe} around ${price}. Holds above ${support1} keeps the setup valid. Break above ${resistance1} opens ${resistance2}. RSI ${rsi}, MACD ${macdText}. Invalidation below ${invalidation}.`;
  }

  if (summarySignal === "Sell" || summarySignal === "Strong sell") {
    return `${symbol} is bearish on ${timeframe} around ${price}. Stays weak below ${resistance1}. Loss of ${support1} opens ${support2}. RSI ${rsi}, MACD ${macdText}. Recovery above ${resistance2} reduces the bearish read.`;
  }

  return `${symbol} is neutral on ${timeframe} around ${price}. Range: ${support1} support / ${resistance1} resistance. Break above ${resistance1} improves; loss of ${support1} weakens. RSI ${rsi}, MACD ${macdText}.`;
}

function inferRelatedAsset(symbol: string, assetType: string) {
  const upper = symbol.toUpperCase();

  if (upper.includes("MARA") || upper.includes("RIOT") || upper.includes("COIN") || upper.includes("BTC")) {
    return "Bitcoin / crypto liquidity";
  }

  if (upper.includes("GOLD") || upper.includes("XAU")) {
    return "USD / yields";
  }

  if (upper.includes("OIL") || upper.includes("WTI") || upper.includes("BRENT")) {
    return "Crude oil / energy market";
  }

  if (upper.includes("DAX") || upper.includes("GER")) {
    return "EUR/USD / European risk";
  }

  if (upper.includes("NASDAQ") || upper.includes("QQQ") || upper.includes("NQ")) {
    return "US tech risk appetite";
  }

  if (assetType.toLowerCase().includes("crypto")) {
    return "Crypto market liquidity";
  }

  if (assetType.toLowerCase().includes("forex")) {
    return "FX macro conditions";
  }

  return "Broader market context";
}

function inferSentiment(signal: MeterSignal, rsi: number) {
  if (signal === "Strong buy") return "Strong positive";
  if (signal === "Buy") return rsi > 70 ? "Positive but stretched" : "Positive";
  if (signal === "Strong sell") return "Strong negative";
  if (signal === "Sell") return rsi < 30 ? "Negative but oversold" : "Negative";
  return "Neutral / mixed";
}

function inferCatalyst(symbol: string, assetType: string, relatedAsset: string) {
  const upper = symbol.toUpperCase();

  if (upper.includes("MARA")) return "Bitcoin correlation, crypto miner momentum and risk appetite";
  if (upper.includes("BTC")) return "Crypto liquidity, ETF flows, dollar conditions and risk appetite";
  if (upper.includes("GOLD") || upper.includes("XAU")) return "Dollar direction, real yields and defensive demand";
  if (upper.includes("DAX") || upper.includes("GER")) return "European index momentum, US futures and EUR/USD sensitivity";

  return `${assetType} momentum with ${relatedAsset}`;
}

function noNewsYet(symbol: string): NewsItem[] {
  return [
    {
      headline: `News layer pending for ${symbol}. Next step: connect a separate news provider.`,
      source: "SignalIX",
    },
  ];
}

async function buildLiveScan(symbol: string, timeframe: Timeframe): Promise<ScanResponse> {
  const interval = toTwelveInterval(timeframe);

  const [quote, timeSeries] = await Promise.all([
    fetchTwelve<TwelveQuote>("quote", { symbol }),
    fetchTwelve<TwelveTimeSeries>("time_series", {
      symbol,
      interval,
      outputsize: "100",
    }),
  ]);

  const rawCandles = timeSeries.values ?? [];

  if (!rawCandles.length) {
    throw new Error("No candle data returned by Twelve Data.");
  }

  const candlesNewestFirst = candlesToNumeric(rawCandles);
  const candlesOldestFirst = [...candlesNewestFirst].reverse();

  if (candlesOldestFirst.length < 20) {
    throw new Error("Not enough candle data returned by Twelve Data.");
  }

  const latestCandle = candlesNewestFirst[0];

  const price = round(safeNumber(quote.close, latestCandle.close), 2);

  if (!price) {
    throw new Error("No valid price returned by Twelve Data.");
  }

  const open = round(safeNumber(quote.open, latestCandle.open), 2);
  const high = round(safeNumber(quote.high, latestCandle.high), 2);
  const low = round(safeNumber(quote.low, latestCandle.low), 2);
  const volume = formatVolume(quote.volume || latestCandle.volume);

  const closes = candlesOldestFirst.map((candle) => candle.close);

  const rsi = round(calculateRsi(closes), 2);
  const macdValues = calculateMacd(closes);

  const macdText =
    macdValues.macd > macdValues.signal && macdValues.hist > 0
      ? "positive"
      : macdValues.macd < macdValues.signal && macdValues.hist < 0
        ? "negative"
        : "neutral";

  const ma20 = calculateSma(closes, 20);
  const ma50 = calculateSma(closes, 50);

  const atr = calculateAtr(candlesOldestFirst, round(high - low, 2));
  const levels = calculateSupportResistance(candlesOldestFirst, price);

  const oscillatorSignal = signalFromScore(
    (scoreSignal(analyseRsi(rsi)) + scoreSignal(analyseMacd(macdValues.macd, macdValues.signal, macdValues.hist))) / 2
  );

  const ma20Signal = analyseMovingAverage(price, ma20);
  const ma50Signal = analyseMovingAverage(price, ma50);
  const movingAverageSignal = signalFromScore((scoreSignal(ma20Signal) + scoreSignal(ma50Signal)) / 2);

  const summarySignal = signalFromScore(
    (scoreSignal(oscillatorSignal) + scoreSignal(movingAverageSignal) * 1.35) / 2.35
  );

  const meters = {
    oscillators: signalToCounts(oscillatorSignal, 11),
    summary: signalToCounts(summarySignal, 26),
    movingAverages: signalToCounts(movingAverageSignal, 15),
  };

  const name = quote.name || timeSeries.meta?.symbol || symbol;
  const assetType = timeSeries.meta?.type || "Market instrument";
  const relatedAsset = inferRelatedAsset(symbol, assetType);
  const sentiment = inferSentiment(summarySignal, rsi);
  const catalyst = inferCatalyst(symbol, assetType, relatedAsset);

  const bias = buildBias(summarySignal, levels.support1, levels.resistance1);
  const confidence = buildConfidence(summarySignal, rsi, price, levels.support1, levels.resistance1, timeframe);

  const now = new Date();

  return {
    symbol,
    name,
    assetType,
    relatedAsset,
    price,
    open,
    high,
    low,
    volume,
    rsi,
    macd: macdText,
    atr,
    sentiment,
    catalyst,
    support1: levels.support1,
    support2: levels.support2,
    resistance1: levels.resistance1,
    resistance2: levels.resistance2,
    invalidation: levels.invalidation,
    bias,
    confidence,
    meters,
    news: noNewsYet(symbol),
    timeframe,
    source: "live",
    summary: compactSummary({
      symbol,
      price,
      support1: levels.support1,
      support2: levels.support2,
      resistance1: levels.resistance1,
      resistance2: levels.resistance2,
      invalidation: levels.invalidation,
      summarySignal,
      rsi,
      macdText,
      timeframe,
    }),
    scanTime: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    scanDate: now.toLocaleDateString(),
    createdAt: now.toISOString(),
  };
}

async function scanSymbol(symbol: string, timeframe: Timeframe): Promise<ScanResponse> {
  try {
    return await buildLiveScan(symbol, timeframe);
  } catch (error) {
    const warning =
      error instanceof Error
        ? `Live data unavailable. Fallback scan used. Reason: ${error.message}`
        : "Live data unavailable. Fallback scan used.";

    return buildFallbackScan(symbol, timeframe, warning);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const rawTimeframe = searchParams.get("timeframe");
  const timeframe: Timeframe = isTimeframe(rawTimeframe) ? rawTimeframe : "5m";

  const { requestedSymbols, acceptedSymbols, rejectedSymbols } = parseSymbols(request);

  if (acceptedSymbols.length === 0) {
    return NextResponse.json(
      {
        error: "Missing symbol",
        message: "Please provide one or more symbols, for example /api/scan?symbols=MARA,TSLA,NVDA&timeframe=5m",
      },
      { status: 400 }
    );
  }

  const scans = await Promise.all(acceptedSymbols.map((symbol) => scanSymbol(symbol, timeframe)));

  const batch: BatchResponse = {
    scans,
    requestedSymbols,
    acceptedSymbols,
    rejectedSymbols,
    timeframe,
    maxSymbols: MAX_SYMBOLS,
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json(batch);
}
