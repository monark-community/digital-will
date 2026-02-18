"use client";

import { useState } from "react";
import { useWallets, useAddWallet, useRemoveWallet, useUpdateWalletLabel, useCurrentUser } from "@/lib/hooks";
import { connectWallet, isMetaMaskInstalled } from "@/lib/utils/wallet";
import Header from "@/app/components/ui/Header";
import type { Wallet } from "@/lib/types";

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
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleAddWallet = async () => {
    try {
      setErrorMessage(null);

      if (!isMetaMaskInstalled()) {
        setErrorMessage("MetaMask is not installed. Please install MetaMask to continue.");
        return;
      }

      const { address, signature, message } = await connectWallet();

      addWallet(
        { walletAddress: address, signature, message },
        {
          onError: (error: any) => {
            const msg = error?.response?.data?.message || "Failed to add wallet";
            setErrorMessage(msg);
          },
        }
      );
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to connect to MetaMask");
    }
  };

  const handleRemoveWallet = (wallet: Wallet) => {
    if (wallets && wallets.length === 1) {
      setErrorMessage("Cannot remove the last wallet from your account. You must have at least one wallet.");
      return;
    }

    setWalletToDelete(wallet);
  };

  const confirmDeleteWallet = () => {
    if (!walletToDelete) return;

    removeWallet(walletToDelete.walletId, {
      onSuccess: () => {
        setWalletToDelete(null);
      },
      onError: (error: any) => {
        const msg = error?.response?.data?.message || "Failed to remove wallet";
        setErrorMessage(msg);
      },
    });
  };

  const cancelDeleteWallet = () => {
    setWalletToDelete(null);
  };

  const copyToClipboard = async (address: string, walletId: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(walletId);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
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
          const msg = error?.response?.data?.message || "Failed to update label";
          setErrorMessage(msg);
        },
      }
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
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">My Wallets</h1>
          <p className="text-[var(--text-muted)]">
            Manage your connected MetaMask wallets
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-md bg-red-500/10 border border-red-500/20 p-4">
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}

        <div className="mb-6">
          <button
            onClick={handleAddWallet}
            disabled={isAdding}
            className="flex items-center space-x-2 bg-[var(--accent)] hover:opacity-90 text-white px-6 py-3 rounded-lg font-semibold transition-opacity disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{isAdding ? "Adding..." : "Add Wallet"}</span>
          </button>
        </div>

        <div className="space-y-4">
          {wallets && wallets.length === 0 && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-lg p-8 text-center">
              <p className="text-[var(--text-muted)]">No wallets connected yet</p>
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
                          if (e.key === 'Enter') {
                            handleSaveLabel(wallet.walletId);
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
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
                    <p className="font-mono text-sm text-[var(--text-muted)] break-all">
                      {wallet.address}
                    </p>
                    <div className="relative">
                      <button
                        onClick={() => copyToClipboard(wallet.address, wallet.walletId)}
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                        title="Copy address"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      {copiedAddress === wallet.walletId && (
                        <div className="absolute left-1/2 -translate-x-1/2 -top-8 bg-green-600 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
                          Address copied!
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    Added {new Date(wallet.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {editingLabel === wallet.walletId ? (
                    <>
                      <button
                        onClick={() => handleSaveLabel(wallet.walletId)}
                        className="p-2 text-green-500 hover:bg-[var(--bg-section)] rounded transition-colors cursor-pointer"
                        title="Save"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-section)] rounded transition-colors cursor-pointer"
                        title="Cancel"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditLabel(wallet)}
                        className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-section)] rounded transition-colors cursor-pointer"
                        title="Edit label"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRemoveWallet(wallet)}
                        className="p-2 text-red-400 hover:bg-[var(--bg-section)] rounded transition-colors cursor-pointer"
                        title="Remove wallet"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {walletToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                  Remove Wallet
                </h2>
                <p className="text-[var(--text-muted)] mb-4">
                  Are you sure you want to remove this wallet? This action cannot be undone.
                </p>
                <div className="bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg p-3 mb-6">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Wallet Address:</p>
                  <p className="font-mono text-sm text-[var(--text-primary)] break-all">
                    {walletToDelete.address}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={confirmDeleteWallet}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                  <button
                    onClick={cancelDeleteWallet}
                    className="flex-1 px-4 py-2 bg-[var(--bg-section)] hover:bg-[var(--bg-card)] border border-[var(--border-section)] text-[var(--text-primary)] font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
