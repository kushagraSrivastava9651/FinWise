import { useState, useMemo, useCallback, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Download, Share2, Sparkles, ChevronDown, ChevronUp, Check,
} from "lucide-react";
import Seo from "../components/Seo";
import SliderInput from "../components/SliderInput";
import { calculateSIP, formatINR } from "../utils/calculations";
import { downloadSIPPdf } from "../utils/pdfExport";

// ─── Presets ────────────────────────────────────────────────────────────────

const SIP_PRESETS = [
  { label: "Starter",    monthly: 1000,  rate: 12, years: 10 },
  { label: "Regular",    monthly: 5000,  rate: 12, years: 15 },
  { label: "Aggressive", monthly: 10000, rate: 15, years: 20 },
  { label: "Retirement", monthly: 20000, rate: 12, years: 30 },
];

const LUMPSUM_PRESETS = [
  { label: "Conservative", amount: 100000,  rate: 8,  years: 5  },
  { label: "Moderate",     amount: 500000,  rate: 12, years: 10 },
  { label: "Growth",       amount: 1000000, rate: 15, years: 15 },
  { label: "Wealth",       amount: 5000000, rate: 12, years: 20 },
];

// ─── Calculations ────────────────────────────────────────────────────────────

function calcLumpsum(amount, annualRate, years) {
  const r = annualRate / 100;
  const futureValue = amount * Math.pow(1 + r, years);
  return {
    futureValue: Math.round(futureValue),
    returns: Math.round(futureValue - amount),
    cagr: annualRate,
  };
}

function buildSIPChartData(monthly, annualReturn, years) {
  const r = annualReturn / 12 / 100;
  return Array.from({ length: years }, (_, i) => {
    const y = i + 1;
    const n = y * 12;
    const fv = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    return {
      year: `Y${y}`,
      invested: Number((monthly * n).toFixed(2)),
      value: Number(fv.toFixed(2)),
      returns: Number((fv - monthly * n).toFixed(2)),
    };
  });
}

function buildLumpsumChartData(amount, annualRate, years) {
  const r = annualRate / 100;
  return Array.from({ length: years }, (_, i) => {
    const y = i + 1;
    const fv = amount * Math.pow(1 + r, y);
    return {
      year: `Y${y}`,
      invested: amount,
      value: Number(fv.toFixed(2)),
      returns: Number((fv - amount).toFixed(2)),
    };
  });
}

