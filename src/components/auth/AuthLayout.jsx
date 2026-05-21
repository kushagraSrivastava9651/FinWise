import { Link } from 'react-router-dom';
import { ArrowLeft, Calculator, Shield, Sparkles } from 'lucide-react';

const perks = [
  { icon: Calculator, text: 'Save calculator preferences' },
  { icon: Shield, text: 'Secure sign-in with encrypted session' },
  { icon: Sparkles, text: 'Access profile and future Pro tools' },
];

export default function AuthLayout({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="min-h-[100dvh] bg-ink">
      <div className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col lg:flex-row">
        <aside className="relative hidden overflow-hidden border-r border-white/5 bg-ink-soft lg:flex lg:w-[42%] lg:flex-col lg:justify-between lg:p-10 xl:p-12">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-slate-soft transition hover:text-gold"
            >
              <ArrowLeft size={16} />
              Back to FinWise
            </Link>
            <p className="mt-10 font-mono text-xs uppercase tracking-[0.2em] text-gold">FinWise</p>
            <h2 className="mt-3 font-display text-3xl font-800 leading-tight text-white xl:text-4xl">
              Plan smarter with your personal finance hub
            </h2>
            <p className="mt-4 max-w-sm text-slate-soft">
              Sign in once to unlock your profile and keep your tools in sync across devices.
            </p>
          </div>
          <ul className="mt-10 space-y-4">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-soft">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                  <Icon size={16} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex flex-1 flex-col justify-center px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[calc(5rem+env(safe-area-inset-top))] sm:px-6 sm:py-10 lg:px-10 lg:py-12 lg:pt-12">
          <Link
            to="/"
            className="mb-6 inline-flex min-h-[44px] w-fit items-center gap-2 rounded-xl px-1 text-sm text-slate-soft transition hover:text-gold lg:hidden"
          >
            <ArrowLeft size={16} />
            Back
          </Link>

          <div className="mx-auto w-full max-w-md animate-fade-in">
            <div className="rounded-3xl border border-white/10 bg-ink-soft p-6 shadow-xl sm:p-8">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">{eyebrow}</p>
              <h1 className="mt-2 font-display text-2xl font-800 text-white sm:text-3xl">{title}</h1>
              {subtitle && (
                <p className="mt-2 text-sm leading-relaxed text-slate-soft sm:text-base">{subtitle}</p>
              )}
              <div className="mt-6 sm:mt-8">{children}</div>
              {footer && <div className="mt-6 border-t border-white/5 pt-6 text-center">{footer}</div>}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
