// ─────────────────────────────────────────────────────────────────────────────
// Supported networks. This is a util file to help the mappers. 
// ─────────────────────────────────────────────────────────────────────────────

export enum ChainId {
    SEPOLIA = 11155111,
}

export interface NetworkInfo {
    chainId: ChainId;
    name: string;
    nativeToken: string;  // symbol of the native currency (e.g. "ETH")
    weiDecimals: number;  // decimals used to convert from wei (always 18 for EVM)
}

export const NETWORKS: Record<ChainId, NetworkInfo> = {
    [ChainId.SEPOLIA]: { chainId: ChainId.SEPOLIA, name: 'Sepolia Testnet', nativeToken: 'ETH', weiDecimals: 18 },
};

/** Parses a chainId string (or number) into the ChainId enum. Throws if unsupported. */
export function parseChainId(value: string | number): ChainId {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    if (!Object.values(ChainId).includes(num)) {
        throw new Error(`Unsupported chainId: ${value}`);
    }
    return num as ChainId;
}

/** Converts a wei amount string to the network's native token unit. */
export function weiToNativeToken(weiAmount: string, chainId: ChainId): number {
    const network = NETWORKS[chainId];
    if (!network) throw new Error(`Unsupported chainId: ${chainId}`);
    return Number(BigInt(weiAmount)) / Math.pow(10, network.weiDecimals);
}
