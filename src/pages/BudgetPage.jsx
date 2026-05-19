import { useState, useMemo } from "react";
import { Plus, Trash2, Wallet, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import Seo from "../components/Seo";

// ─── Default Categories ───────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = [
  { id: "housing",       label: "Housing",       color: "#6366f1" },
  { id: "food",          label: "Food",           color: "#f59e0b" },
  { id: "transport",     label: "Transport",      color: "#3b82f6" },
  { id: "health",        label: "Health",         color: "#10b981" },
  { id: "entertainment", label: "Entertainment",  color: "#ec4899" },
  { id: "education",     label: "Education",      color: "#8b5cf6" },
  { id: "utilities",     label: "Utilities",      color: "#14b8a6" },
  { id: "clothing",      label: "Clothing",       color: "#f97316" },
  { id: "savings",       label: "Savings / Inv.", color: "#22c55e" },
  { id: "other",         label: "Other",          color: "#94a3b8" },
];

// ─── Formatting ───────────────────────────────────────────────────────────────

function formatINR(v) {
  if (!v && v !== 0) return "—";
  const n = Math.round(Number(v));
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function pct(part, whole) {
  if (!whole) return 0;
  return Math.min(100, (part / whole) * 100);
}

// ─── Unique ID ────────────────────────────────────────────────────────────────

let _id = 0;
const uid = () => `e${++_id}`;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BudgetPage() {
  const currentMonth = new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });

  const [income, setIncome]       = useState(80000);
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput]     = useState("80000");

  // expenses: { id, label, amount, categoryId }
  const [expenses, setExpenses] = useState([
    { id: uid(), label: "Rent",          amount: 18000, categoryId: "housing"       },
    { id: uid(), label: "Groceries",     amount: 6000,  categoryId: "food"          },
    { id: uid(), label: "Metro / Petrol",amount: 3000,  categoryId: "transport"     },
    { id: uid(), label: "OTT & Leisure", amount: 1500,  categoryId: "entertainment" },
    { id: uid(), label: "Electricity",   amount: 2000,  categoryId: "utilities"     },
  ]);

  const [newLabel,    setNewLabel]    = useState("");
  const [newAmount,   setNewAmount]   = useState("");
  const [newCategory, setNewCategory] = useState("food");
  const [expandedCat, setExpandedCat] = useState(null);

  // ── Derived ──
  const totalExpenses = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.amount || 0), 0),
    [expenses]
  );
  const savings    = income - totalExpenses;
  const savingsPct = pct(Math.max(0, savings), income);

  // Group by category
  const byCategory = useMemo(() => {
    const map = {};
    for (const cat of DEFAULT_CATEGORIES) {
      const items = expenses.filter((e) => e.categoryId === cat.id);
      const total = items.reduce((s, e) => s + Number(e.amount || 0), 0);
      map[cat.id] = { ...cat, items, total };
    }
    return map;
  }, [expenses]);

  const activeCats = DEFAULT_CATEGORIES.filter((c) => byCategory[c.id].total > 0);

  // ── Handlers ──
  function addExpense() {
    if (!newLabel.trim() || !newAmount || Number(newAmount) <= 0) return;
    setExpenses((prev) => [
      ...prev,
      { id: uid(), label: newLabel.trim(), amount: Number(newAmount), categoryId: newCategory },
    ]);
    setNewLabel("");
    setNewAmount("");
  }

  function removeExpense(id) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  function updateExpenseAmount(id, val) {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, amount: val } : e))
    );
  }

  function commitIncome() {
    const v = Number(incomeInput.replace(/,/g, ""));
    if (!isNaN(v) && v >= 0) setIncome(v);
    setEditingIncome(false);
  }

  // ── Budget health tip ──
  const tip = useMemo(() => {
    if (!income) return null;
    const spentPct = (totalExpenses / income) * 100;
    const housingTotal = byCategory["housing"].total;
    const housingPct   = income ? (housingTotal / income) * 100 : 0;
    if (savings < 0)          return { type: "danger",  text: `You're overspending by ${formatINR(-savings)}. Review your largest categories.` };
    if (savingsPct < 10)      return { type: "warn",    text: `Only ${savingsPct.toFixed(0)}% saved. Aim for 20%+ — try trimming Entertainment or Food.` };
    if (housingPct > 40)      return { type: "warn",    text: `Housing is ${housingPct.toFixed(0)}% of income — above the recommended 30% cap.` };
    if (savingsPct >= 30)     return { type: "great",   text: `Excellent! You're saving ${savingsPct.toFixed(0)}% of income. Consider investing the surplus in SIP.` };
    return { type: "ok",      text: `You're saving ${savingsPct.toFixed(0)}% (${formatINR(savings)}/mo). Aim to push this above 20%.` };
  }, [income, totalExpenses, savings, savingsPct, byCategory]);

  // ── Savings bar colour ──
  const savingsBarColor = savings < 0 ? "#ef4444" : savingsPct >= 20 ? "#34d399" : "#f59e0b";

  return (
    <div className="min-h-screen bg-ink pt-20 pb-16">
      <Seo
        title="Budget Tracker | FinWise"
        description="Track monthly income, expenses and savings with category-based budgeting. Spot overspending and improve your cash flow."
        keywords="budget tracker, expense tracker, savings planner, monthly budget"
      />

      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-6 animate-slide-up-1">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-gold text-xs font-mono uppercase tracking-widest mb-2">Calculator · Budget</p>
            <h1 className="font-display text-4xl font-800 text-white leading-none">Budget Tracker</h1>
            <p className="text-slate-soft mt-2 text-sm">{currentMonth} — income, expenses &amp; savings</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gold/10 border border-gold/20 rounded-full">
            <Wallet size={13} className="text-gold" />
            <span className="text-gold text-xs font-medium">Monthly View</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left — Income + Add Expense */}
        <div className="lg:col-span-3 space-y-5 animate-slide-up-2">

          {/* Income card */}
          <div className="bg-ink-soft border border-white/8 rounded-2xl p-6">
            <p className="text-xs text-slate-dim uppercase tracking-wider font-mono mb-4">Monthly Income</p>
            {editingIncome ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl text-slate-dim font-mono">₹</span>
                <input
                  autoFocus
                  type="number"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  onBlur={commitIncome}
                  onKeyDown={(e) => e.key === "Enter" && commitIncome()}
                  className="flex-1 bg-transparent font-mono text-3xl font-bold text-white outline-none border-b border-gold/40 pb-1"
                />
              </div>
            ) : (
              <button
                onClick={() => { setIncomeInput(String(income)); setEditingIncome(true); }}
                className="group flex items-baseline gap-2"
              >
                <span className="font-display text-5xl font-800 text-white group-hover:text-gold transition-colors">
                  {formatINR(income)}
                </span>
                <span className="text-xs text-slate-dim group-hover:text-gold transition-colors">click to edit</span>
              </button>
            )}

            {/* Income breakdown bar */}
            <div className="mt-5 space-y-2">
              <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                {activeCats.map((cat) => (
                  <div
                    key={cat.id}
                    style={{
                      width: `${pct(byCategory[cat.id].total, income)}%`,
                      backgroundColor: cat.color,
                      opacity: 0.85,
                    }}
                    className="transition-all duration-500 first:rounded-l-full"
                    title={`${cat.label}: ${formatINR(byCategory[cat.id].total)}`}
                  />
                ))}
                {/* savings portion */}
                {savings > 0 && (
                  <div
                    style={{ width: `${savingsPct}%`, backgroundColor: savingsBarColor }}
                    className="transition-all duration-500 rounded-r-full"
                    title={`Savings: ${formatINR(savings)}`}
                  />
                )}
                {savings < 0 && (
                  <div className="flex-1 bg-red-500/30 rounded-r-full" />
                )}
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-dim">
                  Spent: <span className="text-white font-mono">{formatINR(totalExpenses)}</span>
                </span>
                <span className={savings >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {savings >= 0 ? "Left: " : "Over: "}
                  <span className="font-mono">{formatINR(Math.abs(savings))}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Add expense */}
          <div className="bg-ink-soft border border-white/8 rounded-2xl p-6">
            <p className="text-xs text-slate-dim uppercase tracking-wider font-mono mb-4">Add Expense</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Label (e.g. Rent)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addExpense()}
                className="sm:col-span-1 bg-ink-muted border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-dim outline-none focus:border-white/20 transition-colors"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-dim text-sm">₹</span>
                <input
                  type="number"
                  placeholder="Amount"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addExpense()}
                  className="w-full bg-ink-muted border border-white/8 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white placeholder-slate-dim outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-ink-muted border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-white/20 transition-colors appearance-none cursor-pointer"
              >
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id} style={{ background: "#1a1a2e" }}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={addExpense}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-gold/15 border border-gold/30 text-gold text-sm font-medium rounded-xl hover:bg-gold/25 transition-all"
            >
              <Plus size={15} /> Add Expense
            </button>
          </div>

          {/* Expense list by category */}
          <div className="bg-ink-soft border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/8">
              <p className="text-xs text-slate-dim uppercase tracking-wider font-mono">Expenses by Category</p>
            </div>
            <div className="divide-y divide-white/4">
              {DEFAULT_CATEGORIES.filter((c) => byCategory[c.id].items.length > 0).map((cat) => {
                const { items, total, color } = byCategory[cat.id];
                const isOpen = expandedCat === cat.id;
                return (
                  <div key={cat.id}>
                    <button
                      onClick={() => setExpandedCat(isOpen ? null : cat.id)}
                      className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-white/3 transition-colors group"
                    >
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="flex-1 text-sm text-left text-white font-medium">{cat.label}</span>
                      <span className="font-mono text-sm text-white mr-2">{formatINR(total)}</span>
                      <span className="text-xs text-slate-dim w-10 text-right">{pct(total, income).toFixed(0)}%</span>
                      {isOpen
                        ? <ChevronUp   size={14} className="text-slate-dim group-hover:text-white transition-colors ml-1" />
                        : <ChevronDown size={14} className="text-slate-dim group-hover:text-white transition-colors ml-1" />}
                    </button>

                    {isOpen && (
                      <div className="bg-ink-muted border-t border-white/4">
                        {items.map((exp) => (
                          <div key={exp.id} className="flex items-center gap-3 px-6 py-2.5 group/row">
                            <span className="flex-1 text-xs text-slate-soft">{exp.label}</span>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-dim text-xs">₹</span>
                              <input
                                type="number"
                                value={exp.amount}
                                onChange={(e) => updateExpenseAmount(exp.id, Number(e.target.value))}
                                className="w-24 bg-white/5 border border-white/8 rounded-lg pl-5 pr-2 py-1 text-xs font-mono text-white outline-none focus:border-white/20 text-right"
                              />
                            </div>
                            <button
                              onClick={() => removeExpense(exp.id)}
                              className="opacity-0 group-hover/row:opacity-100 transition-opacity text-slate-dim hover:text-red-400"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {expenses.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-slate-dim">
                  No expenses added yet. Add one above.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right — Summary */}
        <div className="lg:col-span-2 space-y-4 animate-slide-up-3">

          {/* Savings card */}
          <div className={`rounded-2xl p-6 border ${
            savings < 0
              ? "bg-gradient-to-br from-red-500/20 to-red-900/10 border-red-500/30"
              : savingsPct >= 20
              ? "bg-gradient-to-br from-emerald-500/20 to-emerald-900/10 border-emerald-500/30"
              : "bg-gradient-to-br from-amber-500/15 to-amber-900/10 border-amber-500/25"
          }`}>
            <p className={`text-xs font-mono uppercase tracking-widest mb-1 ${
              savings < 0 ? "text-red-400/70" : savingsPct >= 20 ? "text-emerald-400/70" : "text-amber-400/70"
            }`}>
              {savings < 0 ? "Overspent" : "Monthly Savings"}
            </p>
            <p className="font-display text-5xl font-800 text-white leading-none">
              {savings < 0 ? `-${formatINR(-savings)}` : formatINR(savings)}
            </p>
            <p className={`text-xs mt-2 ${savings < 0 ? "text-red-400/70" : "text-emerald-400/60"}`}>
              {savings >= 0
                ? `${savingsPct.toFixed(1)}% of income saved`
                : `Spending exceeds income by ${(((-savings) / income) * 100).toFixed(1)}%`}
            </p>
          </div>

          {/* Stats */}
          <div className="bg-ink-soft border border-white/8 rounded-2xl p-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-dim mb-1">Total Income</p>
              <p className="font-mono text-sm font-medium text-white">{formatINR(income)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-dim mb-1">Total Expenses</p>
              <p className="font-mono text-sm font-medium text-white">{formatINR(totalExpenses)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-dim mb-1">No. of Items</p>
              <p className="font-mono text-sm font-medium text-white">{expenses.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-dim mb-1">Avg / Item</p>
              <p className="font-mono text-sm font-medium text-white">
                {expenses.length ? formatINR(Math.round(totalExpenses / expenses.length)) : "—"}
              </p>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="bg-ink-soft border border-white/8 rounded-2xl p-5">
            <p className="text-xs text-slate-dim uppercase tracking-wider mb-4">Spending Breakdown</p>
            <div className="space-y-3">
              {activeCats.length === 0 && (
                <p className="text-xs text-slate-dim text-center py-4">No expenses yet</p>
              )}
              {activeCats.map((cat) => {
                const { total, color } = byCategory[cat.id];
                const barPct = pct(total, totalExpenses);
                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-slate-soft">{cat.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white">{formatINR(total)}</span>
                        <span className="text-slate-dim w-8 text-right">{barPct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${barPct}%`, backgroundColor: color, opacity: 0.75 }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Savings row */}
              {income > 0 && (
                <div className="space-y-1 pt-1 border-t border-white/5 mt-2">
                  <div className="flex justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: savingsBarColor }} />
                      <span className="text-slate-soft">Savings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono" style={{ color: savingsBarColor }}>{formatINR(Math.max(0, savings))}</span>
                      <span className="text-slate-dim w-8 text-right">{savingsPct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${savingsPct}%`, backgroundColor: savingsBarColor, opacity: 0.75 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Health tip */}
          {tip && (
            <div className={`flex items-start gap-2.5 rounded-xl p-4 border ${
              tip.type === "danger" ? "bg-red-500/5 border-red-500/20"
              : tip.type === "warn"  ? "bg-amber-500/5 border-amber-500/20"
              : tip.type === "great" ? "bg-emerald-500/5 border-emerald-500/15"
              : "bg-white/3 border-white/8"
            }`}>
              <Sparkles size={14} className={`mt-0.5 shrink-0 ${
                tip.type === "danger" ? "text-red-400"
                : tip.type === "warn"  ? "text-amber-400"
                : "text-emerald-400"
              }`} />
              <p className="text-xs text-slate-soft leading-relaxed">{tip.text}</p>
            </div>
          )}

          {/* 50/30/20 rule reference */}
          <div className="bg-ink-soft border border-white/8 rounded-2xl p-5">
            <p className="text-xs text-slate-dim uppercase tracking-wider mb-3">50 / 30 / 20 Rule</p>
            <div className="space-y-2">
              {[
                { label: "Needs (50%)",  target: income * 0.5,  color: "#6366f1" },
                { label: "Wants (30%)",  target: income * 0.3,  color: "#f59e0b" },
                { label: "Savings (20%)", target: income * 0.2, color: "#34d399" },
              ].map(({ label, target, color }) => (
                <div key={label} className="flex justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-slate-soft">{label}</span>
                  </div>
                  <span className="font-mono text-white">{formatINR(target)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}