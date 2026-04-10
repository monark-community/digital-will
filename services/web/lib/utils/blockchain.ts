/**
 * Blockchain utilities for interacting with smart contracts
 */

import { ethers } from "ethers";
import { WILL_ABI } from "@/lib/contracts/WillABI";
import { willService } from "@/lib/services";
import { config } from "@/lib/config";

/**
 * Get a signer from MetaMask
 * @param expectedAddress - Optional expected wallet address to validate against
 * @throws Error if MetaMask is not installed or if the user rejects wallet switch
 */
export async function getSigner(expectedAddress?: string): Promise<ethers.Signer> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  
  // If an expected address is provided, check and request switch if needed
  if (expectedAddress) {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    const currentAccount = accounts[0]?.toLowerCase();
    const expectedLower = expectedAddress.toLowerCase();
    
    if (currentAccount !== expectedLower) {
      // Prompt user to switch to the correct wallet
      try {
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
        
        // Get accounts again after permission request
        const newAccounts = await window.ethereum.request({ method: "eth_accounts" });
        const newAccount = newAccounts[0]?.toLowerCase();
        
        if (newAccount !== expectedLower) {
          throw new Error(
            `Please select wallet ${expectedAddress.slice(0, 6)}...${expectedAddress.slice(-4)} in MetaMask to continue this transaction.`
          );
        }
      } catch (error: any) {
        if (error.code === 4001) {
          throw new Error("Wallet selection was cancelled. Please try again and select the correct wallet.");
        }
        throw error;
      }
    }
  }
  
  const signer = await provider.getSigner();
  return signer;
}

/**
 * Convert days to seconds (for blockchain timestamps)
 */
export function daysToSeconds(days: number): bigint {
  return BigInt(days * 24 * 60 * 60);
}

/**
 * Convert a security period input to seconds.
 * In local/dev: input is in minutes. In production: input is in days.
 */
export function periodToSeconds(value: number): bigint {
  return config.isLocalOrDev
    ? BigInt(value * 60)
    : BigInt(value * 24 * 60 * 60);
}

/**
 * Convert seconds to days
 */
export function secondsToDays(seconds: bigint): number {
  return Number(seconds) / (24 * 60 * 60);
}

/**
 * Format a security period value (in seconds) for display.
 * In local/dev: converts to minutes. In production: converts to days.
 */
export function displaySecurityPeriod(seconds: number): string {
  if (config.isLocalOrDev) {
    return `${Math.round(seconds / 60)} min`;
  }
  return `${Math.round(seconds / 86400)} days`;
}

/**
 * Format a security period range (in seconds) for display.
 * In local/dev: converts to minutes. In production: converts to days.
 */
export function displaySecurityPeriodRange(
  minSeconds: number,
  maxSeconds: number,
): string {
  if (config.isLocalOrDev) {
    return `${Math.round(minSeconds / 60)} – ${Math.round(maxSeconds / 60)} min`;
  }
  return `${Math.round(minSeconds / 86400)} – ${Math.round(maxSeconds / 86400)} days`;
}

/**
 * Fund a will contract by calling deposit() via MetaMask.
 * Returns the transaction hash on success.
 * Throws if the user has insufficient balance.
 * @param expectedOwnerAddress - Optional wallet address that should sign the transaction
 */
export async function fundWillContract(
  contractAddress: string,
  amountEth: string,
  expectedOwnerAddress?: string,
): Promise<string> {
  const signer = await getSigner(expectedOwnerAddress);
  const provider = new ethers.BrowserProvider(window.ethereum);

  const amountWei = ethers.parseEther(amountEth);
  const signerAddress = await signer.getAddress();
  const userBalance = await provider.getBalance(signerAddress);

  // Rough gas buffer: 0.001 ETH
  const gasBuffer = ethers.parseEther("0.001");
  if (userBalance < amountWei + gasBuffer) {
    throw new Error(
      `Insufficient balance. You have ${parseFloat(ethers.formatEther(userBalance)).toFixed(4)} ETH.`,
    );
  }

  const contract = new ethers.Contract(contractAddress, WILL_ABI, signer);
  const tx = await contract.deposit({ value: amountWei });
  await tx.wait();

  /*
  Delay added instead of waiting 2 block confirmation 
  */
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return tx.hash;
}

