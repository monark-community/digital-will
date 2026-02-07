import React from 'react';
import Link from 'next/link';
import { STUB_METRICS, STUB_WILL, STUB_ASSETS, formatCurrency } from './stub-data';

export default function PrimaryMemberContent() {
  const progressPercent = Math.min(100, (365 - STUB_WILL.inactivityDaysRemaining) / 365 * 100);

  return (
    <>
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--text-muted-alt)]">Total Asset Value</p>
            <p className="text-xl font-bold text-[var(--text-primary)] mt-1">{formatCurrency(STUB_METRICS.totalAssetValue)}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
              <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
            </svg>
          </div>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--text-muted-alt)]">Active Wills</p>
            <p className="text-xl font-bold text-[var(--text-primary)] mt-1">{STUB_METRICS.activeWills}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 011-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 011.52 0C14.51 3.81 17 5 19 5a1 1 0 011 1z" />
            </svg>
          </div>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--text-muted-alt)]">Secondary members</p>
            <p className="text-xl font-bold text-[var(--text-primary)] mt-1">{STUB_METRICS.beneficiaries}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--text-muted-alt)]">Last Activity</p>
            <p className="text-xl font-bold text-[var(--text-primary)] mt-1">{STUB_METRICS.lastActivity}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>
      </div>

      {/* Two panels */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Digital Wills */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Digital Wills</h2>
              <p className="text-sm text-[var(--text-muted-alt)]">Your active inheritance plans</p>
            </div>
            <Link
              href="#"
              className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] hover:opacity-90 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Will
            </Link>
          </div>
          <div className="border border-[var(--border-section)] rounded-lg p-5 bg-[var(--bg-section)]/50">
            <div className="flex items-start justify-between gap-2 mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">{STUB_WILL.title}</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--text-muted-alt)]/20 text-[var(--text-primary)]">
                <svg className="w-3.5 h-3.5 text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {STUB_WILL.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-[var(--text-muted-alt)]">Beneficiaries</p>
                <p className="font-medium text-[var(--text-primary)]">{STUB_WILL.beneficiariesCount} people</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted-alt)]">Assets</p>
                <p className="font-medium text-[var(--text-primary)]">{STUB_WILL.assetsCount} types</p>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-xs text-[var(--text-muted-alt)] mb-2">Inactivity Timer</p>
              <div className="h-2 bg-[var(--border-section)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--text-muted-alt)] rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-sm text-[var(--text-primary)] mt-1 font-medium">{STUB_WILL.inactivityDaysRemaining} days remaining</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-section)] text-[var(--text-primary)] hover:bg-[var(--bg-section)] text-sm font-medium transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.204-.107-.397.165-.71.505-.78.929l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Edit
              </button>
              <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-section)] text-[var(--text-primary)] hover:bg-[var(--bg-section)] text-sm font-medium transition-colors">
                View Details
              </button>
            </div>
          </div>
        </div>

        {/* Asset Overview */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Asset Overview</h2>
            <p className="text-sm text-[var(--text-muted-alt)]">Your protected digital assets</p>
          </div>
          <ul className="space-y-4 mb-6">
            {STUB_ASSETS.map((asset) => (
              <li key={asset.symbol} className="flex items-center gap-4 p-3 rounded-lg border border-[var(--border-section)] bg-[var(--bg-section)]/30">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${asset.iconBg} flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
                  {asset.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--text-primary)]">{asset.symbol}</p>
                  <p className="text-sm text-[var(--text-muted-alt)]">{asset.quantity} · {formatCurrency(asset.value)}</p>
                </div>
              </li>
            ))}
          </ul>
          <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border-section)] text-[var(--text-primary)] hover:bg-[var(--bg-section)] text-sm font-medium transition-colors">
            Manage Assets
          </button>
        </div>
      </div>
    </>
  );
}
