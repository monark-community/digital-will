import { Willfactory_CreateWillCall } from '../../raw/factory/calls_interface';
import { Will } from '../model';
import { ChainId, weiToNativeToken } from '../utils/network';
import { base64ToHex } from '../utils/utils';
// ─────────────────────────────────────────────────────────────────────────────
// Mapper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps a raw Willfactory_CreateWillCall (from the substream) to a cleaned Will
 * object that is safe to persist to the DB or send to the frontend.
 *
 * Note: chainId and state must be added by the caller since they are not
 * present in the raw call data.
 */
export function mapCreateWill(raw: Willfactory_CreateWillCall, chainId: ChainId): Will {
    return {
        walletAddress: base64ToHex(raw.owner),
        contractAddressInBlockchain: base64ToHex(raw.outputParam0),
        securityPeriodConfig: {
            minSecurityPeriod: parseInt(raw.securityPeriodConfig?.minSecurityPeriod ?? '0', 10) / (24 * 60 * 60), // in days
            maxSecurityPeriod: parseInt(raw.securityPeriodConfig?.maxSecurityPeriod ?? '0', 10) / (24 * 60 * 60),
        },
        newSmList: raw.newSmList.map((sm) => ({
            smAddress: base64ToHex(sm.smAddress),
            votePower: sm.votePower,
        })),
        initialBalance: raw.callValue ? weiToNativeToken(raw.callValue, chainId) : 0,
    };
}
