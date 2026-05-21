import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function AuthField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
  inputMode,
  placeholder,
  required = true,
  disabled = false,
  error,
  autoFocus = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-left text-sm font-medium text-slate-soft">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={inputType}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full min-h-[48px] rounded-2xl border bg-ink-muted px-4 py-3 text-base text-white placeholder:text-slate-dim/80 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm ${
            error
              ? 'border-red-400/60 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
              : 'border-white/10 focus:border-gold focus:ring-2 focus:ring-gold/20'
          } ${isPassword ? 'pr-12' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={disabled}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-dim transition hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-left text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
