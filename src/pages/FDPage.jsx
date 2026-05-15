// pages/FDPage.jsx
import { useState, useMemo } from "react";
import { Landmark, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import SliderInput from "../components/SliderInput";
import { formatINR } from "../utils/calculations";

// --- Calculation helpers ---
function calcFD(principal, annualRate, years, compoundFreq) {
  const n = compoundFreq;
  const r = annualRate / 100;
  const maturity = principal * Math.pow(1 + r / n, n * years);
  return {
    maturity: Number(maturity.toFixed(2)),
    interest: Number((maturity - principal).toFixed(2)),
  };
}

function calcFDMonthly(principal, annualRate, years, compoundFreq) {
  const r = annualRate / 100;
  const n = compoundFreq;
  const totalMonths = years * 12;
  const data = [];
  for (let m = 1; m <= totalMonths; m++) {
    const t = m / 12;
    const val = principal * Math.pow(1 + r / n, n * t);
    data.push({
      month: m,
      year: Math.ceil(m / 12),
      value: Number(val.toFixed(2)),
      interest: Number((val - principal).toFixed(2)),
    });
  }
  return data;
}

const FREQ_OPTIONS = [
  { label: "Monthly", value: 12 },
  { label: "Quarterly", value: 4 },
  { label: "Half-Yearly", value: 2 },
  { label: "Yearly", value: 1 },
];

const PRESETS = [
  { label: "Short-term", amount: 100000, rate: 6.5, years: 1 },
  { label: "Mid-term", amount: 500000, rate: 7.0, years: 3 },
  { label: "Long-term", amount: 1000000, rate: 7.5, years: 5 },
  { label: "Max Growth", amount: 2000000, rate: 8.0, years: 10 },
];

// Simple SVG sparkline for growth curve
function GrowthSparkline({ data, width = "100%", height = 160 }) {
  if (!data.length) return null;
  const maxVal = data[data.length - 1].value;
  const minVal = data[0].value;
  const range = maxVal - minVal || 1;
  const pts = data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 80)) === 0 || i === data.length - 1);
  const padT = 12, padB = 8, padL = 0, padR = 0;
  const W = 600, H = height;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const x = (i) => padL + (i / (pts.length - 1)) * chartW;
  const y = (v) => padT + chartH - ((v - minVal) / range) * chartH;

  const linePath = pts.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${x(pts.length - 1).toFixed(1)},${(padT + chartH).toFixed(1)} L${padL},${(padT + chartH).toFixed(1)} Z`;

  // Interest-only fill
  const intPts = pts.map((d) => ({ ...d, intVal: minVal + (d.interest / (maxVal - minVal)) * range }));
  const intLine = intPts.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width, height }}>
      <defs>
        <linearGradient id="fdAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5C842" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#F5C842" stopOpacity="0.01" />
        </linearGradient>
        <linearGradient id="fdIntGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={padL} y1={padT + t * chartH}
          x2={W - padR} y2={padT + t * chartH}
          stroke="rgba(255,255,255,0.04)" strokeWidth="1"
        />
      ))}
      {/* Area fill */}
      <path d={areaPath} fill="url(#fdAreaGrad)" />
      {/* Main line */}
      <path d={linePath} fill="none" stroke="#F5C842" strokeWidth="2" strokeLinejoin="round" />
      {/* Dot at end */}
      <circle
        cx={x(pts.length - 1).toFixed(1)}
        cy={y(pts[pts.length - 1].value).toFixed(1)}
        r="4" fill="#F5C842"
      />
    </svg>
  );
}

export default function FDPage() {
  const [amount, setAmount] = useState(500000);
  const [rate, setRate] = useState(7.0);
  const [years, setYears] = useState(3);
  const [freq, setFreq] = useState(4); // quarterly default
  const [showTable, setShowTable] = useState(false);

  const result = useMemo(() => calcFD(amount, rate, years, freq), [amount, rate, years, freq]);
  const monthlyData = useMemo(() => calcFDMonthly(amount, rate, years, freq), [amount, rate, years, freq]);

  // Year-by-year summary
  const yearlyData = useMemo(() => {
    const byYear = [];
    for (let y = 1; y <= years; y++) {
      const row = monthlyData.find((d) => d.month === y * 12) || monthlyData[monthlyData.length - 1];
      const prev = y === 1 ? amount : (monthlyData.find((d) => d.month === (y - 1) * 12)?.value ?? amount);
      byYear.push({
        year: y,
        value: row.value,
        interest: row.interest,
        yearInterest: row.value - prev,
      });
    }
    return byYear;
  }, [monthlyData, amount, years]);

  const effectiveYield = result ? (((result.maturity / amount) - 1) * 100).toFixed(2) : "—";
  const cagr = result ? (((Math.pow(result.maturity / amount, 1 / years)) - 1) * 100).toFixed(2) : "—";
  const interestPct = result ? Math.round((result.interest / result.maturity) * 100) : 0;

  return (
    <div className="pt-24 pb-16 px-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-slide-up-1">
        <p className="text-gold text-xs font-mono uppercase tracking-widest mb-2">Calculator · FD</p>
        <h1 className="font-display text-4xl font-800 text-white leading-none">
          Fixed Deposit <span className="text-gold">Calculator</span>
        </h1>
        <p className="text-slate-soft mt-2 text-sm">
          See how your deposit grows with compounding interest over time.
        </p>

        {/* Presets */}
        <div className="flex gap-2 mt-5 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => { setAmount(p.amount); setRate(p.rate); setYears(p.years); }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 text-slate-soft hover:border-gold/40 hover:text-gold transition-all bg-ink-muted hover:bg-gold/5"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">

        {/* Inputs */}
        <div className="lg:col-span-3 bg-ink-soft border border-white/8 rounded-2xl p-6 space-y-6 animate-slide-up-2">
          <SliderInput
            label="Principal Amount"
            value={amount}
            min={10000}
            max={10000000}
            step={10000}
            onChange={setAmount}
            format={formatINR}
          />
          <SliderInput
            label="Annual Interest Rate"
            value={rate}
            min={1}
            max={15}
            step={0.1}
            onChange={setRate}
            unit="% p.a."
          />
          <div className="space-y-3">
            <SliderInput
              label="Tenure"
              value={years}
              min={1}
              max={10}
              step={1}
              onChange={setYears}
              unit="yrs"
            />
            <div className="flex gap-2 flex-wrap pt-1">
              {[1, 2, 3, 5, 7, 10].map((y) => (
                <button
                  key={y}
                  onClick={() => setYears(y)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                    years === y
                      ? "border-gold/60 text-gold bg-gold/10"
                      : "border-white/10 text-slate-dim hover:border-white/20 hover:text-slate-soft"
                  }`}
                >
                  {y}Y
                </button>
              ))}
            </div>
          </div>

          {/* Compounding frequency */}
          <div>
            <p className="text-xs text-slate-dim uppercase tracking-wider font-600 mb-2">Compounding Frequency</p>
            <div className="grid grid-cols-4 gap-1.5">
              {FREQ_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFreq(f.value)}
                  className={`py-2 text-xs rounded-lg border transition-all font-600 ${
                    freq === f.value
                      ? "bg-gold/10 border-gold/40 text-gold"
                      : "bg-ink-muted border-white/10 text-slate-soft hover:text-white hover:border-white/20"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-4 animate-slide-up-3">
          {/* Maturity card */}
          <div className="bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 rounded-2xl p-6">
            <p className="text-gold/70 text-xs font-mono uppercase tracking-widest mb-1">Maturity Value</p>
            <p className="font-display text-5xl font-800 text-white leading-none">
              {result ? formatINR(result.maturity) : "—"}
            </p>
            <p className="text-gold/60 text-xs mt-2">
              After {years} year{years !== 1 ? "s" : ""} at {rate}% p.a.
            </p>
          </div>

          {/* Stats */}
          <div className="bg-ink-soft border border-white/8 rounded-2xl p-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-dim mb-1">Principal</p>
              <p className="font-mono text-sm font-medium text-white">{formatINR(amount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-dim mb-1">Interest Earned</p>
              <p className="font-mono text-sm font-medium text-emerald-400">
                {result ? formatINR(result.interest) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-dim mb-1">Effective Yield</p>
              <p className="font-mono text-sm font-medium text-gold">{effectiveYield}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-dim mb-1">CAGR</p>
              <p className="font-mono text-sm font-medium text-gold">{cagr}%</p>
            </div>
          </div>

          {/* Breakup bar */}
          {result && (
            <div className="bg-ink-soft border border-white/8 rounded-2xl p-5">
              <p className="text-xs text-slate-dim mb-3 uppercase tracking-wider">Breakup</p>
              <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-3">
                <div
                  className="bg-white/20 rounded-l-full transition-all duration-500"
                  style={{ width: `${100 - interestPct}%` }}
                />
                <div
                  className="bg-emerald-400 rounded-r-full transition-all duration-500"
                  style={{ width: `${interestPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white/20 inline-block" />
                  <span className="text-slate-soft">Principal</span>
                  <span className="text-white font-mono ml-1">{100 - interestPct}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  <span className="text-slate-soft">Interest</span>
                  <span className="text-emerald-400 font-mono ml-1">{interestPct}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Tip */}
          <div className="flex items-start gap-2.5 bg-gold/5 border border-gold/15 rounded-xl p-4">
            <Sparkles size={14} className="text-gold mt-0.5 shrink-0" />
            <p className="text-xs text-slate-soft leading-relaxed">
              Switching from <span className="text-white font-medium">annual</span> to{" "}
              <span className="text-white font-medium">quarterly</span> compounding adds{" "}
              <span className="text-gold font-medium">
                {formatINR(
                  Math.round(calcFD(amount, rate, years, 4).maturity - calcFD(amount, rate, years, 1).maturity)
                )}
              </span>{" "}
              extra to your maturity at the same rate.
            </p>
          </div>
        </div>
      </div>

      {/* Growth Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-ink-soft border border-white/8 rounded-2xl p-6 mb-5 animate-slide-up-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-white">Deposit Growth Curve</p>
              <p className="text-xs text-slate-dim mt-0.5">Principal + compounded interest month by month</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gold" />
                <span className="text-slate-dim">Portfolio Value</span>
              </div>
            </div>
          </div>
          <GrowthSparkline data={monthlyData} height={150} />
          {/* X-axis labels */}
          <div className="flex justify-between text-xs text-slate-dim mt-1 font-mono">
            <span>Start</span>
            {Array.from({ length: Math.min(years - 1, 8) }, (_, i) => {
              const y = Math.round(((i + 1) / (years)) * years);
              return <span key={y}>Y{y}</span>;
            })}
            <span>Y{years}</span>
          </div>
        </div>
      )}

      {/* Year-by-Year Table */}
      <div className="animate-slide-up-4">
        <button
          onClick={() => setShowTable(!showTable)}
          className="w-full flex items-center justify-between px-5 py-4 bg-ink-soft border border-white/8 rounded-2xl hover:border-white/15 transition-all group"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">Year-by-Year Breakdown</span>
            <span className="text-xs px-2 py-0.5 bg-white/5 rounded-full text-slate-dim">
              {years} year{years !== 1 ? "s" : ""}
            </span>
          </div>
          {showTable
            ? <ChevronUp size={16} className="text-slate-dim group-hover:text-white transition-colors" />
            : <ChevronDown size={16} className="text-slate-dim group-hover:text-white transition-colors" />}
        </button>

        {showTable && (
          <div className="mt-2 bg-ink-soft border border-white/8 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    {["Year", "Value", "Interest Earned (Cumulative)", "Interest (This Year)", "Growth"].map((h) => (
                      <th key={h} className="px-4 py-3 text-right first:text-left text-xs text-slate-dim font-medium uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {yearlyData.map((row, i) => (
                    <tr
                      key={row.year}
                      className={`border-b border-white/4 ${i % 2 === 0 ? "" : "bg-white/2"} hover:bg-white/5 transition-colors`}
                    >
                      <td className="px-4 py-2.5 text-left font-mono text-xs text-slate-dim">Year {row.year}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-white font-medium">{formatINR(row.value)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-emerald-400">{formatINR(row.interest)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-emerald-400/70">{formatINR(row.yearInterest)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-gold">
                        +{(((row.value / amount) - 1) * 100).toFixed(2)}%
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