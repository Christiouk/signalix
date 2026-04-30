"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Clock,
  Database,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

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
};

const STORAGE_KEY = "signalix_scans_v1";

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
    summary:
      "Bitcoin is constructive only while holding above 75,800. A clean break above 77,200 would improve the bullish case. If price loses 75,000, the intraday structure weakens and crypto-linked equities may come under pressure.",
  },
};

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-2xl border border-slate-800 bg-slate-950/70 ${className}`}>{children}</div>;
}

function Button({
  className = "",
  children,
  onClick,
  variant = "primary",
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}) {
  const styles =
    variant === "secondary"
      ? "border border-slate-800 bg-slate-950 text-slate-200 hover:bg-slate-900"
      : "bg-white text-black hover:bg-slate-200";

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

function getMockScan(symbol: string, previousScanCount: number): Scan {
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
      summary:
        "This is a placeholder scan. Once live APIs are connected, this card will return current price, indicators, sentiment, support, resistance, invalidation and trading bias.",
    } satisfies Omit<Scan, "symbol" | "scanTime" | "scanDate" | "createdAt">);

  const drift = previousScanCount === 0 ? 0 : (previousScanCount * 0.37) / 100;
  const adjustedPrice = Number((base.price * (1 + drift)).toFixed(2));
  const now = new Date();

  return {
    ...base,
    symbol: clean,
    price: adjustedPrice,
    scanTime: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    scanDate: now.toLocaleDateString(),
    createdAt: now.toISOString(),
  };
}

function Metric({ label, value, compact = false }: { label: string; value: React.ReactNode; compact?: boolean }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-black/25 ${compact ? "p-3" : "p-4"}`}>
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className={`${compact ? "mt-1 text-sm" : "mt-2 text-base"} font-semibold text-white`}>{value}</div>
    </div>
  );
}

