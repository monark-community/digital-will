"use client";

import { useState } from "react";
import {
  useWallets,
  useAddWallet,
  useRemoveWallet,
  useUpdateWalletLabel,
  useCurrentUser,
} from "@/lib/hooks";
import { connectWallet, isMetaMaskInstalled } from "@/lib/utils/wallet";
import { walletService } from "@/lib/services";
import Header from "@/app/components/ui/Header";
import type { Wallet } from "@/lib/types";
import type { WalletRemovalEligibilityResponse } from "@/lib/services/wallet.service";

export default function WalletsPage() {
  const { data: wallets, isLoading, error } = useWallets();
  const { mutate: addWallet, isPending: isAdding } = useAddWallet();
  const { mutate: removeWallet } = useRemoveWallet();
  const { mutate: updateLabel } = useUpdateWalletLabel();
  const { data: user } = useCurrentUser();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [labelValue, setLabelValue] = useState("");
  const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);
  const [walletRemovalEligibility, setWalletRemovalEligibility] = useState<WalletRemovalEligibilityResponse | null>(null);
  const [isCheckingRemovalEligibility, setIsCheckingRemovalEligibility] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAddWallet = async () => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      if (!isMetaMaskInstalled()) {
        setErrorMessage(
          "MetaMask is not installed. Please install MetaMask to continue.",
        );
        return;
      }

      const { address, signature, message } = await connectWallet();

      addWallet(
        { walletAddress: address, signature, message },
        {
          onSuccess: () => {
            setErrorMessage(null);
            setSuccessMessage("Wallet added successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
          },
          onError: (error: any) => {
            setSuccessMessage(null);
            const msg =
              error?.response?.data?.message || "Failed to add wallet";
            setErrorMessage(msg);
          },
        },
      );
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to connect to MetaMask");
    }
  };

  const handleRemoveWallet = async (wallet: Wallet) => {
    if (wallets && wallets.length === 1) {
      setErrorMessage(
        "Cannot remove the last wallet from your account. You must have at least one wallet.",
      );
      return;
    }

    setIsCheckingRemovalEligibility(true);
    setErrorMessage(null);

    try {
      const eligibility = await walletService.checkWalletRemovalEligibility(wallet.walletId);
      setWalletRemovalEligibility(eligibility);
      setWalletToDelete(wallet);
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to check wallet removal eligibility");
    } finally {
      setIsCheckingRemovalEligibility(false);
    }
  };

  const confirmDeleteWallet = () => {
    if (!walletToDelete) return;

    removeWallet(walletToDelete.walletId, {
      onSuccess: () => {
        setErrorMessage(null);
        setSuccessMessage("Wallet removed successfully!");
        setWalletToDelete(null);
        setWalletRemovalEligibility(null);
        setTimeout(() => setSuccessMessage(null), 3000);
      },
      onError: (error: any) => {
        const msg = error?.response?.data?.message || "Failed to remove wallet";
        setErrorMessage(msg);
      },
    });
  };

  const cancelDeleteWallet = () => {
    setWalletToDelete(null);
    setWalletRemovalEligibility(null);
  };

  const copyToClipboard = async (address: string, walletId: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(walletId);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  const handleEditLabel = (wallet: Wallet) => {
    setEditingLabel(wallet.walletId);
    setLabelValue(wallet.label || "");
  };

  const handleSaveLabel = (walletId: string) => {
    updateLabel(
      { walletId, label: labelValue },
      {
        onSuccess: () => {
          setEditingLabel(null);
          setLabelValue("");
        },
        onError: (error: any) => {
          const msg =
            error?.response?.data?.message || "Failed to update label";
          setErrorMessage(msg);
        },
      },
    );
  };

  const handleCancelEdit = () => {
    setEditingLabel(null);
    setLabelValue("");
  };

  if (isLoading) {
    return (
      <>
        <Header isAuthenticated={true} user={user} />
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]">
          <div className="text-[var(--text-muted)]">Loading wallets...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header isAuthenticated={true} user={user} />
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]">
          <div className="text-red-400">Failed to load wallets</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header isAuthenticated={true} user={user} />
      <div className="min-h-screen bg-[var(--bg-page)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              My Wallets
            </h1>
            <p className="text-[var(--text-muted)]">
              Manage your connected MetaMask wallets
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-md bg-red-500/10 border border-red-500/20 p-4">
              <p className="text-sm text-red-400">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 rounded-md bg-green-500/10 border border-green-500/20 p-4">
              <p className="text-sm text-green-400">{successMessage}</p>
            </div>
          )}

          <div className="mb-6">
            <button
              onClick={handleAddWallet}
              disabled={isAdding}
              className="flex items-center space-x-2 bg-[var(--accent)] hover:opacity-90 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 cursor-pointer active:scale-[0.97]"
            >
              <span>{isAdding ? "Adding..." : "Add Wallet"}</span>
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
            </button>
          </div>

          <div className="space-y-4">
            {wallets && wallets.length === 0 && (
              <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-lg p-8 text-center">
                <p className="text-[var(--text-muted)]">
                  No wallets connected yet
                </p>
              </div>
            )}

            {wallets?.map((wallet) => (
              <div
                key={wallet.walletId}
                className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-lg p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {editingLabel === wallet.walletId ? (
                        <input
                          type="text"
                          value={labelValue}
                          onChange={(e) => setLabelValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveLabel(wallet.walletId);
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                          maxLength={50}
                          className="px-2 py-1 border border-[var(--border-section)] bg-[var(--bg-section)] text-[var(--text-primary)] rounded text-sm"
                          placeholder="Wallet label"
                          autoFocus
                        />
                      ) : wallet.label ? (
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {wallet.label}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm text-[var(--text-muted)] break-all inline-flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
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
                        <span>{wallet.address}</span>
                      </p>
                      <div className="relative flex-shrink-0 group">
                        <button
                          onClick={() =>
                            copyToClipboard(wallet.address, wallet.walletId)
                          }
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
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
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-section)] text-[var(--text-primary)] text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                          Copy address
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[var(--border-section)]"></div>
                        </div>
                        {copiedAddress === wallet.walletId && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-section)] text-[var(--text-primary)] text-sm rounded whitespace-nowrap z-50 shadow-lg">
                            Address copied!
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[var(--border-section)]"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2 inline-flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        ></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <span>
                        Added {new Date(wallet.createdAt).toLocaleDateString()}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {editingLabel === wallet.walletId ? (
                      <>
                        <div className="relative flex-shrink-0 group">
                          <button
                            onClick={() => handleSaveLabel(wallet.walletId)}
                            className="p-2 text-green-500 hover:bg-[var(--bg-section)] rounded transition-colors cursor-pointer"
                          >
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
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-section)] text-[var(--text-primary)] text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                            Save
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[var(--border-section)]"></div>
                          </div>
                        </div>
                        <div className="relative flex-shrink-0 group">
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-section)] rounded transition-colors cursor-pointer"
                          >
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
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-section)] text-[var(--text-primary)] text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                            Cancel
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[var(--border-section)]"></div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="relative flex-shrink-0 group">
                          <button
                            onClick={() => handleEditLabel(wallet)}
                            className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-section)] rounded transition-colors cursor-pointer"
                          >
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-section)] text-[var(--text-primary)] text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                            Edit label
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[var(--border-section)]"></div>
                          </div>
                        </div>
                        <div className="relative flex-shrink-0 group">
                          <button
                            onClick={() => handleRemoveWallet(wallet)}
                            disabled={isCheckingRemovalEligibility}
                            className="p-2 text-red-400 hover:bg-[var(--bg-section)] rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                          {isCheckingRemovalEligibility ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-section)] text-[var(--text-primary)] text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                          {isCheckingRemovalEligibility ? "Checking..." : "Remove wallet"}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[var(--border-section)]"></div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {walletToDelete && walletRemovalEligibility && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-section)] px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                  {walletRemovalEligibility.canRemove
                    ? "Remove Wallet"
                    : "Cannot Remove Wallet"}
                </h2>
                <button
                  onClick={cancelDeleteWallet}
                  className="text-[var(--text-muted-alt)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg p-3">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Wallet Address:</p>
                  <p className="font-mono text-sm text-[var(--text-primary)] break-all">
                    {walletToDelete.address}
                  </p>
                </div>

                {!walletRemovalEligibility.canRemove ? (
                  <>
                    <p className="text-[var(--text-primary)]">
                      This wallet cannot be removed because it is associated with deployed wills:
                    </p>

                    {walletRemovalEligibility.obstacles.secondaryMemberWills.length > 0 && (
                      <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                        <p className="font-semibold text-yellow-500 mb-2">
                          As secondary member in:
                        </p>
                        <ul className="list-disc list-inside text-yellow-500/80 text-sm space-y-1">
                          {walletRemovalEligibility.obstacles.secondaryMemberWills.map(
                            (name, idx) => (
                              <li key={idx}>"{name}"</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                    {walletRemovalEligibility.obstacles.ownedDeployedWills.length > 0 && (
                      <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                        <p className="font-semibold text-yellow-500 mb-2">
                          As primary member in:
                        </p>
                        <ul className="list-disc list-inside text-yellow-500/80 text-sm space-y-1">
                          {walletRemovalEligibility.obstacles.ownedDeployedWills.map(
                            (name, idx) => (
                              <li key={idx}>"{name}"</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                    <p className="text-[var(--text-muted)] text-sm mt-4">
                      You must cancel or withdraw from these wills on the blockchain before removing this wallet.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[var(--text-muted)] mb-4">
                  Are you sure you want to remove this wallet? This action cannot be undone.
                </p>
                  </>
                )}
              </div>

              <div className="border-t border-[var(--border-section)] px-6 py-4 flex gap-3">
                <button
                  onClick={cancelDeleteWallet}
                  className="flex-1 px-4 py-2 border border-[var(--border-section)] text-[var(--text-primary)] rounded-lg font-medium hover:bg-[var(--bg-section)] transition-colors"
                >
                  Back
                </button>
                {walletRemovalEligibility.canRemove && (
                  <button
                    onClick={confirmDeleteWallet}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Remove Wallet
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
