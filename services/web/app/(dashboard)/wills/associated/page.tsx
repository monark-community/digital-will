"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/components/ui/Header";
import { willService, authService, type AssociatedWill } from "@/lib/services";
import { useCurrentUser, useWallets } from "@/lib/hooks";
import type { User } from "@/lib/types";

const STATE_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  INACTIVE: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-100 text-green-700",
  CANCELED: "bg-red-100 text-red-700",
  EXECUTED: "bg-blue-100 text-blue-700",
};

const SM_STATE_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  VALIDATED: "bg-green-100 text-green-700",
  DECLARED_DEATH: "bg-red-100 text-red-700",
};

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum Mainnet",
  11155111: "Sepolia Testnet",
  56: "BNB Smart Chain",
  43114: "Avalanche C-Chain",
  31337: "Anvil",
};

export default function AssociatedWillsPage() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { data: wallets } = useWallets();
  const filterWalletDropdownRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [wills, setWills] = useState<AssociatedWill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilterWalletId, setSelectedFilterWalletId] = useState<string>("all");
  const [showFilterWalletDropdown, setShowFilterWalletDropdown] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    setUser(authService.getUser());
  }, [router]);

  useEffect(() => {
    if (currentUser) setUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterWalletDropdownRef.current && !filterWalletDropdownRef.current.contains(event.target as Node)) {
        setShowFilterWalletDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!authService.isAuthenticated()) return;
    const fetchAssociatedWills = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await willService.getAssociatedWills();
        setWills(data);
      } catch (err: any) {
        setError(err.message || "Failed to load associated wills");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssociatedWills();
  }, [mounted]);

  if (!mounted) return null;

  const selectedFilterWallet = wallets?.find(w => w.walletId === selectedFilterWalletId);

  const displayedWills = selectedFilterWalletId === "all"
    ? wills
    : wills.filter(will =>
        will.myMembership.walletAddress?.toLowerCase() === selectedFilterWallet?.address.toLowerCase()
      );

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-page)]">
      <Header isAuthenticated={true} user={user ?? undefined} />
      <div className="min-h-screen bg-[var(--bg-page)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Associated Wills</h1>
            <p className="text-[var(--text-muted)]">
              Wills where you have been designated as a secondary member.
            </p>
          </div>

          <div className="mb-8 relative" ref={filterWalletDropdownRef}>
            <button
              onClick={() => setShowFilterWalletDropdown(!showFilterWalletDropdown)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-5 flex items-center justify-between hover:border-[var(--accent)] transition-colors"
            >
              <div className="flex-1 text-left">
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                  {selectedFilterWalletId === "all"
                    ? "All Wallets"
                    : selectedFilterWallet?.label || `Wallet ${selectedFilterWallet?.address.slice(0, 8)}...`}
                </h3>
                <p className="text-sm text-[var(--text-muted-alt)] font-mono">
                  {selectedFilterWalletId === "all"
                    ? "Showing associated wills from all wallets"
                    : `wallet id : ${selectedFilterWallet?.address}`}
                </p>
              </div>
              <svg
                className={`w-6 h-6 text-[var(--text-primary)] transition-transform ${showFilterWalletDropdown ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showFilterWalletDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl shadow-lg z-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setSelectedFilterWalletId("all"); setShowFilterWalletDropdown(false); }}
                  className={`w-full p-4 text-left hover:bg-[var(--bg-section)] transition-colors border-b border-[var(--border-section)] ${selectedFilterWalletId === "all" ? "bg-[var(--bg-section)]" : ""}`}
                >
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">All Wallets</h3>
                  <p className="text-sm text-[var(--text-muted-alt)]">Show associated wills from all wallets</p>
                </button>
                {wallets && wallets.map((wallet) => (
                  <button
                    key={wallet.walletId}
                    type="button"
                    onClick={() => { setSelectedFilterWalletId(wallet.walletId); setShowFilterWalletDropdown(false); }}
                    className={`w-full p-4 text-left hover:bg-[var(--bg-section)] transition-colors border-b border-[var(--border-section)] last:border-b-0 ${selectedFilterWalletId === wallet.walletId ? "bg-[var(--bg-section)]" : ""}`}
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

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4">
              {error}
            </div>
          )}

          {!isLoading && !error && displayedWills.length === 0 && (
            <div className="text-center py-20 text-[var(--text-muted)]">
              <p className="text-lg">
                {selectedFilterWalletId === "all"
                  ? "You have not been designated as a secondary member in any will yet."
                  : "No associated wills for this wallet."}
              </p>
            </div>
          )}

          {!isLoading && !error && displayedWills.length > 0 && (
            <div className="space-y-6">
              {displayedWills.map((will) => (
                <div
                  key={will.willId}
                  className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-section)] shadow-sm overflow-hidden"
                >
                  {/* Will header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-section)]">
                    <div>
                      <span className="text-xs text-[var(--text-muted)] font-mono">Will ID</span>
                      <p className="font-mono text-sm text-[var(--text-primary)]">{will.willId}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATE_COLORS[will.state] ?? "bg-gray-100 text-gray-700"}`}>
                      {will.state}
                    </span>
                  </div>

                  <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-[var(--text-muted)]">Created by</span>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {will.owner.firstName} {will.owner.lastName}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{will.owner.email}</p>
                    </div>
                    <div>
                      <span className="text-xs text-[var(--text-muted)]">Owner wallet</span>
                      <p className="font-mono text-sm text-[var(--text-primary)] break-all">{will.walletAddress}</p>
                    </div>
                    {will.contractAddressInBlockchain && (
                      <div>
                        <span className="text-xs text-[var(--text-muted)]">Contract address</span>
                        <p className="font-mono text-sm text-[var(--text-primary)] break-all">{will.contractAddressInBlockchain}</p>
                      </div>
                    )}
                    {will.chainId && (
                      <div>
                        <span className="text-xs text-[var(--text-muted)]">Network</span>
                        <p className="text-sm text-[var(--text-primary)]">{CHAIN_NAMES[will.chainId] ?? `Chain ${will.chainId}`}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-[var(--text-muted)]">Security period</span>
                      <p className="text-sm text-[var(--text-primary)]">
                        {will.minSecurityPeriod} – {will.maxSecurityPeriod} days
                      </p>
                    </div>
                  </div>

                  {will.secondaryMembers.length > 0 && (
                    <div className="px-6 py-4 border-t border-[var(--border-section)]">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                        Secondary members ({will.secondaryMembers.length})
                      </h3>
                      <div className="space-y-2">
                        {will.secondaryMembers.map((sm) => {
                          const isMe = sm.secondaryMemberId === will.myMembership.secondaryMemberId;
                          return (
                            <div
                              key={sm.secondaryMemberId}
                              className={`flex items-center justify-between rounded-lg px-4 py-2 text-sm ${
                                isMe
                                  ? "bg-[var(--accent)]/10 border border-[var(--accent)]/30"
                                  : "bg-[var(--bg-section)]"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div>
                                  <span className={`font-medium ${ isMe ? "text-[var(--accent)]" : "text-[var(--text-primary)]" }`}>
                                    {sm.firstName} {sm.lastName}
                                  </span>
                                  {isMe && (
                                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--accent)] text-white">
                                      You
                                    </span>
                                  )}
                                  <span className="text-[var(--text-muted)] ml-2 text-xs">{sm.email}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[var(--text-muted)] text-xs">Power: {sm.votingPower}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SM_STATE_COLORS[sm.state] ?? "bg-gray-100 text-gray-700"}`}>
                                  {sm.state}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
