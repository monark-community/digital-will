import { ethers } from "ethers";
import { WILL_ABI } from "@/lib/contracts/WillABI";
import type { WillFromDB } from "@/lib/services";

export const WILL_STATES_ONCHAIN = ['CANCELED', 'INACTIVE', 'ACTIVE', 'EXECUTED'] as const;
export const SM_STATES_ONCHAIN = ['PENDING', 'VALIDATED', 'DECLARED_DEATH'] as const;


export async function enrichWillsWithChainState<T extends WillFromDB>(wills: T[]): Promise<T[]> {
  if (typeof window === 'undefined' || !(window as any).ethereum) return wills;
  const provider = new ethers.BrowserProvider((window as any).ethereum);

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

        return { ...will, state: chainWillState, secondaryMembers: enrichedMembers, executionTimestampOnChain, deathDeclarationTimestampOnChain, cooldownTimestampOnChain };
      } catch {
        return will;
      }
    }),
  );
}
