import React from 'react';

export default function SecondaryMemberContent() {
  return (
    <div className="rounded-xl border border-[var(--border-section)] bg-[var(--bg-card)] p-12 text-center">
      <p className="text-lg font-medium text-[var(--text-primary)]">
        You are not listed as a secondary member on any wills.
      </p>
      <p className="text-[var(--text-muted-alt)] mt-2 max-w-md mx-auto">
        Wills where you are added as a secondary member will be displayed here.
      </p>
    </div>
  );
}
