import { useState, useEffect } from "react";

export default function SliderInput({ label, value, min, max, step, onChange, format, unit }) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  // Local raw text state for the editable input
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState(String(value));

  // Keep raw in sync when value changes externally (preset buttons etc.)
  useEffect(() => {
    if (!editing) setRaw(String(value));
  }, [value, editing]);

  const handleFocus = () => {
    setEditing(true);
    setRaw(String(value));
  };

  const commit = (str) => {
    setEditing(false);
    // Strip any non-numeric chars (₹, commas, spaces, letters)
    const num = parseFloat(str.replace(/[^0-9.]/g, ""));
    if (!isNaN(num)) {
      const clamped = Math.min(max, Math.max(min, num));
      // Snap to nearest step
      const snapped = Math.round(clamped / step) * step;
      onChange(snapped);
      setRaw(String(snapped));
    } else {
      setRaw(String(value)); // revert on bad input
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") e.target.blur();
    if (e.key === "Escape") { setEditing(false); setRaw(String(value)); e.target.blur(); }
    // Arrow key nudge
    if (e.key === "ArrowUp") { e.preventDefault(); onChange(Math.min(max, value + step)); }
    if (e.key === "ArrowDown") { e.preventDefault(); onChange(Math.max(min, value - step)); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm text-slate-soft font-medium shrink-0">{label}</label>

        {/* Editable value box */}
        <div className={`flex items-center gap-1 bg-ink-muted border rounded-lg px-3 py-1.5 transition-all min-w-[110px] ${
          editing ? "border-gold/60 ring-2 ring-gold/15" : "border-white/10 hover:border-white/25 cursor-text"
        }`}>
          {editing ? (
            <input
              autoFocus
              type="text"
              inputMode="decimal"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              onBlur={(e) => commit(e.target.value)}
              onKeyDown={handleKeyDown}
              className="font-mono text-sm font-medium text-gold bg-transparent outline-none w-full text-right"
            />
          ) : (
            <span
              onClick={handleFocus}
              className="font-mono text-sm font-medium text-white w-full text-right cursor-text select-none"
            >
              {format ? format(value) : value.toLocaleString("en-IN")}
            </span>
          )}
          {unit && (
            <span className="text-xs text-slate-dim ml-1 shrink-0">{unit}</span>
          )}
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full relative z-10"
          style={{
            background: `linear-gradient(to right, #F5C842 ${pct}%, #2A2A3A ${pct}%)`,
          }}
        />
      </div>

      {/* Min / Max labels */}
      <div className="flex justify-between text-xs text-slate-dim">
        <span>{format ? format(min) : min.toLocaleString("en-IN")}{unit ? ` ${unit}` : ""}</span>
        <span>{format ? format(max) : max.toLocaleString("en-IN")}{unit ? ` ${unit}` : ""}</span>
      </div>
    </div>
  );
}