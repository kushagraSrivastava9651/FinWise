import { useState } from 'react';
import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  const from = location.state?.from?.pathname || '/profile';

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
      setError(err.message || 'Unable to login');
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink pt-24 pb-16 px-4 text-center">
      <div className="max-w-md mx-auto bg-ink-soft border border-white/10 rounded-3xl p-8 shadow-xl">
        <p className="text-gold text-xs font-mono uppercase tracking-widest mb-4">Member access</p>
        <h1 className="text-3xl font-display font-800 text-white mb-2">Login</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-left text-slate-soft text-xs uppercase tracking-wider">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-ink-muted px-4 py-3 text-white outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              required
            />
          </label>
          <label className="block text-left text-slate-soft text-xs uppercase tracking-wider">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-ink-muted px-4 py-3 text-white outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              required
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={working}
            className="w-full rounded-2xl bg-gold px-4 py-3 text-ink font-semibold hover:bg-gold-light transition"
          >
            {working ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="text-slate-dim text-sm mt-5">
          New here? <Link className="text-gold hover:underline" to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
