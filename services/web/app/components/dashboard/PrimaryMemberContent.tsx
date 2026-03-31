"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  STUB_METRICS,
  STUB_WILL,
  STUB_ASSETS,
  formatCurrency,
} from "./stub-data";
import { useWalletContext } from "./WalletContext";
import { getMultiNetworkBalances, NETWORKS } from "@/lib/utils/wallet";
import { willService, type WillFromDB } from "@/lib/services";
import { displaySecurityPeriod } from "@/lib/utils/blockchain";

interface WalletBalances {
  sepolia: string;
  mainnet: string;
  bnb: string;
  avax: string;
  total: number;
  totalCAD: number;
}

export default function PrimaryMemberContent() {
  const progressPercent = Math.min(
    100,
    ((365 - STUB_WILL.inactivityDaysRemaining) / 365) * 100,
  );
  const { selectedWallet, setSelectedWallet, wallets, isLoading } =
    useWalletContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [realWills, setRealWills] = useState<WillFromDB[]>([]);
  const [loadingWills, setLoadingWills] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedWallet) {
      setLoadingBalances(true);
      getMultiNetworkBalances(selectedWallet.address)
        .then(setBalances)
        .catch((err) => {
          console.error("Error fetching balances:", err);
          setBalances({
            sepolia: "0",
            mainnet: "0",
            bnb: "0",
            avax: "0",
            total: 0,
            totalCAD: 0,
          });
        })
        .finally(() => setLoadingBalances(false));

      setLoadingWills(true);
      willService
        .getWillsByWallet(selectedWallet.address)
        .then((wills) => setRealWills(wills.filter((w) => w.state !== "DRAFT")))
        .catch((err) => {
          console.error("Error fetching wills:", err);
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
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-section)] border border-[var(--border-section)] flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-[var(--accent)]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7.5A2.5 2.5 0 015.5 5h13A2.5 2.5 0 0121 7.5v9A2.5 2.5 0 0118.5 19h-13A2.5 2.5 0 013 16.5v-9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12h3"
                  />
                </svg>
              </div>
              <div className="text-left min-w-0">
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1 truncate">
                  {selectedWallet.label ||
                    `Wallet ${selectedWallet.address.slice(0, 8)}...`}
                </h3>
                <p className="text-sm text-[var(--text-muted-alt)] font-mono truncate">
                  wallet id : {selectedWallet.address}
                </p>
              </div>
            </div>
            <svg
              className={`w-6 h-6 text-[var(--text-primary)] transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
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
                      wallet.walletId === selectedWallet.walletId
                        ? "bg-[var(--bg-section)]"
                        : ""
                    }`}
                  >
                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                      {wallet.label ||
                        `Wallet ${wallet.address.slice(0, 8)}...`}
                    </h3>
                    <p className="text-sm text-[var(--text-muted-alt)] font-mono">
                      wallet id : {wallet.address}
                    </p>
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
              <p className="text-sm text-[var(--text-muted-alt)]">
                Please add a wallet to continue
              </p>
            </div>
            <svg
              className="w-6 h-6 text-[var(--text-muted-alt)]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-section)] border border-[var(--border-section)] flex items-center justify-center flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-[var(--accent)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                My Wills
              </h2>
            </div>
            <Link
              href="/wills"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
            >
              <span>View All</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
          <div className="space-y-4">
            {loadingWills ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
                <p className="text-[var(--text-muted-alt)] mt-4 text-sm">
                  Loading wills...
                </p>
              </div>
            ) : realWills.length === 0 ? (
              <div className="text-center py-8">
                <div className="border border-[var(--border-section)] rounded-lg p-6 bg-[var(--bg-section)]/30">
                  <p className="text-[var(--text-muted-alt)]">
                    No wills created yet
                  </p>
                </div>
              </div>
            ) : (
              realWills.map((will) => (
                <div
                  key={will.willId}
                  className="border border-[var(--border-section)] rounded-lg p-4 bg-[var(--bg-section)]/30 hover:bg-[var(--bg-section)]/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                        {will.willName}
                      </h3>
                      <p className="text-xs text-[var(--text-muted-alt)] font-mono truncate">
                        {will.contractAddressInBlockchain}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
                        will.state === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : will.state === "INACTIVE"
                            ? "bg-blue-500/20 text-blue-400"
                            : will.state === "CANCELED"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {will.state}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div>
                      <p className="text-[var(--text-muted-alt)] inline-flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="2" y1="12" x2="22" y2="12"></line>
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                        <span>Network</span>
                      </p>
                      <p className="font-medium text-[var(--text-primary)]">
                        {will.chainId === 11155111
                          ? "Sepolia"
                          : will.chainId === 1
                            ? "Mainnet"
                            : (will.chainId ?? "—")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted-alt)] inline-flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          viewBox="0 0 24 24"
                        >
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>Secondary Members</span>
                      </p>
                      <p className="font-medium text-[var(--text-primary)]">
                        {will.secondaryMembers.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted-alt)] inline-flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>Min Security Period</span>
                      </p>
                      <p className="font-medium text-[var(--text-primary)]">
                        {displaySecurityPeriod(will.minSecurityPeriod)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted-alt)] inline-flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>Max Security Period</span>
                      </p>
                      <p className="font-medium text-[var(--text-primary)]">
                        {displaySecurityPeriod(will.maxSecurityPeriod)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-[var(--border-section)] pt-3 space-y-1.5">
                    {will.secondaryMembers
                      .slice(0, 2)
                      .map((member: WillFromDB["secondaryMembers"][0]) => {
                        const addr =
                          member.walletAddress || member.tempWalletAddress;
                        return (
                          <div
                            key={member.secondaryMemberId}
                            className="flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-1.5">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#FFFFFF"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                              </svg>
                              <span className="text-[var(--text-primary)] font-medium">
                                {member.firstName} {member.lastName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[var(--text-muted-alt)] font-mono inline-flex items-center gap-1">
                                {addr ? (
                                  <>
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3 7.5A2.5 2.5 0 015.5 5h13A2.5 2.5 0 0121 7.5v9A2.5 2.5 0 0118.5 19h-13A2.5 2.5 0 013 16.5v-9z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15 12h3"
                                      />
                                    </svg>
                                    <span>{`${addr.slice(0, 6)}…${addr.slice(-4)}`}</span>
                                  </>
                                ) : (
                                  <span className="italic text-[var(--text-muted-alt)]">
                                    no address
                                  </span>
                                )}
                              </span>
                              {addr && (
                                <div className="relative group">
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(addr);
                                      setCopiedAddress(addr);
                                      setTimeout(() => setCopiedAddress(null), 2000);
                                    }}
                                    className="p-1 hover:bg-[var(--bg-card)] rounded transition-colors"
                                  >
                                    <svg
                                      className="w-3 h-3 text-[var(--text-muted-alt)] hover:text-[var(--text-primary)]"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </button>
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-section)] text-[var(--text-primary)] text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                                    Copy address
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[var(--border-section)]"></div>
                                  </div>
                                  {copiedAddress === addr && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-section)] text-[var(--text-primary)] text-sm rounded whitespace-nowrap z-50 shadow-lg">
                                      Address copied!
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[var(--border-section)]"></div>
                                    </div>
                                  )}
                                </div>
                              )}
                              <span className="px-1.5 py-0.5 rounded bg-violet-500/15 text-[10px]">
                                <span className="text-violet-400/70">pwr </span>
                                <span className="text-violet-300 font-semibold">
                                  {member.votingPower}
                                </span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    {will.secondaryMembers.length > 2 && (
                      <p className="text-[var(--text-muted-alt)] text-[10px]">
                        +{will.secondaryMembers.length - 2} more
                      </p>
                    )}
                  </div>

                  <div className="mt-3">
                    <Link
                      href="/wills"
                      className="block w-full px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border-section)] text-[var(--text-primary)] hover:bg-[var(--bg-section)] transition-colors text-center"
                    >
                      Manage Will
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {!loadingWills && (
            <div className="text-center mt-4">
              <Link
                href="/wills?openCreate=true"
                className="group relative inline-flex justify-center items-center space-x-2 py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-[var(--accent)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] transition-opacity"
              >
                <span>Create Will</span>
                             <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Total Assets */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-section)] border border-[var(--border-section)] flex items-center justify-center flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-[var(--accent)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Total Assets
              </h2>
            </div>
            {loadingBalances ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-[var(--text-muted-alt)]">
                  Loading balances...
                </div>
              </div>
            ) : balances ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-[var(--text-primary)]">
                    {balances.totalCAD.toFixed(2)} CAD
                  </p>
                  <p className="text-sm text-[var(--text-muted-alt)] mt-1">
                    Total Balance (All Networks)
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-[var(--text-muted-alt)]">
                  No wallet selected
                </p>
              </div>
            )}
          </div>

          {/* Assets Overview */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-section)] border border-[var(--border-section)] flex items-center justify-center flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-[var(--accent)]"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.54946 6.93712c0.85107 -0.52626 1.83209 -0.80464 2.83272 -0.80382 1.1698 0.00096 2.30739 0.38333 3.24028 1.08912 0.79524 0.60166 1.40474 1.41038 1.76494 2.3331h9.6571L23 11.5111l-1.9555 1.9555h-1.4667l-1.4667 1.4667 -1.4667 -1.4667h-0.9777L14.2 14.9333l-1.4667 -1.4667h-1.3459c-0.2995 0.7672 -0.7721 1.4576 -1.3837 2.016 -0.73893 0.6747 -1.65148 1.1298 -2.63498 1.3142 -0.9835 0.1844 -1.99894 0.0907 -2.93211 -0.2705 -0.93317 -0.3612 -1.74706 -0.9756 -2.35014 -1.7741 -0.60308 -0.7984 -0.97142 -1.7493 -1.0636 -2.7457 -0.09218 -0.9964 0.09546 -1.9987 0.54181 -2.89429 0.44635 -0.89556 1.13372 -1.64883 1.98478 -2.17509Z"
                    strokeWidth="1.5"
                  ></path>
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.40429 12.9797c0.81002 0 1.46667 -0.6566 1.46667 -1.4666 0 -0.8101 -0.65665 -1.4667 -1.46667 -1.4667s-1.46667 0.6566 -1.46667 1.4667c0 0.81 0.65665 1.4666 1.46667 1.4666Z"
                    strokeWidth="1.5"
                  ></path>
                  <path
                    stroke="currentColor"
                    strokeLinejoin="round"
                    d="M8.08801 1.75c0 0.19891 0.07902 0.38968 0.21967 0.53033 0.14065 0.14065 0.33142 0.21967 0.53033 0.21967 0.19892 0 0.38968 -0.07902 0.53033 -0.21967 0.14065 -0.14065 0.21967 -0.33142 0.21967 -0.53033 0 -0.19891 -0.07902 -0.38968 -0.21967 -0.53033C9.22769 1.07902 9.03693 1 8.83801 1c-0.19891 0 -0.38968 0.07902 -0.53033 0.21967 -0.14065 0.14065 -0.21967 0.33142 -0.21967 0.53033Z"
                    strokeWidth="1.5"
                  ></path>
                  <path
                    stroke="currentColor"
                    strokeLinejoin="round"
                    d="M5.40399 22.283c0 0.0985 0.0194 0.196 0.05709 0.287 0.03769 0.091 0.09294 0.1736 0.16258 0.2433 0.06965 0.0696 0.15232 0.1249 0.24332 0.1626 0.09099 0.0377 0.18852 0.0571 0.28701 0.0571s0.19602 -0.0194 0.28701 -0.0571c0.091 -0.0377 0.17368 -0.093 0.24332 -0.1626 0.06965 -0.0697 0.12489 -0.1523 0.16258 -0.2433s0.05709 -0.1885 0.05709 -0.287c0 -0.0985 -0.0194 -0.1961 -0.05709 -0.2871 -0.03769 -0.0909 -0.09293 -0.1736 -0.16258 -0.2433 -0.06964 -0.0696 -0.15232 -0.1249 -0.24332 -0.1626 -0.09099 -0.0376 -0.18852 -0.057 -0.28701 -0.057s-0.19602 0.0194 -0.28701 0.057c-0.091 0.0377 -0.17367 0.093 -0.24332 0.1626 -0.06964 0.0697 -0.12489 0.1524 -0.16258 0.2433 -0.03769 0.091 -0.05709 0.1886 -0.05709 0.2871Z"
                    strokeWidth="1.5"
                  ></path>
                  <path
                    stroke="currentColor"
                    strokeLinejoin="round"
                    d="M21.533 3.70508c0 0.19891 0.079 0.38968 0.2197 0.53033 0.1406 0.14065 0.3314 0.21967 0.5303 0.21967 0.1989 0 0.3897 -0.07902 0.5303 -0.21967 0.1407 -0.14065 0.2197 -0.33142 0.2197 -0.53033 0 -0.19891 -0.079 -0.38968 -0.2197 -0.53033 -0.1406 -0.14065 -0.3314 -0.21967 -0.5303 -0.21967 -0.1989 0 -0.3897 0.07902 -0.5303 0.21967 -0.1407 0.14065 -0.2197 0.33142 -0.2197 0.53033Z"
                    strokeWidth="1.5"
                  ></path>
                  <path
                    stroke="currentColor"
                    strokeLinejoin="round"
                    d="M21.533 19.3501c0 0.1989 0.079 0.3897 0.2197 0.5303 0.1406 0.1407 0.3314 0.2197 0.5303 0.2197 0.1989 0 0.3897 -0.079 0.5303 -0.2197 0.1407 -0.1406 0.2197 -0.3314 0.2197 -0.5303 0 -0.1989 -0.079 -0.3897 -0.2197 -0.5303 -0.1406 -0.1407 -0.3314 -0.2197 -0.5303 -0.2197 -0.1989 0 -0.3897 0.079 -0.5303 0.2197 -0.1407 0.1406 -0.2197 0.3314 -0.2197 0.5303Z"
                    strokeWidth="1.5"
                  ></path>
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.3778 7.5991V4.66577c0 -0.54002 0.4378 -0.97778 0.9778 -0.97778h0.9778"
                    strokeWidth="1.5"
                  ></path>
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.9996 1.7334h0.9778c0.54 0 0.9778 0.43776 0.9778 0.97777v4.88889"
                    strokeWidth="1.5"
                  ></path>
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.4 15.9111v2.4445c0 0.54 0.4378 0.9778 0.9778 0.9778h1.9556"
                    strokeWidth="1.5"
                  ></path>
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.55603 22.2666h1.95557c0.54 0 0.9778 -0.4378 0.9778 -0.9778v-4.8889"
                    strokeWidth="1.5"
                  ></path>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Assets Overview
              </h2>
            </div>
            {loadingBalances ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-[var(--text-muted-alt)]">
                  Loading balances...
                </div>
              </div>
            ) : balances ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-section)] bg-[var(--bg-section)]/30">
                  <div className="flex items-center gap-3">
                    <div
                      className={
                        "w-10 h-10 rounded-full bg-gradient-to-br " +
                        NETWORKS.SEPOLIA.iconBg +
                        " flex items-center justify-center text-white font-semibold text-sm"
                      }
                    >
                      SEP
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {NETWORKS.SEPOLIA.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted-alt)]">
                        Testnet
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[var(--text-primary)]">
                      {balances.sepolia} {NETWORKS.SEPOLIA.symbol}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-section)] bg-[var(--bg-section)]/30">
                  <div className="flex items-center gap-3">
                    <div
                      className={
                        "w-10 h-10 rounded-full bg-gradient-to-br " +
                        NETWORKS.MAINNET.iconBg +
                        " flex items-center justify-center text-white font-semibold text-sm"
                      }
                    >
                      ETH
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {NETWORKS.MAINNET.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted-alt)]">
                        Mainnet
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[var(--text-primary)]">
                      {balances.mainnet} {NETWORKS.MAINNET.symbol}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-section)] bg-[var(--bg-section)]/30">
                  <div className="flex items-center gap-3">
                    <div
                      className={
                        "w-10 h-10 rounded-full bg-gradient-to-br " +
                        NETWORKS.BNB.iconBg +
                        " flex items-center justify-center text-white font-semibold text-sm"
                      }
                    >
                      BNB
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {NETWORKS.BNB.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted-alt)]">
                        Mainnet
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[var(--text-primary)]">
                      {balances.bnb} {NETWORKS.BNB.symbol}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-section)] bg-[var(--bg-section)]/30">
                  <div className="flex items-center gap-3">
                    <div
                      className={
                        "w-10 h-10 rounded-full bg-gradient-to-br " +
                        NETWORKS.AVAX.iconBg +
                        " flex items-center justify-center text-white font-semibold text-sm"
                      }
                    >
                      AVAX
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {NETWORKS.AVAX.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted-alt)]">
                        Mainnet
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[var(--text-primary)]">
                      {balances.avax} {NETWORKS.AVAX.symbol}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-[var(--text-muted-alt)]">
                  No wallet selected
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
