"use client";

import React, { useMemo, useState } from "react";
import { Activity, BarChart3, Clock, Database, RefreshCw, Search, ShieldAlert, TrendingDown, TrendingUp } from "lucide-react";

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
};

const mockMarketProfiles: Record<string, Omit<Scan, "symbol" | "scanTime" | "scanDate">> = {
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
};

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-3xl ${className}`}>{children}</div>;
}

function Button({
  className = "",
  children,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-slate-200 ${className}`}
    >
      {children}
    </button>
  );
}

function formatPrice(value: number) {
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return value.toFixed(2);
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
    } satisfies Omit<Scan, "symbol" | "scanTime" | "scanDate">);

  const drift = previousScanCount === 0 ? 0 : (previousScanCount * 0.37) / 100;
  const adjustedPrice = Number((base.price * (1 + drift)).toFixed(2));

  return {
    ...base,
    symbol: clean,
    price: adjustedPrice,
    scanTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    scanDate: new Date().toLocaleDateString(),
  };
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function BiasBadge({ bias }: { bias: string }) {
  const lower = bias.toLowerCase();
  const isBullish = lower.includes("bullish");
  const isNeutral = lower.includes("neutral");

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-200">
      {isBullish ? (
        <TrendingUp className="h-4 w-4" />
      ) : isNeutral ? (
        <Activity className="h-4 w-4" />
      ) : (
        <TrendingDown className="h-4 w-4" />
      )}
      {bias}
    </div>
  );
}

