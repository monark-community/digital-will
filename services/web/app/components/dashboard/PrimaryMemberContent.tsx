'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { STUB_METRICS, STUB_WILL, STUB_ASSETS, formatCurrency } from './stub-data';
import { useWalletContext } from './WalletContext';
import { getMultiNetworkBalances, NETWORKS } from '@/lib/utils/wallet';
import { willService, type WillFromDB } from '@/lib/services';

interface WalletBalances {
  sepolia: string;
  mainnet: string;
  bnb: string;
  avax: string;
  total: number;
  totalCAD: number;
}

export default function PrimaryMemberContent() {
  const progressPercent = Math.min(100, (365 - STUB_WILL.inactivityDaysRemaining) / 365 * 100);
  const { selectedWallet, setSelectedWallet, wallets, isLoading } = useWalletContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [realWills, setRealWills] = useState<WillFromDB[]>([]);
  const [loadingWills, setLoadingWills] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedWallet) {
      setLoadingBalances(true);
      getMultiNetworkBalances(selectedWallet.address)
        .then(setBalances)
        .catch(err => {
          console.error('Error fetching balances:', err);
          setBalances({ sepolia: '0', mainnet: '0', bnb: '0', avax: '0', total: 0, totalCAD: 0 });
        })
        .finally(() => setLoadingBalances(false));

      setLoadingWills(true);
      willService.getWillsByWallet(selectedWallet.address)
        .then(setRealWills)
        .catch(err => {
          console.error('Error fetching wills:', err);
          setRealWills([]);
        })
        .finally(() => setLoadingWills(false));
    } else {
      setBalances(null);
      setRealWills([]);
    }
  }, [selectedWallet]);

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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">My Wills</h2>
            <Link
              href="/wills"
              className="text-sm text-[var(--accent)] hover:opacity-80 transition-opacity"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-4">
            {loadingWills ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
                <p className="text-[var(--text-muted-alt)] mt-4 text-sm">Loading wills...</p>
              </div>
            ) : realWills.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[var(--text-muted-alt)] mb-2">No wills created yet</p>
                <Link
                  href="/wills"
                  className="text-sm text-[var(--accent)] hover:opacity-80 transition-opacity"
                >
                  Create your first will →
                </Link>
              </div>
            ) : realWills.map((will) => (
              <div key={will.willId} className="border border-[var(--border-section)] rounded-lg p-4 bg-[var(--bg-section)]/30 hover:bg-[var(--bg-section)]/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-1">Will Contract</h3>
                    <p className="text-xs text-[var(--text-muted-alt)] font-mono break-all">{will.contractAddressInBlockchain}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-500 ml-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Deployed
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-[var(--text-muted-alt)]">Chain ID</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{will.chainId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted-alt)]">Beneficiaries</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{will.secondaryMembers.length} people</p>
                  </div>
                </div>

                <div className="border-t border-[var(--border-section)] pt-3 mt-3">
                  <p className="text-xs text-[var(--text-muted-alt)] mb-2">Secondary Members:</p>
                  <div className="space-y-2">
                    {will.secondaryMembers.slice(0, 2).map((member: WillFromDB['secondaryMembers'][0]) => (
                      <div key={member.secondaryMemberId} className="text-xs">
                        <span className="text-[var(--text-primary)] font-medium">{member.FirstName} {member.LastName}</span>
                        <p className="text-[var(--text-muted-alt)] font-mono text-[10px]">{member.walletAddress ? `${member.walletAddress.slice(0, 10)}...${member.walletAddress.slice(-8)}` : 'No wallet'}</p>
                      </div>
                    ))}
                    {will.secondaryMembers.length > 2 && (
                      <p className="text-[var(--text-muted-alt)] text-[10px]">+{will.secondaryMembers.length - 2} more</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <Link
                    href="/wills"
                    className="block w-full px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border-section)] text-[var(--text-primary)] hover:bg-[var(--bg-section)] transition-colors text-center"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          {/* Total Assets */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6">Total Assets</h2>
            {loadingBalances ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-[var(--text-muted-alt)]">Loading balances...</div>
              </div>
            ) : balances ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-[var(--text-primary)]">{balances.totalCAD.toFixed(2)} CAD</p>
                  <p className="text-sm text-[var(--text-muted-alt)] mt-1">Total Balance (All Networks)</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-[var(--text-muted-alt)]">No wallet selected</p>
              </div>
            )}
          </div>

          {/* Assets Overview */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6">Assets Overview</h2>
            {loadingBalances ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-[var(--text-muted-alt)]">Loading balances...</div>
              </div>
            ) : balances ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-section)] bg-[var(--bg-section)]/30">
                  <div className="flex items-center gap-3">
                    <div className={"w-10 h-10 rounded-full bg-gradient-to-br " + NETWORKS.SEPOLIA.iconBg + " flex items-center justify-center text-white font-semibold text-sm"}>
                      SEP
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{NETWORKS.SEPOLIA.name}</p>
                      <p className="text-xs text-[var(--text-muted-alt)]">Testnet</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[var(--text-primary)]">{balances.sepolia} {NETWORKS.SEPOLIA.symbol}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-section)] bg-[var(--bg-section)]/30">
                  <div className="flex items-center gap-3">
                    <div className={"w-10 h-10 rounded-full bg-gradient-to-br " + NETWORKS.MAINNET.iconBg + " flex items-center justify-center text-white font-semibold text-sm"}>
                      ETH
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{NETWORKS.MAINNET.name}</p>
                      <p className="text-xs text-[var(--text-muted-alt)]">Mainnet</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[var(--text-primary)]">{balances.mainnet} {NETWORKS.MAINNET.symbol}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-section)] bg-[var(--bg-section)]/30">
                  <div className="flex items-center gap-3">
                    <div className={"w-10 h-10 rounded-full bg-gradient-to-br " + NETWORKS.BNB.iconBg + " flex items-center justify-center text-white font-semibold text-sm"}>
                      BNB
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{NETWORKS.BNB.name}</p>
                      <p className="text-xs text-[var(--text-muted-alt)]">Mainnet</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[var(--text-primary)]">{balances.bnb} {NETWORKS.BNB.symbol}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-section)] bg-[var(--bg-section)]/30">
                  <div className="flex items-center gap-3">
                    <div className={"w-10 h-10 rounded-full bg-gradient-to-br " + NETWORKS.AVAX.iconBg + " flex items-center justify-center text-white font-semibold text-sm"}>
                      AVAX
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{NETWORKS.AVAX.name}</p>
                      <p className="text-xs text-[var(--text-muted-alt)]">Mainnet</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[var(--text-primary)]">{balances.avax} {NETWORKS.AVAX.symbol}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-[var(--text-muted-alt)]">No wallet selected</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
