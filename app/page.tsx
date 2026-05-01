"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  Moon,
  Newspaper,
  RefreshCw,
  Search,
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

type NewsItem = {
  headline: string;
  source: string;
  url?: string;
  datetime?: string;
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
  source?: "live" | "fallback";
  warning?: string;
  news?: NewsItem[];
  meters: {
    oscillators: Meter;
    summary: Meter;
    movingAverages: Meter;
  };
};

type BatchScanResponse = {
  scans: Scan[];
  requestedSymbols: string[];
  acceptedSymbols: string[];
  rejectedSymbols: string[];
  timeframe: Timeframe;
  maxSymbols: number;
  createdAt: string;
};

const STORAGE_KEY = "signalix_scans_v2";
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
    activeTab: "bg-white text-black border-white",
    tab: "border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900",
    error: "border-red-900/60 bg-red-950/30 text-red-200",
    warning: "border-amber-400/30 bg-amber-500/10 text-amber-200",
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
    activeTab: "bg-slate-950 text-white border-slate-950",
    tab: "border-slate-300 bg-white text-slate-600 hover:bg-slate-100",
    error: "border-red-200 bg-red-50 text-red-700",
    warning: "border-amber-300 bg-amber-50 text-amber-700",
  },
};

function todayKey() {
  return new Date().toLocaleDateString();
}

function formatPrice(value: number) {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (Math.abs(value) >= 100) return value.toFixed(2);
  if (Math.abs(value) >= 10) return value.toFixed(2);
  return value.toFixed(4).replace(/\.?0+$/, "");
}

function parseSymbolsInput(input: string) {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((item) => item.trim().toUpperCase().replace(/\s+/g, ""))
        .filter(Boolean)
    )
  );
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
    return mode === "navy" ? "text-emerald-300" : "text-emerald-700";
  }

  if (signal.includes("sell") || signal === "Sell") {
    return mode === "navy" ? "text-rose-300" : "text-rose-700";
  }

  return mode === "navy" ? "text-slate-300" : "text-slate-700";
}

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

function SourceBadge({ source, mode }: { source?: "live" | "fallback"; mode: ThemeMode }) {
  if (source === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.32)]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        LIVE
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        mode === "navy"
          ? "border-amber-400/40 bg-amber-500/10 text-amber-300"
          : "border-amber-300 bg-amber-50 text-amber-700"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      FALLBACK
    </span>
  );
}

function BiasBadge({ bias, mode }: { bias: string; mode: ThemeMode }) {
  const lower = bias.toLowerCase();
  const isBullish = lower.includes("bullish") || lower.includes("buy");
  const isBearish = lower.includes("bearish") || lower.includes("sell");

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${theme[mode].badge}`}>
      {isBullish ? (
        <TrendingUp className="h-3 w-3" />
      ) : isBearish ? (
        <TrendingDown className="h-3 w-3" />
      ) : (
        <Activity className="h-3 w-3" />
      )}
      {bias}
    </span>
  );
}

function MiniMeter({
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
    <div className={`rounded-xl border p-3 ${theme[mode].cardSoft}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={`text-[10px] uppercase tracking-[0.14em] ${theme[mode].textMuted}`}>{title}</span>
        <span className={`text-[11px] font-semibold ${signalClass(meter.signal, mode)}`}>{meter.signal}</span>
      </div>

      <div className="relative mx-auto h-10 w-20 overflow-hidden">
        <div className={`absolute left-0 top-0 h-20 w-20 rounded-full border-[6px] ${mode === "navy" ? "border-slate-800" : "border-slate-200"}`} />
        <div className="absolute left-0 top-0 h-20 w-20 rounded-full border-[6px] border-transparent border-l-rose-500 border-t-rose-500 border-r-emerald-500" />
        <div
          className="absolute bottom-0 left-1/2 h-8 w-[2px] origin-bottom rounded-full bg-current transition-transform"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        />
        <div className={`absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${mode === "navy" ? "bg-white" : "bg-slate-950"}`} />
      </div>

      <div className={`mt-1 grid grid-cols-3 text-center text-[10px] ${theme[mode].textMuted}`}>
        <span>S {meter.sell}</span>
        <span>N {meter.neutral}</span>
        <span>B {meter.buy}</span>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  mode,
}: {
  label: string;
  value: React.ReactNode;
  mode: ThemeMode;
}) {
  return (
    <div className={`rounded-xl border p-2.5 ${theme[mode].cardSoft}`}>
      <div className={`text-[9px] uppercase tracking-[0.14em] ${theme[mode].textMuted}`}>{label}</div>
      <div className={`mt-1 text-sm font-semibold ${theme[mode].textMain}`}>{value}</div>
    </div>
  );
}

function getBaseline(scans: Scan[], symbol: string) {
  return scans.find((scan) => scan.symbol === symbol && scan.scanDate === todayKey());
}