function ComparisonCard({ baseline, latest }: { baseline?: Scan; latest?: Scan }) {
  if (!baseline || !latest) return null;

  const change = ((latest.price - baseline.price) / baseline.price) * 100;
  const improved = latest.confidence >= baseline.confidence;
  const sameScan = baseline.scanTime === latest.scanTime && baseline.symbol === latest.symbol;

  return (
    <Card className="border border-slate-800 bg-slate-950/70 shadow-2xl">
      <div className="p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Daily comparison</div>
            <h2 className="mt-1 text-2xl font-semibold text-white">First scan vs latest scan</h2>
          </div>
          <Database className="h-6 w-6 text-slate-400" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Metric label="First scan" value={`${baseline.scanTime} / ${formatPrice(baseline.price)}`} />
          <Metric label="Latest scan" value={`${latest.scanTime} / ${formatPrice(latest.price)}`} />
          <Metric label="Move from baseline" value={sameScan ? "Baseline created" : `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`} />
        </div>

        <div className="mt-5 rounded-2xl border border-slate-800 bg-black/30 p-4 text-slate-300">
          {sameScan ? (
            <p>
              This is the first scan of the day for {latest.symbol}. It is now saved as today’s baseline. Later scans will be compared against this reading.
            </p>
          ) : (
            <p>
              Since the first scan, {latest.symbol} has moved <span className="font-semibold text-white">{change >= 0 ? "higher" : "lower"}</span> by{" "}
              <span className="font-semibold text-white">{Math.abs(change).toFixed(2)}%</span>. Confidence has{" "}
              {improved ? "improved or remained stable" : "weakened"}. The latest bias is <span className="font-semibold text-white">{latest.bias}</span>,
              compared with the initial bias of <span className="font-semibold text-white">{baseline.bias}</span>.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function SignalIXPage() {
  const [symbol, setSymbol] = useState("MARA");
  const [scans, setScans] = useState<Scan[]>([]);
  const [activeSymbol, setActiveSymbol] = useState("MARA");

  const symbolScans = useMemo(() => scans.filter((scan) => scan.symbol === activeSymbol), [scans, activeSymbol]);
  const latest = symbolScans[symbolScans.length - 1];
  const baseline = symbolScans[0];

  function handleScan() {
    if (!symbol.trim()) return;
    const clean = symbol.trim().toUpperCase();
    const previousCount = scans.filter((scan) => scan.symbol === clean).length;
    const nextScan = getMockScan(clean, previousCount);
    setActiveSymbol(clean);
    setScans((current) => [...current, nextScan]);
  }

  return (
    <main className="min-h-screen bg-[#05070b] p-4 text-slate-100 md:p-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-400">
            <Activity className="h-4 w-4" />
            SignalIX · MVP Preview
          </div>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-6xl">
            Market scan. Signal memory. Daily comparison.
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-slate-400">
            Enter a stock, index, commodity or crypto. Press scan. The first scan of the day becomes the baseline, and every later scan is compared against it.
          </p>
        </section>

        <Card className="mb-6 border border-slate-800 bg-slate-950/80 shadow-2xl">
          <div className="p-5 md:p-6">
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  value={symbol}
                  onChange={(event) => setSymbol(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && handleScan()}
                  placeholder="Enter ticker: MARA, DAX, GOLD, BTC..."
                  className="h-14 w-full rounded-2xl border border-slate-800 bg-black/40 pl-12 pr-4 text-lg text-white outline-none transition focus:border-slate-500"
                />
              </div>

              <Button onClick={handleScan} className="h-14">
                <RefreshCw className="mr-2 h-4 w-4" />
                Scan
              </Button>
            </div>
          </div>
        </Card>

        {!latest ? (
          <Card className="border border-slate-800 bg-slate-950/70">
            <div className="flex min-h-[320px] flex-col items-center justify-center p-10 text-center">
              <BarChart3 className="mb-4 h-12 w-12 text-slate-500" />
              <h2 className="text-2xl font-semibold text-white">No scan yet</h2>
              <p className="mt-2 max-w-xl text-slate-400">
                Press Scan to create the first baseline reading for today. Try MARA, DAX or GOLD in this preview.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <Card className="border border-slate-800 bg-slate-950/70 shadow-2xl">
                <div className="p-6">
                  <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <Clock className="h-4 w-4" />
                        Scan at {latest.scanTime} · {latest.assetType}
                      </div>

                      <h2 className="mt-2 text-3xl font-semibold text-white md:text-4xl">
                        {latest.symbol} — {latest.name}
                      </h2>

                      <div className="mt-3">
                        <BiasBadge bias={latest.bias} />
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-black/40 p-5 text-right">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Current price</div>
                      <div className="mt-1 text-4xl font-semibold text-white">{formatPrice(latest.price)}</div>
                      <div className="mt-1 text-sm text-slate-400">Confidence {latest.confidence}%</div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <Metric label="Open" value={formatPrice(latest.open)} />
                    <Metric label="High" value={formatPrice(latest.high)} />
                    <Metric label="Low" value={formatPrice(latest.low)} />
                    <Metric label="Volume" value={latest.volume} />
                  </div>

                  <div className="mt-6 rounded-3xl border border-slate-800 bg-black/30 p-5">
                    <div className="mb-2 text-sm uppercase tracking-[0.2em] text-slate-500">Signal read</div>
                    <p className="text-lg leading-8 text-slate-200">{latest.summary}</p>
                  </div>
                </div>
              </Card>

              <ComparisonCard baseline={baseline} latest={latest} />
            </div>

            <div className="space-y-6">
              <Card className="border border-slate-800 bg-slate-950/70 shadow-2xl">
                <div className="p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">Technical & sentiment</h3>
                    <Activity className="h-5 w-5 text-slate-400" />
                  </div>

                  <div className="space-y-3">
                    <Metric label="RSI" value={latest.rsi} />
                    <Metric label="MACD" value={latest.macd} />
                    <Metric label="ATR" value={latest.atr} />
                    <Metric label="Sentiment" value={latest.sentiment} />
                    <Metric label="Related asset" value={latest.relatedAsset} />
                    <Metric label="Catalyst" value={latest.catalyst} />
                  </div>
                </div>
              </Card>

              <Card className="border border-slate-800 bg-slate-950/70 shadow-2xl">
                <div className="p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">Levels</h3>
                    <ShieldAlert className="h-5 w-5 text-slate-400" />
                  </div>

                  <div className="grid gap-3">
                    <Metric label="Support 1" value={formatPrice(latest.support1)} />
                    <Metric label="Support 2" value={formatPrice(latest.support2)} />
                    <Metric label="Resistance 1" value={formatPrice(latest.resistance1)} />
                    <Metric label="Resistance 2" value={formatPrice(latest.resistance2)} />
                    <Metric label="Invalidation" value={formatPrice(latest.invalidation)} />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {scans.length > 0 && (
          <Card className="mt-6 border border-slate-800 bg-slate-950/70 shadow-2xl">
            <div className="p-6">
              <h3 className="mb-4 text-xl font-semibold text-white">Today’s scan history</h3>

              <div className="overflow-hidden rounded-2xl border border-slate-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/40 text-slate-500">
                    <tr>
                      <th className="p-3">Time</th>
                      <th className="p-3">Symbol</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Bias</th>
                      <th className="p-3">Confidence</th>
                    </tr>
                  </thead>

                  <tbody>
                    {[...scans].reverse().map((scan, index) => (
                      <tr key={`${scan.symbol}-${scan.scanTime}-${index}`} className="border-t border-slate-800 text-slate-300">
                        <td className="p-3">{scan.scanTime}</td>
                        <td className="p-3 font-semibold text-white">{scan.symbol}</td>
                        <td className="p-3">{formatPrice(scan.price)}</td>
                        <td className="p-3">{scan.bias}</td>
                        <td className="p-3">{scan.confidence}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
