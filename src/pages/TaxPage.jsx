import { useState, useMemo } from "react";
import { Sparkles, Info, ChevronDown, ChevronUp, Receipt } from "lucide-react";

// ─── Tax Slabs FY 2025-26 ─────────────────────────────────────────────────────
// Old regime: unchanged, basic exemption ₹2.5L
const OLD_SLABS = [
  { from: 0,        upto: 250000,   rate: 0  },
  { from: 250000,   upto: 500000,   rate: 5  },
  { from: 500000,   upto: 1000000,  rate: 20 },
  { from: 1000000,  upto: Infinity, rate: 30 },
];

// New regime: Budget 2025 revised slabs, basic exemption ₹4L
const NEW_SLABS = [
  { from: 0,        upto: 400000,   rate: 0  },
  { from: 400000,   upto: 800000,   rate: 5  },
  { from: 800000,   upto: 1200000,  rate: 10 },
  { from: 1200000,  upto: 1600000,  rate: 15 },
  { from: 1600000,  upto: 2000000,  rate: 20 },
  { from: 2000000,  upto: 2400000,  rate: 25 },
  { from: 2400000,  upto: Infinity, rate: 30 },
];

// ─── Core Tax Calculation ─────────────────────────────────────────────────────

/** Raw income tax from slabs (before rebate/surcharge/cess) */
function calcSlabTax(taxableIncome, slabs) {
  let tax = 0;
  for (const slab of slabs) {
    if (taxableIncome <= slab.from) break;
    const taxable = Math.min(taxableIncome, slab.upto) - slab.from;
    tax += (taxable * slab.rate) / 100;
  }
  return Math.round(tax);
}

/**
 * Section 87A Rebate + Marginal Relief
 *
 * Old regime:
 *   - Rebate up to ₹12,500 if taxable income ≤ ₹5,00,000
 *   - No marginal relief in old regime (cliff at ₹5L)
 *
 * New regime:
 *   - Rebate up to ₹60,000 if taxable income ≤ ₹12,00,000
 *   - Marginal relief: if income slightly > ₹12L, net tax = (income - 12L)
 *     i.e. rebate = baseTax - (taxableIncome - 12L), but only if > 0
 */
function calcRebate(baseTax, taxableIncome, regime) {
  if (regime === "old") {
    if (taxableIncome <= 500000) return Math.min(baseTax, 12500);
    return 0;
  }
  // New regime
  const THRESHOLD  = 1200000;
  const MAX_REBATE = 60000;
  if (taxableIncome <= THRESHOLD) {
    return Math.min(baseTax, MAX_REBATE);
  }
  // Marginal relief zone: tax should not exceed income above ₹12L
  const excessIncome   = taxableIncome - THRESHOLD;
  const marginalRelief = baseTax - excessIncome;
  return marginalRelief > 0 ? marginalRelief : 0;
}

/**
 * Surcharge
 * Old regime:  10% (>50L), 15% (>1Cr), 25% (>2Cr), 37% (>5Cr)
 * New regime:  same but capped at 25% (no 37% slab)
 */
function calcSurcharge(taxAfterRebate, grossIncome, regime) {
  if (grossIncome <= 5000000)  return 0;
  if (grossIncome <= 10000000) return Math.round(taxAfterRebate * 0.10);
  if (grossIncome <= 20000000) return Math.round(taxAfterRebate * 0.15);
  if (grossIncome <= 50000000) return Math.round(taxAfterRebate * 0.25);
  return Math.round(taxAfterRebate * (regime === "old" ? 0.37 : 0.25));
}

/** Full tax computation for one regime */
function computeTax(taxableIncome, grossIncome, slabs, regime) {
  const baseTax        = calcSlabTax(taxableIncome, slabs);
  const rebate         = calcRebate(baseTax, taxableIncome, regime);
  const taxAfterRebate = Math.max(0, baseTax - rebate);
  const surcharge      = calcSurcharge(taxAfterRebate, grossIncome, regime);
  const cess           = Math.round((taxAfterRebate + surcharge) * 0.04);
  const total          = taxAfterRebate + surcharge + cess;
  return { baseTax, rebate, taxAfterRebate, surcharge, cess, total };
}

