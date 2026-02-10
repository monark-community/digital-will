"use client";

import { useState } from "react";
import { useCurrentUser } from "@/lib/hooks";
import Header from "@/app/components/ui/Header";
import { STUB_WILLS, formatCurrency } from "@/app/components/dashboard/stub-data";

type WillStatus = 'Draft' | 'Inactive' | 'Active';

export default function WillsPage() {
  const { data: user } = useCurrentUser();
  const [filters, setFilters] = useState<Set<WillStatus>>(new Set(['Draft', 'Inactive', 'Active']));

  const toggleFilter = (status: WillStatus) => {
    const newFilters = new Set(filters);
    if (newFilters.has(status)) {
      newFilters.delete(status);
    } else {
      newFilters.add(status);
    }
    setFilters(newFilters);
  };

  const filteredWills = STUB_WILLS.filter(will => filters.has(will.status));

  return (
    <>
      <Header isAuthenticated={true} user={user} />
      <div className="min-h-screen bg-[var(--bg-page)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">My Wills</h1>
            <p className="text-[var(--text-muted)]">
              Manage your digital inheritance wills
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-4 justify-center">
            <button
              onClick={() => toggleFilter('Draft')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                filters.has('Draft')
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border-section)] bg-[var(--bg-card)]'
              }`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                filters.has('Draft')
                  ? 'border-[var(--accent)] bg-[var(--accent)]'
                  : 'border-[var(--text-muted-alt)]'
              }`}>
                {filters.has('Draft') && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)]">draft</span>
            </button>

            <button
              onClick={() => toggleFilter('Inactive')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                filters.has('Inactive')
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border-section)] bg-[var(--bg-card)]'
              }`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                filters.has('Inactive')
                  ? 'border-[var(--accent)] bg-[var(--accent)]'
                  : 'border-[var(--text-muted-alt)]'
              }`}>
                {filters.has('Inactive') && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)]">inactive</span>
            </button>

            <button
              onClick={() => toggleFilter('Active')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                filters.has('Active')
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border-section)] bg-[var(--bg-card)]'
              }`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                filters.has('Active')
                  ? 'border-[var(--accent)] bg-[var(--accent)]'
                  : 'border-[var(--text-muted-alt)]'
              }`}>
                {filters.has('Active') && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)]">active</span>
            </button>
          </div>

          {/* Wills List */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-6">
            <div className="space-y-4">
              {filteredWills.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[var(--text-muted-alt)]">No wills match the selected filters</p>
                </div>
              ) : (
                filteredWills.map((will) => (
                  <div key={will.id} className="border border-[var(--border-section)] rounded-lg p-4 bg-[var(--bg-section)]/30 hover:bg-[var(--bg-section)]/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-[var(--text-primary)]">{will.title}</h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        will.status === 'Active' 
                          ? 'bg-emerald-500/20 text-emerald-500' 
                          : will.status === 'Draft'
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : 'bg-gray-500/20 text-gray-500'
                      }`}>
                        {will.status === 'Active' && (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                        {will.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-[var(--text-muted-alt)]">Secondary Members</p>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{will.secondaryMembers.length} people</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-muted-alt)]">Total Value</p>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{formatCurrency(will.totalValue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-muted-alt)]">Assets</p>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{will.assets.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-muted-alt)]">Inactivity Period</p>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{will.inactivityPeriod} days</p>
                      </div>
                    </div>

                    <div className="border-t border-[var(--border-section)] pt-3 mt-3">
                      <p className="text-xs text-[var(--text-muted-alt)] mb-2">Beneficiaries:</p>
                      <div className="space-y-1">
                        {will.secondaryMembers.map((member, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-[var(--text-primary)]">{member.name}</span>
                            <span className="text-[var(--text-muted-alt)]">{member.allocation}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border-section)] text-[var(--text-primary)] hover:bg-[var(--bg-section)] transition-colors">
                        View Details
                      </button>
                      <button className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border-section)] text-[var(--text-primary)] hover:bg-[var(--bg-section)] transition-colors">
                        Edit
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