/**
 * Withdraw ETH from a will contract by calling withdraw(amount) via MetaMask.
 * Returns the transaction hash on success.
 * Throws if the requested amount exceeds the contract balance.
 * @param expectedOwnerAddress - Optional wallet address that should sign the transaction
 */
export async function withdrawWillContract(
  contractAddress: string,
  amountEth: string,
  expectedOwnerAddress?: string,
): Promise<string> {
  const amountWei = ethers.parseEther(amountEth);

  const contractBalance = await willService
    .getContractBalance(contractAddress)
    .then((balanceStr) => ethers.parseEther(balanceStr));
  if (contractBalance < amountWei) {
    throw new Error(
      `Insufficient contract balance. Contract holds ${parseFloat(ethers.formatEther(contractBalance)).toFixed(4)} ETH.`,
    );
  }

  const signer = await getSigner(expectedOwnerAddress);
  const contract = new ethers.Contract(contractAddress, WILL_ABI, signer);
  const tx = await contract.withdraw(amountWei);
  await tx.wait();

  /*
  Delay added instead of waiting 2 block confirmation 
  */
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return tx.hash;
}

/**
 * Cancel a will contract by calling cancelWill() via MetaMask.
 * The contract will auto-withdraw all ETH back to the PM.
 * Returns the transaction hash on success.
 * @param expectedOwnerAddress - Optional wallet address that should sign the transaction
 */
export async function cancelWillContract(
  contractAddress: string,
  expectedOwnerAddress?: string,
): Promise<string> {
  const signer = await getSigner(expectedOwnerAddress);
  const contract = new ethers.Contract(contractAddress, WILL_ABI, signer);
  const tx = await contract.cancelWill();
  await tx.wait();
  return tx.hash;
}

/**
 * Veto a death declaration via MetaMask. Resets all DECLARED_DEATH SMs to VALIDATED
 * and starts a cooldown, preventing new declarations for COOLDOWN_PERIOD seconds.
 * @param expectedOwnerAddress - Optional wallet address that should sign the transaction
 */
export async function vetoDeathContract(
  contractAddress: string,
  expectedOwnerAddress?: string,
): Promise<string> {
  const signer = await getSigner(expectedOwnerAddress);
  const contract = new ethers.Contract(contractAddress, WILL_ABI, signer);
  const tx = await contract.vetoDeath();
  await tx.wait();

  /*
  Delay added instead of waiting 2 block confirmation 
  */
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return tx.hash;
}

/**
 * Update a deployed will's SM list and/or security period via MetaMask.
 * Pass empty arrays for lists that are unchanged.
 * Pass { minSecurityPeriod: 0n, maxSecurityPeriod: 0n } to skip period update.
 * @param expectedOwnerAddress - Optional wallet address that should sign the transaction
 */
export async function updateWillContract(
  contractAddress: string,
  updatedSmList: Array<{ smAddress: string; votePower: number }>,
  addedSmList: Array<{ smAddress: string; votePower: number }>,
  deletedSmList: string[],
  securityPeriodConfig: {
    minSecurityPeriod: bigint;
    maxSecurityPeriod: bigint;
  },
  expectedOwnerAddress?: string,
): Promise<string> {
  const signer = await getSigner(expectedOwnerAddress);
  const contract = new ethers.Contract(contractAddress, WILL_ABI, signer);
  const tx = await contract.updateWill(
    updatedSmList.map((m) => [ethers.getAddress(m.smAddress), m.votePower]),
    addedSmList.map((m) => [ethers.getAddress(m.smAddress), m.votePower]),
    deletedSmList.map((a) => ethers.getAddress(a)),
    [
      securityPeriodConfig.minSecurityPeriod,
      securityPeriodConfig.maxSecurityPeriod,
    ],
  );
  await tx.wait();
  return tx.hash;
}
