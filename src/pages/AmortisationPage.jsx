// pages/AmortisationPage.jsx
import { useState, useRef, useEffect } from "react";
import SliderInput from "../components/SliderInput";
import Seo from "../components/Seo";
import { generateAmortisation, formatINR, formatNumber } from "../utils/calculations";

const PAGE_SIZE = 24;

export default function AmortisationPage() {
  const [principal, setPrincipal] = useState(5000000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(240);
  const [schedule, setSchedule] = useState([]);
  const [filter, setFilter] = useState("all"); // "all" | "year"
  const [page, setPage] = useState(0);
  const canvasRef = useRef(null);
  const tableRef = useRef(null);

  useEffect(() => { generate(); }, []);

  function generate() {
    const s = generateAmortisation(principal, rate, tenure);
    setSchedule(s);
    setPage(0);
  }

  // Summary
  const totalInterest = schedule.reduce((a, r) => a + r.interest, 0);
  const totalAmount = schedule.reduce((a, r) => a + r.emi, 0);
  const emi = schedule[0]?.emi ?? 0;

  // Rows for table
  const rows = filter === "year"
    ? Array.from({ length: Math.ceil(schedule.length / 12) }, (_, y) => {
        const chunk = schedule.slice(y * 12, y * 12 + 12);
        const last = chunk[chunk.length - 1];
        return {
          label: `Year ${y + 1}`,
          emi: last.emi,
          principal: chunk.reduce((a, r) => a + r.principal, 0),
          interest: chunk.reduce((a, r) => a + r.interest, 0),
          balance: last.balance,
          paidPct: Math.round(((principal - last.balance) / principal) * 100),
        };
      })
    : schedule.map(r => ({ ...r, label: r.month }));

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const maxP = Math.max(...schedule.map(r => r.principal));
  const maxI = Math.max(...schedule.map(r => r.interest));

  // Draw chart
  useEffect(() => {
    if (!canvasRef.current || !schedule.length) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.parentElement.clientWidth;
    const H = 200;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const N = schedule.length;
    const sample = Math.max(1, Math.floor(N / 180));
    const pts = schedule.filter((_, i) => i % sample === 0 || i === N - 1);
    const maxVal = schedule[0].emi;
    const maxBal = schedule[0].balance;
    const padT = 10, padB = 20, chartW = W, chartH = H - padT - padB;

    const x = (i) => (i / (pts.length - 1)) * chartW;
    const yE = (v) => padT + chartH - (v / maxVal) * chartH;
    const yB = (v) => padT + chartH - (v / maxBal) * chartH;

    // Grid
    for (let g = 0; g <= 4; g++) {
      const y = padT + (g / 4) * chartH;
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Balance line
    ctx.beginPath();
    pts.forEach((r, i) => i === 0 ? ctx.moveTo(x(i), yB(r.balance)) : ctx.lineTo(x(i), yB(r.balance)));
    ctx.strokeStyle = "rgba(96,165,250,0.4)"; ctx.lineWidth = 1.5; ctx.stroke();

    // Interest area
    ctx.beginPath();
    pts.forEach((r, i) => ctx.lineTo(x(i), yE(r.interest)));
    [...pts].reverse().forEach((r, i) => ctx.lineTo(x(pts.length - 1 - i), padT + chartH));
    ctx.closePath();
    const rg = ctx.createLinearGradient(0, padT, 0, padT + chartH);
    rg.addColorStop(0, "rgba(248,113,113,0.7)"); rg.addColorStop(1, "rgba(248,113,113,0.1)");
    ctx.fillStyle = rg; ctx.fill();

    // Principal area
    ctx.beginPath();
    pts.forEach((r, i) => ctx.lineTo(x(i), yE(r.emi)));
    [...pts].reverse().forEach((r, i) => ctx.lineTo(x(pts.length - 1 - i), yE(pts[pts.length - 1 - i].interest)));
    ctx.closePath();
    const gg = ctx.createLinearGradient(0, padT, 0, padT + chartH);
    gg.addColorStop(0, "rgba(74,222,128,0.7)"); gg.addColorStop(1, "rgba(74,222,128,0.1)");
    ctx.fillStyle = gg; ctx.fill();
  }, [schedule]);

  return (
    <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
      <Seo
        title="Loan Amortisation Schedule | FinWise"
        description="Generate loan amortisation schedules and visualise principal versus interest across each payment. Understand your repayment plan clearly."
        keywords="amortisation schedule, loan repayment, EMI schedule, interest breakdown"
      />
      <h1 className="font-display text-2xl font-800 text-white mb-1">
        Amortisation <span className="text-gold">Schedule</span>
      </h1>
      <p className="text-slate-soft text-sm mb-8">Monthly breakdown of principal, interest, and balance</p>

      {/* Inputs */}
      <div className="bg-ink-card border border-white/7 rounded-2xl p-6 mb-6 space-y-6">
        <SliderInput label="Loan Amount" value={principal} min={100000} max={50000000}
          step={100000} onChange={setPrincipal} format={formatINR} />
        <SliderInput label="Annual Interest Rate" value={rate} min={1} max={24}
          step={0.1} onChange={setRate} unit="%" />
        <SliderInput label="Tenure" value={tenure} min={6} max={360}
          step={6} onChange={setTenure} unit="mo" />
        <button onClick={generate}
          className="w-full bg-gold text-ink font-700 rounded-xl py-3 text-sm tracking-wide hover:opacity-90 transition-opacity">
          Generate Schedule →
        </button>
      </div>

      {/* Summary cards */}
      {schedule.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Monthly EMI", value: formatINR(emi), color: "gold" },
            { label: "Total Principal", value: formatINR(principal), color: "green" },
            { label: "Total Interest", value: formatINR(totalInterest), color: "red" },
            { label: "Total Outflow", value: formatINR(totalAmount), color: "blue" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-ink-card border border-white/7 rounded-xl p-4">
              <p className="text-slate-soft text-xs font-600 uppercase tracking-wider mb-2">{label}</p>
              <p className={`font-mono text-base font-600 text-${color}-400`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {schedule.length > 0 && (
        <div className="bg-ink-card border border-white/7 rounded-2xl p-6 mb-6">
          <p className="text-slate-soft text-xs font-700 uppercase tracking-wider mb-4">
            📊 Principal vs Interest Over Time
          </p>
          <div className="flex gap-4 mb-3 text-xs text-slate-soft flex-wrap">
            <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-400 mr-1.5" />Principal</span>
            <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-400 mr-1.5" />Interest</span>
            <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-400/50 mr-1.5" />Balance</span>
          </div>
          <canvas ref={canvasRef} />
        </div>
      )}

      {/* Table */}
      <div className="bg-ink-card border border-white/7 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between flex-wrap gap-3">
          <span className="text-slate-soft text-xs font-700 uppercase tracking-wider">Monthly Breakdown</span>
          <div className="flex gap-2">
            {["all", "year"].map(f => (
              <button key={f} onClick={() => { setFilter(f); setPage(0); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-600 border transition-all ${
                  filter === f
                    ? "bg-gold/10 border-gold/40 text-gold"
                    : "bg-ink-muted border-white/10 text-slate-soft hover:text-white"
                }`}>
                {f === "all" ? "Monthly" : "Yearly"}
              </button>
            ))}
          </div>
        </div>

        <div ref={tableRef} className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm font-mono">
            <thead className="sticky top-0 bg-ink-soft">
              <tr>
                {["Month", "EMI (₹)", "Principal (₹)", "Interest (₹)", "Balance (₹)", "Paid %"].map(h => (
                  <th key={h} className="px-4 py-3 text-right first:text-center text-slate text-xs font-600 uppercase tracking-wider border-b border-white/7">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, idx) => (
                <tr key={idx} className="border-b border-white/4 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-2.5 text-center text-slate text-xs">{row.label}</td>
                  <td className="px-4 py-2.5 text-right text-gold font-600">{formatNumber(row.emi)}</td>
                  <td className="px-4 py-2.5 text-right text-green-400 font-500">{formatNumber(row.principal)}</td>
                  <td className="px-4 py-2.5 text-right text-red-400">{formatNumber(row.interest)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-soft">{formatNumber(row.balance)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-10 h-1 bg-white/8 rounded-full overflow-hidden">
                        <div className="h-full bg-gold rounded-full" style={{ width: `${row.paidPct}%` }} />
                      </div>
                      <span className="text-slate text-xs">{row.paidPct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-white/6 flex items-center justify-between text-xs text-slate flex-wrap gap-2">
            <span>Page {page + 1} / {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 bg-ink-muted border border-white/10 rounded-lg text-slate-soft disabled:opacity-30 hover:border-gold/40 hover:text-gold transition-all">
                ← Prev
              </button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 bg-ink-muted border border-white/10 rounded-lg text-slate-soft disabled:opacity-30 hover:border-gold/40 hover:text-gold transition-all">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}