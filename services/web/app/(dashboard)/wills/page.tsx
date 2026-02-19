"use client";

import { useState, useEffect, useRef } from "react";
import { useCurrentUser, useWallets } from "@/lib/hooks";
import Header from "@/app/components/ui/Header";
import { STUB_WILLS, formatCurrency } from "@/app/components/dashboard/stub-data";
import { willService } from "@/lib/services";
import { config } from "@/lib/config";
import { ethers } from "ethers";

type WillStatus = 'Draft' | 'Inactive' | 'Active';

interface SecondaryMember {
  address: string;
  power: number;
}

export default function WillsPage() {
  const { data: user } = useCurrentUser();
  const { data: wallets } = useWallets();
  const [filters, setFilters] = useState<Set<WillStatus>>(new Set(['Draft', 'Inactive', 'Active']));
  const [showCreateForm, setShowCreateForm] = useState(false);
  const walletDropdownRef = useRef<HTMLDivElement>(null);
  
  const [factoryAddress, setFactoryAddress] = useState(config.blockchain.willFactoryAddress);
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [secondaryMembers, setSecondaryMembers] = useState<SecondaryMember[]>([
    { address: "", power: 1 },
    { address: "", power: 1 }
  ]);
  const [minSecurityPeriod, setMinSecurityPeriod] = useState("");
  const [maxSecurityPeriod, setMaxSecurityPeriod] = useState("");
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(event.target as Node)) {
        setShowWalletDropdown(false);
      }
    };

    if (showWalletDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showWalletDropdown]);

  const toggleFilter = (status: WillStatus) => {
    const newFilters = new Set(filters);
    if (newFilters.has(status)) {
      newFilters.delete(status);
    } else {
      newFilters.add(status);
    }
    setFilters(newFilters);
  };

  const addSecondaryMember = () => {
    setSecondaryMembers([...secondaryMembers, { address: "", power: 1 }]);
  };

  const removeSecondaryMember = (index: number) => {
    if (secondaryMembers.length > 2) {
      setSecondaryMembers(secondaryMembers.filter((_, i) => i !== index));
    }
  };

  const updateSecondaryMember = (index: number, field: keyof SecondaryMember, value: string | number) => {
    const updated = [...secondaryMembers];
    updated[index] = { ...updated[index], [field]: value };
    setSecondaryMembers(updated);
  };

  const handleCreateWill = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedFactoryAddress = factoryAddress.trim();
    if (!trimmedFactoryAddress) {
      setErrorMessage("Please enter a factory contract address");
      return;
    }

    try {
      ethers.getAddress(trimmedFactoryAddress);
    } catch (error) {
      setErrorMessage("Invalid factory contract address format");
      return;
    }

    if (!selectedWalletId) {
      setErrorMessage("Please select a wallet");
      return;
    }

    const selectedWallet = wallets?.find(w => w.walletId === selectedWalletId);
    if (!selectedWallet) {
      setErrorMessage("Selected wallet not found");
      return;
    }

    const validMembers = secondaryMembers.filter(sm => sm.address.trim() !== "");
    if (validMembers.length < 2) {
      setErrorMessage("Please add at least 2 secondary members (contract requirement)");
      return;
    }

    for (const member of validMembers) {
      try {
        ethers.getAddress(member.address.trim());
      } catch (error) {
        setErrorMessage(`Invalid secondary member address: ${member.address}`);
        return;
      }
    }

    const addresses = validMembers.map(sm => sm.address.toLowerCase());
    const uniqueAddresses = new Set(addresses);
    if (addresses.length !== uniqueAddresses.size) {
      setErrorMessage("Duplicate secondary member addresses are not allowed");
      return;
    }

    const invalidPower = validMembers.find(sm => sm.power < 1 || sm.power > 255);
    if (invalidPower) {
      setErrorMessage("Power values must be between 1 and 255");
      return;
    }

    const minPeriod = parseInt(minSecurityPeriod);
    const maxPeriod = parseInt(maxSecurityPeriod);

    if (isNaN(minPeriod) || minPeriod < 0) {
      setErrorMessage("Please enter a valid minimum security period");
      return;
    }

    if (isNaN(maxPeriod) || maxPeriod < 0) {
      setErrorMessage("Please enter a valid maximum security period");
      return;
    }

    if (minPeriod > maxPeriod) {
      setErrorMessage("Minimum security period cannot be greater than maximum");
      return;
    }

    setIsCreating(true);

    try {
      const params = willService.prepareCreateWillParams(
        trimmedFactoryAddress,
        selectedWallet.address,
        validMembers,
        minPeriod,
        maxPeriod
      );

      const result = await willService.createWill(params);

      setSuccessMessage(
        `Will created successfully! Will Address: ${result.willAddress}`
      );

      setTimeout(() => {
        resetForm();
      }, 3000);
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to create will");
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setFactoryAddress(config.blockchain.willFactoryAddress);
    setSelectedWalletId("");
    setSecondaryMembers([{ address: "", power: 1 }, { address: "", power: 1 }]);
    setMinSecurityPeriod("");
    setMaxSecurityPeriod("");
    setShowCreateForm(false);
    setShowWalletDropdown(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const selectedWallet = wallets?.find(w => w.walletId === selectedWalletId);

  const filteredWills = STUB_WILLS.filter(will => filters.has(will.status));

  return (
    <>
      <Header isAuthenticated={true} user={user} />
      <div className="min-h-screen bg-[var(--bg-page)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">My Wills</h1>
              <p className="text-[var(--text-muted)]">
                Manage your digital inheritance wills
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Create Will
            </button>
          </div>

          {showCreateForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-section)] px-6 py-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">Create New Will</h2>
                  <button
                    onClick={resetForm}
                    className="text-[var(--text-muted-alt)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {errorMessage && (
                    <div className="px-4 py-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                      {errorMessage}
                    </div>
                  )}

                  {successMessage && (
                    <div className="px-4 py-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-500 text-sm">
                      {successMessage}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Factory Contract Address (Will be hardcoded eventually)
                    </label>
                    <input
                      type="text"
                      value={factoryAddress}
                      onChange={(e) => setFactoryAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>

                  <div ref={walletDropdownRef}>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Select Wallet
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                        className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-left text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          {selectedWallet ? (
                            <div>
                              {selectedWallet.label && (
                                <div className="text-[var(--text-primary)] font-medium">{selectedWallet.label}</div>
                              )}
                              <div className="text-[var(--text-muted-alt)] text-sm font-mono">
                                {selectedWallet.address}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[var(--text-muted-alt)]">Choose a wallet</span>
                          )}
                        </div>
                        <svg className="w-5 h-5 text-[var(--text-muted-alt)] ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {showWalletDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {wallets && wallets.length > 0 ? (
                            wallets.map((wallet) => (
                              <button
                                key={wallet.walletId}
                                type="button"
                                onClick={() => {
                                  setSelectedWalletId(wallet.walletId);
                                  setShowWalletDropdown(false);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-[var(--bg-card)] transition-colors border-b border-[var(--border-section)] last:border-b-0"
                              >
                                {wallet.label && (
                                  <div className="text-[var(--text-primary)] font-medium mb-1">{wallet.label}</div>
                                )}
                                <div className="text-[var(--text-muted-alt)] text-sm font-mono">
                                  {wallet.address}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-[var(--text-muted-alt)] text-sm">
                              No wallets available
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Secondary Members (minimum 2 required)
                    </label>
                    <div className="space-y-3">
                      {secondaryMembers.map((member, index) => (
                        <div key={index} className="flex gap-3 items-start">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={member.address}
                              onChange={(e) => updateSecondaryMember(index, "address", e.target.value)}
                              placeholder="0x... Member Address"
                              className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            />
                          </div>
                          <div className="w-32">
                            <input
                              type="number"
                              min="1"
                              max="255"
                              value={member.power}
                              onChange={(e) => updateSecondaryMember(index, "power", parseInt(e.target.value) || 1)}
                              placeholder="Power"
                              className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            />
                          </div>
                          {secondaryMembers.length > 2 && (
                            <button
                              onClick={() => removeSecondaryMember(index)}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addSecondaryMember}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--accent)] border border-[var(--accent)] rounded-lg hover:bg-[var(--accent)]/10 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Member
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Min Security Period (days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={minSecurityPeriod}
                        onChange={(e) => setMinSecurityPeriod(e.target.value)}
                        placeholder="e.g., 7"
                        className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Max Security Period (days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={maxSecurityPeriod}
                        onChange={(e) => setMaxSecurityPeriod(e.target.value)}
                        placeholder="e.g., 365"
                        className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={resetForm}
                      disabled={isCreating}
                      className="flex-1 px-4 py-2 border border-[var(--border-section)] text-[var(--text-primary)] rounded-lg font-medium hover:bg-[var(--bg-section)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateWill}
                      disabled={isCreating}
                      className="flex-1 px-4 py-2 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCreating && (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {isCreating ? "Creating..." : "Create Will"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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
