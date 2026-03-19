import {
  Will_EvtWillChainAssetsSwapped,
  Will_EvtWillChainAssetsWithdrawn,
  Will_EvtWillChainDeathConfirmed,
  Will_EvtWillChainDeathDeclared,
  Will_EvtWillChainSecurityPeriodUpdated,
  Will_EvtWillChainSmAdded,
  Will_EvtWillChainSmDesisted,
  Will_EvtWillChainSmRemoved,
  Will_EvtWillChainSmUpdated,
  Will_EvtWillChainSmValidated,
  Will_EvtWillChainVetoExercised,
  Will_EvtWillChainWillActivated,
  Will_EvtWillChainWillCanceled,
} from "../../raw/will/events_interface";
import {
  Event_WillActivated,
  Event_WillAssetsSwapped,
  Event_WillAssetsWithdrawn,
  Event_WillCanceled,
  Event_WillDeathConfirmed,
  Event_WillDeathDeclared,
  Event_WillSecurityPeriodUpdated,
  Event_WillSmAdded,
  Event_WillSmDesisted,
  Event_WillSmRemoved,
  Event_WillSmUpdated,
  Event_WillSmValidated,
  Event_WillVetoExercised,
} from "../model";
import { ChainId, weiToNativeToken } from "../utils/network";
import { addHexPrefix, base64ToHex } from "../utils/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Mappers
// ─────────────────────────────────────────────────────────────────────────────

// verified

/**
 * Maps a raw SmValidated event to a cleaned object.
 * DB usage: update the SecondaryMember whose walletAddress
 * matches smAddress, set state → VALIDATED.
 */
export function mapSmValidated(
  raw: Will_EvtWillChainSmValidated,
): Event_WillSmValidated {
  return {
    willAddress: addHexPrefix(raw.evtAddress),
    smAddress: base64ToHex(raw.smAddress),
  };
}

/**
 * Maps a raw WillActivated event to a cleaned object.
 * DB usage: update the Will whose contractAddressInBlockchain matches
 * willAddress, set state → ACTIVE.
 */
export function mapWillActivated(
  raw: Will_EvtWillChainWillActivated,
): Event_WillActivated {
  return {
    willAddress: addHexPrefix(raw.evtAddress),
  };
}

/**
 * Maps a raw AssetsWithdrawn event to a cleaned object.
 * @param chainId - provided by the dispatcher, determines the native token conversion
 */
export function mapAssetsWithdrawn(
  raw: Will_EvtWillChainAssetsWithdrawn,
  chainId: ChainId,
): Event_WillAssetsWithdrawn {
  return {
    willAddress: addHexPrefix(raw.evtAddress),
    amount: weiToNativeToken(raw.amount, chainId),
  };
}

/**
 * Maps a raw SmAdded event to a cleaned object.
 */
export function mapSmAdded(raw: Will_EvtWillChainSmAdded): Event_WillSmAdded {
  return {
    willAddress: addHexPrefix(raw.evtAddress),
    smAddress: base64ToHex(raw.smAddress),
    votePower: Number(raw.votePower),
  };
}

/**
 * Maps a raw SmDesisted event to a cleaned object.
 * DB usage: update the SecondaryMember state → DESISTED
 */
export function mapSmDesisted(
  raw: Will_EvtWillChainSmDesisted,
): Event_WillSmDesisted {
  return {
    willAddress: addHexPrefix(raw.evtAddress),
    smAddress: base64ToHex(raw.smAddress),
  };
}

/**
 * Maps a raw SmRemoved event to a cleaned object.
 * DB usage: remove the SecondaryMember record from the will.
 */
export function mapSmRemoved(
  raw: Will_EvtWillChainSmRemoved,
): Event_WillSmRemoved {
  return {
    willAddress: addHexPrefix(raw.evtAddress),
    smAddress: base64ToHex(raw.smAddress),
  };
}

/**
 * Maps a raw SmUpdated event to a cleaned object.
 */
export function mapSmUpdated(
  raw: Will_EvtWillChainSmUpdated,
): Event_WillSmUpdated {
  return {
    willAddress: addHexPrefix(raw.evtAddress),
    smAddress: base64ToHex(raw.smAddress),
    votePower: Number(raw.votePower),
  };
}

/**
 * Maps a raw SecurityPeriodUpdated event to a cleaned object.
 */
export function mapSecurityPeriodUpdated(
  raw: Will_EvtWillChainSecurityPeriodUpdated,
): Event_WillSecurityPeriodUpdated {
  return {
    willAddress: addHexPrefix(raw.evtAddress),
    minSecurityPeriod: Number(raw.minSecurityPeriod) / (24 * 60 * 60),
    maxSecurityPeriod: Number(raw.maxSecurityPeriod) / (24 * 60 * 60),
  };
}

/**
 * Maps a raw DeathDeclared event to a cleaned object.
 */
export function mapDeathDeclared(
  raw: Will_EvtWillChainDeathDeclared,
): Event_WillDeathDeclared {
  return {
    willAddress: addHexPrefix(raw.evtAddress),
    smAddress: base64ToHex(raw.smAddress),
  };
}

// not verified

/**
 * Maps a raw AssetsSwapped event to a cleaned object.
 */
export function mapAssetsSwapped(
  raw: Will_EvtWillChainAssetsSwapped,
): Event_WillAssetsSwapped {
  return {
    willAddress: addHexPrefix(raw.evtAddress),
    smAddress: base64ToHex(raw.smAddress),
  };
}

/**
 * Maps a raw DeathConfirmed event to a cleaned object.
 */
export function mapDeathConfirmed(
  raw: Will_EvtWillChainDeathConfirmed,
): Event_WillDeathConfirmed {
  return {
    willAddress: addHexPrefix(raw.evtAddress),
    smAddress: base64ToHex(raw.smAddress),
  };
}

/**
 * Maps a raw VetoExercised event to a cleaned object.
 */
export function mapVetoExercised(
  raw: Will_EvtWillChainVetoExercised,
): Event_WillVetoExercised {
  return {
    willAddress: addHexPrefix(raw.evtAddress),
  };
}

/**
 * Maps a raw WillCanceled event to a cleaned object.
 */
export function mapWillCanceled(
  raw: Will_EvtWillChainWillCanceled,
): Event_WillCanceled {
  return {
    willAddress: addHexPrefix(raw.evtAddress),
  };
}
