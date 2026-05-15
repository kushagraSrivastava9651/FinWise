import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { TrendingUp, Menu, X, Calculator, BarChart2, GitCompare, Table2, PiggyBank, Wallet, Receipt } from "lucide-react";

const navItems = [
  { to: "/emi", label: "EMI", icon: Calculator },
  { to: "/sip", label: "SIP", icon: TrendingUp },
  { to: "/compare", label: "Compare", icon: GitCompare },
  { to: "/amortisation", label: "Schedule", icon: Table2 },
  { to: "/fd", label: "FD", icon: PiggyBank },
  { to: "/budget", label: "Budget", icon: Wallet },
  { to: "/tax", label: "Tax", icon: Receipt },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-ink/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
            <BarChart2 size={16} className="text-ink" />
          </div>
          <span className="font-display font-800 text-lg text-white tracking-tight">
            Fin<span className="text-gold">Wise</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === to
                  ? "bg-gold/10 text-gold"
                  : "text-slate-soft hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>

        {/* Pro Badge + Mobile Menu */}
        <div className="flex items-center gap-3">
          <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 border border-gold/30 rounded-lg text-gold text-sm font-medium hover:bg-gold/20 transition-all">
            ✦ Go Pro · ₹199
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-slate-soft hover:text-white p-1"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-white/5 bg-ink-soft px-4 py-3 grid grid-cols-3 gap-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-medium transition-all ${
                pathname === to
                  ? "bg-gold/10 text-gold"
                  : "text-slate-soft hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
