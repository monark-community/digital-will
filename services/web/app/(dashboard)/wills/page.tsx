"use client";

import { useState, useEffect, useRef } from "react";
import { useCurrentUser, useWallets, useContacts } from "@/lib/hooks";
import Header from "@/app/components/ui/Header";
import { willService, type SecondaryMemberInput, type WillFromDB } from "@/lib/services";
import type { Contact } from "@/lib/types";
import { config } from "@/lib/config";
import { ethers } from "ethers";

// Chain ID to name mapping
const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum Mainnet",
  11155111: "Sepolia Testnet",
  56: "BNB Smart Chain",
  43114: "Avalanche C-Chain",
  31337: "Anvil",
};

const getChainName = (chainId: number): string => {
  return CHAIN_NAMES[chainId] || `Chain ${chainId}`;
};

interface SecondaryMember {
  contactId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address: string;
  power: number;
}

export default function WillsPage() {
  const { data: user } = useCurrentUser();
  const { data: wallets } = useWallets();
  const { data: contacts } = useContacts();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const walletDropdownRef = useRef<HTMLDivElement>(null);
  const filterWalletDropdownRef = useRef<HTMLDivElement>(null);
  const [realWills, setRealWills] = useState<WillFromDB[]>([]);
  const [isLoadingWills, setIsLoadingWills] = useState(false);
  const [selectedFilterWalletId, setSelectedFilterWalletId] = useState<string>("all");
  const [showFilterWalletDropdown, setShowFilterWalletDropdown] = useState(false);
  
  const [factoryAddress, setFactoryAddress] = useState(config.blockchain.willFactoryAddress);
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [secondaryMembers, setSecondaryMembers] = useState<SecondaryMember[]>([
    { firstName: "", lastName: "", email: "", phoneNumber: "", address: "", power: 1 },
    { firstName: "", lastName: "", email: "", phoneNumber: "", address: "", power: 1 }
  ]);
  const [minSecurityPeriod, setMinSecurityPeriod] = useState("");
  const [maxSecurityPeriod, setMaxSecurityPeriod] = useState("");
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [showContactDropdown, setShowContactDropdown] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(event.target as Node)) {
        setShowWalletDropdown(false);
      }
      if (filterWalletDropdownRef.current && !filterWalletDropdownRef.current.contains(event.target as Node)) {
        setShowFilterWalletDropdown(false);
      }
    };

    if (showWalletDropdown || showFilterWalletDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showWalletDropdown, showFilterWalletDropdown]);

  useEffect(() => {
    const fetchWills = async () => {
      if (!wallets || wallets.length === 0) return;

      setIsLoadingWills(true);
      try {
        const allWillsPromises = wallets.map(wallet => 
          willService.getWillsByWallet(wallet.address)
        );
        const willsArrays = await Promise.all(allWillsPromises);
        const allWills = willsArrays.flat();
        setRealWills(allWills);
      } catch (error) {
        console.error("Error fetching wills:", error);
      } finally {
        setIsLoadingWills(false);
      }
    };

    fetchWills();
  }, [wallets]);

  const addSecondaryMember = () => {
    setSecondaryMembers([...secondaryMembers, { 
      firstName: "", 
      lastName: "", 
      email: "", 
      phoneNumber: "", 
      address: "", 
      power: 1 
    }]);
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

  const selectContactForMember = (index: number, contact: Contact) => {
    const updated = [...secondaryMembers];
    updated[index] = {
      contactId: contact.contactId,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phoneNumber: contact.phoneNumber || "",
      address: contact.walletAddress,
      power: updated[index].power,
    };
    setSecondaryMembers(updated);
    setShowContactDropdown(null);
  };
  const copyToClipboard = async (address: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(identifier);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
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
      if (!member.firstName.trim()) {
        setErrorMessage("Please provide first name for all secondary members");
        return;
      }
      if (!member.lastName.trim()) {
        setErrorMessage("Please provide last name for all secondary members");
        return;
      }
      if (!member.email.trim()) {
        setErrorMessage("Please provide email for all secondary members");
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(member.email)) {
        setErrorMessage(`Invalid email format: ${member.email}`);
        return;
      }
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
        validMembers.map(m => ({ address: m.address, power: m.power })),
        minPeriod,
        maxPeriod
      );

      const blockchainResult = await willService.createWill(params);

      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const network = await provider.getNetwork();
        
        await willService.saveWillToDB({
          walletAddress: selectedWallet.address,
          contractAddressInBlockchain: blockchainResult.willAddress,
          chainId: Number(network.chainId),
          secondaryMembers: validMembers.map(m => ({
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email,
            phoneNumber: m.phoneNumber,
            walletAddress: m.address,
          })),
        });

        setSuccessMessage(
          `Will created successfully! Will Address: ${blockchainResult.willAddress}`
        );

        setTimeout(() => {
          resetForm();
          window.location.reload(); // Refresh to show new will
        }, 2000);
      } catch (dbError: any) {
        console.error("Database save error:", dbError);
        setErrorMessage(
          `Will created on blockchain (${blockchainResult.willAddress}) but failed to save to database. Please contact support.`
        );
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to create will");
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setFactoryAddress(config.blockchain.willFactoryAddress);
    setSelectedWalletId("");
    setSecondaryMembers([
      { firstName: "", lastName: "", email: "", phoneNumber: "", address: "", power: 1 },
      { firstName: "", lastName: "", email: "", phoneNumber: "", address: "", power: 1 }
    ]);
    setMinSecurityPeriod("");
    setMaxSecurityPeriod("");
    setShowCreateForm(false);
    setShowWalletDropdown(false);
    setShowContactDropdown(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const selectedWallet = wallets?.find(w => w.walletId === selectedWalletId);
  const selectedFilterWallet = wallets?.find(w => w.walletId === selectedFilterWalletId);
  
  // Filter wills based on selected wallet
  const displayedWills = selectedFilterWalletId === "all" 
    ? realWills 
    : realWills.filter(will => will.walletAddress.toLowerCase() === selectedFilterWallet?.address.toLowerCase());

  return (
    <>
      <Header isAuthenticated={true} user={user} />
      <div className="min-h-screen bg-[var(--bg-page)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">My Wills</h1>
            <p className="text-[var(--text-muted)]">
              Manage your digital inheritance wills
            </p>
          </div>

          <div className="mb-6">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 bg-[var(--accent)] hover:opacity-90 text-white px-6 py-3 rounded-lg font-semibold transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Will</span>
            </button>
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
                    ? "Showing wills from all wallets" 
                    : `wallet id : ${selectedFilterWallet?.address}`}
                </p>
              </div>
              <svg 
                className={`w-6 h-6 text-[var(--text-primary)] transition-transform ${showFilterWalletDropdown ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                strokeWidth={2} 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
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
                  className={`w-full p-4 text-left hover:bg-[var(--bg-section)] transition-colors border-b border-[var(--border-section)] ${
                    selectedFilterWalletId === "all" ? "bg-[var(--bg-section)]" : ""
                  }`}
                >
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">All Wallets</h3>
                  <p className="text-sm text-[var(--text-muted-alt)]">Show wills from all wallets</p>
                </button>
                {wallets && wallets.length > 0 && wallets.map((wallet) => (
                  <button
                    key={wallet.walletId}
                    type="button"
                    onClick={() => {
                      setSelectedFilterWalletId(wallet.walletId);
                      setShowFilterWalletDropdown(false);
                    }}
                    className={`w-full p-4 text-left hover:bg-[var(--bg-section)] transition-colors border-b border-[var(--border-section)] last:border-b-0 ${
                      selectedFilterWalletId === wallet.walletId ? "bg-[var(--bg-section)]" : ""
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
                    <div className="space-y-4">
                      {secondaryMembers.map((member, index) => (
                        <div key={index} className="border border-[var(--border-section)] rounded-lg p-4 bg-[var(--bg-section)]/30">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-[var(--text-primary)]">Member {index + 1}</span>
                            <div className="flex items-center gap-2">
                              <div className="relative group">
                                <button
                                  type="button"
                                  onClick={() => contacts && contacts.length > 0 && setShowContactDropdown(showContactDropdown === index ? null : index)}
                                  disabled={!contacts || contacts.length === 0}
                                  className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                                    !contacts || contacts.length === 0
                                      ? 'text-[var(--text-muted-alt)] border border-[var(--border-section)] cursor-not-allowed opacity-50'
                                      : 'text-[var(--accent)] border border-[var(--accent)] hover:bg-[var(--accent)]/10'
                                  }`}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  Add Contact
                                </button>
                                {(!contacts || contacts.length === 0) && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    You have no contacts
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                )}
                              </div>
                              {secondaryMembers.length > 2 && (
                                <button
                                  onClick={() => removeSecondaryMember(index)}
                                  className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>

                          {showContactDropdown === index && contacts && contacts.length > 0 && (
                            <div className="mb-3 max-h-40 overflow-y-auto border border-[var(--border-section)] rounded-lg bg-[var(--bg-card)]">
                              {contacts
                                .filter((contact) => {
                                  const usedAddresses = secondaryMembers
                                    .map((m, i) => i !== index ? m.address.toLowerCase() : null)
                                    .filter(Boolean);
                                  return !usedAddresses.includes(contact.walletAddress.toLowerCase());
                                })
                                .map((contact) => (
                                  <button
                                    key={contact.contactId}
                                    type="button"
                                    onClick={() => selectContactForMember(index, contact)}
                                    className="w-full px-3 py-2 text-left hover:bg-[var(--bg-section)] transition-colors border-b border-[var(--border-section)] last:border-b-0"
                                  >
                                    <div className="text-sm font-medium text-[var(--text-primary)]">
                                      {contact.firstName} {contact.lastName}
                                    </div>
                                    <div className="text-xs text-[var(--text-muted-alt)] font-mono">{contact.walletAddress}</div>
                                  </button>
                                ))}
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <input
                              type="text"
                              value={member.firstName}
                              onChange={(e) => updateSecondaryMember(index, "firstName", e.target.value)}
                              placeholder="First Name *"
                              className="px-3 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            />
                            <input
                              type="text"
                              value={member.lastName}
                              onChange={(e) => updateSecondaryMember(index, "lastName", e.target.value)}
                              placeholder="Last Name *"
                              className="px-3 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <input
                              type="email"
                              value={member.email}
                              onChange={(e) => updateSecondaryMember(index, "email", e.target.value)}
                              placeholder="Email *"
                              className="px-3 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            />
                            <input
                              type="tel"
                              value={member.phoneNumber}
                              onChange={(e) => updateSecondaryMember(index, "phoneNumber", e.target.value)}
                              placeholder="Phone (optional)"
                              className="px-3 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            />
                          </div>

                          <div className="grid grid-cols-[1fr_auto] gap-3">
                            <input
                              type="text"
                              value={member.address}
                              onChange={(e) => updateSecondaryMember(index, "address", e.target.value)}
                              placeholder="0x... Wallet Address *"
                              className="px-3 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] text-sm font-mono placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            />
                            <input
                              type="number"
                              min="1"
                              max="255"
                              value={member.power}
                              onChange={(e) => updateSecondaryMember(index, "power", parseInt(e.target.value) || 1)}
                              placeholder="Power"
                              className="w-24 px-3 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] text-sm text-center placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={addSecondaryMember}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--accent)] border border-[var(--accent)] rounded-lg hover:bg-[var(--accent)]/10 transition-colors w-full justify-center"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Another Member
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

          {/* Wills List */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl p-6">
            <div className="space-y-4">
              {isLoadingWills ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
                  <p className="text-[var(--text-muted-alt)] mt-4">Loading wills...</p>
                </div>
              ) : displayedWills.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[var(--text-muted-alt)]">
                    {selectedFilterWalletId === "all" 
                      ? "No wills created yet" 
                      : "No wills found for this wallet"}
                  </p>
                  <p className="text-[var(--text-muted-alt)] text-sm mt-2">
                    {selectedFilterWalletId === "all" 
                      ? "Create your first will to get started" 
                      : "Try selecting a different wallet or create a new will"}
                  </p>
                </div>
              ) : (
                displayedWills.map((will) => (
                  <div key={will.willId} className="border border-[var(--border-section)] rounded-lg p-4 bg-[var(--bg-section)]/30 hover:bg-[var(--bg-section)]/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-[var(--text-primary)] mb-1">Will Contract</h3>
                        <p className="text-xs text-[var(--text-muted-alt)] font-mono">{will.contractAddressInBlockchain}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Deployed
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-[var(--text-muted-alt)]">Wallet Address</p>
                        <div className="flex items-start gap-2">
                          <p className="text-sm font-medium text-[var(--text-primary)] font-mono break-all">{will.walletAddress}</p>
                          <div className="relative flex-shrink-0">
                            <button
                              onClick={() => copyToClipboard(will.walletAddress, `will-wallet-${will.willId}`)}
                              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                              title="Copy address"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            {copiedAddress === `will-wallet-${will.willId}` && (
                              <div className="absolute left-1/2 -translate-x-1/2 -top-8 bg-green-600 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
                                Address copied!
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-[var(--text-muted-alt)]">Network</p>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{getChainName(will.chainId)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-muted-alt)]">Secondary Members</p>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{will.secondaryMembers.length} people</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-[var(--border-section)] pt-3 mt-3">
                      <p className="text-xs text-[var(--text-muted-alt)] mb-2">Secondary Members:</p>
                      <div className="space-y-2">
                        {will.secondaryMembers.map((member: WillFromDB['secondaryMembers'][0]) => (
                          <div key={member.secondaryMemberId} className="bg-[var(--bg-card)] rounded p-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-[var(--text-primary)]">
                                {member.FirstName} {member.LastName}
                              </span>
                            </div>
                            <div className="text-xs text-[var(--text-muted-alt)] space-y-1">
                              <div className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {member.Email}
                              </div>
                              {member.PhoneNumber && (
                                <div className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  {member.PhoneNumber}
                                </div>
                              )}
                              <div className="flex items-start gap-2">
                                <div className="font-mono break-all">
                                  {member.walletAddress}
                                </div>
                                <div className="relative flex-shrink-0">
                                  <button
                                    onClick={() => copyToClipboard(member.walletAddress, `beneficiary-${member.secondaryMemberId}`)}
                                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                                    title="Copy address"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                  {copiedAddress === `beneficiary-${member.secondaryMemberId}` && (
                                    <div className="absolute left-1/2 -translate-x-1/2 -top-8 bg-green-600 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
                                      Address copied!
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border-section)] text-[var(--text-primary)] hover:bg-[var(--bg-section)] transition-colors">
                        View Details
                      </button>
                      <button className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border-section)] text-[var(--text-primary)] hover:bg-[var(--bg-section)] transition-colors">
                        Manage
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
