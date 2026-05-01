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
  timeframe: Timeframe;
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
    error: "border-red-900/60 bg-red-950/30 text-red-200",
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
    error: "border-red-200 bg-red-50 text-red-700",
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
  disabled = false,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  mode: ThemeMode;
  disabled?: boolean;
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
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
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
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");

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

  async function handleScan() {
    if (!symbol.trim() || isScanning) return;

    const clean = symbol.trim().toUpperCase();
    setIsScanning(true);
    setError("");

    try {
      const response = await fetch(`/api/scan?symbol=${encodeURIComponent(clean)}&timeframe=${encodeURIComponent(timeframe)}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Scan request failed.");
      }

      const nextScan = (await response.json()) as Scan;

      setActiveSymbol(nextScan.symbol);
      setSymbol(nextScan.symbol);
      setScans((current) => [...current, nextScan]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong while scanning.";
      setError(message);
    } finally {
      setIsScanning(false);
    }
  }

  function clearToday() {
    setScans([]);
    setError("");
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
            <span className={`rounded-full border px-3 py-1.5 ${theme[mode].badge}`}>API connected</span>
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

            <Button mode={mode} onClick={handleScan} disabled={isScanning} className="h-11">
              <RefreshCw className={`mr-2 h-4 w-4 ${isScanning ? "animate-spin" : ""}`} />
              {isScanning ? "Scanning" : "Scan"}
            </Button>

            <Button mode={mode} onClick={clearToday} variant="secondary" className="h-11">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </Card>

        {error && (
          <div className={`mb-4 rounded-xl border p-3 text-sm ${theme[mode].error}`}>
            {error}
          </div>
        )}

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
                        {latest.scanTime} · {latest.assetType} · {latest.timeframe}
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
                            <th className="p-2.5">TF</th>
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
                              <td className="p-2.5">{scan.timeframe}</td>
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
