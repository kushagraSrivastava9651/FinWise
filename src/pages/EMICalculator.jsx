import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronDown, ChevronUp, Download, Share2, TrendingDown, Check } from "lucide-react";
import SliderInput from "../components/SliderInput";
import Seo from "../components/Seo";
import { calculateEMI, generateAmortisation, formatINR, formatNumber } from "../utils/calculations";
import { downloadEMIPdf } from "../utils/pdfExport";

const LOAN_PRESETS = [
  { label: "Home Loan", amount: 5000000, rate: 8.5, tenure: 240 },
  { label: "Car Loan", amount: 800000, rate: 9.0, tenure: 60 },
  { label: "Personal", amount: 300000, rate: 13.0, tenure: 36 },
  { label: "Education", amount: 1500000, rate: 7.5, tenure: 120 },
];

export default function EMICalculator() {
  const [loanAmount, setLoanAmount] = useState(2500000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenure, setTenure] = useState(240);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleRows, setScheduleRows] = useState(12);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Restore state from URL params on mount
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("tool") === "emi") {
      if (p.get("amount")) setLoanAmount(Number(p.get("amount")));
      if (p.get("rate"))   setInterestRate(Number(p.get("rate")));
      if (p.get("tenure")) setTenure(Number(p.get("tenure")));
    }
  }, []);

  const result = useMemo(
    () => calculateEMI(loanAmount, interestRate, tenure),
    [loanAmount, interestRate, tenure]
  );

  const schedule = useMemo(
    () => (showSchedule ? generateAmortisation(loanAmount, interestRate, tenure) : []),
    [loanAmount, interestRate, tenure, showSchedule]
  );

  const handleShare = useCallback(() => {
    const params = new URLSearchParams({
      tool: "emi",
      amount: loanAmount,
      rate: interestRate,
      tenure,
    });
    const url = `${window.location.origin}${window.location.pathname}?${params}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [loanAmount, interestRate, tenure]);

  const handleDownload = useCallback(async () => {
    if (!result) return;
    setDownloading(true);
    try {
      const fullSchedule = generateAmortisation(loanAmount, interestRate, tenure);
      await downloadEMIPdf({
        loanAmount,
        interestRate,
        tenure,
        result,
        schedule: fullSchedule,
        formatINR,
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  }, [loanAmount, interestRate, tenure, result]);

  const chartData = result
    ? [
        { name: "Principal", value: loanAmount },
        { name: "Interest", value: result.totalInterest },
      ]
    : [];

  const COLORS = ["#F5C842", "#3D3D52"];

  const applyPreset = (preset) => {
    setLoanAmount(preset.amount);
    setInterestRate(preset.rate);
    setTenure(preset.tenure);
  };

  const years = Math.floor(tenure / 12);
  const months = tenure % 12;

  return (
    <div className="min-h-screen bg-ink pt-20 pb-16">
      <Seo
        title="EMI Calculator | FinWise"
        description="Calculate EMI for home, car, education, and personal loans. Compare monthly payments, interest costs, and total payback quickly."
        keywords="EMI calculator, loan EMI, monthly payment calculator, Indian loan calculator"
      />
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-6 animate-slide-up-1">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-gold text-xs font-mono uppercase tracking-widest mb-2">
              Calculator · EMI
            </p>
            <h1 className="font-display text-4xl font-800 text-white leading-none">
              EMI Calculator
            </h1>
            <p className="text-slate-soft mt-2 text-sm">
              Know your exact monthly obligation before you sign.
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

        {/* Loan Type Presets */}
        <div className="flex gap-2 mt-5 flex-wrap">
          {LOAN_PRESETS.map((p) => (
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
          <SliderInput
            label="Loan Amount"
            value={loanAmount}
            min={100000}
            max={10000000}
            step={50000}
            onChange={setLoanAmount}
            format={(v) => formatINR(v)}
          />
          <SliderInput
            label="Interest Rate"
            value={interestRate}
            min={5}
            max={24}
            step={0.1}
            onChange={setInterestRate}
            unit="% p.a."
          />
          <div className="space-y-3">
            <SliderInput
              label="Loan Tenure"
              value={tenure}
              min={6}
              max={360}
              step={6}
              onChange={setTenure}
              unit="mo"
            />
            <p className="text-xs text-slate-dim text-right">
              = {years > 0 ? `${years} yr${years > 1 ? "s" : ""}` : ""}
              {months > 0 ? ` ${months} mo` : ""}
            </p>
          </div>

          {/* Tenure quick-select */}
          <div>
            <p className="text-xs text-slate-dim mb-2">Quick Tenure</p>
            <div className="flex gap-2 flex-wrap">
              {[12, 24, 36, 60, 84, 120, 180, 240, 300, 360].map((t) => (
                <button
                  key={t}
                  onClick={() => setTenure(t)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                    tenure === t
                      ? "border-gold/60 text-gold bg-gold/10"
                      : "border-white/10 text-slate-dim hover:border-white/20 hover:text-slate-soft"
                  }`}
                >
                  {t < 12 ? `${t}M` : `${t / 12}Y`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result Panel */}
        <div className="lg:col-span-2 space-y-4 animate-slide-up-3">
          {/* EMI Card */}
          <div className="bg-gold rounded-2xl p-6 pulse-gold">
            <p className="text-ink/60 text-xs font-mono uppercase tracking-widest mb-1">
              Monthly EMI
            </p>
            <p className="font-display text-5xl font-800 text-ink leading-none">
              {result ? formatINR(result.emi) : "—"}
            </p>
            <p className="text-ink/50 text-xs mt-2">
              Per month for {years > 0 ? `${years} yr${years !== 1 ? "s" : ""}` : `${tenure} months`}
            </p>
          </div>

          {/* Stats */}
          <div className="bg-ink-soft border border-white/8 rounded-2xl p-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-dim mb-1">Principal</p>
              <p className="font-mono text-sm font-medium text-white">{formatINR(loanAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-dim mb-1">Total Interest</p>
              <p className="font-mono text-sm font-medium text-orange-400">
                {result ? formatINR(result.totalInterest) : "—"}
              </p>
            </div>
            <div className="col-span-2 pt-3 border-t border-white/5">
              <p className="text-xs text-slate-dim mb-1">Total Payment</p>
              <p className="font-mono text-base font-semibold text-white">
                {result ? formatINR(result.totalAmount) : "—"}
              </p>
            </div>
          </div>

          {/* Pie Chart */}
          {result && (
            <div className="bg-ink-soft border border-white/8 rounded-2xl p-5">
              <p className="text-xs text-slate-dim mb-3 uppercase tracking-wider">Breakup</p>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={100} height={100}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={46}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatINR(v)}
                      contentStyle={{
                        background: "#14141C",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      itemStyle={{ color: "#E8E8F0" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-gold" />
                    <span className="text-xs text-slate-soft">Principal</span>
                    <span className="text-xs font-mono text-white ml-auto">
                      {Math.round((loanAmount / result.totalAmount) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#3D3D52]" />
                    <span className="text-xs text-slate-soft">Interest</span>
                    <span className="text-xs font-mono text-orange-400 ml-auto">
                      {Math.round((result.totalInterest / result.totalAmount) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tip */}
          <div className="flex items-start gap-2.5 bg-gold/5 border border-gold/15 rounded-xl p-4">
            <TrendingDown size={14} className="text-gold mt-0.5 shrink-0" />
            <p className="text-xs text-slate-soft leading-relaxed">
              A <span className="text-white font-medium">1% lower rate</span> on{" "}
              {formatINR(loanAmount)} saves{" "}
              <span className="text-gold font-medium">
                {result
                  ? formatINR(
                      (calculateEMI(loanAmount, interestRate, tenure)?.totalInterest ?? 0) -
                        (calculateEMI(loanAmount, Math.max(1, interestRate - 1), tenure)
                          ?.totalInterest ?? 0)
                    )
                  : "—"}
              </span>{" "}
              in interest.
            </p>
          </div>
        </div>
      </div>

      {/* Amortisation Table */}
      <div className="max-w-6xl mx-auto px-4 mt-5 animate-slide-up-4">
        <button
          onClick={() => setShowSchedule(!showSchedule)}
          className="w-full flex items-center justify-between px-5 py-4 bg-ink-soft border border-white/8 rounded-2xl hover:border-white/15 transition-all group"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">Amortisation Schedule</span>
            <span className="text-xs px-2 py-0.5 bg-white/5 rounded-full text-slate-dim">
              {tenure} payments
            </span>
          </div>
          {showSchedule ? (
            <ChevronUp size={16} className="text-slate-dim group-hover:text-white transition-colors" />
          ) : (
            <ChevronDown size={16} className="text-slate-dim group-hover:text-white transition-colors" />
          )}
        </button>

        {showSchedule && schedule.length > 0 && (
          <div className="mt-2 bg-ink-soft border border-white/8 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="px-4 py-3 text-left text-xs text-slate-dim font-medium uppercase tracking-wider">Mo</th>
                    <th className="px-4 py-3 text-right text-xs text-slate-dim font-medium uppercase tracking-wider">EMI</th>
                    <th className="px-4 py-3 text-right text-xs text-slate-dim font-medium uppercase tracking-wider">Principal</th>
                    <th className="px-4 py-3 text-right text-xs text-slate-dim font-medium uppercase tracking-wider">Interest</th>
                    <th className="px-4 py-3 text-right text-xs text-slate-dim font-medium uppercase tracking-wider">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.slice(0, scheduleRows).map((row, i) => (
                    <tr
                      key={row.month}
                      className={`border-b border-white/4 ${i % 2 === 0 ? "" : "bg-white/2"} hover:bg-white/5 transition-colors`}
                    >
                      <td className="px-4 py-2.5 text-slate-dim font-mono text-xs">{row.month}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-white">{formatINR(row.emi)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-gold">{formatINR(row.principal)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-orange-400">{formatINR(row.interest)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-slate-soft">{formatINR(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {scheduleRows < schedule.length && (
              <div className="p-4 border-t border-white/8 text-center">
                <button
                  onClick={() => setScheduleRows((r) => Math.min(r + 12, schedule.length))}
                  className="text-xs text-gold hover:text-gold-light transition-colors font-medium"
                >
                  Show {Math.min(12, schedule.length - scheduleRows)} more rows ↓
                </button>
                <button
                  onClick={() => setScheduleRows(schedule.length)}
                  className="text-xs text-slate-dim hover:text-white transition-colors ml-4"
                >
                  Show all {schedule.length}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}