import { useState } from 'react';
import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import AuthField from '../components/auth/AuthField';
import AuthAlert from '../components/auth/AuthAlert';

export default function Login() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  const from = location.state?.from?.pathname || '/profile';
  const returnLabel = from === '/profile' ? 'your profile' : 'where you left off';

  if (loading) {
    return (
      <AuthLayout eyebrow="Member access" title="Sign in" subtitle="Checking your session…">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gold" aria-label="Loading" />
        </div>
      </AuthLayout>
    );
  }

  if (user) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setWorking(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in. Check your email and password.');
    } finally {
      setWorking(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Member access"
      title="Welcome back"
      subtitle={`Sign in to continue to ${returnLabel}.`}
      footer={
        <p className="text-sm text-slate-dim">
          New to FinWise?{' '}
          <Link className="font-medium text-gold hover:underline" to="/register">
            Create an account
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          disabled={working}
          autoFocus
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Enter your password"
          disabled={working}
        />

        <AuthAlert message={error} />

        <button
          type="submit"
          disabled={working}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gold px-4 py-3.5 text-base font-semibold text-ink transition hover:bg-gold-light active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 sm:text-sm"
        >
          {working ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
