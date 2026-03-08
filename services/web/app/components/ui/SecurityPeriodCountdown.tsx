'use client';

import { useState, useEffect } from 'react';

export function CooldownCountdown({ endTs, role = 'sm' }: { endTs: number; role?: 'pm' | 'sm' }) {
  const now = useNow();
  const remaining = Math.max(endTs - now, 0);
  if (now >= endTs) return null;

  const d = Math.floor(remaining / 86400);
  const h = Math.floor((remaining % 86400) / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = d > 0 ? `${d}d ${pad(h)}h ${pad(m)}m` : `${pad(h)}:${pad(m)}:${pad(s)}`;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-orange-500/20 bg-orange-500/5">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-orange-500/15 flex items-center justify-center">
        {/* lock icon */}
        <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Cooldown Active</p>
        <p className="text-xs text-[var(--text-muted-alt)] mt-0.5">
          {role === 'sm'
            ? <>You, and other secondary members cannot declare death for another{' '}<span className="font-mono text-orange-300">{timeStr}</span></>
            : <>Secondary members cannot declare death for another{' '}<span className="font-mono text-orange-300">{timeStr}</span></>}
        </p>
      </div>
    </div>
  );
}

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