// ─── Formatting ───────────────────────────────────────────────────────────────

function formatINR(v) {
  if (v === undefined || v === null || isNaN(v)) return "—";
  const n = Math.round(v);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function pct(part, whole) {
  if (!whole) return "0.0";
  return ((part / whole) * 100).toFixed(1);
}

// ─── SliderInput ──────────────────────────────────────────────────────────────

function SliderInput({ label, value, min, max, step, onChange, format, unit, sublabel }) {
  const display  = format ? format(value) : `${value.toLocaleString("en-IN")}${unit ? ` ${unit}` : ""}`;
  const pctFill  = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-sm text-slate-soft">{label}</span>
          {sublabel && <p className="text-xs text-slate-dim mt-0.5">{sublabel}</p>}
        </div>
        <span className="font-mono text-sm font-semibold text-white bg-white/5 px-3 py-1 rounded-lg shrink-0">
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #F4C430 0%, #F4C430 ${pctFill}%, rgba(255,255,255,0.08) ${pctFill}%, rgba(255,255,255,0.08) 100%)`,
        }}
      />
    </div>
  );
}

// ─── Slab Table ───────────────────────────────────────────────────────────────

function SlabTable({ taxableIncome, slabs }) {
  const rows = slabs
    .map((slab) => {
      const taxableHere = Math.max(0, Math.min(taxableIncome, slab.upto) - slab.from);
      const taxHere     = Math.round((taxableHere * slab.rate) / 100);
      return { ...slab, taxableHere, taxHere };
    })
    .filter((r) => r.from < taxableIncome);

  return (
    <div className="overflow-x-auto rounded-xl border border-white/8">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/8 bg-ink-muted">
            <th className="px-3 py-2 text-left text-slate-dim font-medium">Slab Range</th>
            <th className="px-3 py-2 text-right text-slate-dim font-medium">Rate</th>
            <th className="px-3 py-2 text-right text-slate-dim font-medium">Taxable</th>
            <th className="px-3 py-2 text-right text-slate-dim font-medium">Tax</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-white/4 hover:bg-white/3 transition-colors">
              <td className="px-3 py-2 font-mono text-slate-soft">
                {formatINR(r.from)} – {r.upto === Infinity ? "∞" : formatINR(r.upto)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-white">{r.rate}%</td>
              <td className="px-3 py-2 text-right font-mono text-white">{formatINR(r.taxableHere)}</td>
              <td className="px-3 py-2 text-right font-mono text-gold">
                {r.rate === 0 ? "Nil" : formatINR(r.taxHere)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Mini summary card ────────────────────────────────────────────────────────

function MiniCard({ label, value, valueClass = "text-white" }) {
  return (
    <div className="bg-ink-soft border border-white/5 rounded-xl p-3 text-xs">
      <p className="text-slate-dim mb-1">{label}</p>
      <p className={`font-mono ${valueClass}`}>{value}</p>
    </div>
  );
}

// ─── Row helper ───────────────────────────────────────────────────────────────

function Row({ label, value, valueClass = "text-white" }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-dim">{label}</span>
      <span className={`font-mono ${valueClass}`}>{value}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TaxPage() {
  const [grossIncome,     setGrossIncome]     = useState(1200000);
  const [section80c,      setSection80c]      = useState(150000);
  const [section80d,      setSection80d]      = useState(25000);
  const [nps80ccd,        setNps80ccd]        = useState(50000);
  const [otherDeductions, setOtherDeductions] = useState(0);
  const [showOldSlabs,    setShowOldSlabs]    = useState(false);
  const [showNewSlabs,    setShowNewSlabs]    = useState(false);

  const result = useMemo(() => {
    // Old Regime
    const oldStdDed     = 50000;
    const old80c        = Math.min(section80c, 150000);
    const old80d        = section80d;
    const oldNps        = Math.min(nps80ccd, 50000);
    const oldTotalDed   = oldStdDed + old80c + old80d + oldNps + otherDeductions;
    const oldTaxableInc = Math.max(0, grossIncome - oldTotalDed);
    const oldTax        = computeTax(oldTaxableInc, grossIncome, OLD_SLABS, "old");

    // New Regime — only std deduction allowed
    const newStdDed     = 75000;
    const newTaxableInc = Math.max(0, grossIncome - newStdDed);
    const newTax        = computeTax(newTaxableInc, grossIncome, NEW_SLABS, "new");

    const betterRegime  = oldTax.total <= newTax.total ? "old" : "new";
    const savings       = Math.abs(oldTax.total - newTax.total);

    return {
      old: { ...oldTax, taxableIncome: oldTaxableInc, totalDeductions: oldTotalDed },
      new: { ...newTax, taxableIncome: newTaxableInc, totalDeductions: newStdDed  },
      betterRegime,
      savings,
    };
  }, [grossIncome, section80c, section80d, nps80ccd, otherDeductions]);

  return (
    <div className="min-h-screen bg-ink pt-20 pb-16">

      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-6 animate-slide-up-1">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-gold text-xs font-mono uppercase tracking-widest mb-2">Calculator · Tax</p>
            <h1 className="font-display text-4xl font-800 text-white leading-none">Tax Calculator</h1>
            <p className="text-slate-soft mt-2 text-sm">Old vs New Regime — FY 2025–26 (AY 2026–27)</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gold/10 border border-gold/20 rounded-full">
            <Receipt size={13} className="text-gold" />
            <span className="text-gold text-xs font-medium">Budget 2025 · FY 2025–26</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Input Panel */}
        <div className="lg:col-span-3 space-y-5 animate-slide-up-2">

          {/* Income */}
          <div className="bg-ink-soft border border-white/8 rounded-2xl p-6">
            <p className="text-xs text-slate-dim uppercase tracking-wider font-mono mb-6">Income</p>
            <SliderInput
              label="Gross Annual Income"
              value={grossIncome}
              min={100000}
              max={10000000}
              step={50000}
              onChange={setGrossIncome}
              format={(v) => {
                if (v >= 10000000) return `₹1 Cr`;
                if (v >= 100000)   return `₹${(v / 100000).toFixed(1)} L`;
                return `₹${v.toLocaleString("en-IN")}`;
              }}
            />
          </div>

          {/* Deductions */}
          <div className="bg-ink-soft border border-white/8 rounded-2xl p-6 space-y-7">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-dim uppercase tracking-wider font-mono">Deductions</p>
              <span className="text-xs px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full">
                Old Regime only
              </span>
            </div>

            <div className="flex items-start gap-2 bg-white/3 border border-white/5 rounded-xl px-3 py-2.5">
              <Info size={12} className="text-slate-dim mt-0.5 shrink-0" />
              <p className="text-xs text-slate-dim leading-relaxed">
                Standard deduction auto-applied: <span className="text-white font-mono">₹50,000</span> (Old) / <span className="text-white font-mono">₹75,000</span> (New).
                The New Regime does not allow 80C, 80D, HRA, or other deductions.
              </p>
            </div>

            <SliderInput
              label="Section 80C"
              sublabel="PF, ELSS, PPF, LIC, home loan principal — max ₹1.5L"
              value={section80c}
              min={0}
              max={150000}
              step={5000}
              onChange={setSection80c}
              format={(v) => v === 0 ? "₹0" : `₹${(v / 1000).toFixed(0)}k`}
            />
            <SliderInput
              label="Section 80D"
              sublabel="Health insurance — self/family (₹25k) + parents (₹25k)"
              value={section80d}
              min={0}
              max={100000}
              step={5000}
              onChange={setSection80d}
              format={(v) => v === 0 ? "₹0" : `₹${(v / 1000).toFixed(0)}k`}
            />
            <SliderInput
              label="NPS — 80CCD(1B)"
              sublabel="Additional NPS contribution over 80C — max ₹50,000"
              value={nps80ccd}
              min={0}
              max={50000}
              step={5000}
              onChange={setNps80ccd}
              format={(v) => v === 0 ? "₹0" : `₹${(v / 1000).toFixed(0)}k`}
            />
            <SliderInput
              label="Other Deductions"
              sublabel="HRA, LTA, 80E, 80G, home loan interest (24b)…"
              value={otherDeductions}
              min={0}
              max={500000}
              step={10000}
              onChange={setOtherDeductions}
              format={(v) => {
                if (v === 0)       return "₹0";
                if (v >= 100000)   return `₹${(v / 100000).toFixed(1)} L`;
                return `₹${(v / 1000).toFixed(0)}k`;
              }}
            />

            {/* Deduction summary bar */}
            <div className="bg-ink-muted border border-white/5 rounded-xl p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-dim">Total Old Regime Deductions</span>
                <span className="font-mono text-white">{formatINR(result.old.totalDeductions)}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold/60 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (result.old.totalDeductions / grossIncome) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-dim">{pct(result.old.totalDeductions, grossIncome)}% of gross income</p>
            </div>
          </div>
        </div>

        {/* Result Panel */}
        <div className="lg:col-span-2 space-y-4 animate-slide-up-3">

          {/* Recommendation banner */}
          <div className={`rounded-2xl p-5 border ${
            result.betterRegime === "new"
              ? "bg-gradient-to-br from-emerald-500/20 to-emerald-900/10 border-emerald-500/30"
              : "bg-gradient-to-br from-gold/15 to-gold/5 border-gold/30"
          }`}>
            <p className={`text-xs font-mono uppercase tracking-widest mb-1 ${
              result.betterRegime === "new" ? "text-emerald-400/70" : "text-gold/70"
            }`}>Recommended Regime</p>
            <p className="font-display text-3xl font-800 text-white leading-none">
              {result.betterRegime === "new" ? "New Regime" : "Old Regime"}
            </p>
            <p className={`text-xs mt-2 ${result.betterRegime === "new" ? "text-emerald-400/70" : "text-gold/70"}`}>
              Save {formatINR(result.savings)} vs the other regime
            </p>
          </div>

          {/* Side-by-side cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "old", label: "Old", accent: "border-gold/40", badgeCls: "bg-gold/15 text-gold", valCls: "text-gold" },
              { key: "new", label: "New", accent: "border-emerald-500/40", badgeCls: "bg-emerald-500/20 text-emerald-400", valCls: "text-emerald-400" },
            ].map(({ key, label, accent, badgeCls, valCls }) => {
              const r    = result[key];
              const best = result.betterRegime === key;
              return (
                <div key={key} className={`bg-ink-soft border rounded-2xl p-4 space-y-3 ${best ? accent : "border-white/8"}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-dim font-mono uppercase tracking-wider">{label}</p>
                    {best && <span className={`text-xs px-1.5 py-0.5 rounded-full ${badgeCls}`}>Best</span>}
                  </div>
                  <div>
                    <p className="font-mono text-lg font-bold text-white">{formatINR(r.total)}</p>
                    <p className="text-xs text-slate-dim mt-0.5">Total payable</p>
                  </div>
                  <div className="space-y-1.5 pt-1 border-t border-white/5">
                    <Row label="Taxable"   value={formatINR(r.taxableIncome)} />
                    <Row label="Base tax"  value={formatINR(r.baseTax)} />
                    {r.rebate > 0 && (
                      <Row label="87A Rebate" value={`−${formatINR(r.rebate)}`} valueClass="text-emerald-400" />
                    )}
                    {r.surcharge > 0 && (
                      <Row label="Surcharge" value={formatINR(r.surcharge)} />
                    )}
                    <Row label="Cess 4%"  value={formatINR(r.cess)} />
                    <div className="flex justify-between text-xs pt-1 border-t border-white/5">
                      <span className="text-slate-dim">Eff. Rate</span>
                      <span className={`font-mono font-semibold ${best ? valCls : "text-white"}`}>
                        {pct(r.total, grossIncome)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Monthly take-home */}
          <div className="bg-ink-soft border border-white/8 rounded-2xl p-5">
            <p className="text-xs text-slate-dim uppercase tracking-wider mb-3">Monthly Take-Home</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-xs text-slate-dim mb-0.5">Old Regime</p>
                <p className="font-mono text-sm font-semibold text-white">
                  {formatINR(Math.round((grossIncome - result.old.total) / 12))}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-dim mb-0.5">New Regime</p>
                <p className="font-mono text-sm font-semibold text-emerald-400">
                  {formatINR(Math.round((grossIncome - result.new.total) / 12))}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: "Old", val: result.old.total, cls: "bg-gold/50", textCls: "text-gold" },
                { label: "New", val: result.new.total, cls: "bg-emerald-400/60", textCls: "text-emerald-400" },
              ].map(({ label, val, cls, textCls }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-xs text-slate-dim w-8 shrink-0">{label}</span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${cls} rounded-full transition-all duration-500`}
                      style={{ width: `${pct(val, grossIncome)}%` }} />
                  </div>
                  <span className={`text-xs font-mono ${textCls} w-12 text-right shrink-0`}>
                    {pct(val, grossIncome)}%
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-dim mt-2">Tax as % of gross income</p>
          </div>

          {/* Tip */}
          <div className="flex items-start gap-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
            <Sparkles size={14} className="text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-soft leading-relaxed">
              {result.betterRegime === "new"
                ? <>The <span className="text-white font-medium">New Regime</span> suits you — lower slab rates and zero tax up to ₹12.75L for salaried individuals (₹12L taxable + ₹75k std. deduction).</>
                : <>The <span className="text-white font-medium">Old Regime</span> wins here — your deductions offset the higher slab rates. Max out 80C (<span className="text-emerald-400 font-medium">₹1.5L</span>) + NPS (<span className="text-emerald-400 font-medium">₹50k</span>) to save more.</>
              }
            </p>
          </div>
        </div>
      </div>

      {/* Slab Breakdowns */}
      <div className="max-w-6xl mx-auto px-4 mt-5 space-y-3">
        {[
          {
            key: "old", label: "Old Regime — Slab Breakdown",
            slabs: OLD_SLABS, show: showOldSlabs, setShow: setShowOldSlabs,
            accentVal: "text-gold",
          },
          {
            key: "new", label: "New Regime — Slab Breakdown",
            slabs: NEW_SLABS, show: showNewSlabs, setShow: setShowNewSlabs,
            accentVal: "text-emerald-400",
          },
        ].map(({ key, label, slabs, show, setShow, accentVal }) => {
          const r = result[key];
          return (
            <div key={key}>
              <button
                onClick={() => setShow(!show)}
                className="w-full flex items-center justify-between px-5 py-4 bg-ink-soft border border-white/8 rounded-2xl hover:border-white/15 transition-all group"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{label}</span>
                  <span className="text-xs px-2 py-0.5 bg-white/5 rounded-full text-slate-dim">
                    Taxable: {formatINR(r.taxableIncome)}
                  </span>
                </div>
                {show
                  ? <ChevronUp   size={16} className="text-slate-dim group-hover:text-white transition-colors" />
                  : <ChevronDown size={16} className="text-slate-dim group-hover:text-white transition-colors" />}
              </button>

              {show && (
                <div className="mt-2 space-y-3">
                  <SlabTable taxableIncome={r.taxableIncome} slabs={slabs} />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <MiniCard label="Base Tax"  value={formatINR(r.baseTax)} />
                    {r.rebate > 0 && (
                      <MiniCard label="87A Rebate" value={`−${formatINR(r.rebate)}`} valueClass="text-emerald-400" />
                    )}
                    {r.surcharge > 0 && (
                      <MiniCard label="Surcharge" value={formatINR(r.surcharge)} />
                    )}
                    <MiniCard label="Cess (4%)" value={formatINR(r.cess)} />
                    <MiniCard label="Total Tax" value={formatINR(r.total)} valueClass={`${accentVal} font-semibold`} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <p className="text-xs text-slate-dim text-center leading-relaxed">
          Indicative calculation for resident salaried individuals. FY 2025–26 slabs per Budget 2025.
          Does not cover capital gains, business income, advance tax, TDS, or all exemptions. Consult a CA for accurate filing.
        </p>
      </div>
    </div>
  );
}