/**
 * Service for enriching wills with blockchain state
 */

import { ethers } from "ethers";
import { getProvider } from "../utils/blockchain";

const WILL_ABI = [
  "function getState() view returns (uint8)",
  "function executionTimeStampS() view returns (uint256)",
  "function deathDeclarationTimestampS() view returns (uint256)",
  "function cooldownTimeStampS() view returns (uint256)",
  "function getDetailedSm(address) view returns (tuple(uint8 state, uint8 votePower))"
];

const WILL_STATES_ONCHAIN = ['CANCELED', 'INACTIVE', 'ACTIVE', 'EXECUTED'] as const;
const SM_STATES_ONCHAIN = ['PENDING', 'VALIDATED', 'DECLARED_DEATH'] as const;

export interface WillFromDB {
  willId: string;
  willName: string;
  walletAddress: string;
  contractAddressInBlockchain?: string | null;
  chainId?: number | null;
  minSecurityPeriod: number;
  maxSecurityPeriod: number;
  state: 'DRAFT' | 'INACTIVE' | 'ACTIVE' | 'CANCELED' | 'EXECUTED';
  executionTimestampOnChain?: number;
  deathDeclarationTimestampOnChain?: number;
  cooldownTimestampOnChain?: number;
  secondaryMembers: Array<{
    secondaryMemberId: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string | null;
    walletAddress?: string | null;
    tempWalletAddress?: string | null;
    votingPower: number;
    state: 'PENDING' | 'VALIDATED' | 'DECLARED_DEATH';
    relationship?: string | null;
  }>;
}

/**
 * Enrich wills with on-chain state data
 */
export async function enrichWillsWithChainState<T extends WillFromDB>(wills: T[]): Promise<T[]> {
  try {
    const provider = getProvider();
    
    // Test the provider connection first
    try {
      await provider.getBlockNumber();
    } catch (error) {
      console.warn('Cannot connect to blockchain RPC, returning wills without enrichment:', error);
      return wills;
    }

    return Promise.all(
      wills.map(async (will) => {
        if (!will.contractAddressInBlockchain || will.state === 'DRAFT') return will;

        try {
          const contract = new ethers.Contract(
            ethers.getAddress(will.contractAddressInBlockchain),
            WILL_ABI,
            provider,
          );

          const [stateNum, rawExecTs, rawDeclTs, rawCooldownTs] = await Promise.all([
            contract.getState(),
            contract.executionTimeStampS().catch(() => BigInt(0)),
            contract.deathDeclarationTimestampS().catch(() => BigInt(0)),
            contract.cooldownTimeStampS().catch(() => BigInt(0)),
          ]);

          const chainWillState = (WILL_STATES_ONCHAIN[Number(stateNum)] ?? will.state) as T['state'];
          const executionTimestampOnChain = Number(rawExecTs);
          const deathDeclarationTimestampOnChain = Number(rawDeclTs);
          const cooldownTimestampOnChain = Number(rawCooldownTs);

          const enrichedMembers = await Promise.all(
            will.secondaryMembers.map(async (sm) => {
              const smWallet = sm.walletAddress || sm.tempWalletAddress;
              if (!smWallet) return sm;
              try {
                const smInfo = await contract.getDetailedSm(ethers.getAddress(smWallet));
                const chainSmState = (SM_STATES_ONCHAIN[Number(smInfo.state)] ?? sm.state) as typeof sm.state;
                return { ...sm, state: chainSmState };
              } catch {
                return sm;
              }
            }),
          );

          return { 
            ...will, 
            state: chainWillState, 
            secondaryMembers: enrichedMembers, 
            executionTimestampOnChain, 
            deathDeclarationTimestampOnChain, 
            cooldownTimestampOnChain 
          };
        } catch (error) {
          console.error(`Error enriching will ${will.willId}:`, error);
          return will;
        }
      }),
    );
  } catch (error) {
    console.error('Error in enrichWillsWithChainState:', error);
    return wills; // Return unenriched wills on error
  }
}