function BiasBadge({ bias }: { bias: string }) {
  const lower = bias.toLowerCase();
  const isBullish = lower.includes("bullish");
  const isNeutral = lower.includes("neutral");

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200">
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

function ComparisonCard({ baseline, latest }: { baseline?: Scan; latest?: Scan }) {
  if (!baseline || !latest) return null;

  const change = ((latest.price - baseline.price) / baseline.price) * 100;
  const sameScan = baseline.createdAt === latest.createdAt;

  return (
    <Card>
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Daily comparison</div>
            <h2 className="mt-0.5 text-lg font-semibold text-white">First scan vs latest</h2>
          </div>
          <Database className="h-4 w-4 text-slate-400" />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Metric compact label="First" value={`${baseline.scanTime} / ${formatPrice(baseline.price)}`} />
          <Metric compact label="Latest" value={`${latest.scanTime} / ${formatPrice(latest.price)}`} />
          <Metric compact label="Move" value={sameScan ? "Baseline" : `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`} />
        </div>

        <p className="mt-3 rounded-xl border border-slate-800 bg-black/25 p-3 text-sm leading-6 text-slate-300">
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

  useEffect(() => {
    try {
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

  const symbolScans = useMemo(() => scans.filter((scan) => scan.symbol === activeSymbol), [scans, activeSymbol]);
  const latest = symbolScans[symbolScans.length - 1];
  const baseline = symbolScans[0];

  function handleScan() {
    if (!symbol.trim()) return;
    const clean = symbol.trim().toUpperCase();
    const previousCount = scans.filter((scan) => scan.symbol === clean && scan.scanDate === todayKey()).length;
    const nextScan = getMockScan(clean, previousCount);
    setActiveSymbol(clean);
    setScans((current) => [...current, nextScan]);
  }

  function clearToday() {
    setScans([]);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <main className="min-h-screen bg-[#05070b] p-3 text-slate-100 md:p-5">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-900 pb-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-950">
                <Activity className="h-4 w-4 text-slate-300" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-white">SignalIX</h1>
                <p className="text-xs text-slate-500">Market scan intelligence</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-300">MVP</span>
            <span className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-300">signalix.cloud</span>
            <span className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-300">{scans.length} scans today</span>
          </div>
        </header>

        <Card className="mb-4">
          <div className="grid gap-3 p-3 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleScan()}
                placeholder="Enter ticker: MARA, DAX, GOLD, BTC..."
                className="h-11 w-full rounded-xl border border-slate-800 bg-black/40 pl-10 pr-4 text-sm text-white outline-none transition focus:border-slate-500"
              />
            </div>

            <Button onClick={handleScan} className="h-11">
              <RefreshCw className="mr-2 h-4 w-4" />
              Scan
            </Button>

            <Button onClick={clearToday} variant="secondary" className="h-11">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </Card>

        {!latest ? (
          <Card>
            <div className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
              <BarChart3 className="mb-3 h-9 w-9 text-slate-500" />
              <h2 className="text-xl font-semibold text-white">No scan yet</h2>
              <p className="mt-2 max-w-xl text-sm text-slate-400">Press Scan to create the first baseline reading for today.</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-4">
              <Card>
                <div className="p-4">
                  <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        {latest.scanTime} · {latest.assetType}
                      </div>

                      <h2 className="mt-1 text-2xl font-semibold text-white">
                        {latest.symbol} — {latest.name}
                      </h2>

                      <div className="mt-2">
                        <BiasBadge bias={latest.bias} />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-black/30 p-4 text-right">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Price</div>
                      <div className="text-3xl font-semibold text-white">{formatPrice(latest.price)}</div>
                      <div className="text-xs text-slate-400">Confidence {latest.confidence}%</div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-4">
                    <Metric compact label="Open" value={formatPrice(latest.open)} />
                    <Metric compact label="High" value={formatPrice(latest.high)} />
                    <Metric compact label="Low" value={formatPrice(latest.low)} />
                    <Metric compact label="Volume" value={latest.volume} />
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-800 bg-black/25 p-4">
                    <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">Signal read</div>
                    <p className="text-sm leading-6 text-slate-200">{latest.summary}</p>
                  </div>
                </div>
              </Card>

              <ComparisonCard baseline={baseline} latest={latest} />

              {scans.length > 0 && (
                <Card>
                  <div className="p-4">
                    <h3 className="mb-3 text-lg font-semibold text-white">Today’s scan history</h3>

                    <div className="overflow-hidden rounded-xl border border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-black/40 text-slate-500">
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
                            <tr key={`${scan.symbol}-${scan.createdAt}-${index}`} className="border-t border-slate-800 text-slate-300">
                              <td className="p-2.5">{scan.scanTime}</td>
                              <td className="p-2.5 font-semibold text-white">{scan.symbol}</td>
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
              <Card>
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Technicals</h3>
                    <Activity className="h-4 w-4 text-slate-400" />
                  </div>

                  <div className="grid gap-3">
                    <Metric compact label="RSI" value={latest.rsi} />
                    <Metric compact label="MACD" value={latest.macd} />
                    <Metric compact label="ATR" value={latest.atr} />
                    <Metric compact label="Sentiment" value={latest.sentiment} />
                    <Metric compact label="Related" value={latest.relatedAsset} />
                    <Metric compact label="Catalyst" value={latest.catalyst} />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Levels</h3>
                    <ShieldAlert className="h-4 w-4 text-slate-400" />
                  </div>

                  <div className="grid gap-3">
                    <Metric compact label="Support 1" value={formatPrice(latest.support1)} />
                    <Metric compact label="Support 2" value={formatPrice(latest.support2)} />
                    <Metric compact label="Resistance 1" value={formatPrice(latest.resistance1)} />
                    <Metric compact label="Resistance 2" value={formatPrice(latest.resistance2)} />
                    <Metric compact label="Invalidation" value={formatPrice(latest.invalidation)} />
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
