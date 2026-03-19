import {
  NotificationType,
  NotificationRecipientRole,
  UserNotification,
} from "../substreams/interfaces/cleaned/model";
import { getWillByContractAddress } from "../services/willService";
import { createInAppNotification as createAppNotification } from "../services/notificationService";
import {
  sendEmailNotification,
  sendEmailNotifications,
  sendSignatureRequestToSm,
} from "../services/emailService";
import {
  SmWithWallet,
  getSecondaryMembersByWillId,
  getSecondaryMembersByWillIdExcluding,
  findSecondaryMemberByAddressAndWill,
} from "../services/secondaryMemberService";
import { findUserIdByWalletAddress } from "../services/userService";
import { emitUserNotification } from "../gateways/userNotificationGateway";
import { generateUserNotification } from "../utils/userNotificationGenerator";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function warn(fn: string, smartContractAddress: string): void {
  console.warn(
    `[NotificationHandler] ${fn}: no will found for ${smartContractAddress} — skipping`,
  );
}

function registeredUserIds(sms: SmWithWallet[]): string[] {
  return sms.filter((sm) => sm.wallet !== null).map((sm) => sm.wallet!.userId);
}

function buildUserNotif(
  type: NotificationType,
  willName: string,
  willId: string,
  role: NotificationRecipientRole,
): UserNotification {
  const { title, message } = generateUserNotification(type, willName, role);
  return {
    type,
    role,
    title,
    message,
    willId,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Creating App notifications and sending Emails for everyone + differentiated emails: PM gets "pm" role, SMs get "sm" role.
 */
async function broadcastSplit(
  willId: string,
  willName: string,
  pmUserId: string | undefined,
  smUserIds: string[],
  type: NotificationType,
): Promise<void> {
  const allUserIds = [pmUserId, ...smUserIds].filter(Boolean) as string[];
  for (const userId of allUserIds) {
    await createAppNotification(type, willId, userId);
  }
  if (pmUserId) {
    emitUserNotification(
      pmUserId,
      buildUserNotif(type, willName, willId, NotificationRecipientRole.PM),
    );
    await sendEmailNotification(
      type,
      willName,
      pmUserId,
      NotificationRecipientRole.PM,
    );
  }
  for (const userId of smUserIds) {
    emitUserNotification(
      userId,
      buildUserNotif(type, willName, willId, NotificationRecipientRole.SM),
    );
  }
  await sendEmailNotifications(
    type,
    willName,
    smUserIds,
    NotificationRecipientRole.SM,
  );
}

/**
 * Creating App notifications and sending Emails for secondary members.
 */
async function broadcastSmsOnly(
  willId: string,
  willName: string,
  smUserIds: string[],
  type: NotificationType,
): Promise<void> {
  for (const userId of smUserIds) {
    await createAppNotification(type, willId, userId);
    emitUserNotification(
      userId,
      buildUserNotif(type, willName, willId, NotificationRecipientRole.SM),
    );
  }
  await sendEmailNotifications(
    type,
    willName,
    smUserIds,
    NotificationRecipientRole.SM,
  );
}

// ─── Notification patterns ────────────────────────────────────────────────────

/** Notify Primary Member and Secondary Members. */
async function notifyPmAndSms(
  smartContractAddress: string,
  type: NotificationType,
): Promise<void> {
  const will = await getWillByContractAddress(smartContractAddress);
  if (!will) {
    warn("notifyPmAndSms", smartContractAddress);
    return;
  }
  const sms = await getSecondaryMembersByWillId(will.willId);
  await broadcastSplit(
    will.willId,
    will.willName,
    will.wallet?.user?.userId,
    registeredUserIds(sms),
    type,
  );
}
/** Notifies all secondary members. */
async function notifySmsOnly(
  smartContractAddress: string,
  type: NotificationType,
): Promise<void> {
  const will = await getWillByContractAddress(smartContractAddress);
  if (!will) {
    warn("notifySmsOnly", smartContractAddress);
    return;
  }
  const sms = await getSecondaryMembersByWillId(will.willId);
  await broadcastSmsOnly(
    will.willId,
    will.willName,
    registeredUserIds(sms),
    type,
  );
}

/** Notify Primary Member and Secondary Members, excluding one SM. */
async function notifyPmAndSmsExcluding(
  smartContractAddress: string,
  excludeAddress: string,
  type: NotificationType,
): Promise<void> {
  const will = await getWillByContractAddress(smartContractAddress);
  if (!will) {
    warn("notifyPmAndSmsExcluding", smartContractAddress);
    return;
  }
  const sms = await getSecondaryMembersByWillIdExcluding(
    will.willId,
    excludeAddress,
  );
  await broadcastSplit(
    will.willId,
    will.willName,
    will.wallet?.user?.userId,
    registeredUserIds(sms),
    type,
  );
}

/** Notify a specific secondary member. */
async function notifySpecificSm(
  smartContractAddress: string,
  smAddress: string,
  type: NotificationType,
): Promise<void> {
  const will = await getWillByContractAddress(smartContractAddress);
  if (!will) {
    warn("notifySpecificSm", smartContractAddress);
    return;
  }

  if (type === NotificationType.SIGNATURE_REQUEST) {
    const userId = await findUserIdByWalletAddress(smAddress);
    if (userId) {
      // SM has a WillChain account → standard flow
      await createAppNotification(type, will.willId, userId);
      emitUserNotification(
        userId,
        buildUserNotif(
          type,
          will.willName,
          will.willId,
          NotificationRecipientRole.SM,
        ),
      );
      await sendEmailNotification(
        type,
        will.willName,
        userId,
        NotificationRecipientRole.SM,
      );
    } else {
      // SM has no account → find their record in this will and send the invite email
      const sm = await findSecondaryMemberByAddressAndWill(
        will.willId,
        smAddress,
      );
      if (sm) {
        await sendSignatureRequestToSm(
          will.willName,
          sm.firstName,
          sm.lastName,
          sm.email,
        );
      } else {
        console.warn(
          `[NotificationHandler] SIGNATURE_REQUEST: no SM found for address ${smAddress} in will ${will.willId}`,
        );
      }
    }
    return;
  }

  const userId = await findUserIdByWalletAddress(smAddress);
  if (!userId) return;

  await createAppNotification(type, will.willId, userId);
  emitUserNotification(
    userId,
    buildUserNotif(
      type,
      will.willName,
      will.willId,
      NotificationRecipientRole.SM_TARGET,
    ),
  );
  await sendEmailNotification(
    type,
    will.willName,
    userId,
    NotificationRecipientRole.SM_TARGET,
  );
}

/** Notify all other SMs + the target SM with a differentiated email. */
async function notifyOthersAndTarget(
  smartContractAddress: string,
  smAddress: string,
  type: NotificationType,
): Promise<void> {
  const will = await getWillByContractAddress(smartContractAddress);
  if (!will) {
    warn(`notifyOthersAndTarget[${type}]`, smartContractAddress);
    return;
  }

  const otherSms = await getSecondaryMembersByWillIdExcluding(
    will.willId,
    smAddress,
  );
  await broadcastSmsOnly(
    will.willId,
    will.willName,
    registeredUserIds(otherSms),
    type,
  );

  const targetUserId = await findUserIdByWalletAddress(smAddress);
  if (targetUserId) {
    await createAppNotification(type, will.willId, targetUserId);
    emitUserNotification(
      targetUserId,
      buildUserNotif(
        type,
        will.willName,
        will.willId,
        NotificationRecipientRole.SM_TARGET,
      ),
    );
    await sendEmailNotification(
      type,
      will.willName,
      targetUserId,
      NotificationRecipientRole.SM_TARGET,
    );
  }
}

// ─── Per-event exports ────────────────────────────────────────────────────────

export const notifyWillActivated = (smartContractAddress: string) =>
  notifyPmAndSms(smartContractAddress, NotificationType.WILL_ACTIVATED);

export const notifyWillCanceled = (smartContractAddress: string) =>
  notifySmsOnly(smartContractAddress, NotificationType.WILL_CANCELED);

export const notifySecurityPeriodUpdated = (smartContractAddress: string) =>
  notifySmsOnly(smartContractAddress, NotificationType.SECURITY_PERIOD_UPDATED);

export const notifySmValidated = (smartContractAddress: string, sm: string) =>
  notifyPmAndSmsExcluding(smartContractAddress, sm, NotificationType.SM_ADDED);

export const notifyVetoExercised = (smartContractAddress: string) =>
  notifySmsOnly(smartContractAddress, NotificationType.VETO_EXERCISED);

export const notifySmToSign = (smartContractAddress: string, sm: string) =>
  notifySpecificSm(
    smartContractAddress,
    sm,
    NotificationType.SIGNATURE_REQUEST,
  );

export const notifySmDesisted = (smartContractAddress: string, sm: string) =>
  notifyPmAndSmsExcluding(
    smartContractAddress,
    sm,
    NotificationType.SM_DESISTED,
  );

export const notifyDeathDeclared = (smartContractAddress: string, sm: string) =>
  notifyPmAndSmsExcluding(
    smartContractAddress,
    sm,
    NotificationType.DEATH_DECLARED,
  );

export const notifyDeathConfirmed = (
  smartContractAddress: string,
  sm: string,
) =>
  notifyPmAndSmsExcluding(
    smartContractAddress,
    sm,
    NotificationType.DEATH_CONFIRMED,
  );

export const notifyAssetsSwapped = (smartContractAddress: string, sm: string) =>
  notifyPmAndSmsExcluding(
    smartContractAddress,
    sm,
    NotificationType.ASSETS_SWAPPED,
  );

export const notifySmUpdated = (
  smartContractAddress: string,
  smAddress: string,
) =>
  notifySpecificSm(
    smartContractAddress,
    smAddress,
    NotificationType.SM_UPDATED,
  );

export const notifySmRemoved = (
  smartContractAddress: string,
  smAddress: string,
) =>
  notifyOthersAndTarget(
    smartContractAddress,
    smAddress,
    NotificationType.SM_REMOVED,
  );
