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
  "function getSecurityPeriodConfig() view returns (tuple(uint256 minSecurityPeriod, uint256 maxSecurityPeriod))",
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
  minSecurityPeriod?: number | null;
  maxSecurityPeriod?: number | null;
  state?: 'DRAFT' | 'INACTIVE' | 'ACTIVE' | 'CANCELED' | 'EXECUTED' | null;
  executionTimestampOnChain?: number;
  deathDeclarationTimestampOnChain?: number;
  cooldownTimestampOnChain?: number;
  contractBalance?: string;
  secondaryMembers: Array<{
    secondaryMemberId: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string | null;
    walletAddress?: string | null;
    tempWalletAddress?: string | null;
    votingPower?: number | null;
    relationship?: string | null;
  }>;
}

/**
 * Enrich wills with on-chain state data
 * Careful: it also takes draft wills as input 
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

        if (will.state === 'DRAFT') return will;

        try {
          const contract = new ethers.Contract(
            ethers.getAddress(will.contractAddressInBlockchain!),
            WILL_ABI,
            provider,
          );

          const [stateNum, rawExecTs, rawDeclTs, rawCooldownTs, balanceWei, securityPeriodConfig] = await Promise.all([
            contract.getState(),
            contract.executionTimeStampS().catch(() => BigInt(0)),
            contract.deathDeclarationTimestampS().catch(() => BigInt(0)),
            contract.cooldownTimeStampS().catch(() => BigInt(0)),
            provider.getBalance(will.contractAddressInBlockchain!),
            contract.getSecurityPeriodConfig(),
          ]);

          const chainWillState = (WILL_STATES_ONCHAIN[Number(stateNum)] ?? will.state) as T['state'];
          const executionTimestampOnChain = Number(rawExecTs);
          const deathDeclarationTimestampOnChain = Number(rawDeclTs);
          const cooldownTimestampOnChain = Number(rawCooldownTs);
          const contractBalance = ethers.formatEther(balanceWei);

          const enrichedMembers = await Promise.all(
            will.secondaryMembers.map(async (sm) => {
              const smWallet = sm.walletAddress || sm.tempWalletAddress;
              if (!smWallet) return sm;
              try {
                const smInfo = await contract.getDetailedSm(ethers.getAddress(smWallet));
                const chainSmState = SM_STATES_ONCHAIN[Number(smInfo.state)];
                const votePower = Number(smInfo.votePower);
                return { ...sm, state: chainSmState, votingPower: votePower };
              } catch {
                return sm;
              }
            }),
          );

          return {
            ...will,
            state: chainWillState,
            secondaryMembers: enrichedMembers,
            minSecurityPeriod: Number(securityPeriodConfig.minSecurityPeriod) / 86400, // Convert seconds to days
            maxSecurityPeriod: Number(securityPeriodConfig.maxSecurityPeriod) / 86400, // Convert seconds to days
            executionTimestampOnChain,
            deathDeclarationTimestampOnChain,
            cooldownTimestampOnChain,
            contractBalance
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
