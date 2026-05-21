import { AlertCircle } from 'lucide-react';

export default function AuthAlert({ message }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-left text-sm text-red-300"
    >
      <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
      <p>{message}</p>
    </div>
  );
}