function ScanCard({
  scan,
  baseline,
  mode,
}: {
  scan: Scan;
  baseline?: Scan;
  mode: ThemeMode;
}) {
  const changeFromBaseline =
    baseline && baseline.createdAt !== scan.createdAt
      ? ((scan.price - baseline.price) / baseline.price) * 100
      : null;

  return (
    <Card mode={mode} className="overflow-hidden">
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className={`flex items-center gap-2 text-[11px] ${theme[mode].textSoft}`}>
              <Clock className="h-3 w-3" />
              <span>{scan.scanTime}</span>
              <span>·</span>
              <span>{scan.timeframe}</span>
              <span>·</span>
              <span className="truncate">{scan.assetType}</span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className={`text-xl font-semibold leading-none ${theme[mode].textMain}`}>{scan.symbol}</h2>
              <SourceBadge mode={mode} source={scan.source} />
            </div>

            <p className={`mt-1 max-w-[320px] truncate text-xs ${theme[mode].textMuted}`}>{scan.name}</p>
          </div>

          <div className="text-right">
            <div className={`text-2xl font-semibold leading-none ${theme[mode].textMain}`}>{formatPrice(scan.price)}</div>
            <div className={`mt-1 text-[11px] ${theme[mode].textSoft}`}>Conf. {scan.confidence}%</div>
            {changeFromBaseline !== null && (
              <div className={`mt-1 text-[11px] font-semibold ${changeFromBaseline >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {changeFromBaseline >= 0 ? "+" : ""}
                {changeFromBaseline.toFixed(2)}%
              </div>
            )}
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <BiasBadge mode={mode} bias={scan.bias} />
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${theme[mode].badge}`}>
            RSI {scan.rsi}
          </span>
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${theme[mode].badge}`}>
            MACD {scan.macd}
          </span>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2">
          <MiniMeter mode={mode} title="Osc." meter={scan.meters.oscillators} />
          <MiniMeter mode={mode} title="Summary" meter={scan.meters.summary} />
          <MiniMeter mode={mode} title="MA" meter={scan.meters.movingAverages} />
        </div>

        <div className="mb-3 grid grid-cols-4 gap-2">
          <Metric mode={mode} label="High" value={formatPrice(scan.high)} />
          <Metric mode={mode} label="Low" value={formatPrice(scan.low)} />
          <Metric mode={mode} label="ATR" value={formatPrice(scan.atr)} />
          <Metric mode={mode} label="Vol." value={scan.volume} />
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2">
          <Metric mode={mode} label="Support" value={formatPrice(scan.support1)} />
          <Metric mode={mode} label="Resist." value={formatPrice(scan.resistance1)} />
          <Metric mode={mode} label="Invalid." value={formatPrice(scan.invalidation)} />
        </div>

        <div className={`rounded-xl border p-3 ${theme[mode].cardSoft}`}>
          <div className={`mb-1 text-[9px] uppercase tracking-[0.18em] ${theme[mode].textMuted}`}>Signal read</div>
          <p className={`line-clamp-4 text-xs leading-5 ${theme[mode].textSoft}`}>{scan.summary}</p>
        </div>

        <div className={`mt-3 rounded-xl border p-3 ${theme[mode].cardSoft}`}>
          <div className="mb-2 flex items-center gap-1.5">
            <Newspaper className={`h-3.5 w-3.5 ${theme[mode].textMuted}`} />
            <div className={`text-[9px] uppercase tracking-[0.18em] ${theme[mode].textMuted}`}>News</div>
          </div>

          <div className="space-y-2">
            {(scan.news && scan.news.length > 0 ? scan.news.slice(0, 3) : [{ headline: "No news connected.", source: "SignalIX" }]).map((item, index) => (
              <div key={`${scan.symbol}-news-${index}`} className="flex gap-2">
                <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${mode === "navy" ? "bg-slate-500" : "bg-slate-400"}`} />
                <div className="min-w-0">
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className={`line-clamp-2 text-xs leading-5 hover:underline ${theme[mode].textMain}`}>
                      {item.headline}
                    </a>
                  ) : (
                    <p className={`line-clamp-2 text-xs leading-5 ${theme[mode].textMain}`}>{item.headline}</p>
                  )}
                  <p className={`text-[10px] ${theme[mode].textMuted}`}>
                    {item.source}
                    {item.datetime ? ` · ${item.datetime}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {scan.warning && (
          <div className={`mt-3 flex gap-2 rounded-xl border p-3 text-xs leading-5 ${theme[mode].warning}`}>
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{scan.warning}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function SignalIXPage() {
  const [symbolsInput, setSymbolsInput] = useState("MARA, TSLA, NVDA, AAPL, BTC");
  const [sessionScans, setSessionScans] = useState<Scan[]>([]);
  const [latestBatch, setLatestBatch] = useState<Scan[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<ThemeMode>("navy");
  const [timeframe, setTimeframe] = useState<Timeframe>("5m");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [batchWarning, setBatchWarning] = useState("");

  const parsedSymbols = useMemo(() => parseSymbolsInput(symbolsInput), [symbolsInput]);
  const acceptedPreview = parsedSymbols.slice(0, 5);
  const rejectedPreview = parsedSymbols.slice(5);

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
        setSessionScans(todaysScans);
        setLatestBatch(todaysScans.slice(-5));
      }
    } catch {
      setSessionScans([]);
      setLatestBatch([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionScans));
  }, [sessionScans, loaded]);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(THEME_KEY, mode);
  }, [mode, loaded]);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(TIMEFRAME_KEY, timeframe);
  }, [timeframe, loaded]);

  async function handleScan() {
    if (isScanning) return;

    const symbols = parseSymbolsInput(symbolsInput).slice(0, 5);

    if (symbols.length === 0) {
      setError("Enter at least one symbol.");
      return;
    }

    setIsScanning(true);
    setError("");
    setBatchWarning("");

    try {
      const response = await fetch(`/api/scan?symbols=${encodeURIComponent(symbols.join(","))}&timeframe=${encodeURIComponent(timeframe)}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Scan request failed.");
      }

      const payload = (await response.json()) as BatchScanResponse | Scan;

      const scans = "scans" in payload ? payload.scans : [payload];

      setLatestBatch(scans);
      setSessionScans((current) => [...current, ...scans]);

      if ("rejectedSymbols" in payload && payload.rejectedSymbols.length > 0) {
        setBatchWarning(`Only 5 symbols are scanned at once. Ignored: ${payload.rejectedSymbols.join(", ")}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong while scanning.";
      setError(message);
    } finally {
      setIsScanning(false);
    }
  }

  function clearSession() {
    setSessionScans([]);
    setLatestBatch([]);
    setError("");
    setBatchWarning("");
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function toggleTheme() {
    setMode((current) => (current === "navy" ? "light" : "navy"));
  }

  return (
    <main className={`min-h-screen p-3 md:p-5 ${theme[mode].page}`}>
      <div className="mx-auto max-w-[1600px]">
        <header className={`mb-4 flex flex-col justify-between gap-3 border-b pb-4 md:flex-row md:items-center ${theme[mode].borderSoft}`}>
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${theme[mode].badge}`}>
              <Activity className="h-4 w-4" />
            </div>

            <div>
              <h1 className={`text-xl font-semibold tracking-tight ${theme[mode].textMain}`}>SignalIX</h1>
              <p className={`text-xs ${theme[mode].textMuted}`}>Multi-asset scan intelligence</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`rounded-full border px-3 py-1.5 ${theme[mode].badge}`}>MVP</span>
            <span className={`rounded-full border px-3 py-1.5 ${theme[mode].badge}`}>Up to 5 symbols</span>
            <span className={`rounded-full border px-3 py-1.5 ${theme[mode].badge}`}>{sessionScans.length} scans today</span>

            <button
              onClick={toggleTheme}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition ${theme[mode].badge}`}
            >
              {mode === "navy" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {mode === "navy" ? "Light" : "Navy"}
            </button>
          </div>
        </header>

        <Card mode={mode} className="mb-3">
          <div className="grid gap-3 p-3 lg:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${theme[mode].textMuted}`} />
              <input
                value={symbolsInput}
                onChange={(event) => setSymbolsInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleScan()}
                placeholder="Enter up to 5 symbols: MARA, TSLA, NVDA, AAPL, BTC"
                className={`h-11 w-full rounded-xl border pl-10 pr-4 text-sm outline-none transition ${theme[mode].input}`}
              />
            </div>

            <Button mode={mode} onClick={handleScan} disabled={isScanning} className="h-11">
              <RefreshCw className={`mr-2 h-4 w-4 ${isScanning ? "animate-spin" : ""}`} />
              {isScanning ? "Scanning" : `Scan ${acceptedPreview.length || ""}`}
            </Button>

            <Button mode={mode} onClick={clearSession} variant="secondary" className="h-11">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </Card>

        <div className="mb-3 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
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

          <div className={`text-xs ${theme[mode].textMuted}`}>
            Current set:{" "}
            <span className={theme[mode].textMain}>
              {acceptedPreview.length ? acceptedPreview.join(", ") : "none"}
            </span>
            {rejectedPreview.length > 0 && (
              <span className="text-amber-500"> · Ignored: {rejectedPreview.join(", ")}</span>
            )}
          </div>
        </div>

        {error && <div className={`mb-3 rounded-xl border p-3 text-sm ${theme[mode].error}`}>{error}</div>}
        {batchWarning && <div className={`mb-3 rounded-xl border p-3 text-sm ${theme[mode].warning}`}>{batchWarning}</div>}

        {latestBatch.length === 0 ? (
          <Card mode={mode}>
            <div className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
              <BarChart3 className={`mb-3 h-9 w-9 ${theme[mode].textMuted}`} />
              <h2 className={`text-xl font-semibold ${theme[mode].textMain}`}>No scan yet</h2>
              <p className={`mt-2 max-w-xl text-sm ${theme[mode].textSoft}`}>
                Enter up to five symbols separated by commas, then press Scan.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {latestBatch.map((scan) => (
              <ScanCard
                key={`${scan.symbol}-${scan.createdAt}`}
                scan={scan}
                baseline={getBaseline(sessionScans, scan.symbol)}
                mode={mode}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
