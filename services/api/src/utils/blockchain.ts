/**
 * Backend blockchain utilities for interacting with smart contracts
 */

import { ethers } from "ethers";
import { config } from "../config/config";

let providerInstance: ethers.JsonRpcProvider | null = null;

/**
 * Get the JSON-RPC provider for the blockchain
 * Uses singleton pattern to avoid creating multiple providers
 */
export function getProvider(): ethers.JsonRpcProvider {
  if (!providerInstance) {
    // Create provider with staticNetwork to skip auto-detection
    // This prevents the "failed to detect network" errors
    const network = config.blockchain.chainId 
      ? ethers.Network.from(config.blockchain.chainId)
      : undefined;
    
    console.log(`[Blockchain] Initializing provider with RPC: ${config.blockchain.rpcUrl}, Chain ID: ${config.blockchain.chainId}`);
    
    providerInstance = new ethers.JsonRpcProvider(
      config.blockchain.rpcUrl,
      network,
      { 
        staticNetwork: network,
        batchMaxCount: 1 // Disable batching for better compatibility
      }
    );
  }
  return providerInstance;
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
 * Get the ETH balance of a contract address, returned as a formatted string (e.g. "0.05")
 */
export async function getContractBalance(contractAddress: string): Promise<string> {
  try {
    // Validate and checksum the address
    if (!ethers.isAddress(contractAddress)) {
      console.error(`Invalid address format: ${contractAddress}`);
      return '0';
    }
    
    const checksummedAddress = ethers.getAddress(contractAddress);
    const provider = getProvider();
    const balanceWei = await provider.getBalance(checksummedAddress);
    const formattedBalance = ethers.formatEther(balanceWei);
    return formattedBalance;
  } catch (error) {
    console.error(`Error fetching balance for ${contractAddress}:`, error);
    return '0'; // Return 0 instead of throwing on error
  }
}

/**
 * Validate an Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
  try {
    ethers.getAddress(address);
    return true;
  } catch {
    return false;
  }
}
