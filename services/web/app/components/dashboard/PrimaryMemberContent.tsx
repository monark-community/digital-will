import React from 'react';
import Link from 'next/link';
import { STUB_METRICS, STUB_WILL, STUB_ASSETS, STUB_WALLETS, formatCurrency } from './stub-data';

export default function PrimaryMemberContent() {
  const progressPercent = Math.min(100, (365 - STUB_WILL.inactivityDaysRemaining) / 365 * 100);
  const selectedWallet = STUB_WALLETS[0];

  return (
    <>
      <div className="mb-8">
        <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-5 flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">{selectedWallet.name}</h3>
            <p className="text-sm text-[var(--text-muted-alt)] font-mono">wallet id : {selectedWallet.address}</p>
          </div>
          <svg className="w-6 h-6 text-[var(--text-primary)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-6 flex items-center justify-center min-h-[400px]">
          <p className="text-[var(--text-muted-alt)] text-lg">List wills published</p>
        </div>

        <div className="space-y-8">
          <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-6 flex items-center justify-center min-h-[180px]">
            <p className="text-[var(--text-muted-alt)] text-lg">total assets</p>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-6 flex items-center justify-center min-h-[180px]">
            <p className="text-[var(--text-muted-alt)] text-lg">assets overview</p>
          </div>
        </div>
      </div>
    </>
  );
}
