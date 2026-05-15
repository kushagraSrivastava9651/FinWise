import { Link } from "react-router-dom";
import { ArrowLeft, Wrench } from "lucide-react";

export function Placeholder({ title, description }) {
  return (
    <div className="min-h-screen bg-ink pt-20 flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="w-16 h-16 bg-ink-soft border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Wrench size={24} className="text-slate-dim" />
        </div>
        <h1 className="font-display text-3xl font-800 text-white mb-2">{title}</h1>
        <p className="text-slate-soft mb-6">{description}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors"
        >
          <ArrowLeft size={14} /> Back to Home
        </Link>
      </div>
    </div>
  );
}

export function SIPPage() {
  return <Placeholder title="SIP Calculator" description="Coming up next — monthly SIP projections with compound growth visualisation." />;
}
export function ComparePage() {
  return <Placeholder title="Loan Comparison" description="Side-by-side EMI, interest, and tenure comparison for up to 4 loans." />;
}
export function AmortisationPage() {
  return <Placeholder title="Amortisation Schedule" description="Full month-by-month breakdown of principal, interest and balance." />;
}
export function FDPage() {
  return <Placeholder title="FD Calculator" description="Fixed deposit maturity value with annual/quarterly compounding." />;
}
export function BudgetPage() {
  return <Placeholder title="Budget Tracker" description="Track income, categorised expenses, and leftover savings each month." />;
}
export function TaxPage() {
  return <Placeholder title="Tax Calculator" description="Old vs New regime comparison for FY 2024-25." />;
}
