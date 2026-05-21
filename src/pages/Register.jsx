import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import AuthField from '../components/auth/AuthField';
import AuthAlert from '../components/auth/AuthAlert';

export default function Register() {
  const { user, register, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  if (loading) {
    return (
      <AuthLayout eyebrow="Create account" title="Register" subtitle="Checking your session…">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gold" aria-label="Loading" />
        </div>
      </AuthLayout>
    );
  }

  if (user) {
    return <Navigate to="/profile" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setWorking(true);

    try {
      await register({ name, email, password });
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to create account. Try a different email.');
    } finally {
      setWorking(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Create account"
      title="Join FinWise"
      subtitle="Free account — use calculators and manage your profile on any device."
      footer={
        <p className="text-sm text-slate-dim">
          Already have an account?{' '}
          <Link className="font-medium text-gold hover:underline" to="/login">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <AuthField
          id="name"
          label="Full name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder="Your name"
          disabled={working}
        />
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
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="At least 6 characters"
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
              Creating account…
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
