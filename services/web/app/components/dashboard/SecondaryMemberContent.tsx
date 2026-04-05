"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { willService, type AssociatedWill } from "@/lib/services";
import { WILL_ABI } from "@/lib/contracts/WillABI";
import { displaySecurityPeriodRange } from "@/lib/utils/blockchain";
import { getErrorMessage } from "@/lib/contract-errors";

function stateBadge(state: string) {
  const map: Record<string, string> = {
    INACTIVE: "bg-blue-500/20 text-blue-400",
    ACTIVE: "bg-emerald-500/20 text-emerald-400",
    EXECUTABLE: "bg-purple-500/20 text-purple-400",
    CANCELED: "bg-red-500/20 text-red-400",
    EXECUTED: "bg-blue-500/20 text-blue-400",
    DRAFT: "bg-gray-500/20 text-gray-400",
  };
  return map[state] ?? "bg-gray-500/20 text-gray-400";
}

function smStateBadge(state: string) {
  const map: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400",
    VALIDATED: "bg-emerald-500/20 text-emerald-400",
    DECLARED_DEATH: "bg-red-500/20 text-red-400",
  };
  return map[state] ?? "bg-gray-500/20 text-gray-400";
}

async function getWillContract(contractAddress: string) {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("No Web3 provider found. Please install MetaMask.");
  }
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(
    ethers.getAddress(contractAddress),
    WILL_ABI,
    signer,
  );
}

interface ActionDef {
  id: "validate" | "refuse" | "declareDeath" | "swapAssets";
  label: string;
  description: string;
  disabledReason: (will: AssociatedWill) => string | null;
  color: "green" | "yellow" | "red" | "purple";
}

const ACTIONS: ActionDef[] = [
  {
    id: "validate",
    label: "Validate",
    description: "Accept your role as a secondary member to activate the will.",
    disabledReason: (will) => {
      if (will.state !== "INACTIVE")
        return `Will must be INACTIVE (currently ${will.state})`;
      if (will.myMembership.state !== "PENDING")
        return "You have already validated";
      return null;
    },
    color: "green",
  },
  {
    id: "refuse",
    label: "Refuse",
    description: "Refuse to participate in this will.",
    disabledReason: (will) => {
      if (will.state === "CANCELED") return "Will is canceled";
      if (will.state === "EXECUTED") return "Will is already executed";
      if (will.state === "DRAFT") return "Will is not yet deployed";
      return null;
    },
    color: "yellow",
  },
  {
    id: "declareDeath",
    label: "Declare Death",
    description:
      "Declare that the primary member has passed, starting the security period.",
    disabledReason: (will) => {
      if (will.state !== "ACTIVE")
        return `Will must be ACTIVE (currently ${will.state})`;
      if (will.myMembership.state === "DECLARED_DEATH")
        return "You have already declared death";
      return null;
    },
    color: "red",
  },
  {
    id: "swapAssets",
    label: "Execute Will",
    description:
      "Trigger asset distribution after the security period has elapsed.",
    disabledReason: (will) => {
      if (will.state !== "ACTIVE")
        return `Will must be ACTIVE (currently ${will.state})`;
      return null;
    },
    color: "purple",
  },
];

const activeClass: Record<ActionDef["color"], string> = {
  green: "bg-emerald-600 hover:bg-emerald-500 text-white",
  yellow: "bg-yellow-600 hover:bg-yellow-500 text-white",
  red: "bg-red-700 hover:bg-red-600 text-white",
  purple: "bg-purple-700 hover:bg-purple-600 text-white",
};

const disabledClass =
  "bg-[var(--bg-section)] text-[var(--text-muted-alt)] opacity-40 cursor-not-allowed";

interface WillCardProps {
  will: AssociatedWill;
  onRefresh: () => void;
}

