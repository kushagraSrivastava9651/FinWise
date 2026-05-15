import { Link } from "react-router-dom";
import { Calculator, TrendingUp, GitCompare, Table2, PiggyBank, Wallet, ArrowRight, BarChart2, Receipt } from "lucide-react";

const features = [
  {
    to: "/emi",
    icon: Calculator,
    label: "EMI Calculator",
    desc: "Monthly instalments for any loan",
    badge: "Most Used",
    badgeColor: "bg-gold/15 text-gold",
  },
  {
    to: "/sip",
    icon: TrendingUp,
    label: "SIP Calculator",
    desc: "Grow wealth through monthly SIP",
    badge: null,
  },
  {
    to: "/compare",
    icon: GitCompare,
    label: "Loan Comparison",
    desc: "Compare EMI across 2–4 loans",
    badge: null,
  },
  {
    to: "/amortisation",
    icon: Table2,
    label: "Amortisation",
    desc: "Month-by-month payment schedule",
    badge: null,
  },
  {
    to: "/fd",
    icon: PiggyBank,
    label: "FD Calculator",
    desc: "Fixed deposit maturity value",
    badge: null,
  },
  {
    to: "/budget",
    icon: Wallet,
    label: "Budget Tracker",
    desc: "Income, expenses & savings",
    badge: "Coming Soon",
    badgeColor: "bg-white/5 text-slate-dim",
  },
    {
    to: "/tax",
    icon: Receipt,
    label: "Tax Calculator",
    desc: "Old vs new regime, FY 2025–26",
    badge: null,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-ink pt-20">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 pt-16 pb-12 text-center animate-slide-up-1">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/20 rounded-full mb-6">
          <BarChart2 size={14} className="text-gold" />
          <span className="text-gold text-xs font-medium">Smart Finance, Simplified</span>
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-800 text-white leading-none mb-4">
          Every number<br />
          <span className="text-gold">in your favour.</span>
        </h1>
        <p className="text-slate-soft text-lg max-w-lg mx-auto mb-8">
          Free financial calculators built for India — EMI, SIP, FD, and more.
        </p>
        <Link
          to="/emi"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-ink font-semibold rounded-xl hover:bg-gold-light transition-all"
        >
          Start with EMI <ArrowRight size={16} />
        </Link>
      </div>

      {/* Feature Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up-2">
        {features.map(({ to, icon: Icon, label, desc, badge, badgeColor }) => (
          <Link
            key={to}
            to={to}
            className="group bg-ink-soft border border-white/8 rounded-2xl p-5 hover:border-white/20 hover:bg-white/3 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-ink-muted rounded-xl flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                <Icon size={18} className="text-slate-soft group-hover:text-gold transition-colors" />
              </div>
              {badge && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
                  {badge}
                </span>
              )}
            </div>
            <h3 className="font-display text-base font-700 text-white mb-1">{label}</h3>
            <p className="text-sm text-slate-dim">{desc}</p>
            <div className="mt-4 flex items-center gap-1 text-xs text-slate-dim group-hover:text-gold transition-colors">
              Open <ArrowRight size={12} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}