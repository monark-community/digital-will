// ─────────────────────────────────────────────────────────────────────────────
// Event handlers
// ─────────────────────────────────────────────────────────────────────────────

import { parseChainId } from "../interfaces/cleaned/utils/network";
import {
  mapAssetsSwapped,
  mapDeathConfirmed,
  mapDeathDeclared,
  mapSecurityPeriodUpdated,
  mapSmAdded,
  mapSmDesisted,
  mapSmRemoved,
  mapSmUpdated,
  mapSmValidated,
  mapVetoExercised,
  mapWillActivated,
  mapWillCanceled,
} from "../interfaces/cleaned/will/mapper";
import {
  Will_EvtWillChainAssetsSwapped,
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
} from "../interfaces/raw/will/events_interface";
import {
  notifyAssetsSwapped,
  notifyDeathConfirmed,
  notifyDeathDeclared,
  notifySecurityPeriodUpdated,
  notifySmToSign,
  notifySmDesisted,
  notifySmRemoved,
  notifySmUpdated,
  notifySmValidated,
  notifyVetoExercised,
  notifyWillActivated,
  notifyWillCanceled,
} from "../../handlers/notificationHandler";
import {
  upsertProtectionPeriodTimer,
  cancelProtectionPeriodTimer,
} from "../../services/protectionPeriodService";

export async function handleAssetsSwapped(
  evt: Will_EvtWillChainAssetsSwapped,
  chainId: string,
): Promise<void> {
  const chainId_parsed = parseChainId(chainId);
  const event_WillAssetsSwapped = mapAssetsSwapped(evt);
  console.dir(
    { fn: "handleAssetsSwapped", cleanedEvt: event_WillAssetsSwapped },
    { depth: null, colors: true },
  );
  await notifyAssetsSwapped(
    event_WillAssetsSwapped.willAddress,
    event_WillAssetsSwapped.smAddress,
  );
  await cancelProtectionPeriodTimer(event_WillAssetsSwapped.willAddress);
}

export async function handleDeathConfirmed(
  evt: Will_EvtWillChainDeathConfirmed,
  chainId: string,
): Promise<void> {
  const chainId_parsed = parseChainId(chainId);
  const event_WillDeathConfirmed = mapDeathConfirmed(evt);
  console.dir(
    { fn: "handleDeathConfirmed", cleanedEvt: event_WillDeathConfirmed },
    { depth: null, colors: true },
  );

  await notifyDeathConfirmed(
    event_WillDeathConfirmed.willAddress,
    event_WillDeathConfirmed.smAddress,
  );
  await upsertProtectionPeriodTimer(event_WillDeathConfirmed.willAddress);
}

export async function handleDeathDeclared(
  evt: Will_EvtWillChainDeathDeclared,
  chainId: string,
): Promise<void> {
  const chainId_parsed = parseChainId(chainId);
  const event_WillDeathDeclared = mapDeathDeclared(evt);
  console.dir(
    { fn: "handleDeathDeclared", cleanedEvt: event_WillDeathDeclared },
    { depth: null, colors: true },
  );

  await notifyDeathDeclared(
    event_WillDeathDeclared.willAddress,
    event_WillDeathDeclared.smAddress,
  );
  await upsertProtectionPeriodTimer(event_WillDeathDeclared.willAddress);
}

export async function handleSmAdded(
  evt: Will_EvtWillChainSmAdded,
): Promise<void> {
  const event_WillSmAdded = mapSmAdded(evt);
  console.dir(
    { fn: "handleSmAdded", event_WillSmAdded },
    { depth: null, colors: true },
  );
  await notifySmToSign(
    event_WillSmAdded.willAddress,
    event_WillSmAdded.smAddress,
  );
}

export async function handleSmDesisted(
  evt: Will_EvtWillChainSmDesisted,
  chainId: string,
): Promise<void> {
  const chainId_parsed = parseChainId(chainId);
  const event_WillSmDesisted = mapSmDesisted(evt);
  console.dir(
    { fn: "handleSmDesisted", event_WillSmDesisted },
    { depth: null, colors: true },
  );
  await notifySmDesisted(
    event_WillSmDesisted.willAddress,
    event_WillSmDesisted.smAddress,
  );
}

export async function handleSmRemoved(
  evt: Will_EvtWillChainSmRemoved,
  chainId: string,
): Promise<void> {
  const chainId_parsed = parseChainId(chainId);
  const event_WillSmRemoved = mapSmRemoved(evt);
  console.dir(
    { fn: "handleSmRemoved", event_WillSmRemoved },
    { depth: null, colors: true },
  );
  await notifySmRemoved(
    event_WillSmRemoved.willAddress,
    event_WillSmRemoved.smAddress,
  );
}

export async function handleSmUpdated(
  evt: Will_EvtWillChainSmUpdated,
): Promise<void> {
  const event_WillSmUpdated = mapSmUpdated(evt);
  console.dir(
    { fn: "handleSmUpdated", event_WillSmUpdated },
    { depth: null, colors: true },
  );
  await notifySmUpdated(
    event_WillSmUpdated.willAddress,
    event_WillSmUpdated.smAddress,
  );
}

export async function handleSmValidated(
  evt: Will_EvtWillChainSmValidated,
  chainId: string,
): Promise<void> {
  const chainId_parsed = parseChainId(chainId);
  const event_WillSmValidated = mapSmValidated(evt);
  console.dir(
    { fn: "handleSmValidated", event_WillSmValidated },
    { depth: null, colors: true },
  );
  await notifySmValidated(
    event_WillSmValidated.willAddress,
    event_WillSmValidated.smAddress,
  );
}

export async function handleSecurityPeriodUpdated(
  evt: Will_EvtWillChainSecurityPeriodUpdated,
  chainId: string,
): Promise<void> {
  const chainId_parsed = parseChainId(chainId);
  const event_WillSecurityPeriodUpdated = mapSecurityPeriodUpdated(evt);
  console.dir(
    { fn: "handleSecurityPeriodUpdated", event_WillSecurityPeriodUpdated },
    { depth: null, colors: true },
  );
  await notifySecurityPeriodUpdated(
    event_WillSecurityPeriodUpdated.willAddress,
  );
}

export async function handleVetoExercised(
  evt: Will_EvtWillChainVetoExercised,
  chainId: string,
): Promise<void> {
  const chainId_parsed = parseChainId(chainId);
  const event_WillVetoExercised = mapVetoExercised(evt);
  console.dir(
    { fn: "handleVetoExercised", event_WillVetoExercised },
    { depth: null, colors: true },
  );
  await notifyVetoExercised(event_WillVetoExercised.willAddress);
  await cancelProtectionPeriodTimer(event_WillVetoExercised.willAddress);
}

export async function handleWillActivated(
  evt: Will_EvtWillChainWillActivated,
  chainId: string,
): Promise<void> {
  const chainId_parsed = parseChainId(chainId);
  const event_WillActivated = mapWillActivated(evt);
  console.dir(
    { fn: "handleWillActivated", event_WillActivated },
    { depth: null, colors: true },
  );

  await notifyWillActivated(event_WillActivated.willAddress);
}

export async function handleWillCanceled(
  evt: Will_EvtWillChainWillCanceled,
  chainId: string,
): Promise<void> {
  const chainId_parsed = parseChainId(chainId);
  const event_WillCanceled = mapWillCanceled(evt);
  console.dir(
    { fn: "handleWillCanceled", event_WillCanceled },
    { depth: null, colors: true },
  );
  await notifyWillCanceled(event_WillCanceled.willAddress);
  await cancelProtectionPeriodTimer(event_WillCanceled.willAddress);
}
