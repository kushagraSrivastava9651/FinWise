// pages/ComparePage.jsx
import { useState, useMemo } from "react";
import { ArrowLeftRight, TrendingDown, Wallet, Clock } from "lucide-react";
import SliderInput from "../components/SliderInput";
import { calculateEMI, formatINR, formatNumber } from "../utils/calculations";

const LOAN_DEFAULTS = [
  { label: "Loan A", principal: 5000000, rate: 8.5, tenure: 240, color: "gold" },
  { label: "Loan B", principal: 5000000, rate: 9.5, tenure: 180, color: "blue" },
];

const COLOR_MAP = {
  gold: {
    text: "text-gold",
    border: "border-gold/40",
    bg: "bg-gold/10",
    bar: "bg-gold",
    ring: "ring-gold/30",
    accent: "#F5C842",
    dim: "text-gold/60",
  },
  blue: {
    text: "text-blue-400",
    border: "border-blue-400/40",
    bg: "bg-blue-400/10",
    bar: "bg-blue-400",
    ring: "ring-blue-400/30",
    accent: "#60A5FA",
    dim: "text-blue-400/60",
  },
};

function LoanPanel({ loan, config, onChange }) {
  const c = COLOR_MAP[config.color];
  return (
    <div className={`bg-ink-soft border rounded-2xl p-6 space-y-6 ${c.border} ring-1 ${c.ring}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2.5 h-2.5 rounded-full ${c.bar}`} />
        <span className={`text-sm font-700 ${c.text} tracking-wide`}>{config.label}</span>
      </div>
      <SliderInput
        label="Loan Amount"
        value={loan.principal}
        min={100000}
        max={50000000}
        step={100000}
        onChange={(v) => onChange({ ...loan, principal: v })}
        format={formatINR}
      />
      <SliderInput
        label="Annual Interest Rate"
        value={loan.rate}
        min={1}
        max={24}
        step={0.1}
        onChange={(v) => onChange({ ...loan, rate: v })}
        unit="%"
      />
      <SliderInput
        label="Tenure"
        value={loan.tenure}
        min={6}
        max={360}
        step={6}
        onChange={(v) => onChange({ ...loan, tenure: v })}
        unit="mo"
      />
    </div>
  );
}

function DiffBadge({ value, positiveIsGood = false }) {
  if (value === 0) return <span className="text-slate-dim text-xs font-mono">same</span>;
  const isPositive = value > 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;
  return (
    <span className={`text-xs font-mono font-600 ${isGood ? "text-emerald-400" : "text-red-400"}`}>
      {isPositive ? "+" : "−"}{formatINR(Math.abs(value))}
    </span>
  );
}

function CompareBar({ valA, valB, colorA = "bg-gold", colorB = "bg-blue-400" }) {
  const total = valA + valB;
  const pctA = total > 0 ? (valA / total) * 100 : 50;
  return (
    <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
      <div className={`${colorA} transition-all duration-500`} style={{ width: `${pctA}%` }} />
      <div className={`${colorB} transition-all duration-500`} style={{ flex: 1 }} />
    </div>
  );
}

