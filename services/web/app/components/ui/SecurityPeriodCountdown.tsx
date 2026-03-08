'use client';

import { useState, useEffect } from 'react';

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function SecurityPeriodCountdown({ startTs, endTs }: { startTs: number; endTs: number }) {
  const now = useNow();

  const total    = endTs - startTs;
  const elapsed  = Math.min(Math.max(now - startTs, 0), total);
  const remaining = Math.max(endTs - now, 0);
  const pct      = total > 0 ? elapsed / total : 0;
  const done     = now >= endTs;

  const R   = 44;
  const C   = 2 * Math.PI * R;
  const strokeDashoffset = C * (1 - pct);

  const d = Math.floor(remaining / 86400);
  const h = Math.floor((remaining % 86400) / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-red-400">
        {done ? '⚠ Security period elapsed — will can be executed' : '⏳ Security period in progress'}
      </p>

      <div className="relative">
        <svg width="120" height="120" className="-rotate-90">
          <circle
            cx="60" cy="60" r={R}
            fill="none"
            strokeWidth="8"
            className="stroke-[var(--bg-section)]"
          />
          <circle
            cx="60" cy="60" r={R}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            style={{
              stroke: done ? '#a855f7' : '#ef4444',
              strokeDasharray: C,
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.8s ease',
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {done ? (
            <span className="text-xl font-bold text-purple-400">✓</span>
          ) : (
            <>
              <span className="text-base font-bold text-[var(--text-primary)] tabular-nums">
                {d > 0 ? `${d}d ${pad(h)}h` : `${pad(h)}:${pad(m)}:${pad(s)}`}
              </span>
              <span className="text-[10px] text-[var(--text-muted-alt)]">remaining</span>
            </>
          )}
        </div>
      </div>

      <div className="w-full max-w-xs">
        <div className="flex justify-between text-[10px] text-[var(--text-muted-alt)] mb-1">
          <span>Declaration</span>
          <span>{Math.round(pct * 100)}% elapsed</span>
          <span>Execution</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--bg-section)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct * 100}%`, background: done ? '#a855f7' : '#ef4444' }}
          />
        </div>
      </div>
    </div>
  );
}
