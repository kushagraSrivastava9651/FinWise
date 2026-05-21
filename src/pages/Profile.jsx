import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-ink pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto bg-ink-soft border border-white/10 rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-gold text-xs font-mono uppercase tracking-widest mb-2">Your profile</p>
            <h1 className="text-4xl font-display font-800 text-white">Welcome, {user.name}</h1>
            <p className="text-slate-soft mt-2">This session is secured with a JWT token and MongoDB-backed user store.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-ink-muted p-5">
              <p className="text-slate-dim text-xs uppercase tracking-wider mb-2">Email</p>
              <p className="text-white font-mono">{user.email}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-ink-muted p-5">
              <p className="text-slate-dim text-xs uppercase tracking-wider mb-2">User ID</p>
              <p className="text-white font-mono break-all">{user.id}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full rounded-2xl bg-red-500 px-4 py-3 text-white font-semibold hover:bg-red-600 transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
