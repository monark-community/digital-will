"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCurrentUser, useWallets, useContacts } from "@/lib/hooks";
import Header from "@/app/components/ui/Header";
import {
  willService,
  type SecondaryMemberInput,
  type WillFromDB,
} from "@/lib/services";
import type { Contact } from "@/lib/types";
import { config } from "@/lib/config";
import { ethers } from "ethers";
import {
  fundWillContract,
  withdrawWillContract,
  cancelWillContract,
  vetoDeathContract,
  updateWillContract,
  periodToSeconds,
  displaySecurityPeriod,
} from "@/lib/utils/blockchain";
import {
  SecurityPeriodCountdown,
  CooldownCountdown,
} from "@/app/components/ui/SecurityPeriodCountdown";
import { getErrorMessage } from "@/lib/contract-errors";

const WILL_STATE_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-500/20 text-gray-400",
  INACTIVE: "bg-yellow-500/20 text-yellow-400",
  ACTIVE: "bg-emerald-500/20 text-emerald-400",
  CANCELED: "bg-red-500/20 text-red-400",
  EXECUTED: "bg-blue-500/20 text-blue-400",
};

const SM_STATE_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  VALIDATED: "bg-emerald-500/20 text-emerald-400",
  DECLARED_DEATH: "bg-red-500/20 text-red-400",
};

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
  relationship?: string;
}

interface EditWillMember {
  secondaryMemberId?: string;
  originalAddress?: string;
  address: string;
  power: number;
  firstName: string;
  lastName: string;
  email: string;
  relationship: string;
}

