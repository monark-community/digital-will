// ─────────────────────────────────────────────────────────────────────────────
// Main dispatcher
// ─────────────────────────────────────────────────────────────────────────────

import { handleCreateWillCall } from "./handlers/call_handlers";
import {
  handleAssetsSwapped,
  handleDeathConfirmed,
  handleDeathDeclared,
  handleSmAdded,
  handleSmDesisted,
  handleSmRemoved,
  handleSmValidated,
  handleSecurityPeriodUpdated,
  handleVetoExercised,
  handleWillActivated,
  handleWillCanceled,
  handleSmUpdated,
} from "./handlers/event_handlers";
import {
  CallKey,
  EventKey,
  EventsCalls,
} from "./interfaces/raw/calls_events_interfaces";

/**
 * Entry point called for every block message received from the substream.
 * Routes each event / call to its dedicated handler.
 */
export async function eventsCallsDispatcher(
  message: EventsCalls,
  chainId: string,
): Promise<void> {
  console.log("in eventsCallsDispatcher");

  const { events, calls } = message;

  // ── Calls ─────────────────────────────────────────────────────────────────
  // Process calls FIRST so the DB is up to date before events (e.g. SM_ADDED)
  // fire notification lookups that depend on the will existing in DB.
  for (const [calls_type, callList] of Object.entries(calls ?? {})) {
    for (const call of (callList as any[]) ?? []) {
      switch (calls_type) {
        case CallKey.WillfactoryCallCreateWills:
          await handleCreateWillCall(call, chainId);
          break;
        default:
          console.warn(`Unknown call type: ${calls_type}`);
      }
    }
  }

  // ── Events ────────────────────────────────────────────────────────────────
  // WillActivated is collected and processed last so that SmValidated
  // notifications ("member signed") always arrive before "will activated".
  const deferredWillActivated: any[] = [];

  for (const [events_type, eventList] of Object.entries(events ?? {})) {
    for (const event of (eventList as any[]) ?? []) {
      switch (events_type) {
        case EventKey.WillEvtWillChainAssetsSwappeds:
          await handleAssetsSwapped(event, chainId);
          break;
        case EventKey.WillEvtWillChainDeathConfirmeds:
          await handleDeathConfirmed(event, chainId);
          break;
        case EventKey.WillEvtWillChainDeathDeclareds:
          await handleDeathDeclared(event, chainId);
          break;
        case EventKey.WillEvtWillChainSmAddeds:
          await handleSmAdded(event);
          break;
        case EventKey.WillEvtWillChainSmDesisteds:
          await handleSmDesisted(event, chainId);
          break;
        case EventKey.WillEvtWillChainSmRemoveds:
          await handleSmRemoved(event, chainId);
          break;
        case EventKey.WillEvtWillChainSmUpdateds:
          await handleSmUpdated(event);
          break;
        case EventKey.WillEvtWillChainSmValidateds:
          await handleSmValidated(event, chainId);
          break;
        case EventKey.WillEvtWillChainSecurityPeriodUpdateds:
          await handleSecurityPeriodUpdated(event, chainId);
          break;
        case EventKey.WillEvtWillChainVetoExerciseds:
          await handleVetoExercised(event, chainId);
          break;
        case EventKey.WillEvtWillChainWillActivateds:
          deferredWillActivated.push(event);
          break;
        case EventKey.WillEvtWillChainWillCanceleds:
          await handleWillCanceled(event, chainId);
          break;
        default:
          console.warn(`Unknown event type: ${events_type}`);
      }
    }
  }

  // Process WillActivated last — after SmValidated — so notifications arrive in logical order
  for (const event of deferredWillActivated) {
    await handleWillActivated(event, chainId);
  }
}
