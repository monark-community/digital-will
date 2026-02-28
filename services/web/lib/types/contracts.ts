/**
 * Smart contract types and interfaces
 */

export interface SMPartialInfo {
  smAddress: string;
  votePower: number;
}

export interface SecurityPeriodConfig {
  minSecurityPeriod: bigint;
  maxSecurityPeriod: bigint;
}

export interface CreateWillParams {
  factoryAddress: string;
  owner: string;
  secondaryMembers: SMPartialInfo[];
  securityPeriodConfig: SecurityPeriodConfig;
}

export interface CreateWillResult {
  willAddress: string;
  transactionHash: string;
}

