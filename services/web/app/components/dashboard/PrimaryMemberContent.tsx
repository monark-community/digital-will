'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { STUB_METRICS, STUB_WILL, STUB_ASSETS, formatCurrency } from './stub-data';
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

          {isDropdownOpen && wallets && wallets.length > 1 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl shadow-lg z-50 overflow-hidden">
              {wallets.map((wallet) => (
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
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-8">
          <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-5 flex items-center justify-center">
            <p className="text-[var(--text-muted-alt)]">No wallets found. Please add a wallet to continue.</p>
          </div>
        </div>
      )}

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
