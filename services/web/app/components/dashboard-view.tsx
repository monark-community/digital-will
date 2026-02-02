'use client';

import React, { useState } from 'react';
import {
  type MemberRole,
  STUB_USER,
  PrimaryMemberContent,
  SecondaryMemberContent,
} from './dashboard';

export default function DashboardView() {
  const [activeRole, setActiveRole] = useState<MemberRole>('primary');

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-section)] border border-[var(--border-section)] w-fit mb-6">
          <button
            type="button"
            onClick={() => setActiveRole('primary')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeRole === 'primary'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
            }`}
          >
            Primary member
          </button>
          <button
            type="button"
            onClick={() => setActiveRole('secondary')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeRole === 'secondary'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
            }`}
          >
            Secondary member
          </button>
        </div>

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
            Welcome back, {STUB_USER.firstName} {STUB_USER.lastName}
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Manage your digital inheritance and secure your legacy
          </p>
        </div>

        {activeRole === 'secondary' ? (
          <SecondaryMemberContent />
        ) : (
          <PrimaryMemberContent />
        )}
      </div>
    </div>
  );
}
