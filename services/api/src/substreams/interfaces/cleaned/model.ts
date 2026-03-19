// ─────────────────────────────────────────────────────────────────────────────
// Cleaned models — ready for DB persistence or frontend consumption.
// All blockchain addresses are hex strings prefixed with 0x.
// All time periods are numbers (days).
// ─────────────────────────────────────────────────────────────────────────────

export enum WillState {
  DRAFT = "DRAFT",
  CANCELED = "CANCELED",
  INACTIVE = "INACTIVE",
  ACTIVE = "ACTIVE",
  EXECUTED = "EXECUTED",
}

export enum SMState {
  PENDING = "PENDING",
  VALIDATED = "VALIDATED",
  DECLARED_DEATH = "DECLARED_DEATH",
}

export enum NotificationType {
  SIGNATURE_REQUEST = "SIGNATURE_REQUEST",
  WILL_ACTIVATED = "WILL_ACTIVATED",
  WILL_CANCELED = "WILL_CANCELED",
  SM_ADDED = "SM_ADDED",
  SM_UPDATED = "SM_UPDATED",
  SM_REMOVED = "SM_REMOVED",
  SM_DESISTED = "SM_DESISTED",
  SECURITY_PERIOD_UPDATED = "SECURITY_PERIOD_UPDATED",
  DEATH_DECLARED = "DEATH_DECLARED",
  DEATH_CONFIRMED = "DEATH_CONFIRMED",
  VETO_EXERCISED = "VETO_EXERCISED",
  ASSETS_SWAPPED = "ASSETS_SWAPPED",
}

export enum NotificationRecipientRole {
  PM = "pm",
  SM = "sm",
  SM_TARGET = "sm_target",
}

export interface UserNotification {
  type: NotificationType;
  role: NotificationRecipientRole;
  title: string;
  message: string;
  willId: string;
  createdAt: string;
}

export interface SmPartialInfo {
  smAddress: string; // hex 0x
  votePower: number;
}

export interface SecurityPeriodConfig {
  minSecurityPeriod: number; // days
  maxSecurityPeriod: number; // days
}

export interface Will {
  walletAddress: string; // hex 0x — owner of the will (MP address)
  contractAddressInBlockchain: string; // hex 0x — deployed will contract address
  securityPeriodConfig: SecurityPeriodConfig;
  newSmList: SmPartialInfo[];
  initialBalance: number; // in the native token of the network (converted from wei)
}

// ── Will event cleaned models ─────────────────────────────────────────────────

/** Fired when a secondary member validates the will. Use to set SM state → VALIDATED. */
export interface Event_WillSmValidated {
  willAddress: string; // hex 0x
  smAddress: string; // hex 0x
}

/** Fired when the will reaches ACTIVE state (all SMs validated). Use to set Will state → ACTIVE. */
export interface Event_WillActivated {
  willAddress: string; // hex 0x
}

/** Fired when an PM's assets are swapped. */
export interface Event_WillAssetsSwapped {
  willAddress: string; // hex 0x
  smAddress: string; // hex 0x
}

/** Fired when ETH is partially withdrawn from the will contract. */
export interface Event_WillAssetsWithdrawn {
  willAddress: string; // hex 0x
  amount: number; // in the native token of the network (converted from wei)
}

/** Fired when a death declaration is confirmed by a secondary member. */
export interface Event_WillDeathConfirmed {
  willAddress: string; // hex 0x
  smAddress: string; // hex 0x
}

/** Fired when a death is declared by a secondary member. */
export interface Event_WillDeathDeclared {
  willAddress: string; // hex 0x
  smAddress: string; // hex 0x
}

/** Fired when a secondary member is added to the will. */
export interface Event_WillSmAdded {
  willAddress: string; // hex 0x
  smAddress: string; // hex 0x
  votePower: number;
}

/** Fired when a secondary member desists from the will. */
export interface Event_WillSmDesisted {
  willAddress: string; // hex 0x
  smAddress: string; // hex 0x
}

/** Fired when a secondary member is removed from the will by the PM. */
export interface Event_WillSmRemoved {
  willAddress: string; // hex 0x
  smAddress: string; // hex 0x
}

/** Fired when a secondary member is updated. */
export interface Event_WillSmUpdated {
  willAddress: string; // hex 0x
  smAddress: string; // hex 0x
  votePower: number;
}

/** Fired when the security period configuration is updated. */
export interface Event_WillSecurityPeriodUpdated {
  willAddress: string; // hex 0x
  minSecurityPeriod: number; // days
  maxSecurityPeriod: number; // days
}

/** Fired when the will owner exercises a veto. */
export interface Event_WillVetoExercised {
  willAddress: string; // hex 0x
}

/** Fired when the will is canceled. */
export interface Event_WillCanceled {
  willAddress: string; // hex 0x
}
