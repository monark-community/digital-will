/**
 * Blockchain utilities for interacting with smart contracts
 */

import { ethers } from "ethers";
import { WILL_ABI } from "@/lib/contracts/WillABI";
import { willService} from "@/lib/services";

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

  /*
  Delay added instead of waiting 2 block confirmation 
  */
  await new Promise(resolve => setTimeout(resolve, 2000));
  
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
  const amountWei = ethers.parseEther(amountEth);

  const contractBalance = await willService.getContractBalance(contractAddress).then(balanceStr => ethers.parseEther(balanceStr));
  if (contractBalance < amountWei) {
    throw new Error(
      `Insufficient contract balance. Contract holds ${parseFloat(ethers.formatEther(contractBalance)).toFixed(4)} ETH.`
    );
  }

  const signer = await getSigner();
  const contract = new ethers.Contract(contractAddress, WILL_ABI, signer);
  const tx = await contract.withdraw(amountWei);
  await tx.wait();

  /*
  Delay added instead of waiting 2 block confirmation 
  */
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return tx.hash;
}

/**
 * Cancel a will contract by calling cancelWill() via MetaMask.
 * The contract will auto-withdraw all ETH back to the PM.
 * Returns the transaction hash on success.
 */
export async function cancelWillContract(contractAddress: string): Promise<string> {
  const signer = await getSigner();
  const contract = new ethers.Contract(contractAddress, WILL_ABI, signer);
  const tx = await contract.cancelWill();
  await tx.wait();
  return tx.hash;
}

/**
 * Veto a death declaration via MetaMask. Resets all DECLARED_DEATH SMs to VALIDATED
 * and starts a cooldown, preventing new declarations for COOLDOWN_PERIOD seconds.
 */
export async function vetoDeathContract(contractAddress: string): Promise<string> {
  const signer = await getSigner();
  const contract = new ethers.Contract(contractAddress, WILL_ABI, signer);
  const tx = await contract.vetoDeath();
  await tx.wait();

  /*
  Delay added instead of waiting 2 block confirmation 
  */
  await new Promise(resolve => setTimeout(resolve, 2000));
  return tx.hash;
}

/**
 * Update a deployed will's SM list and/or security period via MetaMask.
 * Pass empty arrays for lists that are unchanged.
 * Pass { minSecurityPeriod: 0n, maxSecurityPeriod: 0n } to skip period update.
 */
export async function updateWillContract(
  contractAddress: string,
  updatedSmList: Array<{ smAddress: string; votePower: number }>,
  addedSmList: Array<{ smAddress: string; votePower: number }>,
  deletedSmList: string[],
  securityPeriodConfig: { minSecurityPeriod: bigint; maxSecurityPeriod: bigint }
): Promise<string> {
  const signer = await getSigner();
  const contract = new ethers.Contract(contractAddress, WILL_ABI, signer);
  const tx = await contract.updateWill(
    updatedSmList.map(m => [ethers.getAddress(m.smAddress), m.votePower]),
    addedSmList.map(m => [ethers.getAddress(m.smAddress), m.votePower]),
    deletedSmList.map(a => ethers.getAddress(a)),
    [securityPeriodConfig.minSecurityPeriod, securityPeriodConfig.maxSecurityPeriod]
  );
  await tx.wait();
  return tx.hash;
}
