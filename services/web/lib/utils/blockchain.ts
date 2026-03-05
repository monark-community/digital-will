/**
 * Blockchain utilities for interacting with smart contracts
 */

import { ethers } from "ethers";
import { config } from "@/lib/config";
import { WILL_ABI } from "@/lib/contracts/WillABI";

/**
 * Get the JSON-RPC provider for the blockchain
 */
export function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
}

/**
 * Get a signer from MetaMask
 */
export async function getSigner(): Promise<ethers.Signer> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
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
 * Convert seconds to days
 */
export function secondsToDays(seconds: bigint): number {
  return Number(seconds) / (24 * 60 * 60);
}

/**
 * Wait for a transaction to be mined
 */
export async function waitForTransaction(hash: string): Promise<ethers.TransactionReceipt | null> {
  const provider = getProvider();
  return await provider.waitForTransaction(hash);
}

/**
 * Get the ETH balance of a contract address, returned as a formatted string (e.g. "0.05")
 */
export async function getContractBalance(contractAddress: string): Promise<string> {
  const provider = getProvider();
  const balanceWei = await provider.getBalance(contractAddress);
  return ethers.formatEther(balanceWei);
}

/**
 * Fund a will contract by calling deposit() via MetaMask.
 * Returns the transaction hash on success.
 * Throws if the user has insufficient balance.
 */
export async function fundWillContract(
  contractAddress: string,
  amountEth: string
): Promise<string> {
  const signer = await getSigner();
  const provider = new ethers.BrowserProvider(window.ethereum);

  const amountWei = ethers.parseEther(amountEth);
  const signerAddress = await signer.getAddress();
  const userBalance = await provider.getBalance(signerAddress);

  // Rough gas buffer: 0.001 ETH
  const gasBuffer = ethers.parseEther("0.001");
  if (userBalance < amountWei + gasBuffer) {
    throw new Error(`Insufficient balance. You have ${parseFloat(ethers.formatEther(userBalance)).toFixed(4)} ETH.`);
  }

  const contract = new ethers.Contract(contractAddress, WILL_ABI, signer);
  const tx = await contract.deposit({ value: amountWei });
  await tx.wait();
  return tx.hash;
}

/**
 * Withdraw ETH from a will contract by calling withdraw(amount) via MetaMask.
 * Returns the transaction hash on success.
 * Throws if the requested amount exceeds the contract balance.
 */
export async function withdrawWillContract(
  contractAddress: string,
  amountEth: string
): Promise<string> {
  const provider = getProvider();
  const amountWei = ethers.parseEther(amountEth);

  const contractBalance = await provider.getBalance(contractAddress);
  if (contractBalance < amountWei) {
    throw new Error(
      `Insufficient contract balance. Contract holds ${parseFloat(ethers.formatEther(contractBalance)).toFixed(4)} ETH.`
    );
  }

  const signer = await getSigner();
  const contract = new ethers.Contract(contractAddress, WILL_ABI, signer);
  const tx = await contract.withdraw(amountWei);
  await tx.wait();
  return tx.hash;
}
