import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";
import { getProvider } from "../utils/blockchain";
import { getWillByContractAddress } from "./willService";
import { notifyExecuteWill } from "../handlers/notificationHandler";
import {
  PROTECTION_PERIOD_POLLER_INTERVAL_MS,
  RETRY_DELAYS_MS,
} from "../utils/constants";

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const prisma = new PrismaClient();

const EXECUTION_TS_ABI = [
  "function executionTimeStampS() view returns (uint256)",
];

/**
 * Reads executionTimeStampS from the contract and creates/updates the timer in DB.
 * Retries with exponential backoff if the value is not yet set on-chain (handles
 * the single-SM case where DEATH_DECLARED auto-confirms before the timestamp is readable).
 * Called on DEATH_DECLARED and DEATH_CONFIRMED events.
 */
export async function upsertProtectionPeriodTimer(
  contractAddress: string,
): Promise<void> {
  const will = await getWillByContractAddress(contractAddress);
  if (!will) return;

  const provider = getProvider();
  const contract = new ethers.Contract(
    ethers.getAddress(contractAddress),
    EXECUTION_TS_ABI,
    provider,
  );

  let rawTs: bigint = await contract.executionTimeStampS();
  for (let i = 0; rawTs === 0n && i < RETRY_DELAYS_MS.length; i++) {
    console.warn(
      `[ProtectionPeriodTimer] executionTimeStampS is 0 for will ${will.willId}, retrying in ${RETRY_DELAYS_MS[i]}ms (attempt ${i + 1}/${RETRY_DELAYS_MS.length})`,
    );
    await sleep(RETRY_DELAYS_MS[i]);
    rawTs = await contract.executionTimeStampS();
  }

  if (rawTs === 0n) {
    console.warn(
      `[ProtectionPeriodTimer] Could not read executionTimeStampS for will ${will.willId} after all retries — timer not set`,
    );
    return;
  }

  const expiresAt = new Date(Number(rawTs) * 1000);
  await prisma.protectionPeriodTimer.upsert({
    where: { willId: will.willId },
    create: { willId: will.willId, expiresAt, fired: false },
    update: { expiresAt, fired: false },
  });

  console.log(
    `[ProtectionPeriodTimer] Timer set for will ${will.willId} → expires ${expiresAt.toISOString()}`,
  );
}

/**
 * Cancels the timer (veto exercised, will canceled, will executed).
 */
export async function cancelProtectionPeriodTimer(
  contractAddress: string,
): Promise<void> {
  const will = await getWillByContractAddress(contractAddress);
  if (!will) return;

  await prisma.protectionPeriodTimer.deleteMany({
    where: { willId: will.willId },
  });

  console.log(
    `[ProtectionPeriodTimer] Timer cancelled for will ${will.willId}`,
  );
}

/**
 * Poller: fetches all unfired timers and checks if they've expired on-chain.
 * Re-reads executionTimeStampS from blockchain each cycle in case it was updated.
 */
async function checkExpiredTimers(): Promise<void> {
  const timers = await prisma.protectionPeriodTimer.findMany({
    where: { fired: false },
    include: { will: true },
  });

  const provider = getProvider();
  const contract = (contractAddress: string) =>
    new ethers.Contract(contractAddress, EXECUTION_TS_ABI, provider);

  for (const timer of timers) {
    try {
      // Re-read the timestamp from blockchain in case it changed
      const contractAddress = timer.will.contractAddressInBlockchain;
      const rawTs: bigint =
        await contract(contractAddress).executionTimeStampS();
      const nowSec = Math.floor(Date.now() / 1000);

      if (rawTs === 0n) {
        // Timestamp was cleared (veto/cancelled) — cancel timer
        await prisma.protectionPeriodTimer.update({
          where: { timerId: timer.timerId },
          data: { fired: true },
        });
        continue;
      }

      const expiresAtSec = Number(rawTs);
      if (expiresAtSec <= nowSec) {
        // Timer has expired!
        console.log(
          `[ProtectionPeriodTimer] Firing EXECUTE_WILL for will ${timer.willId} (expiry: ${expiresAtSec}, now: ${nowSec})`,
        );
        await notifyExecuteWill(contractAddress);
        await prisma.protectionPeriodTimer.update({
          where: { timerId: timer.timerId },
          data: { fired: true },
        });
      } else {
        // Update the expiresAt in DB to match the latest blockchain value
        const newExpiresAt = new Date(expiresAtSec * 1000);
        if (newExpiresAt.getTime() !== timer.expiresAt.getTime()) {
          await prisma.protectionPeriodTimer.update({
            where: { timerId: timer.timerId },
            data: { expiresAt: newExpiresAt },
          });
          console.log(
            `[ProtectionPeriodTimer] Updated timer for will ${timer.willId} → expires ${newExpiresAt.toISOString()}`,
          );
        }
      }
    } catch (err) {
      console.error(
        `[ProtectionPeriodTimer] Error checking timer ${timer.timerId}:`,
        err,
      );
    }
  }
}

/**
 * Starts the background poller. Call once at server startup.
 */
export function startProtectionPeriodPoller(): void {
  // Immediate first run — catches timers missed during downtime
  checkExpiredTimers().catch(console.error);

  setInterval(() => {
    checkExpiredTimers().catch(console.error);
  }, PROTECTION_PERIOD_POLLER_INTERVAL_MS);

  const intervalMs = PROTECTION_PERIOD_POLLER_INTERVAL_MS;
  const intervalLabel = intervalMs === 60000 ? "1m" : `${intervalMs / 1000}s`;
  console.log(
    `[ProtectionPeriodTimer] Poller started (interval: ${intervalLabel})`,
  );
}
