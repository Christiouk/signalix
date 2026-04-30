"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Clock,
  Database,
  Moon,
  RefreshCw,
  Search,
  ShieldAlert,
  Sun,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type ThemeMode = "navy" | "light";
type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1D";

type MeterSignal = "Strong sell" | "Sell" | "Neutral" | "Buy" | "Strong buy";

type Meter = {
  signal: MeterSignal;
  sell: number;
  neutral: number;
  buy: number;
};

type Scan = {
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
  meters: {
    oscillators: Meter;
    summary: Meter;
    movingAverages: Meter;
  };
};

const STORAGE_KEY = "signalix_scans_v1";
const THEME_KEY = "signalix_theme_v1";
const TIMEFRAME_KEY = "signalix_timeframe_v1";

const timeframes: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1D"];

const theme = {
  navy: {
    page: "bg-[#05070b] text-slate-100",
    border: "border-slate-800",
    borderSoft: "border-slate-900",
    card: "border-slate-800 bg-slate-950/70",
    cardSoft: "border-slate-800 bg-black/25",
    input: "border-slate-800 bg-black/40 text-white placeholder:text-slate-600 focus:border-slate-500",
    textMain: "text-white",
    textSoft: "text-slate-400",
    textMuted: "text-slate-500",
    badge: "border-slate-800 bg-slate-950 text-slate-300",
    buttonSecondary: "border-slate-800 bg-slate-950 text-slate-200 hover:bg-slate-900",
    tableHead: "bg-black/40 text-slate-500",
    tableRow: "border-slate-800 text-slate-300",
    activeTab: "bg-white text-black border-white",
    tab: "border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900",
  },
  light: {
    page: "bg-slate-100 text-slate-950",
    border: "border-slate-300",
    borderSoft: "border-slate-200",
    card: "border-slate-300 bg-white",
    cardSoft: "border-slate-200 bg-slate-50",
    input: "border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus:border-slate-600",
    textMain: "text-slate-950",
    textSoft: "text-slate-600",
    textMuted: "text-slate-500",
    badge: "border-slate-300 bg-white text-slate-700",
    buttonSecondary: "border-slate-300 bg-white text-slate-800 hover:bg-slate-100",
    tableHead: "bg-slate-100 text-slate-500",
    tableRow: "border-slate-200 text-slate-700",
    activeTab: "bg-slate-950 text-white border-slate-950",
    tab: "border-slate-300 bg-white text-slate-600 hover:bg-slate-100",
  },
};