export default function ComparePage() {
  const [loans, setLoans] = useState([
    { principal: 5000000, rate: 8.5, tenure: 240 },
    { principal: 5000000, rate: 9.5, tenure: 180 },
  ]);

  const results = useMemo(
    () => loans.map((l) => calculateEMI(l.principal, l.rate, l.tenure)),
    [loans]
  );

  const updateLoan = (idx, val) =>
    setLoans((prev) => prev.map((l, i) => (i === idx ? val : l)));

  const [a, b] = results;
  const emiDiff = a && b ? a.emi - b.emi : 0;
  const interestDiff = a && b ? a.totalInterest - b.totalInterest : 0;
  const outflowDiff = a && b ? a.totalAmount - b.totalAmount : 0;
  const betterLoan = a && b
    ? a.totalInterest <= b.totalInterest ? 0 : 1
    : null;

  const METRICS = [
    {
      icon: <Wallet size={14} />,
      label: "Monthly EMI",
      valA: a?.emi,
      valB: b?.emi,
      diff: emiDiff,
      positiveIsGood: false,
      format: formatINR,
    },
    {
      icon: <TrendingDown size={14} />,
      label: "Total Interest",
      valA: a?.totalInterest,
      valB: b?.totalInterest,
      diff: interestDiff,
      positiveIsGood: false,
      format: formatINR,
    },
    {
      icon: <ArrowLeftRight size={14} />,
      label: "Total Outflow",
      valA: a?.totalAmount,
      valB: b?.totalAmount,
      diff: outflowDiff,
      positiveIsGood: false,
      format: formatINR,
    },
    {
      icon: <Clock size={14} />,
      label: "Tenure",
      valA: loans[0].tenure,
      valB: loans[1].tenure,
      diff: loans[0].tenure - loans[1].tenure,
      positiveIsGood: false,
      format: (v) => `${v} mo`,
    },
  ];

  return (
    <div className="pt-24 pb-16 px-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-gold text-xs font-mono uppercase tracking-widest mb-2">Calculator · Compare</p>
        <h1 className="font-display text-4xl font-800 text-white leading-none">
          Loan <span className="text-gold">Comparison</span>
        </h1>
        <p className="text-slate-soft mt-2 text-sm">
          Side-by-side analysis of two loan offers — find the smarter deal.
        </p>
      </div>

      {/* Winner Banner */}
      {betterLoan !== null && a && b && (
        <div
          className={`mb-6 flex items-center gap-3 px-5 py-4 rounded-2xl border ${
            betterLoan === 0
              ? "bg-gold/5 border-gold/30"
              : "bg-blue-400/5 border-blue-400/30"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              betterLoan === 0 ? "bg-gold/20 text-gold" : "bg-blue-400/20 text-blue-400"
            }`}
          >
            ★
          </div>
          <div>
            <p className="text-white text-sm font-600">
              {LOAN_DEFAULTS[betterLoan].label} saves you{" "}
              <span className={betterLoan === 0 ? "text-gold" : "text-blue-400"}>
                {formatINR(Math.abs(interestDiff))}
              </span>{" "}
              in total interest
            </p>
            <p className="text-slate-dim text-xs mt-0.5">
              Based on total interest outflow over loan tenure
            </p>
          </div>
        </div>
      )}

      {/* Input Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {LOAN_DEFAULTS.map((config, idx) => (
          <LoanPanel
            key={idx}
            loan={loans[idx]}
            config={config}
            onChange={(val) => updateLoan(idx, val)}
          />
        ))}
      </div>

      {/* Comparison Table */}
      {a && b && (
        <div className="bg-ink-soft border border-white/8 rounded-2xl overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-white/6">
            <span className="text-slate-soft text-xs font-700 uppercase tracking-wider">
              Side-by-Side Breakdown
            </span>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-4 gap-0 px-5 py-3 border-b border-white/5 text-xs font-600 uppercase tracking-wider text-slate-dim">
            <span>Metric</span>
            <span className="text-center text-gold">Loan A</span>
            <span className="text-center text-blue-400">Loan B</span>
            <span className="text-center">Difference</span>
          </div>

          {METRICS.map((m, i) => (
            <div
              key={m.label}
              className={`grid grid-cols-4 gap-0 px-5 py-4 items-center ${
                i < METRICS.length - 1 ? "border-b border-white/4" : ""
              } hover:bg-white/2 transition-colors`}
            >
              <div className="flex items-center gap-2 text-slate-soft text-xs">
                <span className="text-slate-dim">{m.icon}</span>
                {m.label}
              </div>
              <div className="text-center font-mono text-sm font-600 text-gold">
                {m.format(m.valA)}
              </div>
              <div className="text-center font-mono text-sm font-600 text-blue-400">
                {m.format(m.valB)}
              </div>
              <div className="text-center">
                <DiffBadge value={m.diff} positiveIsGood={m.positiveIsGood} />
                <span className="block text-slate-dim text-xs mt-0.5">A vs B</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visual bars */}
      {a && b && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          {[
            { label: "EMI", valA: a.emi, valB: b.emi },
            { label: "Total Interest", valA: a.totalInterest, valB: b.totalInterest },
            { label: "Total Outflow", valA: a.totalAmount, valB: b.totalAmount },
          ].map(({ label, valA, valB }) => (
            <div key={label} className="bg-ink-soft border border-white/8 rounded-2xl p-5">
              <p className="text-xs text-slate-dim uppercase tracking-wider mb-3">{label}</p>
              <CompareBar valA={valA} valB={valB} />
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-soft">
                    <span className="w-2 h-2 rounded-full bg-gold inline-block" /> A
                  </span>
                  <span className="font-mono text-gold">{formatINR(valA)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-soft">
                    <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> B
                  </span>
                  <span className="font-mono text-blue-400">{formatINR(valB)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interest rate sensitivity note */}
      {a && b && (
        <div className="bg-ink-soft border border-white/8 rounded-2xl p-5 flex items-start gap-3">
          <span className="text-2xl mt-0.5">💡</span>
          <div>
            <p className="text-white text-sm font-600 mb-1">Key Insight</p>
            <p className="text-slate-soft text-xs leading-relaxed">
              Even a{" "}
              <span className="text-white font-medium">
                {Math.abs(loans[0].rate - loans[1].rate).toFixed(1)}% rate difference
              </span>{" "}
              translates to{" "}
              <span className={interestDiff < 0 ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>
                {formatINR(Math.abs(interestDiff))}
              </span>{" "}
              in total interest over the loan tenure. Always negotiate your rate before accepting tenure terms.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}