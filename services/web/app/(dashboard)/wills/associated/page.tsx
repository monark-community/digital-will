"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ethers } from "ethers";
import Header from "@/app/components/ui/Header";
import { willService, authService, type AssociatedWill } from "@/lib/services";
import { WILL_ABI } from "@/lib/contracts/WillABI";
import { useCurrentUser, useWallets } from "@/lib/hooks";
import type { User } from "@/lib/types";
import {
  SecurityPeriodCountdown,
  CooldownCountdown,
} from "@/app/components/ui/SecurityPeriodCountdown";
import { displaySecurityPeriodRange } from "@/lib/utils/blockchain";
import { getErrorMessage } from "@/lib/contract-errors";

type ActionId = 'validate' | 'refuse' |  'declareDeath' | 'swapAssets';

interface ActionDef {
  id: ActionId;
  label: string;
  description: string;
  disabledReason: (will: AssociatedWill) => string | null;
  colorActive: string;
}

const SM_ACTIONS: ActionDef[] = [
  {
    id: "validate",
    label: "Validate",
    description: "Accept your role to activate the will.",
    disabledReason: (w) => {
      if (w.state !== "INACTIVE")
        return `Will must be INACTIVE (currently ${w.state})`;
      if (w.myMembership.state !== "PENDING")
        return "You have already validated";
      return null;
    },
    colorActive: "bg-emerald-600 hover:bg-emerald-500 text-white",
  },
  {
    id: 'refuse',
    label: 'Refuse',
    description: 'Refuse to participate.',
    disabledReason: (w) => {
      if (w.state === 'CANCELED') return 'Will is canceled';
      if (w.state === 'EXECUTED') return 'Will is already executed';
      if (w.state === 'DRAFT')    return 'Will is not yet deployed';
      return null;
    },
    colorActive: 'bg-red-600 hover:bg-red-500 text-white',
  },
  {
    id: "declareDeath",
    label: "Declare Death",
    description: "Start the security period countdown.",
    disabledReason: (w) => {
      if (w.state !== "ACTIVE")
        return `Will must be ACTIVE (currently ${w.state})`;
      if (w.myMembership.state === "DECLARED_DEATH")
        return "You already declared death";
      if (w.myMembership.state !== "VALIDATED")
        return "You must be a validated member to declare death";
      const nowSec = Math.floor(Date.now() / 1000);
      const cooldownEnd = w.cooldownTimestampOnChain ?? 0;
      if (cooldownEnd > nowSec) {
        const secsLeft = cooldownEnd - nowSec;
        const d = Math.floor(secsLeft / 86400);
        const h = Math.floor((secsLeft % 86400) / 3600);
        const m = Math.floor((secsLeft % 3600) / 60);
        const parts: string[] = [];
        if (d > 0) parts.push(`${d}d`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0 || parts.length === 0) parts.push(`${m}m`);
        return `On cooldown after PM veto — ${parts.join(" ")} remaining`;
      }
      return null;
    },
    colorActive: "bg-red-700 hover:bg-red-600 text-white",
  },
  {
    id: "swapAssets",
    label: "Execute Will",
    description: "Distribute assets after security period.",
    disabledReason: (w) => {
      if (w.state !== "ACTIVE")
        return `Will must be ACTIVE (currently ${w.state})`;
      if (w.myMembership.state === "PENDING")
        return "You must be validated to execute the will";
      const anyDeclared = w.secondaryMembers.some(
        (sm) => sm.state === "DECLARED_DEATH",
      );
      if (!anyDeclared)
        return "No SM has declared death yet. Security period not started";
      const execTs = w.executionTimestampOnChain;
      if (execTs === undefined) return "Loading on-chain execution timestamp…";
      if (execTs === 0) return "Execution timestamp not set on chain";
      const nowSec = Math.floor(Date.now() / 1000);
      if (nowSec < execTs) {
        const secsLeft = execTs - nowSec;
        const d = Math.floor(secsLeft / 86400);
        const h = Math.floor((secsLeft % 86400) / 3600);
        const m = Math.floor((secsLeft % 3600) / 60);
        const parts = [];
        if (d > 0) parts.push(`${d}d`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0 || parts.length === 0) parts.push(`${m}m`);
        return `Security period not yet elapsed — ${parts.join(" ")} remaining`;
      }
      return null;
    },
    colorActive: "bg-purple-700 hover:bg-purple-600 text-white",
  },
];

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
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: currentUser } = useCurrentUser();
  const { data: wallets } = useWallets();
  const filterWalletDropdownRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [wills, setWills] = useState<AssociatedWill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilterWalletId, setSelectedFilterWalletId] =
    useState<string>("all");
  const [showFilterWalletDropdown, setShowFilterWalletDropdown] =
    useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [highlightedWillId, setHighlightedWillId] = useState<string | null>(
    null,
  );

  // Per-will action state
  const [actionLoading, setActionLoading] = useState<
    Record<string, ActionId | null>
  >({});
  const [actionError, setActionError] = useState<Record<string, string | null>>(
    {},
  );
  const [actionSuccess, setActionSuccess] = useState<
    Record<string, string | null>
  >({});

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
      if (
        filterWalletDropdownRef.current &&
        !filterWalletDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFilterWalletDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAssociatedWills = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const enrichedWills = await willService.getAssociatedWills();

      const willsWithUpdatedMembership = enrichedWills.map((will) => {
        const myEnriched = will.secondaryMembers.find(
          (sm) => sm.secondaryMemberId === will.myMembership.secondaryMemberId,
        );
        return {
          ...will,
          myMembership: {
            ...will.myMembership,
            state: myEnriched?.state ?? will.myMembership.state,
          },
        };
      });

      setWills(willsWithUpdatedMembership);
    } catch (err: any) {
      setError(err.message || "Failed to load associated wills");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSmAction = useCallback(async (will: AssociatedWill, action: ActionDef) => {
    if (!will.contractAddressInBlockchain) return;
    const id = will.willId;
    setActionError(prev  => ({ ...prev, [id]: null }));
    setActionSuccess(prev => ({ ...prev, [id]: null }));
    setActionLoading(prev => ({ ...prev, [id]: action.id }));
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('No Web3 provider found. Please install MetaMask.');
      }
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer   = await provider.getSigner();
      const contract = new ethers.Contract(
        ethers.getAddress(will.contractAddressInBlockchain),
        WILL_ABI,
        signer
      );
      let tx: ethers.TransactionResponse;
      switch (action.id) {
        case 'validate':
          tx = await contract.validateSm();
          break;
        case 'refuse':
          tx = await contract.desistSm();
          break;
        case 'declareDeath':
          tx = await contract.declareDeath();
        break;
        case 'swapAssets':
          tx = await contract.swapAssets();
          break;
      }
      const receipt = await tx.wait();
      
      /*
      2 seconds delay added instead of waiting 2 block confirmation
      */
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (action.id === 'refuse') {
        console.log('🔵 Refuse confirmed, removing from database...');
        try {
          await willService.removeSecondaryMember(will.willId);
          console.log('🔵 Successfully removed from database');
        } catch (dbError: any) {
          setActionError((prev) => ({
              ...prev,
              [id]: "Blockchain transaction succeeded, but failed to update database. Please refresh.",
            }));
            setActionLoading((prev) => ({ ...prev, [id]: null }));
          return;
        }
      }
        setActionSuccess((prev) => ({
          ...prev,
          [id]: `"${action.label}" confirmed!`,
        }));
        await fetchAssociatedWills();
      } catch (err: any) {
        setActionError((prev) => ({
          ...prev,
          [id]: getErrorMessage(err, "Transaction failed."),
        }));
      } finally {
        setActionLoading((prev) => ({ ...prev, [id]: null }));
      }
    },
    [fetchAssociatedWills],
  );

  useEffect(() => {
    if (!mounted) return;
    if (!authService.isAuthenticated()) return;
    fetchAssociatedWills();
  }, [mounted, fetchAssociatedWills]);

  const copyToClipboard = async (address: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(identifier);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  const selectedFilterWallet = wallets?.find(
    (w) => w.walletId === selectedFilterWalletId,
  );

  const displayedWills =
    selectedFilterWalletId === "all"
      ? wills
      : wills.filter((will) => {
          const addr = selectedFilterWallet?.address.toLowerCase();
          return (
            will.myMembership.walletAddress?.toLowerCase() === addr ||
            will.myMembership.tempWalletAddress?.toLowerCase() === addr
          );
        });

  const clearTargetWillParam = useCallback(() => {
    if (!searchParams.has("targetWillId")) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("targetWillId");
    const queryString = params.toString();

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const targetWillId = searchParams.get("targetWillId");
    if (!targetWillId || isLoading || displayedWills.length === 0) return;

    const targetWillExists = displayedWills.some(
      (will) => will.willId === targetWillId,
    );
    if (!targetWillExists) return;

    const timeoutId = window.setTimeout(() => {
      const targetElement = document.getElementById(
        `associated-will-card-${targetWillId}`,
      );
      if (!targetElement) return;

      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedWillId(targetWillId);
      clearTargetWillParam();

      window.setTimeout(() => {
        setHighlightedWillId((current) =>
          current === targetWillId ? null : current,
        );
      }, 2200);
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [
    clearTargetWillParam,
    displayedWills,
    isLoading,
    searchParams,
  ]);

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-page)]">
      <Header isAuthenticated={true} user={user ?? undefined} />
      <div className="min-h-screen bg-[var(--bg-page)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              Associated Wills
            </h1>
            <p className="text-[var(--text-muted)]">
              Wills where you have been designated as a secondary member.
            </p>
          </div>

          <div className="mb-8 relative" ref={filterWalletDropdownRef}>
            <button
              onClick={() =>
                setShowFilterWalletDropdown(!showFilterWalletDropdown)
              }
              className="w-full bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-5 flex items-center justify-between hover:border-[var(--accent)] transition-colors"
            >
              <div className="flex-1 text-left">
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                  {selectedFilterWalletId === "all"
                    ? "All Wallets"
                    : selectedFilterWallet?.label ||
                      `Wallet ${selectedFilterWallet?.address.slice(0, 8)}...`}
                </h3>
                <p className="text-sm text-[var(--text-muted-alt)] font-mono">
                  {selectedFilterWalletId === "all"
                    ? "Showing associated wills from all wallets"
                    : `wallet id : ${selectedFilterWallet?.address}`}
                </p>
              </div>
              <svg
                className={`w-6 h-6 text-[var(--text-primary)] transition-transform ${showFilterWalletDropdown ? "rotate-180" : ""}`}
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

            {showFilterWalletDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl shadow-lg z-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFilterWalletId("all");
                    setShowFilterWalletDropdown(false);
                  }}
                  className={`w-full p-4 text-left hover:bg-[var(--bg-section)] transition-colors border-b border-[var(--border-section)] ${selectedFilterWalletId === "all" ? "bg-[var(--bg-section)]" : ""}`}
                >
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                    All Wallets
                  </h3>
                  <p className="text-sm text-[var(--text-muted-alt)]">
                    Show associated wills from all wallets
                  </p>
                </button>
                {wallets &&
                  wallets.map((wallet) => (
                    <button
                      key={wallet.walletId}
                      type="button"
                      onClick={() => {
                        setSelectedFilterWalletId(wallet.walletId);
                        setShowFilterWalletDropdown(false);
                      }}
                      className={`w-full p-4 text-left hover:bg-[var(--bg-section)] transition-colors border-b border-[var(--border-section)] last:border-b-0 ${selectedFilterWalletId === wallet.walletId ? "bg-[var(--bg-section)]" : ""}`}
                    >
                      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                        {wallet.label ||
                          `Wallet ${wallet.address.slice(0, 8)}...`}
                      </h3>
                      <p className="text-sm text-[var(--text-muted-alt)] font-mono">
                        wallet id : {wallet.address}
                      </p>
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
                  id={`associated-will-card-${will.willId}`}
                  className={`bg-[var(--bg-card)] rounded-xl border border-[var(--border-section)] shadow-sm overflow-hidden ${
                    highlightedWillId === will.willId
                      ? "ring-2 ring-[var(--accent)]"
                      : ""
                  }`}
                >
                  {/* Will header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-section)]">
                    <div>
                      <span className="text-xs text-[var(--text-muted)] font-mono">
                        Will ID
                      </span>
                      <p className="font-mono text-sm text-[var(--text-primary)]">
                        {will.willId}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${STATE_COLORS[will.state] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {will.state}
                    </span>
                  </div>

                  <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-1">
                        Created by
                      </p>
                      <p className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>
                          {will.owner.firstName} {will.owner.lastName}
                        </span>
                      </p>
                      <p className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          {will.owner.email}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-[var(--text-muted)] inline-flex items-center gap-1 mb-1">
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
                        <span>Owner wallet</span>
                      </span>
                      <div className="flex items-start gap-1">
                        <p className="font-mono text-sm text-[var(--text-primary)] break-all">
                          {will.walletAddress}
                        </p>
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={() =>
                              copyToClipboard(
                                will.walletAddress,
                                `owner-${will.willId}`,
                              )
                            }
                            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                            title="Copy address"
                          >
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
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                          {copiedAddress === `owner-${will.willId}` && (
                            <div className="absolute left-1/2 -translate-x-1/2 -top-8 bg-green-600 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
                              Copied!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {will.contractAddressInBlockchain && (
                      <div>
                        <span className="text-xs text-[var(--text-muted)]">
                          Contract address
                        </span>
                        <p className="font-mono text-sm text-[var(--text-primary)] break-all">
                          {will.contractAddressInBlockchain}
                        </p>
                      </div>
                    )}
                    {will.chainId && (
                      <div>
                        <span className="text-xs text-[var(--text-muted)] inline-flex items-center gap-1 mb-1">
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
                          <span className="text-xs text-[var(--text-muted)]">
                            Network
                          </span>
                        </span>
                        <p className="text-sm text-[var(--text-primary)]">
                          {CHAIN_NAMES[will.chainId] ?? `Chain ${will.chainId}`}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-[var(--text-muted)] inline-flex items-center gap-1 mb-1">
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
                        <span className="text-xs text-[var(--text-muted)]">
                          Security period
                        </span>
                      </span>
                      
                      <p className="text-sm text-[var(--text-primary)]">
                        {displaySecurityPeriodRange(
                          will.minSecurityPeriod,
                          will.maxSecurityPeriod,
                        )}
                      </p>
                    </div>
                  </div>

                  {(() => {
                    const nowSec = Math.floor(Date.now() / 1000);
                    const cooldownEnd = will.cooldownTimestampOnChain ?? 0;
                    if (
                      cooldownEnd > nowSec &&
                      will.state !== "CANCELED" &&
                      will.state !== "EXECUTED"
                    ) {
                      return (
                        <div className="px-6 py-3 border-t border-orange-500/20">
                          <CooldownCountdown endTs={cooldownEnd} />
                        </div>
                      );
                    }
                    const startTs = will.deathDeclarationTimestampOnChain;
                    const endTs = will.executionTimestampOnChain;
                    if (!startTs || startTs === 0 || !endTs || endTs === 0)
                      return null;
                    return (
                      <div className="px-6 py-2 border-t border-red-500/20 bg-red-500/5">
                        <SecurityPeriodCountdown
                          startTs={startTs}
                          endTs={endTs}
                        />
                      </div>
                    );
                  })()}

                  {will.contractAddressInBlockchain && (
                    <div className="px-6 py-4 border-t border-[var(--border-section)]">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                        Your Actions
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {SM_ACTIONS.map((action) => {
                          const reason = action.disabledReason(will);
                          const isDisabled = reason !== null;
                          const isLoading =
                            actionLoading[will.willId] === action.id;
                          const anyLoading = !!actionLoading[will.willId];
                          return (
                            <div key={action.id} className="relative group">
                              <button
                                onClick={() =>
                                  !isDisabled &&
                                  !anyLoading &&
                                  handleSmAction(will, action)
                                }
                                disabled={isDisabled || anyLoading}
                                className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                                  isDisabled || anyLoading
                                    ? "bg-[var(--bg-section)] text-[var(--text-muted-alt)] opacity-40 cursor-not-allowed"
                                    : action.colorActive
                                }`}
                              >
                                {isLoading ? (
                                  <>
                                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    <span>Confirming…</span>
                                  </>
                                ) : (
                                  <>
                                    <span>{action.label}</span>
                                    {action.id === "validate" && (
                                      <svg
                                        className="w-3.5 h-3.5"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                      </svg>
                                    )}
                                    {action.id === "refuse" && (
                                      <svg
                                        className="w-3.5 h-3.5"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="15" y1="9" x2="9" y2="15"></line>
                                        <line x1="9" y1="9" x2="15" y2="15"></line>
                                      </svg>
                                    )}
                                    {action.id === "declareDeath" && (
                                      <svg
                                        className="w-3.5 h-3.5"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                        <line x1="12" y1="9" x2="12" y2="13"></line>
                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                      </svg>
                                    )}
                                    {action.id === "swapAssets" && (
                                      <svg
                                        className="w-3.5 h-3.5"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        viewBox="0 0 24 24"
                                      >
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                      </svg>
                                    )}
                                  </>
                                )}
                              </button>
                              {isDisabled && reason && (
                                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 whitespace-nowrap rounded-lg bg-[var(--bg-section)] border border-[var(--border-section)] px-3 py-2 text-xs text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                  {reason}
                                </div>
                              )}
                              {!isDisabled && (
                                <p className="mt-1 text-xs text-[var(--text-muted-alt)] text-center leading-snug">
                                  {action.description}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {actionError[will.willId] && (
                        <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                          {actionError[will.willId]}
                        </div>
                      )}
                      {actionSuccess[will.willId] && (
                        <div className="mt-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400">
                          {actionSuccess[will.willId]}
                        </div>
                      )}
                    </div>
                  )}

                  {will.secondaryMembers.length > 0 && (
                    <div className="px-6 py-4 border-t border-[var(--border-section)]">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                        Secondary members ({will.secondaryMembers.length})
                      </h3>
                      <div className="space-y-2">
                        {will.secondaryMembers.map((sm) => {
                          const isMe =
                            sm.secondaryMemberId ===
                            will.myMembership.secondaryMemberId;
                          const smWallet =
                            sm.walletAddress || sm.tempWalletAddress;
                          return (
                            <div
                              key={sm.secondaryMemberId}
                              className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm ${
                                isMe
                                  ? "bg-[var(--accent)]/10 border border-[var(--accent)]/30"
                                  : "bg-[var(--bg-section)]"
                              }`}
                            >
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`font-medium ${isMe ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}
                                  >
                                    {sm.firstName} {sm.lastName}
                                  </span>
                                  {isMe && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--accent)] text-white">
                                      You
                                    </span>
                                  )}
                                  <span className="text-[var(--text-muted)] text-xs">
                                    {sm.email}
                                  </span>
                                </div>
                                {smWallet && (
                                  <div className="flex items-center gap-1">
                                    <span className="font-mono text-[11px] text-[var(--text-muted)] break-all">
                                      {smWallet}
                                    </span>
                                    <div className="relative flex-shrink-0">
                                      <button
                                        onClick={() =>
                                          copyToClipboard(
                                            smWallet,
                                            `sm-${sm.secondaryMemberId}`,
                                          )
                                        }
                                        className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                                        title="Copy address"
                                      >
                                        <svg
                                          className="w-3.5 h-3.5"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                          />
                                        </svg>
                                      </button>
                                      {copiedAddress ===
                                        `sm-${sm.secondaryMemberId}` && (
                                        <div className="absolute left-1/2 -translate-x-1/2 -top-8 bg-green-600 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
                                          Copied!
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-3 ml-4 shrink-0">
                                <span className="text-[var(--text-muted)] text-xs">
                                  Power: {sm.votingPower}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SM_STATE_COLORS[sm.state] ?? "bg-gray-100 text-gray-700"}`}
                                >
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
