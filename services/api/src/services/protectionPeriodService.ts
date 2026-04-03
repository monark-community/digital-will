import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";
import { getProvider } from "../utils/blockchain";
import { getWillByContractAddress } from "./willService";
import { getSecondaryMembersByWillId } from "./secondaryMemberService";
import { notifyExecuteWill } from "../handlers/notificationHandler";
import { createInAppNotification } from "./notificationService";
import { sendEmailNotification } from "./emailService";
import {
  PROTECTION_PERIOD_POLLER_INTERVAL_MS,
  PROTECTION_PERIOD_REMINDER_INTERVAL_MS,
  REMINDER_POLLER_CHECK_INTERVAL_MS,
  REMINDER_POLLER_STARTUP_DELAY_MS,
  SM_STATE_DECLARED_DEATH,
  MS_PER_SECOND,
  MS_PER_MINUTE,
  MS_PER_DAY,
} from "../utils/constants";
import { retryWithBackoff } from "../utils/helpers";
import {
  NotificationType,
  NotificationRecipientRole,
} from "../substreams/interfaces/cleaned/model";
import { generateUserNotification } from "../utils/userNotificationGenerator";
import { emitUserNotification } from "../gateways/userNotificationGateway";

const prisma = new PrismaClient();

const EXECUTION_TS_ABI = [
  "function executionTimeStampS() view returns (uint256)",
];

const WILL_SM_ABI = [
  "function getSmList() view returns (address[])",
  "function getDetailedSm(address) view returns (tuple(uint8 state, uint8 votePower))",
];

const isProduction = process.env.NODE_ENV === "production";

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

  const rawTs = await retryWithBackoff(
    () => contract.executionTimeStampS() as Promise<bigint>,
    (ts) => ts === 0n,
    `[ProtectionPeriodTimer] executionTimeStampS is 0 for will ${will.willId},`,
  );

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

// ─── Protection Period Reminder Poller ────────────────────────────────────────

function buildReminderNotif(
  willName: string,
  willId: string,
  role: NotificationRecipientRole,
) {
  const { title, message } = generateUserNotification(
    NotificationType.PROTECTION_PERIOD_REMINDER,
    willName,
    role,
  );
  return {
    type: NotificationType.PROTECTION_PERIOD_REMINDER,
    role,
    title,
    message,
    willId,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Sends an in-app reminder (+ email in production) to a single user.
 */
async function sendReminder(
  userId: string,
  willId: string,
  willName: string,
  role: NotificationRecipientRole,
): Promise<void> {
  const type = NotificationType.PROTECTION_PERIOD_REMINDER;
  const notifId = await createInAppNotification(type, willId, userId);
  emitUserNotification(userId, {
    ...buildReminderNotif(willName, willId, role),
    id: notifId,
  });
  if (isProduction) {
    await sendEmailNotification(type, willName, userId, role);
  }
}

/**
 * Returns the user IDs of registered SMs who have NOT yet declared death on-chain.
 */
async function getEligibleSmUserIds(
  contractAddress: string,
  willId: string,
  provider: ethers.Provider,
): Promise<string[]> {
  const contract = new ethers.Contract(
    ethers.getAddress(contractAddress),
    WILL_SM_ABI,
    provider,
  );

  const sms = await getSecondaryMembersByWillId(willId);
  const userIds: string[] = [];

  for (const sm of sms) {
    if (!sm.wallet) continue;
    const smAddress = sm.walletAddress || sm.tempWalletAddress;
    if (!smAddress) continue;
    try {
      const smInfo = await contract.getDetailedSm(ethers.getAddress(smAddress));
      if (Number(smInfo.state) === SM_STATE_DECLARED_DEATH) continue;
    } catch {
      // If we can't read state, still notify to be safe
    }
    userIds.push(sm.wallet.userId);
  }

  return userIds;
}

/**
 * For each active protection period timer due for a reminder:
 * - Notify the PM (always)
 * - Notify SMs who have NOT yet declared death (checked on-chain)
 * - Emails are sent only in production
 */
async function sendProtectionPeriodReminders(): Promise<void> {
  const cutoff = new Date(Date.now() - PROTECTION_PERIOD_REMINDER_INTERVAL_MS);

  const timers = await prisma.protectionPeriodTimer.findMany({
    where: {
      fired: false,
      OR: [{ lastReminderAt: null }, { lastReminderAt: { lte: cutoff } }],
    },
    include: { will: true },
  });

  if (timers.length === 0) return;

  const provider = getProvider();

  for (const timer of timers) {
    try {
      const contractAddress = timer.will.contractAddressInBlockchain;
      const will = await getWillByContractAddress(contractAddress);
      if (!will) continue;

      const { willName, willId } = will;
      const pmUserId = will.wallet?.user?.userId;

      if (pmUserId) {
        await sendReminder(
          pmUserId,
          willId,
          willName,
          NotificationRecipientRole.PM,
        );
      }

      const smUserIds = await getEligibleSmUserIds(
        contractAddress,
        willId,
        provider,
      );
      for (const userId of smUserIds) {
        await sendReminder(
          userId,
          willId,
          willName,
          NotificationRecipientRole.SM,
        );
      }

      await prisma.protectionPeriodTimer.update({
        where: { timerId: timer.timerId },
        data: { lastReminderAt: new Date() },
      });

      console.log(
        `[ProtectionPeriodReminder] Sent reminder for will ${willId} (PM: ${pmUserId ? "yes" : "no"}, SMs: ${smUserIds.length})`,
      );
    } catch (err) {
      console.error(
        `[ProtectionPeriodReminder] Error sending reminder for timer ${timer.timerId}:`,
        err,
      );
    }
  }
}

/**
 * Starts the protection period reminder poller. Call once at server startup.
 * Sends weekly reminders in production, every minute in other environments.
 */
export function startProtectionPeriodReminderPoller(): void {
  // First run after a short delay to let the server fully start
  setTimeout(() => {
    sendProtectionPeriodReminders().catch(console.error);
  }, REMINDER_POLLER_STARTUP_DELAY_MS);

  setInterval(() => {
    sendProtectionPeriodReminders().catch(console.error);
  }, REMINDER_POLLER_CHECK_INTERVAL_MS);

  const intervalMs = REMINDER_POLLER_CHECK_INTERVAL_MS;
  const intervalLabel =
    intervalMs >= MS_PER_DAY
      ? `${intervalMs / MS_PER_DAY}d`
      : intervalMs >= MS_PER_MINUTE
        ? `${intervalMs / MS_PER_MINUTE}m`
        : `${intervalMs / MS_PER_SECOND}s`;
  console.log(
    `[ProtectionPeriodReminder] Poller started (interval: ${intervalLabel}, emails: ${isProduction ? "enabled" : "disabled"})`,
  );
}