export default function WillsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: user } = useCurrentUser();
  const { data: wallets } = useWallets();
  const { data: contacts } = useContacts();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const walletDropdownRef = useRef<HTMLDivElement>(null);
  const filterWalletDropdownRef = useRef<HTMLDivElement>(null);
  const [realWills, setRealWills] = useState<WillFromDB[]>([]);
  const [isLoadingWills, setIsLoadingWills] = useState(false);
  const [selectedFilterWalletId, setSelectedFilterWalletId] =
    useState<string>("all");
  const [showFilterWalletDropdown, setShowFilterWalletDropdown] =
    useState(false);
  const [willName, setWillName] = useState("");
  const [editingWillId, setEditingWillId] = useState<string | null>(null); // Pour la modification
  const [deployingWillId, setDeployingWillId] = useState<string | null>(null); // Pour le dÃ©ploiement
  const [factoryAddress, setFactoryAddress] = useState(
    config.blockchain.willFactoryAddress,
  );
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [secondaryMembers, setSecondaryMembers] = useState<SecondaryMember[]>([
    {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      address: "",
      power: 1,
    },
    {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      address: "",
      power: 1,
    },
  ]);
  const [addingToContacts, setAddingToContacts] = useState<{
    index: number;
    isLoading: boolean;
  } | null>(null);
  const [minSecurityPeriod, setMinSecurityPeriod] = useState(
    (config.isLocalOrDev ? 1 : 28).toString(),
  );
  const [maxSecurityPeriod, setMaxSecurityPeriod] = useState(
    (config.isLocalOrDev ? 10000 : 154).toString(),
  );
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [showContactDropdown, setShowContactDropdown] = useState<number | null>(
    null,
  );
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [contactSuccessByIndex, setContactSuccessByIndex] = useState<
    Record<number, string>
  >({});
  const [addedContactFingerprintByIndex, setAddedContactFingerprintByIndex] =
    useState<Record<number, string>>({});
  const [powerDraftByIndex, setPowerDraftByIndex] = useState<
    Record<number, string>
  >({});
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [addContactTooltip, setAddContactTooltip] = useState<{
    index: number;
    top: number;
    left: number;
    message: string;
  } | null>(null);
  const [powerInfoTooltip, setPowerInfoTooltip] = useState<{
    index: number;
    top: number;
    left: number;
  } | null>(null);
  const [securityPeriodTooltip, setSecurityPeriodTooltip] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [canAddToContacts, setCanAddToContacts] = useState<boolean[]>([]);
  const [contractBalances, setContractBalances] = useState<
    Record<string, string>
  >({});
  const [fundModal, setFundModal] = useState<{
    willId: string;
    contractAddress: string;
  } | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [fundError, setFundError] = useState<string | null>(null);
  const [isFunding, setIsFunding] = useState(false);
  const [fundWalletBalance, setFundWalletBalance] = useState<string | null>(
    null,
  );
  const [withdrawModal, setWithdrawModal] = useState<{
    willId: string;
    contractAddress: string;
  } | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawWalletBalance, setWithdrawWalletBalance] = useState<
    string | null
  >(null);
  const [cancelModal, setCancelModal] = useState<{
    willId: string;
    contractAddress: string;
  } | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [vetoModal, setVetoModal] = useState<{
    willId: string;
    contractAddress: string;
  } | null>(null);
  const [vetoError, setVetoError] = useState<string | null>(null);
  const [isVetoing, setIsVetoing] = useState(false);
  const [canceledResolveModal, setCanceledResolveModal] = useState<{
    willId: string;
    action: "draft" | "delete";
  } | null>(null);
  const [canceledResolveError, setCanceledResolveError] = useState<
    string | null
  >(null);
  const [isCanceledResolving, setIsCanceledResolving] = useState(false);
  const [deployModal, setDeployModal] = useState<WillFromDB | null>(null);
  const [deployFundAmount, setDeployFundAmount] = useState("");
  const [deployFundError, setDeployFundError] = useState<string | null>(null);
  const [deployWalletBalance, setDeployWalletBalance] = useState<string | null>(
    null,
  );
  const [deleteDraftModal, setDeleteDraftModal] = useState<{
    willId: string;
    willName: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDraftToastName, setDeleteDraftToastName] = useState<
    string | null
  >(null);

  const [editWillModal, setEditWillModal] = useState<WillFromDB | null>(null);
  const [editWillMembers, setEditWillMembers] = useState<EditWillMember[]>([]);
  const [editWillMinPeriod, setEditWillMinPeriod] = useState("");
  const [editWillMaxPeriod, setEditWillMaxPeriod] = useState("");
  const [isUpdatingWill, setIsUpdatingWill] = useState(false);
  const [editWillError, setEditWillError] = useState<string | null>(null);
  const [highlightedWillId, setHighlightedWillId] = useState<string | null>(
    null,
  );

  const clearOpenCreateParam = useCallback(() => {
    if (!searchParams.has("openCreate")) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("openCreate");
    const queryString = params.toString();

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

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
    if (searchParams.get("openCreate") === "true") {
      setShowCreateForm(true);
      clearOpenCreateParam();
    }
  }, [clearOpenCreateParam, searchParams]);

  useEffect(() => {
    if (!fundModal) {
      setFundWalletBalance(null);
      return;
    }
    const fetch = async () => {
      try {
        if (typeof window !== "undefined" && (window as any).ethereum) {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const signer = await provider.getSigner();
          const balance = await provider.getBalance(await signer.getAddress());
          setFundWalletBalance(ethers.formatEther(balance));
        }
      } catch {
        setFundWalletBalance(null);
      }
    };
    fetch();
  }, [fundModal]);

  useEffect(() => {
    if (!withdrawModal) {
      setWithdrawWalletBalance(null);
      return;
    }
    const fetch = async () => {
      try {
        if (typeof window !== "undefined" && (window as any).ethereum) {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const signer = await provider.getSigner();
          const balance = await provider.getBalance(await signer.getAddress());
          setWithdrawWalletBalance(ethers.formatEther(balance));
        }
      } catch {
        setWithdrawWalletBalance(null);
      }
    };
    fetch();
  }, [withdrawModal]);

  useEffect(() => {
    if (!deployModal) {
      setDeployWalletBalance(null);
      return;
    }
    const fetchWalletBalance = async () => {
      try {
        if (typeof window !== "undefined" && (window as any).ethereum) {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          const balance = await provider.getBalance(address);
          setDeployWalletBalance(ethers.formatEther(balance));
        }
      } catch {
        setDeployWalletBalance(null);
      }
    };
    fetchWalletBalance();
  }, [deployModal]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        walletDropdownRef.current &&
        !walletDropdownRef.current.contains(event.target as Node)
      ) {
        setShowWalletDropdown(false);
      }
      if (
        filterWalletDropdownRef.current &&
        !filterWalletDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFilterWalletDropdown(false);
      }
    };

    if (showWalletDropdown || showFilterWalletDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showWalletDropdown, showFilterWalletDropdown]);

  const fetchWills = useCallback(async () => {
    if (!wallets || wallets.length === 0) return;

    setIsLoadingWills(true);
    try {
      const allWillsPromises = wallets.map((wallet) =>
        willService.getEnrichedWillsByWallet(wallet.address),
      );
      const willsArrays = await Promise.all(allWillsPromises);
      const allWills = willsArrays.flat();
      setRealWills(allWills);

      const balanceMap: Record<string, string> = {};
      allWills.forEach((w) => {
        if (w.contractBalance !== undefined) {
          balanceMap[w.willId] = w.contractBalance;
        }
      });
      setContractBalances(balanceMap);
    } catch (error) {
      console.error("Error fetching wills:", error);
    } finally {
      setIsLoadingWills(false);
    }
  }, [wallets]);

  useEffect(() => {
    fetchWills();
  }, [fetchWills]);

  useEffect(() => {
    const { errors, canAddToContacts } = validateDraftForm();
    setFormErrors(errors);
    setCanAddToContacts(canAddToContacts);
  }, [
    selectedWalletId,
    secondaryMembers,
    minSecurityPeriod,
    maxSecurityPeriod,
    willName,
    editingWillId,
  ]);
  // Quand le min change, ajuster le max si nÃ©cessaire
  useEffect(() => {
    const min = parseInt(minSecurityPeriod);
    const max = parseInt(maxSecurityPeriod);

    if (!isNaN(min) && !isNaN(max) && min > max) {
      setMaxSecurityPeriod(min.toString());
    }
  }, [minSecurityPeriod]);

  // Quand le max change, juste vÃ©rifier qu'il reste valide
  useEffect(() => {
    const min = parseInt(minSecurityPeriod);
    const max = parseInt(maxSecurityPeriod);

    if (!isNaN(min) && !isNaN(max) && max < min) {
      // Option 1: Ajuster automatiquement
      // setMinSecurityPeriod(max.toString());
      // Option 2: Laisser l'erreur Ãªtre gÃ©rÃ©e par la validation
      // (c'est ce qu'on fait dÃ©jÃ )
    }
  }, [maxSecurityPeriod]);

  const addSecondaryMember = () => {
    setSecondaryMembers([
      ...secondaryMembers,
      {
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        address: "",
        power: 1,
      },
    ]);
  };

  const getContactFingerprint = (member: SecondaryMember) => {
    return [
      member.firstName.trim(),
      member.lastName.trim(),
      member.email.trim().toLowerCase(),
      member.address.trim().toLowerCase(),
    ].join("|");
  };

  const normalizeContactField = (value?: string | null) =>
    (value || "").trim().toLowerCase();

  const memberMatchesExistingContact = (member: SecondaryMember) => {
    if (!contacts || contacts.length === 0) return false;

    const normalizedMemberFirstName = normalizeContactField(member.firstName);
    const normalizedMemberLastName = normalizeContactField(member.lastName);
    const normalizedMemberEmail = normalizeContactField(member.email);
    const normalizedMemberAddress = normalizeContactField(member.address);

    return contacts.some((contact) => {
      return (
        normalizeContactField(contact.firstName) === normalizedMemberFirstName &&
        normalizeContactField(contact.lastName) === normalizedMemberLastName &&
        normalizeContactField(contact.email) === normalizedMemberEmail &&
        normalizeContactField(contact.walletAddress) === normalizedMemberAddress
      );
    });
  };

  const removeSecondaryMember = (index: number) => {
    if (secondaryMembers.length > 2) {
      setSecondaryMembers(secondaryMembers.filter((_, i) => i !== index));
      setContactSuccessByIndex((prev) => {
        const next: Record<number, string> = {};
        for (const [key, value] of Object.entries(prev)) {
          const numericKey = Number(key);
          if (numericKey < index) next[numericKey] = value;
          if (numericKey > index) next[numericKey - 1] = value;
        }
        return next;
      });
      setAddedContactFingerprintByIndex((prev) => {
        const next: Record<number, string> = {};
        for (const [key, value] of Object.entries(prev)) {
          const numericKey = Number(key);
          if (numericKey < index) next[numericKey] = value;
          if (numericKey > index) next[numericKey - 1] = value;
        }
        return next;
      });
      setPowerDraftByIndex((prev) => {
        const next: Record<number, string> = {};
        for (const [key, value] of Object.entries(prev)) {
          const numericKey = Number(key);
          if (numericKey < index) next[numericKey] = value;
          if (numericKey > index) next[numericKey - 1] = value;
        }
        return next;
      });
    }
  };

  const updateSecondaryMember = (
    index: number,
    field: keyof SecondaryMember,
    value: string | number,
  ) => {
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
      relationship: contact.relationship || "",
    };
    setSecondaryMembers(updated);
    setShowContactDropdown(null);
  };

  const refreshBalance = async (willId: string, contractAddress: string) => {
    try {
      const balance = await willService.getContractBalance(contractAddress);
      setContractBalances((prev) => ({ ...prev, [willId]: balance }));
    } catch (error) {
      console.error("Error refreshing balance:", error);
    }
  };

  const handleFundWill = async () => {
    if (!fundModal) return;
    const amount = fundAmount.trim();
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setFundError("Please enter a valid amount greater than 0.");
      return;
    }
    if (fundWalletBalance !== null) {
      const gasBuffer = 0.005;
      if (parseFloat(fundWalletBalance) < parseFloat(amount) + gasBuffer) {
        setFundError(
          `Insufficient balance. You have ${parseFloat(fundWalletBalance).toFixed(4)} ETH but need at least ${(parseFloat(amount) + gasBuffer).toFixed(4)} ETH (amount + gas).`,
        );
        return;
      }
    }
    setFundError(null);
    setIsFunding(true);
    try {
      await fundWillContract(fundModal.contractAddress, amount);
      await refreshBalance(fundModal.willId, fundModal.contractAddress);
      setFundModal(null);
      setFundAmount("");
    } catch (err: any) {
      setFundError(getErrorMessage(err, "Transaction failed."));
    } finally {
      setIsFunding(false);
    }
  };

  const handleWithdrawWill = async () => {
    if (!withdrawModal) return;
    const amount = withdrawAmount.trim();
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setWithdrawError("Please enter a valid amount greater than 0.");
      return;
    }
    const contractBal = contractBalances[withdrawModal.willId];
    if (
      contractBal !== undefined &&
      parseFloat(amount) > parseFloat(contractBal)
    ) {
      setWithdrawError(
        `Amount exceeds contract balance (${parseFloat(contractBal).toFixed(4)} ETH).`,
      );
      return;
    }
    setWithdrawError(null);
    setIsWithdrawing(true);
    try {
      await withdrawWillContract(withdrawModal.contractAddress, amount);
      await refreshBalance(withdrawModal.willId, withdrawModal.contractAddress);
      setWithdrawModal(null);
      setWithdrawAmount("");
    } catch (err: any) {
      setWithdrawError(getErrorMessage(err, "Transaction failed."));
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleCancelWill = async () => {
    if (!cancelModal) return;
    setCancelError(null);
    setIsCanceling(true);
    try {
      // Get the will data from realWills
      const will = realWills.find((w) => w.willId === cancelModal.willId);
      if (!will) {
        setCancelError("Will not found");
        setIsCanceling(false);
        return;
      }

      // Call blockchain cancel
      await cancelWillContract(cancelModal.contractAddress);

      // Prepare voting powers map from secondary members
      const secondaryMembersVotingPowers = will.secondaryMembers.reduce(
        (acc, member) => {
          acc[member.secondaryMemberId] = member.votingPower;
          return acc;
        },
        {} as Record<string, number>,
      );

      /* Call service to update DB
      The old will is deleted and a new draft will is created instead.
      */
      const draftWill = await willService.cancelWill(cancelModal.willId, {
        minSecurityPeriod: will.minSecurityPeriod,
        maxSecurityPeriod: will.maxSecurityPeriod,
        secondaryMembersVotingPowers,
      });

      // Update local state - delete the old will and add the new draft will
      setRealWills(
        (prev) =>
          prev
            .filter((w) => w.willId !== cancelModal.willId) // Remove the old will
            .concat(draftWill), // Add the new draft will
      );
      setCancelModal(null);
    } catch (err: any) {
      setCancelError(getErrorMessage(err, "Transaction failed."));
    } finally {
      setIsCanceling(false);
    }
  };

  const handleVetoDeath = async () => {
    if (!vetoModal) return;
    setVetoError(null);
    setIsVetoing(true);
    try {
      await vetoDeathContract(vetoModal.contractAddress);
      setVetoModal(null);
      await fetchWills();
    } catch (err: any) {
      setVetoError(getErrorMessage(err, "Transaction failed."));
    } finally {
      setIsVetoing(false);
    }
  };

  const handleConfirmCanceledResolve = async () => {
    if (!canceledResolveModal) return;
    setCanceledResolveError(null);
    setIsCanceledResolving(true);
    const { willId, action } = canceledResolveModal;
    try {
      // Cancel will in DB (will become a draft will)

      const will = realWills.find((w) => w.willId === willId);

      if (!will) {
        throw new Error("Will to be canceled not found");
      }

      const secondaryMembersVotingPowers = will.secondaryMembers.reduce(
        (acc, member) => {
          acc[member.secondaryMemberId] = member.votingPower;
          return acc;
        },
        {} as Record<string, number>,
      );

      const draftWill = await willService.cancelWill(willId, {
        minSecurityPeriod: will.minSecurityPeriod,
        maxSecurityPeriod: will.maxSecurityPeriod,
        secondaryMembersVotingPowers,
      });

      setRealWills(
        (prev) =>
          prev
            .filter((w) => w.willId !== willId) // Remove the old will
            .concat(draftWill), // Add the new draft will
      );

      if (action === "delete") {
        await willService.deleteDraftWill(draftWill.willId);
        setRealWills((prev) =>
          prev.filter((w) => w.willId !== draftWill.willId),
        );
      }
      setCanceledResolveModal(null);
    } catch (err: any) {
      setCanceledResolveError(err.message ?? "Action failed.");
    } finally {
      setIsCanceledResolving(false);
    }
  };

  const copyToClipboard = async (address: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(identifier);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  const handleAddToContacts = async (memberIndex: number) => {
    const member = secondaryMembers[memberIndex];

    setAddingToContacts({ index: memberIndex, isLoading: true });

    try {
      await willService.addMemberToContacts({
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phoneNumber: member.phoneNumber,
        walletAddress: member.address,
        relationship: member.relationship,
      });

      setContactSuccessByIndex((prev) => ({
        ...prev,
        [memberIndex]: "Contact added successfully!",
      }));
      setAddedContactFingerprintByIndex((prev) => ({
        ...prev,
        [memberIndex]: getContactFingerprint(member),
      }));
      setTimeout(() => {
        setContactSuccessByIndex((prev) => {
          if (!(memberIndex in prev)) return prev;
          const next = { ...prev };
          delete next[memberIndex];
          return next;
        });
      }, 3000);
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setAddingToContacts(null);
    }
  };

  const handleCreateDraft = async () => {
    const selectedWallet = wallets?.find(
      (w) => w.walletId === selectedWalletId,
    );
    if (!selectedWallet && !editingWillId) {
      setErrorMessage("Please select a wallet");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    const validMembers = secondaryMembers.filter(
      (m) =>
        m.firstName.trim() ||
        m.lastName.trim() ||
        m.email.trim() ||
        m.address.trim(),
    );

    setIsSavingDraft(true);
    try {
      if (editingWillId) {
        await willService.updateDraftWill(editingWillId, {
          willName: willName.trim(),
          secondaryMembers: validMembers.map((m) => ({
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email,
            phoneNumber: m.phoneNumber,
            tempWalletAddress: m.address,
            votingPower: m.power,
            relationship: m.relationship,
          })),
          minSecurityPeriod: Number(
            periodToSeconds(parseInt(minSecurityPeriod) || 0),
          ),
          maxSecurityPeriod: Number(
            periodToSeconds(parseInt(maxSecurityPeriod) || 0),
          ),
        });
        setSuccessMessage("Draft will updated successfully!");
      } else {
        const minSec = parseInt(minSecurityPeriod) || 0;
        const maxSec = parseInt(maxSecurityPeriod) || 0;
        await willService.createDraftWill({
          walletAddress: selectedWallet!.address,
          willName: willName,
          secondaryMembers: validMembers.map((m) => ({
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email,
            phoneNumber: m.phoneNumber,
            tempWalletAddress: m.address,
            votingPower: m.power,
            relationship: m.relationship,
          })),
          minSecurityPeriod: Number(periodToSeconds(minSec)),
          maxSecurityPeriod: Number(periodToSeconds(maxSec)),
        });
        setSuccessMessage("Draft will saved successfully!");
      }

      setTimeout(() => {
        resetForm();
        window.location.reload(); // Refresh to show new/updated will
      }, 2000);
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const validateForDeployment = (
    will: WillFromDB,
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // 1. VÃ©rifier qu'il y a au moins 2 membres
    if (will.secondaryMembers.length < 2) {
      errors.push("At least 2 secondary members are required for deployment");
    }

    // 2. VÃ©rifier que chaque membre a une adresse wallet valide
    for (let i = 0; i < will.secondaryMembers.length; i++) {
      const member = will.secondaryMembers[i];
      const address = member.walletAddress || member.tempWalletAddress;

      if (!address) {
        errors.push(
          `Member ${i + 1} (${member.firstName} ${member.lastName}) has no wallet address`,
        );
      } else {
        try {
          ethers.getAddress(address);
        } catch (error) {
          errors.push(
            `Member ${i + 1} (${member.firstName} ${member.lastName}) has invalid wallet address format`,
          );
        }
      }

      // 3. VÃ©rifier le voting power (1-255)
      if (member.votingPower < 1 || member.votingPower > 255) {
        errors.push(
          `Member ${i + 1} (${member.firstName} ${member.lastName}) has invalid voting power (must be 1-255)`,
        );
      }
    }

    // 4. VÃ©rifier les adresses uniques
    const addresses = will.secondaryMembers
      .map((m) => (m.walletAddress || m.tempWalletAddress)?.toLowerCase())
      .filter(Boolean);
    const uniqueAddresses = new Set(addresses);
    if (addresses.length !== uniqueAddresses.size) {
      errors.push("Duplicate member addresses are not allowed");
    }

    // 5. VÃ©rifier les pÃ©riodes de sÃ©curitÃ©
    if (
      will.minSecurityPeriod < config.securityPeriod.min ||
      will.maxSecurityPeriod < config.securityPeriod.min
    ) {
      errors.push(
        `Security periods must be at least ${config.securityPeriod.min} ${config.securityPeriod.unit}`,
      );
    }
    if (
      will.minSecurityPeriod > config.securityPeriod.max ||
      will.maxSecurityPeriod > config.securityPeriod.max
    ) {
      errors.push(
        `Security periods cannot exceed ${config.securityPeriod.max} ${config.securityPeriod.unit}`,
      );
    }
    if (will.minSecurityPeriod > will.maxSecurityPeriod) {
      errors.push("Minimum security period cannot be greater than maximum");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const validateDraftForm = (): {
    isValid: boolean;
    errors: string[];
    canAddToContacts: boolean[];
  } => {
    const errors: string[] = [];
    const canAddToContacts: boolean[] = [];

    // VÃ©rifier qu'un wallet est sÃ©lectionnÃ©
    if (!selectedWalletId) {
      errors.push("Please select a wallet");
    }

    if (!willName.trim()) {
      errors.push("Will name is required");
    } else if (willName.length > 100) {
      errors.push("Will name must be less than 100 characters");
    }

    // Filtrer les membres qui ont au moins un champ rempli
    const membersWithData = secondaryMembers.filter(
      (m) =>
        m.firstName.trim() ||
        m.lastName.trim() ||
        m.email.trim() ||
        m.address.trim(),
    );

    for (let i = 0; i < secondaryMembers.length; i++) {
      const member = secondaryMembers[i];

      // Valeurs par dÃ©faut pour ce membre
      let canAddContact = false;

      // VÃ©rifier si AU MOINS UN champ est rempli (sauf power qui a une valeur par dÃ©faut)
      const hasAnyField =
        member.firstName.trim() ||
        member.lastName.trim() ||
        member.email.trim() ||
        member.address.trim() ||
        member.phoneNumber?.trim();

      if (hasAnyField) {
        // Validation prÃ©nom
        if (!member.firstName.trim()) {
          errors.push(`Member ${i + 1}: First name is required`);
        }

        // Validation nom
        if (!member.lastName.trim()) {
          errors.push(`Member ${i + 1}: Last name is required`);
        }

        // Validation email
        if (!member.email.trim()) {
          errors.push(`Member ${i + 1}: Email is required`);
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(member.email)) {
          errors.push(`Member ${i + 1}: Invalid email format`);
        }

        if (member.phoneNumber && member.phoneNumber.trim() !== "") {
          // Regex pour 10 chiffres (format 3-3-4)
          const phoneRegex = /^\d{10}$/;
          if (!phoneRegex.test(member.phoneNumber)) {
            errors.push(
              `Member ${i + 1}: Phone number must be 10 digits (e.g., 5141234567)`,
            );
          }
        }

        if (!member.address.trim()) {
          errors.push(`Member ${i + 1}: Wallet address is required`);
        } else {
          try {
            ethers.getAddress(member.address.trim());
          } catch (error) {
            errors.push(`Member ${i + 1}: Invalid wallet address format`);
          }
        }

        // Validation power
        if (member.power < 1 || member.power > 255) {
          errors.push(`Member ${i + 1}: Power must be between 1 and 255`);
        }

        let contactValid = true;

        if (!member.firstName.trim()) contactValid = false;
        else if (!member.lastName.trim()) contactValid = false;
        else if (!member.email.trim()) contactValid = false;
        else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(member.email)) contactValid = false;
        }

        if (
          contactValid &&
          member.phoneNumber &&
          member.phoneNumber.trim() !== ""
        ) {
          const phoneRegex = /^\d{10}$/;
          if (!phoneRegex.test(member.phoneNumber)) contactValid = false;
        }

        if (contactValid) {
          if (!member.address.trim()) contactValid = false;
          else {
            try {
              ethers.getAddress(member.address.trim());
            } catch (error) {
              contactValid = false;
            }
          }
        }

        // PAS de validation du power pour les contacts !
        canAddContact = contactValid;
      }

      canAddToContacts[i] = canAddContact;
    }

    // Validation des pÃ©riodes de sÃ©curitÃ©
    const minPeriod = parseInt(minSecurityPeriod);
    const maxPeriod = parseInt(maxSecurityPeriod);

    // VÃ©rifier que les deux sont remplis
    if (!minSecurityPeriod.trim()) {
      errors.push("Minimum security period is required");
    } else if (isNaN(minPeriod) || minPeriod < 0) {
      errors.push("Minimum security period must be a valid positive number");
    }

    if (!maxSecurityPeriod.trim()) {
      errors.push("Maximum security period is required");
    } else if (isNaN(maxPeriod) || maxPeriod < 0) {
      errors.push("Maximum security period must be a valid positive number");
    }
    if (
      minSecurityPeriod.trim() &&
      maxSecurityPeriod.trim() &&
      !isNaN(minPeriod) &&
      !isNaN(maxPeriod) &&
      minPeriod >= 0 &&
      maxPeriod >= 0
    ) {
      if (minPeriod > maxPeriod) {
        errors.push("Minimum security period cannot be greater than maximum");
      }

      const minPeriodSeconds = config.isLocalOrDev ? minPeriod * 60 : minPeriod * 86400;
      const maxPeriodSeconds = config.isLocalOrDev ? maxPeriod * 60 : maxPeriod * 86400;

      // Optionnel : vÃ©rifier des plages spÃ©cifiques
      if (minPeriodSeconds < config.securityPeriod.min) {
        const minLimit = config.isLocalOrDev ? config.securityPeriod.min / 60 : config.securityPeriod.min / 86400;
        errors.push(
          `Minimum security period must be at least ${minLimit} ${config.securityPeriod.unit}`,
        );
      }

      if (maxPeriodSeconds > config.securityPeriod.max) {
        const maxLimit = config.isLocalOrDev ? config.securityPeriod.max / 60 : config.securityPeriod.max / 86400;
        errors.push(
          `Maximum security period cannot exceed ${maxLimit} ${config.securityPeriod.unit}`,
        );
      }
    }

    // VÃ©rifier les adresses en double (seulement pour celles qui sont remplies)
    const addresses = membersWithData
      .map((m) => m.address.trim().toLowerCase())
      .filter((addr) => addr !== "");
    const uniqueAddresses = new Set(addresses);
    if (addresses.length !== uniqueAddresses.size) {
      errors.push("Duplicate secondary member addresses are not allowed");
    }

    return {
      isValid: errors.length === 0,
      errors,
      canAddToContacts,
    };
  };

  const handleDeployWill = async (will: WillFromDB) => {
    try {
      const validation = await willService.validateForDeployment(will.willId);
      if (!validation.isValid) {
        setErrorMessage(validation.errors[0]);
        return;
      }
      setDeployModal(will);
    } catch (error: any) {
      setErrorMessage(error.message || "Validation failed");
    }
  };

  const handleConfirmDeploy = async (fundEth?: string) => {
    if (!deployModal) return;

    if (fundEth && parseFloat(fundEth) > 0 && deployWalletBalance !== null) {
      const gasBuffer = 0.005;
      const requested = parseFloat(fundEth);
      const available = parseFloat(deployWalletBalance);
      if (available < requested + gasBuffer) {
        setDeployFundError(
          `Insufficient balance. You have ${available.toFixed(4)} ETH but need at least ${(requested + gasBuffer).toFixed(4)} ETH (funding + gas).`,
        );
        return;
      }
    }

    const will = deployModal;

    setErrorMessage(null);
    setSuccessMessage(null);
    setDeployingWillId(will.willId);
    setDeployFundError(null);

    try {
      const blockchainMembers = will.secondaryMembers.map((m) => ({
        address: m.walletAddress || m.tempWalletAddress || "",
        power: m.votingPower,
      }));

      const deployedWill = await willService.deployWill(will.willId, {
        factoryAddress: config.blockchain.willFactoryAddress,
        ownerAddress: will.walletAddress,
        secondaryMembers: blockchainMembers,
        minSecurityPeriodSeconds: will.minSecurityPeriod,
        maxSecurityPeriodSeconds: will.maxSecurityPeriod,
        initialFundEth:
          fundEth && parseFloat(fundEth) > 0 ? fundEth : undefined,
      });

      setDeployModal(null);
      setDeployFundAmount("");
      setSuccessMessage(
        `Will deployed successfully! Contract: ${deployedWill.contractAddressInBlockchain}`,
      );

      setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
      const errorMsg = getErrorMessage(error, "Failed to deploy will.");
      setDeployFundError(errorMsg);
    } finally {
      setDeployingWillId(null);
    }
  };

  const handleEditDraft = (will: WillFromDB) => {
    // PrÃ©-remplir le formulaire avec les donnÃ©es du will
    setSelectedWalletId(
      wallets?.find((w) => w.address === will.walletAddress)?.walletId || "",
    );
    setWillName(will.willName);
    setSecondaryMembers(
      will.secondaryMembers.map((m) => ({
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
        phoneNumber: m.phoneNumber || "",
        address: m.walletAddress || m.tempWalletAddress || "",
        power: m.votingPower,
        relationship: m.relationship || "",
      })),
    );

    if (will.secondaryMembers.length < 2) {
      setSecondaryMembers((prev) => {
        const newMembers = [...prev];
        while (newMembers.length < 2) {
          newMembers.push({
            firstName: "",
            lastName: "",
            email: "",
            phoneNumber: "",
            address: "",
            power: 1,
          });
        }
        return newMembers;
      });
    }
    setMinSecurityPeriod(
      (config.isLocalOrDev
        ? Math.round(will.minSecurityPeriod / 60)
        : Math.round(will.minSecurityPeriod / 86400)
      ).toString(),
    );
    setMaxSecurityPeriod(
      (config.isLocalOrDev
        ? Math.round(will.maxSecurityPeriod / 60)
        : Math.round(will.maxSecurityPeriod / 86400)
      ).toString(),
    );

    // Stocker l'ID du will en cours d'Ã©dition
    setEditingWillId(will.willId);

    // Ouvrir le formulaire
    setShowCreateForm(true);
  };
  const handleDeleteDraft = (willId: string, willName: string) => {
    setDeleteDraftModal({ willId, willName });
    setDeleteError(null);
  };

  const handleConfirmDeleteDraft = async () => {
    if (!deleteDraftModal) return;
    const willIdToDelete = deleteDraftModal.willId;
    const willNameToDelete = deleteDraftModal.willName;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await willService.deleteDraftWill(willIdToDelete);
      setRealWills((prev) => prev.filter((w) => w.willId !== willIdToDelete));
      setDeleteDraftModal(null);
      setDeleteDraftToastName(willNameToDelete);
    } catch (error: any) {
      setDeleteError(error.message ?? "Failed to delete draft.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenEditWill = (will: WillFromDB) => {
    setEditWillMembers(
      will.secondaryMembers.map((m) => ({
        secondaryMemberId: m.secondaryMemberId,
        originalAddress: m.walletAddress || m.tempWalletAddress || "",
        address: m.walletAddress || m.tempWalletAddress || "",
        power: m.votingPower,
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
        relationship: m.relationship ?? "",
      })),
    );
    setEditWillMinPeriod(
      (config.isLocalOrDev
        ? Math.round(will.minSecurityPeriod / 60)
        : Math.round(will.minSecurityPeriod / 86400)
      ).toString(),
    );
    setEditWillMaxPeriod(
      (config.isLocalOrDev
        ? Math.round(will.maxSecurityPeriod / 60)
        : Math.round(will.maxSecurityPeriod / 86400)
      ).toString(),
    );
    setEditWillError(null);
    setEditWillModal(will);
  };

  const computeEditWillDiffs = () => {
    if (!editWillModal) return null;

    const originalById = new Map(
      editWillModal.secondaryMembers.map((m) => [
        m.secondaryMemberId,
        {
          address: (m.walletAddress || m.tempWalletAddress || "").toLowerCase(),
          power: m.votingPower,
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email,
          relationship: m.relationship ?? "",
        },
      ]),
    );

    const currentExisting = editWillMembers.filter((m) => m.secondaryMemberId);
    const currentSmIds = new Set(
      currentExisting.map((m) => m.secondaryMemberId!),
    );

    const updatedSmList: Array<{ smAddress: string; votePower: number }> = [];
    const blockchainAddedSmList: Array<{
      smAddress: string;
      votePower: number;
    }> = [];
    const blockchainDeletedSmList: string[] = [];

    for (const m of currentExisting) {
      const orig = originalById.get(m.secondaryMemberId!);
      if (!orig) continue;
      const newAddr = m.address.trim().toLowerCase();
      if (newAddr !== orig.address && newAddr !== "") {
        blockchainDeletedSmList.push(orig.address);
        blockchainAddedSmList.push({
          smAddress: m.address.trim(),
          votePower: m.power,
        });
      } else if (m.power !== orig.power) {
        updatedSmList.push({ smAddress: orig.address, votePower: m.power });
      }
    }

    for (const [id, orig] of originalById) {
      if (!currentSmIds.has(id)) blockchainDeletedSmList.push(orig.address);
    }

    const newMembers = editWillMembers.filter(
      (m) => !m.secondaryMemberId && m.address.trim(),
    );
    for (const m of newMembers) {
      blockchainAddedSmList.push({
        smAddress: m.address.trim(),
        votePower: m.power,
      });
    }

    const needsBlockchain =
      updatedSmList.length > 0 ||
      blockchainAddedSmList.length > 0 ||
      blockchainDeletedSmList.length > 0;

    const parsedMin = parseInt(editWillMinPeriod) || 0;
    const parsedMax = parseInt(editWillMaxPeriod) || 0;
    const originalMin = config.isLocalOrDev
      ? Math.round(editWillModal.minSecurityPeriod / 60)
      : Math.round(editWillModal.minSecurityPeriod / 86400);
    const originalMax = config.isLocalOrDev
      ? Math.round(editWillModal.maxSecurityPeriod / 60)
      : Math.round(editWillModal.maxSecurityPeriod / 86400);
    const minChanged = parsedMin !== originalMin;
    const maxChanged = parsedMax !== originalMax;
    const periodChanged = minChanged || maxChanged;
    const periodConfig = periodChanged
      ? {
          minSecurityPeriod: periodToSeconds(parsedMin),
          maxSecurityPeriod: periodToSeconds(parsedMax),
        }
      : { minSecurityPeriod: BigInt(0), maxSecurityPeriod: BigInt(0) };

    const dbUpdatedMembers = currentExisting
      .filter((m) => {
        const orig = originalById.get(m.secondaryMemberId!);
        if (!orig) return false;
        return (
          m.address.trim().toLowerCase() !== orig.address ||
          m.power !== orig.power ||
          m.firstName !== orig.firstName ||
          m.lastName !== orig.lastName ||
          m.email !== orig.email ||
          m.relationship !== orig.relationship
        );
      })
      .map((m) => ({
        secondaryMemberId: m.secondaryMemberId!,
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
        relationship: m.relationship,
        walletAddress: m.address.trim(),
        votingPower: m.power,
      }));

    const dbDeletedMemberIds = [...originalById.keys()].filter(
      (id) => !currentSmIds.has(id),
    );
    const dbAddedMembers = newMembers.map((m) => ({
      walletAddress: m.address.trim(),
      votingPower: m.power,
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
      relationship: m.relationship || undefined,
    }));

    return {
      updatedSmList,
      addedSmList: blockchainAddedSmList,
      deletedSmList: blockchainDeletedSmList,
      periodConfig,
      periodChanged,
      needsBlockchain,
      dbUpdatedMembers,
      dbDeletedMemberIds,
      dbAddedMembers,
      dbMinPeriod: minChanged
        ? Number(periodToSeconds(parseInt(editWillMinPeriod)))
        : undefined,
      dbMaxPeriod: maxChanged
        ? Number(periodToSeconds(parseInt(editWillMaxPeriod)))
        : undefined,
    };
  };

  const hasEditWillChanges = (): boolean => {
    const diffs = computeEditWillDiffs();
    if (!diffs) return false;
    return (
      diffs.needsBlockchain ||
      diffs.periodChanged ||
      diffs.dbUpdatedMembers.length > 0 ||
      diffs.dbDeletedMemberIds.length > 0 ||
      diffs.dbAddedMembers.length > 0
    );
  };

  const validateEditWill = (): string | null => {
    if (!editWillModal) return null;
    const existingMembers = editWillMembers.filter((m) => m.secondaryMemberId);
    const newMembers = editWillMembers.filter(
      (m) => !m.secondaryMemberId && m.address.trim(),
    );
    if (existingMembers.length + newMembers.length < 2)
      return "At least 2 secondary members are required.";

    for (const m of [...existingMembers, ...newMembers]) {
      const label = m.firstName ? `"${m.firstName}"` : "A member";
      if (!m.address.trim()) return `${label} is missing a wallet address.`;
      try {
        ethers.getAddress(m.address.trim());
      } catch {
        return `Invalid address for ${label}: ${m.address}`;
      }
      if (!m.power || m.power < 1 || m.power > 255)
        return `Power for ${label} must be between 1 and 255.`;
    }

    const allAddresses = [...existingMembers, ...newMembers].map((m) =>
      m.address.trim().toLowerCase(),
    );
    if (new Set(allAddresses).size !== allAddresses.length)
      return "Duplicate addresses are not allowed.";

    const minP = parseInt(editWillMinPeriod);
    const maxP = parseInt(editWillMaxPeriod);
    if (!editWillMinPeriod.trim() || isNaN(minP))
      return "Minimum security period is required.";
    if (minP < config.securityPeriod.min)
      return `Minimum security period must be at least ${config.securityPeriod.min} ${config.securityPeriod.unit}.`;
    if (!editWillMaxPeriod.trim() || isNaN(maxP))
      return "Maximum security period is required.";
    if (maxP > config.securityPeriod.max)
      return `Maximum security period cannot exceed ${config.securityPeriod.max} ${config.securityPeriod.unit}.`;
    if (minP > maxP) return "Minimum period cannot exceed maximum.";
    return null;
  };

  const handleUpdateWill = async () => {
    if (!editWillModal) return;
    const validationErr = validateEditWill();
    if (validationErr) {
      setEditWillError(validationErr);
      return;
    }
    const diffs = computeEditWillDiffs();
    if (!diffs) return;

    setEditWillError(null);
    setIsUpdatingWill(true);
    try {
      // 1. Blockchain â€” only if address/power/membership/period changed
      if (
        (diffs.needsBlockchain || diffs.periodChanged) &&
        editWillModal.contractAddressInBlockchain
      ) {
        await updateWillContract(
          editWillModal.contractAddressInBlockchain,
          diffs.updatedSmList,
          diffs.addedSmList,
          diffs.deletedSmList,
          diffs.periodConfig,
        );
      }
      // 2. DB â€” update names, addresses, power, add/remove members
      const hasDbChanges =
        diffs.dbUpdatedMembers.length > 0 ||
        diffs.dbDeletedMemberIds.length > 0 ||
        diffs.dbAddedMembers.length > 0 ||
        diffs.dbMinPeriod !== undefined ||
        diffs.dbMaxPeriod !== undefined;
      if (hasDbChanges) {
        await willService.updateDeployedWillMembers(editWillModal.willId, {
          updatedMembers: diffs.dbUpdatedMembers,
          deletedMemberIds: diffs.dbDeletedMemberIds,
          addedMembers: diffs.dbAddedMembers,
          minSecurityPeriod: diffs.dbMinPeriod,
          maxSecurityPeriod: diffs.dbMaxPeriod,
        });
      }
      setEditWillModal(null);
      setSuccessMessage("Will updated successfully.");
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      setEditWillError(getErrorMessage(err, "Update failed."));
    } finally {
      setIsUpdatingWill(false);
    }
  };

  const resetForm = () => {
    setFactoryAddress(config.blockchain.willFactoryAddress);
    setSelectedWalletId("");
    setWillName("");
    setSecondaryMembers([
      {
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        address: "",
        power: 1,
      },
      {
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        address: "",
        power: 1,
      },
    ]);
    setMinSecurityPeriod((config.isLocalOrDev ? 1 : 28).toString());
    setMaxSecurityPeriod((config.isLocalOrDev ? 10000 : 154).toString());
    setShowCreateForm(false);
    setShowWalletDropdown(false);
    setShowContactDropdown(null);
    setContactSuccessByIndex({});
    setAddedContactFingerprintByIndex({});
    setPowerDraftByIndex({});
    setErrorMessage(null);
    setSuccessMessage(null);
    setEditingWillId(null);
    clearOpenCreateParam();
  };

  const selectedWallet = wallets?.find((w) => w.walletId === selectedWalletId);
  const selectedFilterWallet = wallets?.find(
    (w) => w.walletId === selectedFilterWalletId,
  );

  // Filter wills based on selected wallet
  const displayedWills =
    selectedFilterWalletId === "all"
      ? realWills
      : realWills.filter(
          (will) =>
            will.walletAddress.toLowerCase() ===
            selectedFilterWallet?.address.toLowerCase(),
        );

  useEffect(() => {
    const targetWillId = searchParams.get("targetWillId");
    if (!targetWillId || isLoadingWills) return;

    if (selectedFilterWalletId === "all") return;

    const existsInAllWills = realWills.some((will) => will.willId === targetWillId);
    const existsInDisplayed = displayedWills.some(
      (will) => will.willId === targetWillId,
    );

    if (existsInAllWills && !existsInDisplayed) {
      setSelectedFilterWalletId("all");
    }
  }, [
    displayedWills,
    isLoadingWills,
    realWills,
    searchParams,
    selectedFilterWalletId,
  ]);

  useEffect(() => {
    const targetWillId = searchParams.get("targetWillId");
    if (!targetWillId || isLoadingWills || displayedWills.length === 0) return;

    const targetWillExists = displayedWills.some(
      (will) => will.willId === targetWillId,
    );
    if (!targetWillExists) return;

    const timeoutId = window.setTimeout(() => {
      const targetElement = document.getElementById(`will-card-${targetWillId}`);
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
    isLoadingWills,
    searchParams,
  ]);

  useEffect(() => {
    if (!deleteDraftToastName) return;

    const timeoutId = window.setTimeout(() => {
      setDeleteDraftToastName(null);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [deleteDraftToastName]);

  return (
    <>
      <Header isAuthenticated={true} user={user} />
      <div className="min-h-screen bg-[var(--bg-page)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              My Wills
            </h1>
            <p className="text-[var(--text-muted)]">
              Manage your digital inheritance wills
            </p>
          </div>

          <div className="mb-6">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 bg-[var(--accent)] hover:opacity-90 text-white px-6 py-3 rounded-lg font-semibold transition-opacity"
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
            </button>
          </div>

          <div className="mb-8 relative" ref={filterWalletDropdownRef}>
            <button
              onClick={() =>
                setShowFilterWalletDropdown(!showFilterWalletDropdown)
              }
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
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                    {selectedFilterWalletId === "all"
                      ? "All Wallets"
                      : selectedFilterWallet?.label ||
                        `Wallet ${selectedFilterWallet?.address.slice(0, 8)}...`}
                  </h3>
                  <p className="text-sm text-[var(--text-muted-alt)] font-mono">
                    {selectedFilterWalletId === "all"
                      ? "Showing wills from all wallets"
                      : `wallet id : ${selectedFilterWallet?.address}`}
                  </p>
                </div>
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
                  className={`w-full p-4 text-left hover:bg-[var(--bg-section)] transition-colors border-b border-[var(--border-section)] ${
                    selectedFilterWalletId === "all"
                      ? "bg-[var(--bg-section)]"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
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
                    <div>
                      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                        All Wallets
                      </h3>
                      <p className="text-sm text-[var(--text-muted-alt)]">
                        Show wills from all wallets
                      </p>
                    </div>
                  </div>
                </button>
                {wallets &&
                  wallets.length > 0 &&
                  wallets.map((wallet) => (
                    <button
                      key={wallet.walletId}
                      type="button"
                      onClick={() => {
                        setSelectedFilterWalletId(wallet.walletId);
                        setShowFilterWalletDropdown(false);
                      }}
                      className={`w-full p-4 text-left hover:bg-[var(--bg-section)] transition-colors border-b border-[var(--border-section)] last:border-b-0 ${
                        selectedFilterWalletId === wallet.walletId
                          ? "bg-[var(--bg-section)]"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
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
                        <div>
                          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                            {wallet.label ||
                              `Wallet ${wallet.address.slice(0, 8)}...`}
                          </h3>
                          <p className="text-sm text-[var(--text-muted-alt)] font-mono">
                            wallet id : {wallet.address}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {showCreateForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-section)] px-6 py-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                    {" "}
                    {editingWillId ? "Edit Draft Will" : "Create New Will"}
                  </h2>
                  <button
                    onClick={resetForm}
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

                  {formErrors.length > 0 && (
                    <div className="px-4 py-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                      <p className="text-yellow-500 text-sm font-medium mb-1">
                        Please fix the following:
                      </p>
                      <ul className="list-disc list-inside text-yellow-500/80 text-xs space-y-1">
                        {formErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
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
                        onClick={() =>
                          setShowWalletDropdown(!showWalletDropdown)
                        }
                        className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-left text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          {selectedWallet ? (
                            <div>
                              {selectedWallet.label && (
                                <div className="text-[var(--text-primary)] font-medium">
                                  {selectedWallet.label}
                                </div>
                              )}
                              <div className="text-[var(--text-muted-alt)] text-sm font-mono inline-flex items-center gap-1">
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
                                <span>{selectedWallet.address}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[var(--text-muted-alt)]">
                              Choose a wallet
                            </span>
                          )}
                        </div>
                        <svg
                          className="w-5 h-5 text-[var(--text-muted-alt)] ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
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
                                  <div className="text-[var(--text-primary)] font-medium mb-1">
                                    {wallet.label}
                                  </div>
                                )}
                                <div className="text-[var(--text-muted-alt)] text-sm font-mono inline-flex items-center gap-1">
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
                                  <span>{wallet.address}</span>
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
                      Will Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={willName}
                      onChange={(e) => {
                        const value = e.target.value.slice(0, 100);
                        setWillName(value);
                      }}
                      placeholder="e.g., My Primary Will, Emergency Will, etc."
                      maxLength={100}
                      className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                    <p className="mt-1 text-xs text-[var(--text-muted-alt)]">
                      Give your will a descriptive name to easily identify it
                      later
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 inline-flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
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
                      <span>Secondary Members (minimum 2 required)</span>
                    </label>
                    <div className="space-y-4">
                      {secondaryMembers.map((member, index) => {
                        const isAlreadyAddedUnchanged =
                          addedContactFingerprintByIndex[index] !== undefined &&
                          addedContactFingerprintByIndex[index] ===
                            getContactFingerprint(member);
                        const isMatchingContactList =
                          memberMatchesExistingContact(member);
                        const addToContactsDisabledReason =
                          isMatchingContactList
                            ? "Contact already exists in contacts' list"
                            : isAlreadyAddedUnchanged
                              ? "Contact already added in contacts' list"
                              : null;

                        return (
                        <div
                          key={index}
                          className="border border-[var(--border-section)] rounded-lg p-4 bg-[var(--bg-section)]/30"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                              Member {index + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="relative group hover:z-20">
                                <button
                                  type="button"
                                  onClick={() =>
                                    contacts &&
                                    contacts.length > 0 &&
                                    setShowContactDropdown(
                                      showContactDropdown === index
                                        ? null
                                        : index,
                                    )
                                  }
                                  disabled={!contacts || contacts.length === 0}
                                  className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                                    !contacts || contacts.length === 0
                                      ? "text-[var(--text-muted-alt)] border border-[var(--border-section)] cursor-not-allowed opacity-50"
                                      : "text-[var(--accent)] border border-[var(--accent)] hover:bg-[var(--accent)]/10"
                                  }`}
                                >
                                  Contact's List
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
                                      d="M12 4v16m8-8H4"
                                    />
                                  </svg>
                                </button>
                                {(!contacts || contacts.length === 0) && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-section)] text-[var(--text-primary)] text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                                    You have no contacts
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[var(--border-section)]"></div>
                                  </div>
                                )}
                              </div>
                              <div
                                className="relative"
                                onMouseEnter={(e) => {
                                  if (!addToContactsDisabledReason) return;
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setAddContactTooltip({
                                    index,
                                    top: rect.top - 8,
                                    left: rect.left + rect.width / 2,
                                    message: addToContactsDisabledReason,
                                  });
                                }}
                                onMouseLeave={() => {
                                  setAddContactTooltip((prev) =>
                                    prev?.index === index ? null : prev,
                                  );
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleAddToContacts(index)}
                                  disabled={
                                    addingToContacts?.index === index ||
                                    !canAddToContacts[index] ||
                                    isMatchingContactList ||
                                    isAlreadyAddedUnchanged
                                  }
                                  className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                                    canAddToContacts[index] &&
                                    !isMatchingContactList &&
                                    !isAlreadyAddedUnchanged
                                      ? "text-blue-500 border border-blue-500 hover:bg-blue-500/10"
                                      : "text-gray-400 border border-gray-400 cursor-not-allowed opacity-50"
                                  }`}
                                >
                                  {addingToContacts?.index === index ? (
                                    <>
                                      Adding...
                                      <svg
                                        className="animate-spin w-3 h-3"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          className="opacity-25"
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                          fill="none"
                                        />
                                        <path
                                          className="opacity-75"
                                          fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                      </svg>
                                    </>
                                  ) : (
                                    <>
                                      Add to Contacts
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
                                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                        />
                                      </svg>
                                    </>
                                  )}
                                </button>
                              </div>
                              {secondaryMembers.length > 2 && (
                                <button
                                  onClick={() => removeSecondaryMember(index)}
                                  className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors"
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
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>

                          {contactSuccessByIndex[index] && (
                            <div className="mb-3 px-3 py-2 bg-green-500/10 border border-green-500/50 rounded-md text-green-500 text-xs">
                              {contactSuccessByIndex[index]}
                            </div>
                          )}

                          {showContactDropdown === index &&
                            contacts &&
                            contacts.length > 0 && (
                              <div className="mb-3 max-h-40 overflow-y-auto border border-[var(--border-section)] rounded-lg bg-[var(--bg-card)]">
                                {contacts
                                  .filter((contact) => {
                                    const usedAddresses = secondaryMembers
                                      .map((m, i) =>
                                        i !== index
                                          ? m.address.toLowerCase()
                                          : null,
                                      )
                                      .filter(Boolean);
                                    return !usedAddresses.includes(
                                      contact.walletAddress.toLowerCase(),
                                    );
                                  })
                                  .map((contact) => (
                                    <button
                                      key={contact.contactId}
                                      type="button"
                                      onClick={() =>
                                        selectContactForMember(index, contact)
                                      }
                                      className="w-full px-3 py-2 text-left hover:bg-[var(--bg-section)] transition-colors border-b border-[var(--border-section)] last:border-b-0"
                                    >
                                      <div className="text-sm font-medium text-[var(--text-primary)]">
                                        {contact.firstName} {contact.lastName}
                                      </div>
                                      <div className="text-xs text-[var(--text-muted-alt)] font-mono inline-flex items-center gap-1">
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
                                        <span>{contact.walletAddress}</span>
                                      </div>
                                    </button>
                                  ))}
                              </div>
                            )}

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <input
                              type="text"
                              value={member.firstName}
                              onChange={(e) => {
                                const value = e.target.value.slice(0, 50);
                                updateSecondaryMember(
                                  index,
                                  "firstName",
                                  value,
                                );
                              }}
                              placeholder="First Name *"
                              className="px-3 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            />
                            <input
                              type="text"
                              value={member.lastName}
                              onChange={(e) => {
                                const value = e.target.value.slice(0, 50);
                                updateSecondaryMember(index, "lastName", value);
                              }}
                              placeholder="Last Name *"
                              className="px-3 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <input
                              type="email"
                              value={member.email}
                              onChange={(e) => {
                                const value = e.target.value.slice(0, 100);
                                updateSecondaryMember(index, "email", value);
                              }}
                              placeholder="Email *"
                              className="px-3 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            />
                            <input
                              type="tel"
                              value={member.phoneNumber}
                              onChange={(e) => {
                                // Ne garder que les chiffres
                                const onlyNumbers = e.target.value.replace(
                                  /\D/g,
                                  "",
                                );
                                updateSecondaryMember(
                                  index,
                                  "phoneNumber",
                                  onlyNumbers,
                                );
                              }}
                              placeholder="Phone (514) 123-4567 - Optional"
                              maxLength={10} // 10 chiffres sans espaces/tirets
                              className="px-3 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            />
                          </div>

                          <div className="grid grid-cols-[1fr_auto] gap-3">
                            <input
                              type="text"
                              value={member.address}
                              onChange={(e) =>
                                updateSecondaryMember(
                                  index,
                                  "address",
                                  e.target.value,
                                )
                              }
                              placeholder="0x... Wallet Address *"
                              className="px-3 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] text-sm font-mono placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            />
                            <div className="relative">
                              <span
                                className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[var(--text-muted-alt)] border border-[var(--border-section)] rounded-full w-4 h-4 inline-flex items-center justify-center cursor-help"
                                onMouseEnter={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setPowerInfoTooltip({
                                    index,
                                    top: rect.top - 8,
                                    left: rect.left + rect.width / 2,
                                  });
                                }}
                                onMouseLeave={() => {
                                  setPowerInfoTooltip((prev) =>
                                    prev?.index === index ? null : prev,
                                  );
                                }}
                              >
                                ?
                              </span>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={3}
                                value={powerDraftByIndex[index] ?? String(member.power)}
                                onChange={(e) => {
                                  const onlyDigits = e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 3);
                                  setPowerDraftByIndex((prev) => ({
                                    ...prev,
                                    [index]: onlyDigits,
                                  }));

                                  if (onlyDigits === "") return;

                                  updateSecondaryMember(
                                    index,
                                    "power",
                                    parseInt(onlyDigits, 10) || 1,
                                  );
                                }}
                                onBlur={(e) => {
                                  const onlyDigits = e.target.value.replace(/\D/g, "");
                                  const value = parseInt(onlyDigits, 10);

                                  if (isNaN(value) || value <= 0) {
                                    updateSecondaryMember(index, "power", 1);
                                    setPowerDraftByIndex((prev) => ({
                                      ...prev,
                                      [index]: "1",
                                    }));
                                  } else if (value > 255) {
                                    updateSecondaryMember(index, "power", 255);
                                    setPowerDraftByIndex((prev) => ({
                                      ...prev,
                                      [index]: "255",
                                    }));
                                  } else {
                                    setPowerDraftByIndex((prev) => ({
                                      ...prev,
                                      [index]: String(value),
                                    }));
                                  }
                                }}
                                placeholder="Power"
                                className="w-28 pl-7 pr-2 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] text-sm text-center placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                              />
                            </div>
                          </div>
                          <div className="mt-3">
                            <input
                              type="text"
                              value={member.relationship || ""}
                              onChange={(e) => {
                                // Limiter Ã  30 caractÃ¨res
                                const value = e.target.value.slice(0, 30);
                                updateSecondaryMember(
                                  index,
                                  "relationship",
                                  value,
                                );
                              }}
                              placeholder="Relationship (e.g., spouse, child, friend) - optional"
                              maxLength={30}
                              className="w-full px-3 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            />
                          </div>
                        </div>
                        );
                      })}
                      <button
                        onClick={addSecondaryMember}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--accent)] border border-[var(--accent)] rounded-lg hover:bg-[var(--accent)]/10 transition-colors w-full justify-center"
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
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Add Another Member
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 inline-flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
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
                        <span>
                          Min Security Period ({config.securityPeriod.unit})
                        </span>
                        <span
                          aria-label="What is the security period?"
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--border-section)] text-[10px] text-[var(--text-muted-alt)] cursor-help"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setSecurityPeriodTooltip({
                              top: rect.top - 8,
                              left: rect.left + rect.width / 2,
                            });
                          }}
                          onMouseLeave={() => setSecurityPeriodTooltip(null)}
                        >
                          ?
                        </span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={minSecurityPeriod}
                        onChange={(e) => {
                          const onlyDigits = e.target.value.replace(/\D/g, "");
                          setMinSecurityPeriod(onlyDigits);
                        }}
                        onBlur={(e) => {
                          const onlyDigits = e.target.value.replace(/\D/g, "");
                          const value = parseInt(onlyDigits, 10);
                          const minLimit = config.isLocalOrDev ? 1 : 28;
                          const maxLimit = config.isLocalOrDev ? 10000 : 154;
                          let finalMin = value;

                          if (isNaN(value) || value <= 0) {
                            finalMin = minLimit;
                          } else if (value < minLimit) {
                            finalMin = minLimit;
                          } else if (value > maxLimit) {
                            finalMin = maxLimit;
                          }

                          setMinSecurityPeriod(String(finalMin));

                          // If min >= max, set max to min + 1 (capped at maxLimit)
                          const currentMax = parseInt(maxSecurityPeriod, 10);
                          if (finalMin >= currentMax) {
                            const newMax = Math.min(finalMin + 1, maxLimit);
                            setMaxSecurityPeriod(String(newMax));
                          }
                        }}
                        placeholder={`e.g., ${config.isLocalOrDev ? 1 : 28}`}
                        className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 inline-flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
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
                        <span>
                          Max Security Period ({config.securityPeriod.unit})
                        </span>
                        <span
                          aria-label="What is the security period?"
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--border-section)] text-[10px] text-[var(--text-muted-alt)] cursor-help"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setSecurityPeriodTooltip({
                              top: rect.top - 8,
                              left: rect.left + rect.width / 2,
                            });
                          }}
                          onMouseLeave={() => setSecurityPeriodTooltip(null)}
                        >
                          ?
                        </span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={maxSecurityPeriod}
                        onChange={(e) => {
                          const onlyDigits = e.target.value.replace(/\D/g, "");
                          setMaxSecurityPeriod(onlyDigits);
                        }}
                        onBlur={(e) => {
                          const onlyDigits = e.target.value.replace(/\D/g, "");
                          const value = parseInt(onlyDigits, 10);
                          const minLimit = config.isLocalOrDev ? 1 : 28;
                          const maxLimit = config.isLocalOrDev ? 10000 : 154;
                          let finalMax = value;

                          if (isNaN(value) || value <= 0) {
                            finalMax = minLimit;
                          } else if (value < minLimit) {
                            finalMax = minLimit;
                          } else if (value > maxLimit) {
                            finalMax = maxLimit;
                          }

                          const currentMin = parseInt(minSecurityPeriod, 10);
                          // If max <= min, set max to min + 1 (capped at maxLimit)
                          if (finalMax <= currentMin) {
                            finalMax = Math.min(currentMin + 1, maxLimit);
                          }

                          setMaxSecurityPeriod(String(finalMax));
                        }}
                        placeholder={`e.g., ${config.isLocalOrDev ? 10000 : 154}`}
                        className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={resetForm}
                      disabled={isSavingDraft}
                      className="flex-1 px-4 py-2 border border-[var(--border-section)] text-[var(--text-primary)] rounded-lg font-medium hover:bg-[var(--bg-section)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateDraft}
                      disabled={isSavingDraft || formErrors.length > 0}
                      className="flex-1 px-4 py-2 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSavingDraft && (
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      )}
                      {isSavingDraft
                        ? editingWillId
                          ? "Updating Draft..."
                          : "Creating Draft..."
                        : editingWillId
                          ? "Update Draft"
                          : "Create Draft"}
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
                  <p className="text-[var(--text-muted-alt)] mt-4">
                    Loading wills...
                  </p>
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
                  <div
                    key={will.willId}
                    id={`will-card-${will.willId}`}
                    className={`border border-[var(--border-section)] rounded-lg p-4 bg-[var(--bg-section)]/30 hover:bg-[var(--bg-section)]/50 transition-colors ${
                      highlightedWillId === will.willId
                        ? "ring-2 ring-[var(--accent)]"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-[var(--text-primary)]">
                            {will.willName}
                          </h3>

                          {will.state !== "DRAFT" &&
                            will.contractAddressInBlockchain && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-500">
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
                                    d="M4.5 12.75l6 6 9-13.5"
                                  />
                                </svg>
                                Deployed
                              </span>
                            )}
                        </div>
                        <p className="text-xs text-[var(--text-muted-alt)] font-mono">
                          {will.contractAddressInBlockchain}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${WILL_STATE_COLORS[will.state] ?? "bg-gray-500/20 text-gray-400"}`}
                        >
                          {will.state}
                        </span>
                        {will.state === "DRAFT" && (
                          <button
                            onClick={() =>
                              handleDeleteDraft(will.willId, will.willName)
                            }
                            className="px-2.5 py-1 text-xs font-medium rounded-md border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-[var(--text-muted-alt)] inline-flex items-center gap-1">
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
                          <span>Wallet Address</span>
                        </p>
                        <div className="flex items-start gap-2">
                          <p className="text-sm font-medium text-[var(--text-primary)] font-mono break-all inline-flex items-start gap-1">
                            <span>{will.walletAddress}</span>
                          </p>
                          <div className="relative flex-shrink-0 group">
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  will.walletAddress,
                                  `will-wallet-${will.willId}`,
                                )
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
                            {copiedAddress === `will-wallet-${will.willId}` && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-section)] text-[var(--text-primary)] text-sm rounded whitespace-nowrap z-50 shadow-lg">
                                Address copied!
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[var(--border-section)]"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-[var(--text-muted-alt)] inline-flex items-center gap-1">
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
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {will.chainId
                              ? getChainName(will.chainId)
                              : "Not deployed"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-muted-alt)] inline-flex items-center gap-1">
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
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {will.secondaryMembers.length} people
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-muted-alt)] inline-flex items-center gap-1">
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
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {displaySecurityPeriod(will.minSecurityPeriod)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-muted-alt)] inline-flex items-center gap-1">
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
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {displaySecurityPeriod(will.maxSecurityPeriod)}
                          </p>
                        </div>
                      </div>
                      {will.state !== "DRAFT" &&
                        will.contractAddressInBlockchain && (
                          <div className="mt-3 flex items-center justify-between rounded-lg border border-[var(--border-section)] bg-[var(--bg-card)] px-4 py-2">
                            <div className="flex items-center gap-2">
                              <svg
                                className="w-4 h-4 text-[var(--text-muted-alt)]"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="text-xs text-[var(--text-muted-alt)]">
                                Contract Balance
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)] font-mono">
                                <svg
                                  className="w-5.5 h-5.5 text-[#627EEA]"
                                  viewBox="0 0 32 32"
                                  fill="currentColor"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M16 2L6 16.5L16 21.5L26 16.5L16 2Z"
                                    fillOpacity="0.9"
                                  />
                                  <path
                                    d="M16 21.5L6 16.5L16 30L26 16.5L16 21.5Z"
                                    fillOpacity="0.7"
                                  />
                                </svg>
                                {contractBalances[will.willId] !== undefined
                                  ? `${parseFloat(contractBalances[will.willId]) === 0 ? "0" : parseFloat(parseFloat(contractBalances[will.willId]).toFixed(6)).toString()} ETH`
                                  : "..."}
                              </span>
                              <div className="flex items-center gap-1 ml-2">
                                <button
                                  onClick={() => {
                                    setFundModal({
                                      willId: will.willId,
                                      contractAddress:
                                        will.contractAddressInBlockchain!,
                                    });
                                    setFundAmount("");
                                    setFundError(null);
                                  }}
                                  className="px-2.5 py-1 text-xs font-medium rounded-md border border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                                >
                                  Fund +
                                </button>
                                <button
                                  onClick={() => {
                                    setWithdrawModal({
                                      willId: will.willId,
                                      contractAddress:
                                        will.contractAddressInBlockchain!,
                                    });
                                    setWithdrawAmount("");
                                    setWithdrawError(null);
                                  }}
                                  className="px-2.5 py-1 text-xs font-medium rounded-md border border-orange-500/50 text-orange-400 hover:bg-orange-500/10 transition-colors"
                                >
                                  Withdraw -
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
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
                          <div className="mt-3">
                            <CooldownCountdown endTs={cooldownEnd} role="pm" />
                          </div>
                        );
                      }
                      const startTs = will.deathDeclarationTimestampOnChain;
                      const endTs = will.executionTimestampOnChain;
                      if (!startTs || startTs === 0 || !endTs || endTs === 0)
                        return null;
                      return (
                        <div className="mt-3 border-t border-red-500/20 bg-red-500/5 rounded-lg">
                          <SecurityPeriodCountdown
                            startTs={startTs}
                            endTs={endTs}
                          />
                        </div>
                      );
                    })()}

                    <div className="border-t border-[var(--border-section)] pt-3 mt-3">
                      <p className="text-xs text-[var(--text-muted-alt)] mb-2 inline-flex items-center gap-1">
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
                        <span>Secondary Members:</span>
                      </p>
                      <div className="space-y-2">
                        {will.secondaryMembers.map(
                          (member: WillFromDB["secondaryMembers"][0]) => (
                            <div
                              key={member.secondaryMemberId}
                              className="bg-[var(--bg-card)] rounded p-2"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-[var(--text-primary)] inline-flex items-center gap-1">
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
                                    {member.firstName} {member.lastName}
                                  </span>
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {will.contractAddressInBlockchain && (
                                    <span
                                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SM_STATE_COLORS[member.state] ?? "bg-gray-500/20 text-gray-400"}`}
                                    >
                                      {member.state}
                                    </span>
                                  )}
                                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-500/15 flex items-center gap-1">
                                    <span className="text-violet-400/70">
                                      Power
                                    </span>
                                    <span className="text-violet-300 font-semibold">
                                      {member.votingPower}
                                    </span>
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs text-[var(--text-muted-alt)] space-y-1">
                                <div className="flex items-center gap-1">
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
                                  {member.email}
                                </div>
                                {member.phoneNumber && (
                                  <div className="flex items-center gap-1">
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
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                      />
                                    </svg>
                                    {member.phoneNumber}
                                  </div>
                                )}
                                {member.relationship && (
                                  <div className="flex items-center gap-1">
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
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                      />
                                    </svg>
                                    <span>{member.relationship}</span>
                                  </div>
                                )}
                                {(() => {
                                  const addressToCopy =
                                    member.walletAddress ||
                                    member.tempWalletAddress ||
                                    "";
                                  return (
                                    <div className="flex items-start gap-2">
                                      <div className="font-mono break-all inline-flex items-start gap-1">
                                        <svg
                                          className="w-3 h-3 mt-0.5 flex-shrink-0"
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
                                        <span>{addressToCopy || "No address"}</span>
                                      </div>
                                      {addressToCopy && (
                                        <div className="relative flex-shrink-0 group">
                                          <button
                                            onClick={() =>
                                              copyToClipboard(
                                                addressToCopy,
                                                `beneficiary-${member.secondaryMemberId}`,
                                              )
                                            }
                                            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                                          >
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
                                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                              />
                                            </svg>
                                          </button>
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-section)] text-[var(--text-primary)] text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                                            Copy address
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[var(--border-section)]"></div>
                                          </div>
                                          {copiedAddress ===
                                            `beneficiary-${member.secondaryMemberId}` && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-section)] text-[var(--text-primary)] text-sm rounded whitespace-nowrap z-50 shadow-lg">
                                              Address copied!
                                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[var(--border-section)]"></div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      {will.state === "CANCELED" && (
                        <>
                          <button
                            onClick={() => {
                              setCanceledResolveModal({
                                willId: will.willId,
                                action: "draft",
                              });
                              setCanceledResolveError(null);
                            }}
                            className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border-section)] text-[var(--text-primary)] hover:bg-[var(--bg-section)] transition-colors"
                          >
                            Keep as Draft
                          </button>
                          <button
                            onClick={() => {
                              setCanceledResolveModal({
                                willId: will.willId,
                                action: "delete",
                              });
                              setCanceledResolveError(null);
                            }}
                            className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {will.state === "DRAFT" ? (
                        <button
                          onClick={() => handleEditDraft(will)}
                          className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border-section)] text-[var(--text-primary)] hover:bg-[var(--bg-section)] transition-colors inline-flex items-center justify-center gap-1.5"
                        >
                          <span>Edit Will</span>
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            viewBox="0 0 24 24"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      ) : will.state !== "CANCELED" &&
                        will.state !== "EXECUTED" ? (
                        <button
                          onClick={() => handleOpenEditWill(will)}
                          className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border-section)] text-[var(--text-primary)] hover:bg-[var(--bg-section)] transition-colors inline-flex items-center justify-center gap-1.5"
                        >
                          <span>Edit Will</span>
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            viewBox="0 0 24 24"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      ) : null}
                      {will.state !== "DRAFT" &&
                        will.state !== "CANCELED" &&
                        will.state !== "EXECUTED" &&
                        will.contractAddressInBlockchain && (
                          <button
                            onClick={() => {
                              setCancelModal({
                                willId: will.willId,
                                contractAddress:
                                  will.contractAddressInBlockchain!,
                              });
                              setCancelError(null);
                            }}
                            className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors inline-flex items-center justify-center gap-1.5"
                          >
                            <span>Cancel Will</span>
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
                          </button>
                        )}
                      {(() => {
                        const canVeto =
                          will.state === "ACTIVE" &&
                          !!will.contractAddressInBlockchain &&
                          !!will.deathDeclarationTimestampOnChain &&
                          will.deathDeclarationTimestampOnChain > 0;
                        return (
                          <div className="relative group flex-1">
                            <button
                              onClick={() =>
                                canVeto &&
                                (setVetoModal({
                                  willId: will.willId,
                                  contractAddress:
                                    will.contractAddressInBlockchain!,
                                }),
                                setVetoError(null))
                              }
                              disabled={!canVeto}
                              className={`w-full px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                                canVeto
                                  ? "border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                                  : "border-[var(--border-section)] text-[var(--text-muted-alt)] opacity-40 cursor-not-allowed"
                              } inline-flex items-center justify-center gap-1.5`}
                            >
                              <span>Veto Death</span>
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.5}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                viewBox="0 0 24 24"
                              >
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                              </svg>
                            </button>
                            {!canVeto && (
                              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 whitespace-nowrap rounded-lg bg-[var(--bg-card)] border border-[var(--border-section)] px-3 py-1.5 text-xs text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                {will.state !== "ACTIVE"
                                  ? `Will must be ACTIVE (currently ${will.state})`
                                  : "No death has been declared yet"}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[var(--border-section)]"></div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    {will.state === "DRAFT" && (
                      <div className="mt-4">
                        {(() => {
                          const deploymentValidation =
                            validateForDeployment(will);
                          return (
                            <>
                              {!deploymentValidation.isValid && (
                                <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                                  <p className="text-yellow-500 text-xs font-medium mb-1">
                                    Cannot deploy until fixed:
                                  </p>
                                  <ul className="list-disc list-inside text-yellow-500/80 text-xs space-y-0.5">
                                    {deploymentValidation.errors.map(
                                      (error, idx) => (
                                        <li key={idx}>{error}</li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              )}
                              <button
                                onClick={() => handleDeployWill(will)}
                                disabled={
                                  deployingWillId === will.willId ||
                                  !deploymentValidation.isValid
                                }
                                className={`w-full px-3 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 ${
                                  deploymentValidation.isValid
                                    ? "bg-[var(--accent)] hover:opacity-90 text-white"
                                    : "bg-gray-400 cursor-not-allowed text-gray-200"
                                } transition-opacity disabled:opacity-50`}
                              >
                                {deployingWillId === will.willId ? (
                                  <>
                                    <svg
                                      className="animate-spin h-4 w-4"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                      />
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      />
                                    </svg>
                                    Deploying...
                                  </>
                                ) : (
                                  <>
                                    <span>Deploy to Blockchain</span>
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={1.5}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      viewBox="0 0 24 24"
                                    >
                                      <polyline points="16 16 12 12 8 16"></polyline>
                                      <line x1="12" y1="12" x2="12" y2="21"></line>
                                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
                                      <polyline points="16 16 12 12 8 16"></polyline>
                                    </svg>
                                  </>
                                )}
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {addContactTooltip && (
        <div
          className="fixed px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-section)] text-[var(--text-primary)] text-sm rounded whitespace-nowrap pointer-events-none shadow-lg z-[2147483647]"
          style={{
            top: addContactTooltip.top,
            left: addContactTooltip.left,
            transform: "translate(-50%, -100%)",
          }}
        >
          {addContactTooltip.message}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[var(--border-section)]"></div>
        </div>
      )}
      {powerInfoTooltip && (
        <div
          className="fixed px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-section)] text-[var(--text-primary)] text-sm rounded whitespace-nowrap pointer-events-none shadow-lg z-[2147483647]"
          style={{
            top: powerInfoTooltip.top,
            left: powerInfoTooltip.left,
            transform: "translate(-50%, -100%)",
          }}
        >
          Enter voting power from 1 to 255,
          <br />
          set by default at 1.
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[var(--border-section)]"></div>
        </div>
      )}
      {securityPeriodTooltip && (
        <div
          className="fixed px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-section)] text-[var(--text-primary)] text-sm rounded whitespace-nowrap pointer-events-none shadow-lg z-[2147483647]"
          style={{
            top: securityPeriodTooltip.top,
            left: securityPeriodTooltip.left,
            transform: "translate(-50%, -100%)",
          }}
        >
          The security period is the waiting window
          <br />
          after a death declaration.
          <br />
          Secondary members can confirm or challenge
          <br />
          before the will can be executed.
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[var(--border-section)]"></div>
        </div>
      )}
      {fundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Fund Contract
                </h2>
                <p className="text-xs text-[var(--text-muted-alt)] font-mono break-all">
                  {fundModal.contractAddress.slice(0, 10)}â€¦
                  {fundModal.contractAddress.slice(-8)}
                </p>
              </div>
            </div>

            <label className="block text-xs font-medium text-[var(--text-muted-alt)] mb-1.5">
              Amount (ETH)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0.01"
                value={fundAmount}
                onChange={(e) => {
                  setFundAmount(e.target.value);
                  setFundError(null);
                }}
                className="w-full bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg px-3 py-2 pr-12 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                disabled={isFunding}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted-alt)] font-mono">
                ETH
              </span>
            </div>
            <div className="flex items-center justify-between mt-1.5 mb-4">
              {fundError ? (
                <p className="text-red-400 text-xs">{fundError}</p>
              ) : (
                <span />
              )}
              {fundWalletBalance !== null && (
                <p className="text-xs text-[var(--text-muted-alt)] ml-auto">
                  Your wallet:{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {parseFloat(fundWalletBalance).toFixed(4)} ETH
                  </span>
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFundModal(null);
                  setFundAmount("");
                  setFundError(null);
                }}
                disabled={isFunding}
                className="flex-1 px-4 py-2 text-sm rounded-lg border border-[var(--border-section)] text-[var(--text-primary)] hover:bg-[var(--bg-section)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFundWill}
                disabled={isFunding}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isFunding ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                    Sending...
                  </>
                ) : (
                  "Confirm & Send"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {withdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-orange-500/15 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19V5m-7 7l7-7 7 7"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Withdraw Funds
                </h2>
                <p className="text-xs text-[var(--text-muted-alt)] font-mono break-all">
                  {withdrawModal.contractAddress.slice(0, 10)}â€¦
                  {withdrawModal.contractAddress.slice(-8)}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border-section)] bg-[var(--bg-section)]/40 px-4 py-2.5 mb-4 flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted-alt)]">
                Contract balance
              </span>
              <span className="text-sm font-semibold text-[var(--text-primary)] font-mono">
                {contractBalances[withdrawModal.willId] !== undefined
                  ? `${parseFloat(contractBalances[withdrawModal.willId]) === 0 ? "0" : parseFloat(parseFloat(contractBalances[withdrawModal.willId]).toFixed(6)).toString()} ETH`
                  : "â€”"}
              </span>
            </div>

            <label className="block text-xs font-medium text-[var(--text-muted-alt)] mb-1.5">
              Amount (ETH)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0.01"
                value={withdrawAmount}
                onChange={(e) => {
                  setWithdrawAmount(e.target.value);
                  setWithdrawError(null);
                }}
                className="w-full bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg px-3 py-2 pr-12 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                disabled={isWithdrawing}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted-alt)] font-mono">
                ETH
              </span>
            </div>
            <div className="flex items-center justify-between mt-1.5 mb-4">
              {withdrawError ? (
                <p className="text-red-400 text-xs">{withdrawError}</p>
              ) : (
                <span />
              )}
              {withdrawWalletBalance !== null && (
                <p className="text-xs text-[var(--text-muted-alt)] ml-auto">
                  Your wallet:{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {parseFloat(withdrawWalletBalance).toFixed(4)} ETH
                  </span>
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setWithdrawModal(null);
                  setWithdrawAmount("");
                  setWithdrawError(null);
                }}
                disabled={isWithdrawing}
                className="flex-1 px-4 py-2 text-sm rounded-lg border border-[var(--border-section)] text-[var(--text-primary)] hover:bg-[var(--bg-section)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawWill}
                disabled={isWithdrawing}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isWithdrawing ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                    Withdrawing...
                  </>
                ) : (
                  "Confirm & Withdraw"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Cancel Will
                </h2>
                <p className="text-xs text-[var(--text-muted-alt)]">
                  This action is irreversible
                </p>
              </div>
            </div>
            <p className="text-sm text-[var(--text-muted-alt)] mb-1">
              The will contract will be permanently canceled. Any ETH held in
              the contract will be automatically returned to your wallet.
            </p>
            <p className="text-xs text-[var(--text-muted-alt)] font-mono break-all mb-5 mt-3 opacity-60">
              {cancelModal.contractAddress}
            </p>

            {cancelError && (
              <p className="text-red-400 text-xs mb-4">{cancelError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCancelModal(null);
                  setCancelError(null);
                }}
                disabled={isCanceling}
                className="flex-1 px-4 py-2 text-sm rounded-lg border border-[var(--border-section)] text-[var(--text-primary)] hover:bg-[var(--bg-section)] transition-colors"
              >
                Keep Will
              </button>
              <button
                onClick={handleCancelWill}
                disabled={isCanceling}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCanceling ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                    Canceling...
                  </>
                ) : (
                  "Yes, Cancel Will"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {vetoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-orange-500/15 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Veto Death Declaration
                </h2>
                <p className="text-xs text-[var(--text-muted-alt)]">
                  Confirm you are still alive
                </p>
              </div>
            </div>

            <p className="text-sm text-[var(--text-muted-alt)] mb-3">
              This will cancel the current death declaration, reset all
              secondary members back to{" "}
              <span className="font-medium text-[var(--text-primary)]">
                VALIDATED
              </span>
              , and start a cooldown period during which no new declarations can
              be made.
            </p>

            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3 mb-5 text-xs text-orange-300">
              âš  The security period countdown will be reset. SMs will need to
              re-declare death to restart it.
            </div>

            <p className="text-xs text-[var(--text-muted-alt)] font-mono break-all mb-5 opacity-60">
              {vetoModal.contractAddress}
            </p>

            {vetoError && (
              <p className="text-red-400 text-xs mb-4">{vetoError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setVetoModal(null);
                  setVetoError(null);
                }}
                disabled={isVetoing}
                className="flex-1 px-4 py-2 text-sm rounded-lg border border-[var(--border-section)] text-[var(--text-primary)] hover:bg-[var(--bg-section)] transition-colors"
              >
                Keep Declaration
              </button>
              <button
                onClick={handleVetoDeath}
                disabled={isVetoing}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isVetoing ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                    Vetoing...
                  </>
                ) : (
                  "Yes, Veto Death"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {canceledResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${canceledResolveModal.action === "delete" ? "bg-red-500/15" : "bg-[var(--accent)]/15"}`}
              >
                {canceledResolveModal.action === "delete" ? (
                  <svg
                    className="w-5 h-5 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                ) : (
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  {canceledResolveModal.action === "delete"
                    ? "Delete Will"
                    : "Keep as Draft"}
                </h2>
                <p className="text-xs text-[var(--text-muted-alt)]">
                  {canceledResolveModal.action === "delete"
                    ? "This cannot be undone"
                    : "Revert canceled will to draft"}
                </p>
              </div>
            </div>

            <p className="text-sm text-[var(--text-muted-alt)] mb-5">
              {canceledResolveModal.action === "delete"
                ? "This will permanently delete the will and all its data. This action cannot be reversed."
                : "The will will be reset to draft state. You can edit and re-deploy it later."}
            </p>

            {canceledResolveError && (
              <p className="text-red-400 text-xs mb-4">
                {canceledResolveError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCanceledResolveModal(null);
                  setCanceledResolveError(null);
                }}
                disabled={isCanceledResolving}
                className="flex-1 px-4 py-2 text-sm rounded-lg border border-[var(--border-section)] text-[var(--text-primary)] hover:bg-[var(--bg-section)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCanceledResolve}
                disabled={isCanceledResolving}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  canceledResolveModal.action === "delete"
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-[var(--accent)] text-white hover:bg-[var(--accent)]/80"
                }`}
              >
                {isCanceledResolving ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                    Processing...
                  </>
                ) : canceledResolveModal.action === "delete" ? (
                  "Yes, Delete"
                ) : (
                  "Keep as Draft"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {deployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--accent)]/15 flex items-center justify-center">
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
                    d="M5 12h14M12 5l7 7-7 7"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Deploy Will
                </h2>
                <p className="text-xs text-[var(--text-muted-alt)]">
                  This will trigger a MetaMask transaction
                </p>
              </div>
            </div>

            <p className="text-sm text-[var(--text-muted-alt)] mb-3">
              The will contract will be deployed to the blockchain. Secondary
              members will be notified to validate their participation.
            </p>

            <div className="rounded-lg border border-[var(--border-section)] bg-[var(--bg-section)]/40 px-4 py-3 mb-4 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted-alt)]">
                  Security period
                </span>
                <span className="text-[var(--text-primary)] font-medium">
                  {deployModal.minSecurityPeriod}â€“
                  {deployModal.maxSecurityPeriod} days
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted-alt)]">
                  Beneficiaries
                </span>
                <span className="text-[var(--text-primary)] font-medium">
                  {deployModal.secondaryMembers.length} people
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted-alt)]">Wallet</span>
                <span className="text-[var(--text-primary)] font-mono">
                  {deployModal.walletAddress.slice(0, 6)}â€¦
                  {deployModal.walletAddress.slice(-4)}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-[var(--text-muted-alt)] mb-1.5">
                Fund contract now{" "}
                <span className="text-[var(--text-muted-alt)] font-normal">
                  (optional)
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={deployFundAmount}
                  onChange={(e) => {
                    setDeployFundAmount(e.target.value);
                    setDeployFundError(null);
                  }}
                  className="w-full bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg px-3 py-2 pr-12 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted-alt)] font-mono">
                  ETH
                </span>
              </div>
              {deployWalletBalance !== null && (
                <div className="flex justify-end mt-1.5">
                  <p className="text-xs text-[var(--text-muted-alt)]">
                    Balance:{" "}
                    <span className="font-semibold text-[var(--text-primary)]">
                      {parseFloat(deployWalletBalance).toFixed(4)} ETH
                    </span>
                  </p>
                </div>
              )}
              {deployFundError && (
                <div className="mt-2">
                  <p className="text-red-400 text-xs">{deployFundError}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDeployModal(null);
                  setDeployFundAmount("");
                  setDeployFundError(null);
                }}
                disabled={deployingWillId === deployModal.willId}
                className="px-4 py-2 text-sm rounded-lg border border-[var(--border-section)] text-[var(--text-primary)] hover:bg-[var(--bg-section)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDeploy(undefined)}
                disabled={deployingWillId === deployModal.willId}
                className="flex-1 px-4 py-2 text-sm rounded-lg border border-[var(--border-section)] text-[var(--text-primary)] hover:bg-[var(--bg-section)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deployingWillId === deployModal.willId ? 'Deploying...' : 'Fund Later'}
              </button>
              <button
                onClick={() => {
                  const amt = parseFloat(deployFundAmount);
                  if (deployFundAmount && (isNaN(amt) || amt <= 0)) {
                    setDeployFundError("Enter a valid amount greater than 0.");
                    return;
                  }
                  handleConfirmDeploy(deployFundAmount || undefined);
                }}
                disabled={deployingWillId === deployModal.willId}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deployingWillId === deployModal.willId ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Deploying...
                  </>
                ) : (
                  deployFundAmount && parseFloat(deployFundAmount) > 0
                    ? "Deploy & Fund"
                    : "Deploy Now"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Delete Draft
                </h2>
                <p className="text-xs text-[var(--text-muted-alt)]">
                  This action is irreversible
                </p>
              </div>
            </div>

            <p className="text-sm text-[var(--text-muted-alt)] mb-5">
              This draft will be permanently deleted from our records. It has
              not been deployed to the blockchain, so no on-chain transaction is
              needed, but once deleted it cannot be recovered.
            </p>

            {deleteError && (
              <p className="text-red-400 text-xs mb-4">{deleteError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDeleteDraftModal(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm rounded-lg border border-[var(--border-section)] text-[var(--text-primary)] hover:bg-[var(--bg-section)] transition-colors"
              >
                Keep Draft
              </button>
              <button
                onClick={handleConfirmDeleteDraft}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete Draft"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteDraftToastName && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none px-4">
          <div className="min-w-[320px] max-w-[90vw] px-7 py-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-xl backdrop-blur-sm text-lg font-semibold text-center">
            Draft "{deleteDraftToastName}" has been successfully deleted.
          </div>
        </div>
      )}

      {editWillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border-section)] flex-shrink-0">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--accent)]/15 flex items-center justify-center">
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Edit Will
                </h2>
                <p className="text-xs text-[var(--text-muted-alt)] font-mono truncate">
                  {editWillModal.contractAddressInBlockchain}
                </p>
              </div>
              <button
                onClick={() => setEditWillModal(null)}
                className="text-[var(--text-muted-alt)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
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
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
              {editWillError && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-xs">
                  {editWillError}
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)] mb-2 uppercase tracking-wide">
                  Security Period
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[var(--text-muted-alt)] mb-1">
                      Min ({config.securityPeriod.unit})
                    </label>
                    <input
                      type="number"
                      min={config.securityPeriod.min}
                      max={config.securityPeriod.max}
                      value={editWillMinPeriod}
                      onChange={(e) => {
                        setEditWillMinPeriod(e.target.value);
                        setEditWillError(null);
                      }}
                      className="w-full px-3 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted-alt)] mb-1">
                      Max ({config.securityPeriod.unit})
                    </label>
                    <input
                      type="number"
                      min={config.securityPeriod.min}
                      max={config.securityPeriod.max}
                      value={editWillMaxPeriod}
                      onChange={(e) => {
                        setEditWillMaxPeriod(e.target.value);
                        setEditWillError(null);
                      }}
                      className="w-full px-3 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)] mb-2 uppercase tracking-wide inline-flex items-center gap-1">
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
                <div className="space-y-2">
                  {editWillMembers
                    .filter((m) => m.secondaryMemberId)
                    .map((m) => {
                      const absIdx = editWillMembers.indexOf(m);
                      const orig = editWillModal?.secondaryMembers.find(
                        (x) => x.secondaryMemberId === m.secondaryMemberId,
                      );
                      const origAddr = (
                        orig?.walletAddress ||
                        orig?.tempWalletAddress ||
                        ""
                      ).toLowerCase();
                      const addrChanged =
                        m.address.trim().toLowerCase() !== origAddr;
                      return (
                        <div
                          key={m.secondaryMemberId}
                          className="bg-[var(--bg-section)]/40 border border-[var(--border-section)] rounded-lg px-3 py-3 space-y-2"
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={m.firstName}
                              placeholder="First name"
                              onChange={(e) => {
                                setEditWillMembers((prev) =>
                                  prev.map((x, i) =>
                                    i === absIdx
                                      ? { ...x, firstName: e.target.value }
                                      : x,
                                  ),
                                );
                                setEditWillError(null);
                              }}
                              className="px-2 py-1.5 text-xs bg-[var(--bg-section)] border border-[var(--border-section)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                            />
                            <input
                              type="text"
                              value={m.lastName}
                              placeholder="Last name"
                              onChange={(e) => {
                                setEditWillMembers((prev) =>
                                  prev.map((x, i) =>
                                    i === absIdx
                                      ? { ...x, lastName: e.target.value }
                                      : x,
                                  ),
                                );
                                setEditWillError(null);
                              }}
                              className="px-2 py-1.5 text-xs bg-[var(--bg-section)] border border-[var(--border-section)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                            />
                            <input
                              type="email"
                              value={m.email}
                              placeholder="Email"
                              onChange={(e) => {
                                setEditWillMembers((prev) =>
                                  prev.map((x, i) =>
                                    i === absIdx
                                      ? { ...x, email: e.target.value }
                                      : x,
                                  ),
                                );
                                setEditWillError(null);
                              }}
                              className="px-2 py-1.5 text-xs bg-[var(--bg-section)] border border-[var(--border-section)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                            />
                            <input
                              type="text"
                              value={m.relationship}
                              placeholder="Relationship (optional)"
                              onChange={(e) => {
                                setEditWillMembers((prev) =>
                                  prev.map((x, i) =>
                                    i === absIdx
                                      ? { ...x, relationship: e.target.value }
                                      : x,
                                  ),
                                );
                                setEditWillError(null);
                              }}
                              className="px-2 py-1.5 text-xs bg-[var(--bg-section)] border border-[var(--border-section)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                              <input
                                type="text"
                                value={m.address}
                                placeholder="0x... wallet address"
                                onChange={(e) => {
                                  setEditWillMembers((prev) =>
                                    prev.map((x, i) =>
                                      i === absIdx
                                        ? { ...x, address: e.target.value }
                                        : x,
                                    ),
                                  );
                                  setEditWillError(null);
                                }}
                                className={`w-full px-2 py-1.5 text-xs bg-[var(--bg-section)] border rounded font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] ${addrChanged ? "border-amber-500/70" : "border-[var(--border-section)]"}`}
                              />
                              {addrChanged && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 group">
                                  <span className="text-amber-400 text-xs">âš </span>
                                  <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-section)] text-[var(--text-primary)] text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                                    Address changed - will require blockchain signature
                                    <div className="absolute top-full right-2 -mt-px border-4 border-transparent border-t-[var(--border-section)]"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <label className="text-xs text-[var(--text-muted-alt)] flex-shrink-0">
                              Power
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="255"
                              value={m.power}
                              onChange={(e) => {
                                const v = parseInt(e.target.value) || 1;
                                setEditWillMembers((prev) =>
                                  prev.map((x, i) =>
                                    i === absIdx ? { ...x, power: v } : x,
                                  ),
                                );
                                setEditWillError(null);
                              }}
                              className="w-16 px-2 py-1.5 text-xs bg-[var(--bg-section)] border border-[var(--border-section)] rounded text-center text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                            />
                            <button
                              onClick={() => {
                                const totalValid = editWillMembers.filter(
                                  (x) =>
                                    x.secondaryMemberId ||
                                    (!x.secondaryMemberId && x.address.trim()),
                                ).length;
                                if (totalValid <= 2) {
                                  setEditWillError(
                                    "A will must have at least 2 secondary members.",
                                  );
                                  return;
                                }
                                setEditWillMembers((prev) =>
                                  prev.filter((_, i) => i !== absIdx),
                                );
                                setEditWillError(null);
                              }}
                              className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors flex-shrink-0"
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {editWillMembers.filter((m) => !m.secondaryMemberId).length >
                0 && (
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)] mb-2 uppercase tracking-wide">
                    New Members
                  </p>
                  <div className="space-y-2">
                    {editWillMembers
                      .filter((m) => !m.secondaryMemberId)
                      .map((m, relIdx) => {
                        const absIdx = editWillMembers.findIndex(
                          (x, i) =>
                            !x.secondaryMemberId &&
                            editWillMembers
                              .slice(0, i + 1)
                              .filter((y) => !y.secondaryMemberId).length ===
                              relIdx + 1,
                        );
                        return (
                          <div
                            key={absIdx}
                            className="bg-[var(--bg-section)]/40 border border-[var(--accent)]/30 rounded-lg px-3 py-3 space-y-2"
                          >
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={m.firstName}
                                placeholder="First name"
                                onChange={(e) => {
                                  setEditWillMembers((prev) =>
                                    prev.map((x, i) =>
                                      i === absIdx
                                        ? { ...x, firstName: e.target.value }
                                        : x,
                                    ),
                                  );
                                  setEditWillError(null);
                                }}
                                className="px-2 py-1.5 text-xs bg-[var(--bg-section)] border border-[var(--border-section)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                              />
                              <input
                                type="text"
                                value={m.lastName}
                                placeholder="Last name"
                                onChange={(e) => {
                                  setEditWillMembers((prev) =>
                                    prev.map((x, i) =>
                                      i === absIdx
                                        ? { ...x, lastName: e.target.value }
                                        : x,
                                    ),
                                  );
                                  setEditWillError(null);
                                }}
                                className="px-2 py-1.5 text-xs bg-[var(--bg-section)] border border-[var(--border-section)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                              />
                              <input
                                type="email"
                                value={m.email}
                                placeholder="Email"
                                onChange={(e) => {
                                  setEditWillMembers((prev) =>
                                    prev.map((x, i) =>
                                      i === absIdx
                                        ? { ...x, email: e.target.value }
                                        : x,
                                    ),
                                  );
                                  setEditWillError(null);
                                }}
                                className="px-2 py-1.5 text-xs bg-[var(--bg-section)] border border-[var(--border-section)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                              />
                              <input
                                type="text"
                                value={m.relationship}
                                placeholder="Relationship (optional)"
                                onChange={(e) => {
                                  setEditWillMembers((prev) =>
                                    prev.map((x, i) =>
                                      i === absIdx
                                        ? { ...x, relationship: e.target.value }
                                        : x,
                                    ),
                                  );
                                  setEditWillError(null);
                                }}
                                className="px-2 py-1.5 text-xs bg-[var(--bg-section)] border border-[var(--border-section)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={m.address}
                                placeholder="0x... wallet address"
                                onChange={(e) => {
                                  setEditWillMembers((prev) =>
                                    prev.map((x, i) =>
                                      i === absIdx
                                        ? { ...x, address: e.target.value }
                                        : x,
                                    ),
                                  );
                                  setEditWillError(null);
                                }}
                                className="flex-1 min-w-0 px-2 py-1.5 text-xs bg-[var(--bg-section)] border border-[var(--border-section)] rounded font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                              />
                              <label className="text-xs text-[var(--text-muted-alt)] flex-shrink-0">
                                Power
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="255"
                                value={m.power}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value) || 1;
                                  setEditWillMembers((prev) =>
                                    prev.map((x, i) =>
                                      i === absIdx ? { ...x, power: v } : x,
                                    ),
                                  );
                                  setEditWillError(null);
                                }}
                                className="w-16 px-2 py-1.5 text-xs bg-[var(--bg-section)] border border-[var(--border-section)] rounded text-center text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                              />
                              <button
                                onClick={() => {
                                  setEditWillMembers((prev) =>
                                    prev.filter((_, i) => i !== absIdx),
                                  );
                                  setEditWillError(null);
                                }}
                                className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors flex-shrink-0"
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
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              <button
                onClick={() =>
                  setEditWillMembers((prev) => [
                    ...prev,
                    {
                      address: "",
                      power: 1,
                      firstName: "",
                      lastName: "",
                      email: "",
                      relationship: "",
                    },
                  ])
                }
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[var(--accent)] border border-[var(--accent)] rounded-lg hover:bg-[var(--accent)]/10 transition-colors w-full justify-center"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Member
              </button>

              {(() => {
                const diffs = computeEditWillDiffs();
                if (!diffs) return null;
                const infoOnlyUpdates = diffs.dbUpdatedMembers.filter(
                  (dbm) =>
                    !diffs.updatedSmList.some(
                      (x) =>
                        x.smAddress.toLowerCase() ===
                        dbm.walletAddress.toLowerCase(),
                    ) &&
                    !diffs.addedSmList.some(
                      (x) =>
                        x.smAddress.toLowerCase() ===
                        dbm.walletAddress.toLowerCase(),
                    ),
                );
                const total =
                  diffs.updatedSmList.length +
                  diffs.addedSmList.length +
                  diffs.deletedSmList.length +
                  (diffs.periodChanged ? 1 : 0) +
                  infoOnlyUpdates.length;
                if (total === 0)
                  return (
                    <p className="text-xs text-center text-[var(--text-muted-alt)]">
                      No changes yet.
                    </p>
                  );
                return (
                  <div className="rounded-lg border border-[var(--border-section)] bg-[var(--bg-section)]/40 px-4 py-3 space-y-1 text-xs">
                    <p className="font-semibold text-[var(--text-primary)] mb-1.5">
                      Changes ({total})
                    </p>
                    {infoOnlyUpdates.map((m) => (
                      <p
                        key={m.secondaryMemberId}
                        className="text-[var(--text-muted-alt)]"
                      >
                        âœï¸ Info updated: {m.firstName} {m.lastName}
                      </p>
                    ))}
                    {diffs.updatedSmList.map((m) => (
                      <p
                        key={m.smAddress}
                        className="text-[var(--text-muted-alt)]"
                      >
                        ðŸ”‘ Power updated: {m.smAddress.slice(0, 8)}â€¦ â†’{" "}
                        {m.votePower}
                      </p>
                    ))}
                    {diffs.addedSmList.map((m) => (
                      <p key={m.smAddress} className="text-emerald-400">
                        âœš Added: {m.smAddress.slice(0, 8)}â€¦ (power {m.votePower}
                        )
                      </p>
                    ))}
                    {diffs.deletedSmList.map((addr) => (
                      <p key={addr} className="text-red-400">
                        âœ• Removed: {addr.slice(0, 8)}â€¦
                      </p>
                    ))}
                    {diffs.periodChanged && (
                      <p className="text-[var(--text-muted-alt)]">
                        ðŸ“… Security period: {editWillMinPeriod}â€“
                        {editWillMaxPeriod} {config.securityPeriod.unit}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-2 px-6 py-4 border-t border-[var(--border-section)] flex-shrink-0">
              <button
                onClick={() => setEditWillModal(null)}
                disabled={isUpdatingWill}
                className="flex-1 px-4 py-2 text-sm rounded-lg border border-[var(--border-section)] text-[var(--text-primary)] hover:bg-[var(--bg-section)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateWill}
                disabled={isUpdatingWill || !hasEditWillChanges()}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdatingWill ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                    Updatingâ€¦
                  </>
                ) : (
                  "Update Will"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

