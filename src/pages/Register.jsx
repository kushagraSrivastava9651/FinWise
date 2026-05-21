import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  if (user) {
    return <Navigate to="/profile" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setWorking(true);

    try {
      await register({ name, email, password });
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to register');
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink pt-24 pb-16 px-4 text-center">
      <div className="max-w-md mx-auto bg-ink-soft border border-white/10 rounded-3xl p-8 shadow-xl">
        <p className="text-gold text-xs font-mono uppercase tracking-widest mb-4">Create account</p>
        <h1 className="text-3xl font-display font-800 text-white mb-2">Register</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-left text-slate-soft text-xs uppercase tracking-wider">
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-ink-muted px-4 py-3 text-white outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              required
            />
          </label>
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
            {working ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="text-slate-dim text-sm mt-5">
          Already have an account? <Link className="text-gold hover:underline" to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