function WillCard({ will, onRefresh }: WillCardProps) {
  const [loadingAction, setLoadingAction] = useState<ActionDef["id"] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAction = useCallback(
    async (action: ActionDef) => {
      if (!will.contractAddressInBlockchain) return;
      setError(null);
      setSuccess(null);
      setLoadingAction(action.id);
      try {
        const contract = await getWillContract(
          will.contractAddressInBlockchain,
        );
        let tx: ethers.TransactionResponse;

        switch (action.id) {
          case "validate":
            tx = await contract.validateSm();
            break;
          case "refuse":
            tx = await contract.desistSm();
            break;
          case "declareDeath":
            tx = await contract.declareDeath();
            break;
          case "swapAssets":
            tx = await contract.swapAssets();
            break;
          default:
            throw new Error(`Unknown action: ${action.id}`);
        }

        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();

        
        if (action.id === 'refuse') {
          console.log('Refuse confirmed, removing from database...');
          try {
            await willService.removeSecondaryMember(will.willId);
            console.log('Successfully removed from database');
          } catch (dbError: any) {
            setError('Blockchain transaction succeeded, but failed to update database. Please refresh.');
            setLoadingAction(null);
            return;
          }
        }

      /*
      Delay added instead of waiting 2 block confirmation 
      */
        await new Promise((resolve) => setTimeout(resolve, 3000));
        
        setSuccess(`"${action.label}" transaction confirmed!`);
        onRefresh();
      } catch (err: any) {
        setError(getErrorMessage(err, "Transaction failed."));
      } finally {
        setLoadingAction(null);
      }
    },
    [will, onRefresh],
  );

  return (
    <div className="rounded-xl border border-[var(--border-section)] bg-[var(--bg-card)] p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <p className="text-xs text-[var(--text-muted-alt)] mb-1">
            Primary Member
          </p>
          <p className="font-semibold text-[var(--text-primary)]">
            {will.owner.firstName} {will.owner.lastName}
          </p>
          <p className="text-xs text-[var(--text-muted-alt)]">
            {will.owner.email}
          </p>
          {will.contractAddressInBlockchain && (
            <p className="text-xs font-mono text-[var(--text-muted-alt)] truncate mt-1 max-w-xs">
              {will.contractAddressInBlockchain}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {(() => {
            const execTs = will.executionTimestampOnChain ?? 0;
            const nowSec = Math.floor(Date.now() / 1000);
            const badgeState =
              will.state === "ACTIVE" && execTs > 0 && nowSec >= execTs
                ? "EXECUTABLE"
                : will.state;
            return (
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${stateBadge(badgeState)}`}
              >
                {badgeState}
              </span>
            );
          })()}
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${smStateBadge(will.myMembership.state)}`}
          >
            You: {will.myMembership.state}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-5">
        <div>
          <p className="text-[var(--text-muted-alt)]">Your vote power</p>
          <p className="font-medium text-[var(--text-primary)]">
            {will.myMembership.votingPower}
          </p>
        </div>
        <div>
          <p className="text-[var(--text-muted-alt)]">Security period</p>
          <p className="font-medium text-[var(--text-primary)]">
            {displaySecurityPeriodRange(
              will.minSecurityPeriod,
              will.maxSecurityPeriod,
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map((action) => {
          const reason = action.disabledReason(will);
          const isDisabled =
            reason !== null || !will.contractAddressInBlockchain;
          const isLoading = loadingAction === action.id;
          const anyLoading = loadingAction !== null;

          if (action.id === "refuse") {
            console.log("Refuse button state:", {
              willState: will.state,
              membershipState: will.myMembership.state,
              contractAddress: will.contractAddressInBlockchain,
              disabledReason: reason,
              isDisabled,
              isLoading,
              anyLoading,
            });
          }

          return (
            <div key={action.id} className="relative group">
              <button
                onClick={() => {
                  console.log(
                    "Button clicked:",
                    action.id,
                    "disabled:",
                    isDisabled,
                    "anyLoading:",
                    anyLoading,
                  );
                  if (!isDisabled && !anyLoading) {
                    handleAction(action);
                  } else {
                    console.log(
                      "Button click blocked - isDisabled:",
                      isDisabled,
                      "anyLoading:",
                      anyLoading,
                    );
                  }
                }}
                className={`
                  w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  flex items-center justify-center gap-2
                  ${isDisabled || anyLoading ? disabledClass : activeClass[action.color]}
                `}
              >
                {isLoading ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Confirming…</span>
                  </>
                ) : action.id === "refuse" &&
                  will.myMembership.state !== "PENDING" ? (
                  "Desist"
                ) : (
                  action.label
                )}
              </button>

              {isDisabled && reason && (
                <div
                  className="
                  pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                  whitespace-nowrap rounded-lg bg-[var(--bg-section)] border border-[var(--border-section)]
                  px-3 py-2 text-xs text-[var(--text-muted)]
                  opacity-0 group-hover:opacity-100 transition-opacity shadow-lg
                "
                >
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

      {error && (
        <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400">
          {success}
        </div>
      )}
    </div>
  );
}

export default function SecondaryMemberContent() {
  const [wills, setWills] = useState<AssociatedWill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchWills = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await willService.getAssociatedWills();
      setWills(data);
    } catch (err: any) {
      setFetchError(err.message || "Failed to load associated wills.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWills();
  }, [fetchWills]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        <p className="text-sm text-[var(--text-muted-alt)]">
          Loading your wills…
        </p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
        <p className="text-red-400 font-medium">{fetchError}</p>
        <button
          onClick={fetchWills}
          className="mt-4 px-4 py-2 rounded-lg bg-[var(--bg-section)] text-sm text-[var(--text-primary)] hover:bg-[var(--border-section)] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (wills.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border-section)] bg-[var(--bg-card)] p-12 text-center">
        <p className="text-lg font-medium text-[var(--text-primary)]">
          You are not listed as a secondary member on any wills.
        </p>
        <p className="text-[var(--text-muted-alt)] mt-2 max-w-md mx-auto">
          Wills where you are added as a secondary member will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          Wills where you are a Secondary Member
        </h2>
        <button
          onClick={fetchWills}
          className="text-sm text-[var(--accent)] hover:opacity-80 transition-opacity"
        >
          Refresh ↻
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {wills.map((will) => (
          <WillCard key={will.willId} will={will} onRefresh={fetchWills} />
        ))}
      </div>
    </div>
  );
}
