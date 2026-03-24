// ─────────────────────────────────────────────────────────────────────────────
// Call handlers
// ─────────────────────────────────────────────────────────────────────────────

import { Willfactory_CreateWillCall } from "../interfaces/raw/factory/calls_interface";
import { mapCreateWill } from "../interfaces/cleaned/will_factory/mapper";
import { parseChainId } from "../interfaces/cleaned/utils/network";
import { notifySmToSign } from "../../handlers/notificationHandler";

export async function handleCreateWillCall(
  call: Willfactory_CreateWillCall,
  chainId: string,
): Promise<void> {
  console.log("in handleCreateWillCall");

  const chainId_parsed = parseChainId(chainId);

  const will = mapCreateWill(call, chainId_parsed);
  console.dir(will, { depth: null, colors: true });

  // Notify secondary members to sign
  for (const sm of will.newSmList) {
    await notifySmToSign(will.contractAddressInBlockchain, sm.smAddress);
  }
}
