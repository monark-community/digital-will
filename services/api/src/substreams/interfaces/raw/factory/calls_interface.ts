// ─────────────────────────────────────────────────────────────────────────────
// Types (mirror of contract.proto message definitions). These are the interfaces as we receive them from the substream. 
// ─────────────────────────────────────────────────────────────────────────────

// ── Factory ──────────────────────────────────────────────────────────────────
export interface SMPartialInfo { smAddress: string; votePower: number } // smAddress: base64 string
export interface SecurityPeriodConfig { minSecurityPeriod: string; maxSecurityPeriod: string } // seconds

export interface Willfactory_CreateWillCall {
    callTxHash: string;
    callBlockTime: string;
    callBlockNumber: string;
    callOrdinal: string;
    callSuccess: boolean;
    owner: string; // MP address base64 string
    newSmList: SMPartialInfo[];
    securityPeriodConfig?: SecurityPeriodConfig;
    outputParam0: string; // will address base 64 string
    callValue?: string;   // ETH sent with the call, in wei (decimal string) TODO: test
}