// ─── Shared Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink-soft border border-white/10 rounded-xl p-3 text-xs shadow-xl">
      <p className="text-slate-dim mb-2 font-medium">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gold" />
          <span className="text-slate-soft">Value</span>
          <span className="text-white font-mono ml-auto pl-4">
            {formatINR((payload[1]?.value ?? 0) + (payload[0]?.value ?? 0))}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#3D6B52]" />
          <span className="text-slate-soft">Invested</span>
          <span className="text-white font-mono ml-auto pl-4">{formatINR(payload[0]?.value)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-slate-soft">Returns</span>
          <span className="text-emerald-400 font-mono ml-auto pl-4">{formatINR(payload[1]?.value)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Mode Toggle ─────────────────────────────────────────────────────────────

function ModeToggle({ mode, onChange }) {
  return (
    <div className="flex p-1 bg-ink-muted border border-white/8 rounded-xl w-fit">
      {["sip", "lumpsum"].map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
            mode === m
              ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
              : "text-slate-dim hover:text-slate-soft"
          }`}
        >
          {m === "sip" ? "SIP" : "Lumpsum"}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SIPCalculator() {
  const [mode, setMode] = useState("sip"); // "sip" | "lumpsum"

  // SIP state
  const [monthly, setMonthly] = useState(5000);
  const [sipRate, setSipRate] = useState(12);
  const [sipYears, setSipYears] = useState(15);

  // Lumpsum state
  const [amount, setAmount] = useState(500000);
  const [lsRate, setLsRate] = useState(12);
  const [lsYears, setLsYears] = useState(10);

  const [showYearTable, setShowYearTable] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Restore from URL
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("tool") === "sip" || p.get("tool") === "lumpsum") {
      const m = p.get("tool");
      setMode(m);
      if (m === "sip") {
        if (p.get("monthly")) setMonthly(Number(p.get("monthly")));
        if (p.get("rate"))    setSipRate(Number(p.get("rate")));
        if (p.get("years"))   setSipYears(Number(p.get("years")));
      } else {
        if (p.get("amount")) setAmount(Number(p.get("amount")));
        if (p.get("rate"))   setLsRate(Number(p.get("rate")));
        if (p.get("years"))  setLsYears(Number(p.get("years")));
      }
    }
  }, []);

  // Derived
  const isSIP = mode === "sip";
  const rate  = isSIP ? sipRate  : lsRate;
  const years = isSIP ? sipYears : lsYears;

  const result = useMemo(
    () => isSIP
      ? calculateSIP(monthly, sipRate, sipYears)
      : calcLumpsum(amount, lsRate, lsYears),
    [isSIP, monthly, sipRate, sipYears, amount, lsRate, lsYears]
  );

  const chartData = useMemo(
    () => isSIP
      ? buildSIPChartData(monthly, sipRate, sipYears)
      : buildLumpsumChartData(amount, lsRate, lsYears),
    [isSIP, monthly, sipRate, sipYears, amount, lsRate, lsYears]
  );

  const totalInvested = isSIP ? monthly * years * 12 : amount;
  const wealthRatio   = result ? (result.futureValue / totalInvested).toFixed(1) : "—";
  const absReturn     = result
    ? Math.round(((result.futureValue - totalInvested) / totalInvested) * 100)
    : 0;

  // Tip values
  const tipResult = useMemo(() => {
    if (isSIP) return calculateSIP(monthly, sipRate, sipYears + 5);
    return calcLumpsum(amount, lsRate, lsYears + 5);
  }, [isSIP, monthly, sipRate, sipYears, amount, lsRate, lsYears]);

  const tipExtra = result ? tipResult.futureValue - result.futureValue : 0;

  const handleShare = useCallback(() => {
    const params = isSIP
      ? new URLSearchParams({ tool: "sip", monthly, rate: sipRate, years: sipYears })
      : new URLSearchParams({ tool: "lumpsum", amount, rate: lsRate, years: lsYears });
    const url = `${window.location.origin}${window.location.pathname}?${params}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [isSIP, monthly, sipRate, sipYears, amount, lsRate, lsYears]);

  const handleDownload = useCallback(async () => {
    if (!result) return;
    setDownloading(true);
    try {
      await downloadSIPPdf({ monthly, rate, years, result, chartData, formatINR });
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  }, [monthly, rate, years, result, chartData]);

  const applyPreset = (p) => {
    if (isSIP) {
      setMonthly(p.monthly);
      setSipRate(p.rate);
      setSipYears(p.years);
    } else {
      setAmount(p.amount);
      setLsRate(p.rate);
      setLsYears(p.years);
    }
  };

  const presets = isSIP ? SIP_PRESETS : LUMPSUM_PRESETS;
  const yearQuickPicks = isSIP
    ? [3, 5, 7, 10, 15, 20, 25, 30]
    : [1, 2, 3, 5, 7, 10, 15, 20];

  return (
    <div className="min-h-screen bg-ink pt-20 pb-16">
      <Seo
        title="SIP & Lumpsum Calculator | FinWise"
        description="Estimate SIP returns and lump sum growth with Indian market assumptions. Plan goal-based investments and compare wealth accumulation."
        keywords="SIP calculator, lumpsum calculator, investment returns, goal planning, mutual fund SIP"
      />
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-6 animate-slide-up-1">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-gold text-xs font-mono uppercase tracking-widest mb-2">
              Calculator · {isSIP ? "SIP" : "Lumpsum"}
            </p>
            <h1 className="font-display text-4xl font-800 text-white leading-none">
              {isSIP ? "SIP Calculator" : "Lumpsum Calculator"}
            </h1>
            <p className="text-slate-soft mt-2 text-sm">
              {isSIP
                ? "See how small monthly investments compound into wealth."
                : "Calculate how a one-time investment grows over time."}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-soft hover:text-white hover:bg-white/10 transition-all"
            >
              {copied ? <Check size={14} className="text-gold" /> : <Share2 size={14} />}
              {copied ? "Copied!" : "Share"}
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-soft hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={14} />
              {downloading ? "Saving…" : "PDF"}
            </button>
          </div>
        </div>

        {/* Mode toggle + Presets */}
        <div className="flex flex-wrap items-center gap-3 mt-5">
          <ModeToggle mode={mode} onChange={(m) => { setMode(m); setShowYearTable(false); }} />
          <div className="w-px h-5 bg-white/10" />
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 text-slate-soft hover:border-gold/40 hover:text-gold transition-all bg-ink-muted hover:bg-gold/5"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Input Panel */}
        <div className="lg:col-span-3 bg-ink-soft border border-white/8 rounded-2xl p-6 space-y-8 animate-slide-up-2">

          {isSIP ? (
            /* ── SIP Inputs ── */
            <>
              <SliderInput
                label="Monthly Investment"
                value={monthly}
                min={500}
                max={100000}
                step={500}
                onChange={setMonthly}
                format={(v) => formatINR(v)}
              />
              <SliderInput
                label="Expected Return"
                value={sipRate}
                min={1}
                max={30}
                step={0.5}
                onChange={setSipRate}
                unit="% p.a."
              />
              <div className="space-y-3">
                <SliderInput
                  label="Investment Duration"
                  value={sipYears}
                  min={1}
                  max={40}
                  step={1}
                  onChange={setSipYears}
                  unit="yrs"
                />
                <div className="flex gap-2 flex-wrap pt-1">
                  {yearQuickPicks.map((y) => (
                    <button
                      key={y}
                      onClick={() => setSipYears(y)}
                      className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                        sipYears === y
                          ? "border-gold/60 text-gold bg-gold/10"
                          : "border-white/10 text-slate-dim hover:border-white/20 hover:text-slate-soft"
                      }`}
                    >
                      {y}Y
                    </button>
                  ))}
                </div>
              </div>

              {/* Formula */}
              {/* <div className="bg-ink-muted border border-white/5 rounded-xl p-4">
                <p className="text-xs text-slate-dim mb-2 uppercase tracking-wider font-mono">Formula</p>
                <p className="text-xs text-slate-soft font-mono leading-relaxed">
                  FV = P × [ (1+r)ⁿ − 1 ] / r × (1+r)
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-slate-dim">P = </span><span className="text-white font-mono">{formatINR(monthly)}/mo</span></div>
                  <div><span className="text-slate-dim">r = </span><span className="text-white font-mono">{(sipRate / 12 / 100).toFixed(5)}</span></div>
                  <div><span className="text-slate-dim">n = </span><span className="text-white font-mono">{sipYears * 12} mo</span></div>
                </div>
              </div> */}
            </>
          ) : (
            /* ── Lumpsum Inputs ── */
            <>
              <SliderInput
                label="Investment Amount"
                value={amount}
                min={10000}
                max={10000000}
                step={10000}
                onChange={setAmount}
                format={(v) => formatINR(v)}
              />
              <SliderInput
                label="Expected Return"
                value={lsRate}
                min={1}
                max={30}
                step={0.5}
                onChange={setLsRate}
                unit="% p.a."
              />
              <div className="space-y-3">
                <SliderInput
                  label="Investment Duration"
                  value={lsYears}
                  min={1}
                  max={40}
                  step={1}
                  onChange={setLsYears}
                  unit="yrs"
                />
                <div className="flex gap-2 flex-wrap pt-1">
                  {yearQuickPicks.map((y) => (
                    <button
                      key={y}
                      onClick={() => setLsYears(y)}
                      className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                        lsYears === y
                          ? "border-gold/60 text-gold bg-gold/10"
                          : "border-white/10 text-slate-dim hover:border-white/20 hover:text-slate-soft"
                      }`}
                    >
                      {y}Y
                    </button>
                  ))}
                </div>
              </div>

              {/* Formula */}
              {/* <div className="bg-ink-muted border border-white/5 rounded-xl p-4">
                <p className="text-xs text-slate-dim mb-2 uppercase tracking-wider font-mono">Formula</p>
                <p className="text-xs text-slate-soft font-mono leading-relaxed">
                  FV = P × (1 + r)ⁿ
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-slate-dim">P = </span><span className="text-white font-mono">{formatINR(amount)}</span></div>
                  <div><span className="text-slate-dim">r = </span><span className="text-white font-mono">{(lsRate / 100).toFixed(2)}</span></div>
                  <div><span className="text-slate-dim">n = </span><span className="text-white font-mono">{lsYears} yrs</span></div>
                </div>
              </div> */}

              {/* SIP vs Lumpsum comparison callout */}
              {result && (
                <div className="bg-gold/5 border border-gold/15 rounded-xl p-4">
                  <p className="text-xs text-slate-dim mb-2 uppercase tracking-wider font-mono">SIP Equivalent</p>
                  <p className="text-xs text-slate-soft leading-relaxed">
                    Investing{" "}
                    <span className="text-white font-medium">
                      {formatINR(Math.round(amount / (lsYears * 12)))}
                    </span>
                    /month via SIP for {lsYears} years at {lsRate}% would give{" "}
                    <span className="text-gold font-medium">
                      {formatINR(calculateSIP(Math.round(amount / (lsYears * 12)), lsRate, lsYears).futureValue)}
                    </span>
                    {" "}vs lumpsum's{" "}
                    <span className="text-emerald-400 font-medium">
                      {formatINR(result.futureValue)}
                    </span>.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Result Panel */}
        <div className="lg:col-span-2 space-y-4 animate-slide-up-3">
          {/* Future Value Card */}
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-900/10 border border-emerald-500/30 rounded-2xl p-6">
            <p className="text-emerald-400/70 text-xs font-mono uppercase tracking-widest mb-1">
              Future Value
            </p>
            <p className="font-display text-5xl font-800 text-white leading-none">
              {result ? formatINR(result.futureValue) : "—"}
            </p>
            <p className="text-emerald-400/60 text-xs mt-2">
              After {years} year{years !== 1 ? "s" : ""} of investing
            </p>
          </div>

          {/* Stats grid */}
          <div className="bg-ink-soft border border-white/8 rounded-2xl p-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-dim mb-1">
                {isSIP ? "Total Invested" : "Amount Invested"}
              </p>
              <p className="font-mono text-sm font-medium text-white">{formatINR(totalInvested)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-dim mb-1">Est. Returns</p>
              <p className="font-mono text-sm font-medium text-emerald-400">
                {result ? formatINR(result.returns) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-dim mb-1">Wealth Ratio</p>
              <p className="font-mono text-sm font-medium text-gold">{wealthRatio}×</p>
            </div>
            <div>
              <p className="text-xs text-slate-dim mb-1">Abs. Return</p>
              <p className="font-mono text-sm font-medium text-emerald-400">+{absReturn}%</p>
            </div>
            {!isSIP && (
              <div className="col-span-2">
                <p className="text-xs text-slate-dim mb-1">Effective CAGR</p>
                <p className="font-mono text-sm font-medium text-gold">{lsRate}% p.a.</p>
              </div>
            )}
          </div>

          {/* Breakup bar */}
          {result && (
            <div className="bg-ink-soft border border-white/8 rounded-2xl p-5">
              <p className="text-xs text-slate-dim mb-3 uppercase tracking-wider">Breakup</p>
              <div className="space-y-2">
                <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                  <div
                    className="bg-[#2A4A3A] rounded-l-full transition-all duration-500"
                    style={{ width: `${Math.round((totalInvested / result.futureValue) * 100)}%` }}
                  />
                  <div
                    className="bg-emerald-400 rounded-r-full transition-all duration-500"
                    style={{ width: `${Math.round((result.returns / result.futureValue) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#2A4A3A]" />
                    <span className="text-xs text-slate-soft">Invested</span>
                    <span className="text-xs font-mono text-white ml-1">
                      {Math.round((totalInvested / result.futureValue) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-slate-soft">Returns</span>
                    <span className="text-xs font-mono text-emerald-400 ml-1">
                      {Math.round((result.returns / result.futureValue) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tip */}
          <div className="flex items-start gap-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
            <Sparkles size={14} className="text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-soft leading-relaxed">
              {isSIP ? (
                <>
                  Starting <span className="text-white font-medium">5 years earlier</span> with the same amount would give you{" "}
                  <span className="text-emerald-400 font-medium">{formatINR(tipExtra)}</span> more — the power of compounding.
                </>
              ) : (
                <>
                  Holding for <span className="text-white font-medium">5 more years</span> would grow your corpus to{" "}
                  <span className="text-emerald-400 font-medium">{formatINR(tipResult.futureValue)}</span> — that's{" "}
                  <span className="text-emerald-400 font-medium">{formatINR(tipExtra)}</span> extra.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Growth Chart */}
      <div className="max-w-6xl mx-auto px-4 mt-5 animate-slide-up-4">
        <div className="bg-ink-soft border border-white/8 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-medium text-white">Growth Over Time</p>
              <p className="text-xs text-slate-dim mt-0.5">
                {isSIP ? "Invested amount vs portfolio value" : "Principal vs portfolio value"}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2A4A3A]" />
                <span className="text-slate-dim">Invested</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-dim">Returns</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2A4A3A" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2A4A3A" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="returnsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#34d399" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 10, fill: "#5A5D72" }}
                axisLine={false}
                tickLine={false}
                interval={Math.floor(years / 6)}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#5A5D72" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 10000000 ? `₹${(v / 10000000).toFixed(1)}Cr` :
                  v >= 100000  ? `₹${(v / 100000).toFixed(0)}L`    :
                                 `₹${(v / 1000).toFixed(0)}k`
                }
                width={56}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="invested" stackId="1" stroke="#3D6B52" strokeWidth={1.5} fill="url(#investedGrad)" />
              <Area type="monotone" dataKey="returns"  stackId="1" stroke="#34d399" strokeWidth={2}   fill="url(#returnsGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Year-by-Year Table */}
      <div className="max-w-6xl mx-auto px-4 mt-5">
        <button
          onClick={() => setShowYearTable(!showYearTable)}
          className="w-full flex items-center justify-between px-5 py-4 bg-ink-soft border border-white/8 rounded-2xl hover:border-white/15 transition-all group"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">Year-by-Year Breakdown</span>
            <span className="text-xs px-2 py-0.5 bg-white/5 rounded-full text-slate-dim">
              {years} years
            </span>
          </div>
          {showYearTable
            ? <ChevronUp   size={16} className="text-slate-dim group-hover:text-white transition-colors" />
            : <ChevronDown size={16} className="text-slate-dim group-hover:text-white transition-colors" />}
        </button>

        {showYearTable && (
          <div className="mt-2 bg-ink-soft border border-white/8 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="px-4 py-3 text-left   text-xs text-slate-dim font-medium uppercase tracking-wider">Year</th>
                    <th className="px-4 py-3 text-right  text-xs text-slate-dim font-medium uppercase tracking-wider">
                      {isSIP ? "Invested" : "Principal"}
                    </th>
                    <th className="px-4 py-3 text-right  text-xs text-slate-dim font-medium uppercase tracking-wider">Returns</th>
                    <th className="px-4 py-3 text-right  text-xs text-slate-dim font-medium uppercase tracking-wider">Total Value</th>
                    <th className="px-4 py-3 text-right  text-xs text-slate-dim font-medium uppercase tracking-wider">Gain</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row, i) => (
                    <tr
                      key={row.year}
                      className={`border-b border-white/4 ${i % 2 === 0 ? "" : "bg-white/2"} hover:bg-white/5 transition-colors`}
                    >
                      <td className="px-4 py-2.5 text-slate-dim font-mono text-xs">{row.year}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-white">{formatINR(row.invested)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-emerald-400">{formatINR(row.returns)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-white font-medium">{formatINR(row.value)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-gold">
                        +{Math.round((row.returns / row.invested) * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}