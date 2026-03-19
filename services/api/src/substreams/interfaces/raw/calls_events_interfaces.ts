// ─────────────────────────────────────────────────────────────────────────────
// Types (mirror of contract.proto message definitions). These are the interfaces as we receive them from the substream.
// ─────────────────────────────────────────────────────────────────────────────

import { Willfactory_CreateWillCall } from "./factory/calls_interface";
import {
  Will_EvtWillChainAssetsSwapped,
  Will_EvtWillChainAssetsWithdrawn,
  Will_EvtWillChainDeathConfirmed,
  Will_EvtWillChainDeathDeclared,
  Will_EvtWillChainSmAdded,
  Will_EvtWillChainSmDesisted,
  Will_EvtWillChainSmRemoved,
  Will_EvtWillChainSmUpdated,
  Will_EvtWillChainSmValidated,
  Will_EvtWillChainSecurityPeriodUpdated,
  Will_EvtWillChainVetoExercised,
  Will_EvtWillChainWillActivated,
  Will_EvtWillChainWillCanceled,
} from "./will/events_interface";

export interface Events {
  willEvtWillChainAssetsSwappeds: Will_EvtWillChainAssetsSwapped[];
  willEvtWillChainAssetsWithdrawns: Will_EvtWillChainAssetsWithdrawn[];
  willEvtWillChainDeathConfirmeds: Will_EvtWillChainDeathConfirmed[];
  willEvtWillChainDeathDeclareds: Will_EvtWillChainDeathDeclared[];
  willEvtWillChainSmAddeds: Will_EvtWillChainSmAdded[];
  willEvtWillChainSmDesisteds: Will_EvtWillChainSmDesisted[];
  willEvtWillChainSmRemoveds: Will_EvtWillChainSmRemoved[];
  willEvtWillChainSmUpdateds: Will_EvtWillChainSmUpdated[];
  willEvtWillChainSmValidateds: Will_EvtWillChainSmValidated[];
  willEvtWillChainSecurityPeriodUpdateds: Will_EvtWillChainSecurityPeriodUpdated[];
  willEvtWillChainVetoExerciseds: Will_EvtWillChainVetoExercised[];
  willEvtWillChainWillActivateds: Will_EvtWillChainWillActivated[];
  willEvtWillChainWillCanceleds: Will_EvtWillChainWillCanceled[];
}

export interface Calls {
  willfactoryCallCreateWills: Willfactory_CreateWillCall[];
}

export interface EventsCalls {
  events: Events;
  calls: Calls;
}

// ─────────────────────────────────────────────────────────────────────────────
// String-literal enums for type-safe switch dispatching
// ─────────────────────────────────────────────────────────────────────────────

export enum EventKey {
  WillEvtWillChainAssetsSwappeds = "willEvtWillChainAssetsSwappeds",
  WillEvtWillChainAssetsWithdrawns = "willEvtWillChainAssetsWithdrawns",
  WillEvtWillChainDeathConfirmeds = "willEvtWillChainDeathConfirmeds",
  WillEvtWillChainDeathDeclareds = "willEvtWillChainDeathDeclareds",
  WillEvtWillChainSmAddeds = "willEvtWillChainSmAddeds",
  WillEvtWillChainSmDesisteds = "willEvtWillChainSmDesisteds",
  WillEvtWillChainSmRemoveds = "willEvtWillChainSmRemoveds",
  WillEvtWillChainSmUpdateds = "willEvtWillChainSmUpdateds",
  WillEvtWillChainSmValidateds = "willEvtWillChainSmValidateds",
  WillEvtWillChainSecurityPeriodUpdateds = "willEvtWillChainSecurityPeriodUpdateds",
  WillEvtWillChainVetoExerciseds = "willEvtWillChainVetoExerciseds",
  WillEvtWillChainWillActivateds = "willEvtWillChainWillActivateds",
  WillEvtWillChainWillCanceleds = "willEvtWillChainWillCanceleds",
}

export enum CallKey {
  WillfactoryCallCreateWills = "willfactoryCallCreateWills",
}
