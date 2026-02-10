'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { STUB_METRICS, STUB_WILL, STUB_ASSETS, STUB_WILLS, formatCurrency } from './stub-data';
import { useWalletContext } from './WalletContext';

export default function PrimaryMemberContent() {
  const progressPercent = Math.min(100, (365 - STUB_WILL.inactivityDaysRemaining) / 365 * 100);
  const { selectedWallet, setSelectedWallet, wallets, isLoading } = useWalletContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWalletSelect = (wallet: typeof selectedWallet) => {
    setSelectedWallet(wallet);
    setIsDropdownOpen(false);
  };

  return (
    <>
      {/* Wallet Selector Bar */}
      {isLoading ? (
        <div className="mb-8">
          <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-5 flex items-center justify-between">
            <div className="flex-1">
              <div className="h-5 w-32 bg-[var(--bg-section)] rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-[var(--bg-section)] rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      ) : selectedWallet ? (
        <div className="mb-8 relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-5 flex items-center justify-between hover:border-[var(--accent)] transition-colors"
          >
            <div className="flex-1 text-left">
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                {selectedWallet.label || `Wallet ${selectedWallet.address.slice(0, 8)}...`}
              </h3>
              <p className="text-sm text-[var(--text-muted-alt)] font-mono">wallet id : {selectedWallet.address}</p>
            </div>
            <svg 
              className={`w-6 h-6 text-[var(--text-primary)] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              strokeWidth={2} 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && wallets && wallets.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl shadow-lg z-50 overflow-hidden">
              {wallets.length === 1 ? (
                <div className="p-4 text-center text-sm text-[var(--text-muted-alt)]">
                  There are no other wallets available.
                </div>
              ) : (
                wallets.map((wallet) => (
                  <button
                    key={wallet.walletId}
                    onClick={() => handleWalletSelect(wallet)}
                    className={`w-full p-4 text-left hover:bg-[var(--bg-section)] transition-colors border-b border-[var(--border-section)] last:border-b-0 ${
                      wallet.walletId === selectedWallet.walletId ? 'bg-[var(--bg-section)]' : ''
                    }`}
                  >
                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                      {wallet.label || `Wallet ${wallet.address.slice(0, 8)}...`}
                    </h3>
                    <p className="text-sm text-[var(--text-muted-alt)] font-mono">wallet id : {wallet.address}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-8">
          <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-5 flex items-center justify-between">
            <div className="flex-1 text-left">
              <h3 className="text-base font-semibold text-[var(--text-muted-alt)] mb-1">
                No wallet selected
              </h3>
              <p className="text-sm text-[var(--text-muted-alt)]">Please add a wallet to continue</p>
            </div>
            <svg 
              className="w-6 h-6 text-[var(--text-muted-alt)]" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth={2} 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6">Active Wills</h2>
          <div className="space-y-4">
            {STUB_WILLS.filter(will => will.status === 'Active').map((will) => (
              <div key={will.id} className="border border-[var(--border-section)] rounded-lg p-4 bg-[var(--bg-section)]/30 hover:bg-[var(--bg-section)]/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-[var(--text-primary)]">{will.title}</h3>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    will.status === 'Active' 
                      ? 'bg-emerald-500/20 text-emerald-500' 
                      : 'bg-yellow-500/20 text-yellow-500'
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
            ))}
          </div>
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
