// ─────────────────────────────────────────────────────────────────────────────
// Types (mirror of contract.proto message definitions). These are the interfaces as we receive them from the substream.
// ─────────────────────────────────────────────────────────────────────────────

// ── Will events ─────────────────────────────────────────────────────────────── evtAddress is the will address that emitted the event

// tested

export interface Will_EvtWillChainSmValidated {
  evtTxHash: string;
  evtIndex: number;
  evtBlockTime: string;
  evtBlockNumber: string;
  evtAddress: string; // will address hex (without 0x prefix)
  smAddress: string; // base64
}

export interface Will_EvtWillChainWillActivated {
  evtTxHash: string;
  evtIndex: number;
  evtBlockTime: string;
  evtBlockNumber: string;
  evtAddress: string; // will address hex (without 0x prefix)
}

export interface Will_EvtWillChainAssetsSwapped {
  evtTxHash: string;
  evtIndex: number;
  evtBlockTime: string;
  evtBlockNumber: string;
  evtAddress: string;
  smAddress: string;
  usdcAmount: string;
}

export interface Will_EvtWillChainDeathConfirmed {
  evtTxHash: string;
  evtIndex: number;
  evtBlockTime: string;
  evtBlockNumber: string;
  evtAddress: string;
  smAddress: string;
}
export interface Will_EvtWillChainDeathDeclared {
  evtTxHash: string;
  evtIndex: number;
  evtBlockTime: string;
  evtBlockNumber: string;
  evtAddress: string;
  smAddress: string;
  assets: string;
}
export interface Will_EvtWillChainSmAdded {
  evtTxHash: string;
  evtIndex: number;
  evtBlockTime: string;
  evtBlockNumber: string;
  evtAddress: string;
  smAddress: string;
  votePower: string;
}
export interface Will_EvtWillChainSmDesisted {
  evtTxHash: string;
  evtIndex: number;
  evtBlockTime: string;
  evtBlockNumber: string;
  evtAddress: string;
  smAddress: string;
  validatedPreDesist: string; // '1' if they had validated before desisting, '0' if they never validated (refused the signature request).
}
export interface Will_EvtWillChainSmRemoved {
  evtTxHash: string;
  evtIndex: number;
  evtBlockTime: string;
  evtBlockNumber: string;
  evtAddress: string;
  smAddress: string;
}
export interface Will_EvtWillChainSmUpdated {
  evtTxHash: string;
  evtIndex: number;
  evtBlockTime: string;
  evtBlockNumber: string;
  evtAddress: string;
  smAddress: string;
  votePower: string;
}
export interface Will_EvtWillChainSecurityPeriodUpdated {
  evtTxHash: string;
  evtIndex: number;
  evtBlockTime: string;
  evtBlockNumber: string;
  evtAddress: string;
  minSecurityPeriod: string;
  maxSecurityPeriod: string;
}
export interface Will_EvtWillChainVetoExercised {
  evtTxHash: string;
  evtIndex: number;
  evtBlockTime: string;
  evtBlockNumber: string;
  evtAddress: string;
}
export interface Will_EvtWillChainWillCanceled {
  evtTxHash: string;
  evtIndex: number;
  evtBlockTime: string;
  evtBlockNumber: string;
  evtAddress: string;
}