const mockMarketProfiles: Record<string, Omit<Scan, "symbol" | "scanTime" | "scanDate" | "createdAt">> = {
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

function Card({
  className = "",
  children,
  mode,
}: {
  className?: string;
  children: React.ReactNode;
  mode: ThemeMode;
}) {
  return <div className={`rounded-2xl border ${theme[mode].card} ${className}`}>{children}</div>;
}

function Button({
  className = "",
  children,
  onClick,
  variant = "primary",
  mode,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  mode: ThemeMode;
}) {
  const styles =
    variant === "secondary"
      ? `border ${theme[mode].buttonSecondary}`
      : mode === "navy"
        ? "bg-white text-black hover:bg-slate-200"
        : "bg-slate-950 text-white hover:bg-slate-800";

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

function formatPrice(value: number) {
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return value.toFixed(2);
}

function todayKey() {
  return new Date().toLocaleDateString();
}

function getMockScan(symbol: string, previousScanCount: number, timeframe: Timeframe): Scan {
  const clean = symbol.trim().toUpperCase();

  const base =
    mockMarketProfiles[clean] ||
    ({
      name: `${clean} Market Instrument`,
      assetType: "Manual mapping required",
      relatedAsset: "Market context",
      price: 100 + previousScanCount * 1.15,
      open: 99.2,
      high: 101.8 + previousScanCount,
      low: 98.6,
      volume: "Pending API",
      rsi: 52 + previousScanCount,
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
    } satisfies Omit<Scan, "symbol" | "scanTime" | "scanDate" | "createdAt">);

  const drift = previousScanCount === 0 ? 0 : (previousScanCount * 0.37) / 100;
  const adjustedPrice = Number((base.price * (1 + drift)).toFixed(2));
  const now = new Date();

  const timeframeConfidenceBoost =
    timeframe === "1m" ? -4 : timeframe === "5m" ? 0 : timeframe === "15m" ? 2 : timeframe === "1h" ? 4 : timeframe === "4h" ? 3 : 1;

  return {
    ...base,
    confidence: Math.max(1, Math.min(99, base.confidence + timeframeConfidenceBoost)),
    symbol: clean,
    price: adjustedPrice,
    scanTime: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    scanDate: now.toLocaleDateString(),
    createdAt: now.toISOString(),
  };
}

function signalScore(signal: MeterSignal) {
  switch (signal) {
    case "Strong sell":
      return 8;
    case "Sell":
      return 27;
    case "Neutral":
      return 50;
    case "Buy":
      return 73;
    case "Strong buy":
      return 92;
  }
}

function signalClass(signal: MeterSignal, mode: ThemeMode) {
  if (signal.includes("buy") || signal === "Buy") {
    return mode === "navy" ? "text-blue-300" : "text-blue-700";
  }

  if (signal.includes("sell") || signal === "Sell") {
    return mode === "navy" ? "text-rose-300" : "text-rose-700";
  }

  return mode === "navy" ? "text-slate-300" : "text-slate-700";
}

function TechnicalMeter({
  title,
  meter,
  mode,
}: {
  title: string;
  meter: Meter;
  mode: ThemeMode;
}) {
  const score = signalScore(meter.signal);
  const rotation = -90 + (score / 100) * 180;

  return (
    <Card mode={mode}>
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className={`text-sm font-semibold ${theme[mode].textMain}`}>{title}</h3>
          <span className={`text-xs font-semibold ${signalClass(meter.signal, mode)}`}>{meter.signal}</span>
        </div>

        <div className="relative mx-auto h-20 w-40 overflow-hidden">
          <div className={`absolute left-0 top-0 h-40 w-40 rounded-full border-[10px] ${mode === "navy" ? "border-slate-800" : "border-slate-200"}`} />
          <div className="absolute left-0 top-0 h-40 w-40 rounded-full border-[10px] border-transparent border-l-rose-500 border-t-rose-500 border-r-blue-500" />
          <div
            className="absolute bottom-0 left-1/2 h-16 w-[2px] origin-bottom rounded-full bg-current transition-transform"
            style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
          />
          <div className={`absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full ${mode === "navy" ? "bg-white" : "bg-slate-950"}`} />
        </div>

        <div className={`mt-1 text-center text-lg font-semibold ${signalClass(meter.signal, mode)}`}>{meter.signal}</div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className={`text-[10px] uppercase tracking-[0.16em] ${theme[mode].textMuted}`}>Sell</div>
            <div className={`text-sm font-semibold ${theme[mode].textMain}`}>{meter.sell}</div>
          </div>
          <div>
            <div className={`text-[10px] uppercase tracking-[0.16em] ${theme[mode].textMuted}`}>Neutral</div>
            <div className={`text-sm font-semibold ${theme[mode].textMain}`}>{meter.neutral}</div>
          </div>
          <div>
            <div className={`text-[10px] uppercase tracking-[0.16em] ${theme[mode].textMuted}`}>Buy</div>
            <div className={`text-sm font-semibold ${theme[mode].textMain}`}>{meter.buy}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Metric({
  label,
  value,
  compact = false,
  mode,
}: {
  label: string;
  value: React.ReactNode;
  compact?: boolean;
  mode: ThemeMode;
}) {
  return (
    <div className={`rounded-xl border ${theme[mode].cardSoft} ${compact ? "p-3" : "p-4"}`}>
      <div className={`text-[10px] uppercase tracking-[0.16em] ${theme[mode].textMuted}`}>{label}</div>
      <div className={`${compact ? "mt-1 text-sm" : "mt-2 text-base"} font-semibold ${theme[mode].textMain}`}>
        {value}
      </div>
    </div>
  );
}

function BiasBadge({ bias, mode }: { bias: string; mode: ThemeMode }) {
  const lower = bias.toLowerCase();
  const isBullish = lower.includes("bullish");
  const isNeutral = lower.includes("neutral");

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${theme[mode].badge}`}>
      {isBullish ? (
        <TrendingUp className="h-3.5 w-3.5" />
      ) : isNeutral ? (
        <Activity className="h-3.5 w-3.5" />
      ) : (
        <TrendingDown className="h-3.5 w-3.5" />
      )}
      {bias}
    </div>
  );
}

function ComparisonCard({
  baseline,
  latest,
  mode,
}: {
  baseline?: Scan;
  latest?: Scan;
  mode: ThemeMode;
}) {
  if (!baseline || !latest) return null;

  const change = ((latest.price - baseline.price) / baseline.price) * 100;
  const sameScan = baseline.createdAt === latest.createdAt;

  return (
    <Card mode={mode}>
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className={`text-[10px] uppercase tracking-[0.2em] ${theme[mode].textMuted}`}>Daily comparison</div>
            <h2 className={`mt-0.5 text-lg font-semibold ${theme[mode].textMain}`}>First scan vs latest</h2>
          </div>
          <Database className={`h-4 w-4 ${theme[mode].textSoft}`} />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Metric compact mode={mode} label="First" value={`${baseline.scanTime} / ${formatPrice(baseline.price)}`} />
          <Metric compact mode={mode} label="Latest" value={`${latest.scanTime} / ${formatPrice(latest.price)}`} />
          <Metric compact mode={mode} label="Move" value={sameScan ? "Baseline" : `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`} />
        </div>

        <p className={`mt-3 rounded-xl border p-3 text-sm leading-6 ${theme[mode].cardSoft} ${theme[mode].textSoft}`}>
          {sameScan
            ? `First scan saved as today's baseline for ${latest.symbol}.`
            : `${latest.symbol} is ${change >= 0 ? "higher" : "lower"} by ${Math.abs(change).toFixed(
                2
              )}% versus the first scan. Latest bias: ${latest.bias}.`}
        </p>
      </div>
    </Card>
  );
}

export default function SignalIXPage() {
  const [symbol, setSymbol] = useState("MARA");
  const [scans, setScans] = useState<Scan[]>([]);
  const [activeSymbol, setActiveSymbol] = useState("MARA");
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<ThemeMode>("navy");
  const [timeframe, setTimeframe] = useState<Timeframe>("5m");

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem(THEME_KEY) as ThemeMode | null;
      if (savedTheme === "light" || savedTheme === "navy") {
        setMode(savedTheme);
      }

      const savedTimeframe = window.localStorage.getItem(TIMEFRAME_KEY) as Timeframe | null;
      if (savedTimeframe && timeframes.includes(savedTimeframe)) {
        setTimeframe(savedTimeframe);
      }

      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Scan[];
        const todaysScans = parsed.filter((scan) => scan.scanDate === todayKey());
        setScans(todaysScans);

        if (todaysScans.length > 0) {
          setActiveSymbol(todaysScans[todaysScans.length - 1].symbol);
          setSymbol(todaysScans[todaysScans.length - 1].symbol);
        }
      }
    } catch {
      setScans([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
  }, [scans, loaded]);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(THEME_KEY, mode);
  }, [mode, loaded]);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(TIMEFRAME_KEY, timeframe);
  }, [timeframe, loaded]);

  const symbolScans = useMemo(() => scans.filter((scan) => scan.symbol === activeSymbol), [scans, activeSymbol]);
  const latest = symbolScans[symbolScans.length - 1];
  const baseline = symbolScans[0];

  function handleScan() {
    if (!symbol.trim()) return;
    const clean = symbol.trim().toUpperCase();
    const previousCount = scans.filter((scan) => scan.symbol === clean && scan.scanDate === todayKey()).length;
    const nextScan = getMockScan(clean, previousCount, timeframe);
    setActiveSymbol(clean);
    setScans((current) => [...current, nextScan]);
  }

  function clearToday() {
    setScans([]);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function toggleTheme() {
    setMode((current) => (current === "navy" ? "light" : "navy"));
  }

  return (
    <main className={`min-h-screen p-3 md:p-5 ${theme[mode].page}`}>
      <div className="mx-auto max-w-7xl">
        <header className={`mb-4 flex flex-col justify-between gap-3 border-b pb-4 md:flex-row md:items-center ${theme[mode].borderSoft}`}>
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${theme[mode].badge}`}>
              <Activity className="h-4 w-4" />
            </div>

            <div>
              <h1 className={`text-xl font-semibold tracking-tight ${theme[mode].textMain}`}>SignalIX</h1>
              <p className={`text-xs ${theme[mode].textMuted}`}>Market scan intelligence</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`rounded-full border px-3 py-1.5 ${theme[mode].badge}`}>MVP</span>
            <span className={`rounded-full border px-3 py-1.5 ${theme[mode].badge}`}>signalix.cloud</span>
            <span className={`rounded-full border px-3 py-1.5 ${theme[mode].badge}`}>{scans.length} scans today</span>

            <button
              onClick={toggleTheme}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition ${theme[mode].badge}`}
            >
              {mode === "navy" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {mode === "navy" ? "Light" : "Navy"}
            </button>
          </div>
        </header>

        <Card mode={mode} className="mb-4">
          <div className="grid gap-3 p-3 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme[mode].textMuted}`} />
              <input
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleScan()}
                placeholder="Enter ticker: MARA, DAX, GOLD, BTC..."
                className={`h-11 w-full rounded-xl border pl-10 pr-4 text-sm outline-none transition ${theme[mode].input}`}
              />
            </div>

            <Button mode={mode} onClick={handleScan} className="h-11">
              <RefreshCw className="mr-2 h-4 w-4" />
              Scan
            </Button>

            <Button mode={mode} onClick={clearToday} variant="secondary" className="h-11">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </Card>

        <div className="mb-4 flex flex-wrap gap-2">
          {timeframes.map((item) => (
            <button
              key={item}
              onClick={() => setTimeframe(item)}
              className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                timeframe === item ? theme[mode].activeTab : theme[mode].tab
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {!latest ? (
          <Card mode={mode}>
            <div className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
              <BarChart3 className={`mb-3 h-9 w-9 ${theme[mode].textMuted}`} />
              <h2 className={`text-xl font-semibold ${theme[mode].textMain}`}>No scan yet</h2>
              <p className={`mt-2 max-w-xl text-sm ${theme[mode].textSoft}`}>Press Scan to create the first baseline reading for today.</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-3">
                <TechnicalMeter mode={mode} title="Oscillators" meter={latest.meters.oscillators} />
                <TechnicalMeter mode={mode} title="Summary" meter={latest.meters.summary} />
                <TechnicalMeter mode={mode} title="Moving Averages" meter={latest.meters.movingAverages} />
              </div>

              <Card mode={mode}>
                <div className="p-4">
                  <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <div className={`flex items-center gap-2 text-xs ${theme[mode].textSoft}`}>
                        <Clock className="h-3.5 w-3.5" />
                        {latest.scanTime} · {latest.assetType} · {timeframe}
                      </div>

                      <h2 className={`mt-1 text-2xl font-semibold ${theme[mode].textMain}`}>
                        {latest.symbol} — {latest.name}
                      </h2>

                      <div className="mt-2">
                        <BiasBadge mode={mode} bias={latest.bias} />
                      </div>
                    </div>

                    <div className={`rounded-2xl border p-4 text-right ${theme[mode].cardSoft}`}>
                      <div className={`text-[10px] uppercase tracking-[0.18em] ${theme[mode].textMuted}`}>Price</div>
                      <div className={`text-3xl font-semibold ${theme[mode].textMain}`}>{formatPrice(latest.price)}</div>
                      <div className={`text-xs ${theme[mode].textSoft}`}>Confidence {latest.confidence}%</div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-4">
                    <Metric compact mode={mode} label="Open" value={formatPrice(latest.open)} />
                    <Metric compact mode={mode} label="High" value={formatPrice(latest.high)} />
                    <Metric compact mode={mode} label="Low" value={formatPrice(latest.low)} />
                    <Metric compact mode={mode} label="Volume" value={latest.volume} />
                  </div>

                  <div className={`mt-4 rounded-2xl border p-4 ${theme[mode].cardSoft}`}>
                    <div className={`mb-1 text-[10px] uppercase tracking-[0.2em] ${theme[mode].textMuted}`}>Signal read</div>
                    <p className={`text-sm leading-6 ${theme[mode].textSoft}`}>{latest.summary}</p>
                  </div>
                </div>
              </Card>

              <ComparisonCard mode={mode} baseline={baseline} latest={latest} />

              {scans.length > 0 && (
                <Card mode={mode}>
                  <div className="p-4">
                    <h3 className={`mb-3 text-lg font-semibold ${theme[mode].textMain}`}>Today’s scan history</h3>

                    <div className={`overflow-hidden rounded-xl border ${theme[mode].border}`}>
                      <table className="w-full text-left text-xs">
                        <thead className={theme[mode].tableHead}>
                          <tr>
                            <th className="p-2.5">Time</th>
                            <th className="p-2.5">Symbol</th>
                            <th className="p-2.5">Price</th>
                            <th className="p-2.5">Bias</th>
                            <th className="p-2.5">Confidence</th>
                          </tr>
                        </thead>

                        <tbody>
                          {[...scans].reverse().map((scan, index) => (
                            <tr key={`${scan.symbol}-${scan.createdAt}-${index}`} className={`border-t ${theme[mode].tableRow}`}>
                              <td className="p-2.5">{scan.scanTime}</td>
                              <td className={`p-2.5 font-semibold ${theme[mode].textMain}`}>{scan.symbol}</td>
                              <td className="p-2.5">{formatPrice(scan.price)}</td>
                              <td className="p-2.5">{scan.bias}</td>
                              <td className="p-2.5">{scan.confidence}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <Card mode={mode}>
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className={`text-lg font-semibold ${theme[mode].textMain}`}>Technicals</h3>
                    <Activity className={`h-4 w-4 ${theme[mode].textSoft}`} />
                  </div>

                  <div className="grid gap-3">
                    <Metric compact mode={mode} label="RSI" value={latest.rsi} />
                    <Metric compact mode={mode} label="MACD" value={latest.macd} />
                    <Metric compact mode={mode} label="ATR" value={latest.atr} />
                    <Metric compact mode={mode} label="Sentiment" value={latest.sentiment} />
                    <Metric compact mode={mode} label="Related" value={latest.relatedAsset} />
                    <Metric compact mode={mode} label="Catalyst" value={latest.catalyst} />
                  </div>
                </div>
              </Card>

              <Card mode={mode}>
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className={`text-lg font-semibold ${theme[mode].textMain}`}>Levels</h3>
                    <ShieldAlert className={`h-4 w-4 ${theme[mode].textSoft}`} />
                  </div>

                  <div className="grid gap-3">
                    <Metric compact mode={mode} label="Support 1" value={formatPrice(latest.support1)} />
                    <Metric compact mode={mode} label="Support 2" value={formatPrice(latest.support2)} />
                    <Metric compact mode={mode} label="Resistance 1" value={formatPrice(latest.resistance1)} />
                    <Metric compact mode={mode} label="Resistance 2" value={formatPrice(latest.resistance2)} />
                    <Metric compact mode={mode} label="Invalidation" value={formatPrice(latest.invalidation)} />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
