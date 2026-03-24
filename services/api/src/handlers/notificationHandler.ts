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
  sendWillCanceledToUnregisteredSm,
  sendSmRemovedToUnregisteredSm,
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
import { AWAIT_DELAYS_MS, RETRY_DELAYS_MS } from "../utils/constants";
import { getSmListFromChain } from "../utils/blockchain";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function warn(fn: string, smartContractAddress: string): void {
  console.warn(
    `[NotificationHandler] ${fn}: no will found for ${smartContractAddress} — skipping`,
  );
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getWillWithRetry(
  smartContractAddress: string,
): ReturnType<typeof getWillByContractAddress> {
  let will = await getWillByContractAddress(smartContractAddress);
  for (let i = 0; will === null && i < RETRY_DELAYS_MS.length; i++) {
    console.warn(
      `[NotificationHandler] will not found for ${smartContractAddress}, retrying in ${RETRY_DELAYS_MS[i]}ms (attempt ${i + 1}/${RETRY_DELAYS_MS.length})`,
    );
    await sleep(RETRY_DELAYS_MS[i]);
    will = await getWillByContractAddress(smartContractAddress);
  }
  return will;
}

async function getSmWithRetry(
  willId: string,
  smAddress: string,
): ReturnType<typeof findSecondaryMemberByAddressAndWill> {
  let sm = await findSecondaryMemberByAddressAndWill(willId, smAddress);
  for (let i = 0; sm === null && i < RETRY_DELAYS_MS.length; i++) {
    console.warn(
      `[NotificationHandler] SM not found for ${smAddress} in will ${willId}, retrying in ${RETRY_DELAYS_MS[i]}ms (attempt ${i + 1}/${RETRY_DELAYS_MS.length})`,
    );
    await sleep(RETRY_DELAYS_MS[i]);
    sm = await findSecondaryMemberByAddressAndWill(willId, smAddress);
  }
  return sm;
}

function registeredUserIds(sms: SmWithWallet[]): string[] {
  return sms.filter((sm) => sm.wallet !== null).map((sm) => sm.wallet!.userId);
}

function buildUserNotif(
  type: NotificationType,
  willName: string,
  willId: string,
  role: NotificationRecipientRole,
  smName?: string,
): UserNotification {
  const { title, message } = generateUserNotification(
    type,
    willName,
    role,
    smName,
  );
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
  smName?: string,
): Promise<void> {
  if (pmUserId) {
    const pmNotifId = await createAppNotification(
      type,
      willId,
      pmUserId,
      smName,
    );
    emitUserNotification(pmUserId, {
      ...buildUserNotif(
        type,
        willName,
        willId,
        NotificationRecipientRole.PM,
        smName,
      ),
      id: pmNotifId,
    });
    await sendEmailNotification(
      type,
      willName,
      pmUserId,
      NotificationRecipientRole.PM,
      smName,
    );
  }
  for (const userId of smUserIds) {
    const smNotifId = await createAppNotification(type, willId, userId, smName);
    emitUserNotification(userId, {
      ...buildUserNotif(
        type,
        willName,
        willId,
        NotificationRecipientRole.SM,
        smName,
      ),
      id: smNotifId,
    });
  }
  await sendEmailNotifications(
    type,
    willName,
    smUserIds,
    NotificationRecipientRole.SM,
    smName,
  );
}

// ─── Notification patterns ────────────────────────────────────────────────────

/** Notify Primary Member and Secondary Members. */
async function notifyPmAndSms(
  smartContractAddress: string,
  type: NotificationType,
): Promise<void> {
  const will = await getWillWithRetry(smartContractAddress);
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
  const will = await getWillWithRetry(smartContractAddress);
  if (!will) {
    warn("notifySmsOnly", smartContractAddress);
    return;
  }
  const sms = await getSecondaryMembersByWillId(will.willId);
  await broadcastSplit(
    will.willId,
    will.willName,
    undefined,
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
  const will = await getWillWithRetry(smartContractAddress);
  if (!will) {
    warn("notifyPmAndSmsExcluding", smartContractAddress);
    return;
  }
  const [sms, actingSm] = await Promise.all([
    getSecondaryMembersByWillIdExcluding(will.willId, excludeAddress),
    findSecondaryMemberByAddressAndWill(will.willId, excludeAddress),
  ]);
  const smName = actingSm
    ? `${actingSm.firstName} ${actingSm.lastName}`
    : undefined;
  await broadcastSplit(
    will.willId,
    will.willName,
    will.wallet?.user?.userId,
    registeredUserIds(sms),
    type,
    smName,
  );
}

async function handleSignatureRequest(
  will: { willId: string; willName: string },
  smAddress: string,
): Promise<void> {
  const userId = await findUserIdByWalletAddress(smAddress);
  if (userId) {
    // SM has a WillChain account → standard in-app + email flow
    const sigNotifId = await createAppNotification(
      NotificationType.SIGNATURE_REQUEST,
      will.willId,
      userId,
    );
    emitUserNotification(userId, {
      ...buildUserNotif(
        NotificationType.SIGNATURE_REQUEST,
        will.willName,
        will.willId,
        NotificationRecipientRole.SM,
      ),
      id: sigNotifId,
    });
    await sendEmailNotification(
      NotificationType.SIGNATURE_REQUEST,
      will.willName,
      userId,
      NotificationRecipientRole.SM,
    );
    return;
  }

  // SM has no account → find their record in this will and send the invite email
  const sm = await getSmWithRetry(will.willId, smAddress);
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

/** Notify a specific secondary member. */
async function notifySpecificSm(
  smartContractAddress: string,
  smAddress: string,
  type: NotificationType,
): Promise<void> {
  const will = await getWillWithRetry(smartContractAddress);
  if (!will) {
    warn("notifySpecificSm", smartContractAddress);
    return;
  }

  if (type === NotificationType.SIGNATURE_REQUEST) {
    await handleSignatureRequest(will, smAddress);
    return;
  }

  const userId = await findUserIdByWalletAddress(smAddress);
  if (!userId) return;

  const smTargetNotifId = await createAppNotification(
    type,
    will.willId,
    userId,
  );
  emitUserNotification(userId, {
    ...buildUserNotif(
      type,
      will.willName,
      will.willId,
      NotificationRecipientRole.SM_TARGET,
      undefined,
    ),
    id: smTargetNotifId,
  });
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
  const will = await getWillWithRetry(smartContractAddress);
  if (!will) {
    warn(`notifyOthersAndTarget[${type}]`, smartContractAddress);
    return;
  }

  const [otherSms, removedSm] = await Promise.all([
    getSecondaryMembersByWillIdExcluding(will.willId, smAddress),
    findSecondaryMemberByAddressAndWill(will.willId, smAddress),
  ]);
  const smName = removedSm
    ? `${removedSm.firstName} ${removedSm.lastName}`
    : undefined;
  await broadcastSplit(
    will.willId,
    will.willName,
    undefined,
    registeredUserIds(otherSms),
    type,
    smName,
  );

  const targetUserId = await findUserIdByWalletAddress(smAddress);
  if (targetUserId) {
    const targetNotifId = await createAppNotification(
      type,
      will.willId,
      targetUserId,
    );
    emitUserNotification(targetUserId, {
      ...buildUserNotif(
        type,
        will.willName,
        will.willId,
        NotificationRecipientRole.SM_TARGET,
      ),
      id: targetNotifId,
    });
    await sendEmailNotification(
      type,
      will.willName,
      targetUserId,
      NotificationRecipientRole.SM_TARGET,
    );
  } else if (removedSm) {
    await sendSmRemovedToUnregisteredSm(
      will.willName,
      removedSm.firstName,
      removedSm.lastName,
      removedSm.email,
    );
  }
}

// ─── Per-event exports ────────────────────────────────────────────────────────

/** All SMs desisted → will was auto-canceled → notify PM only. */
async function notifyWillAutoCanceled(will: {
  willId: string;
  willName: string;
  wallet?: { user?: { userId?: string } } | null;
}): Promise<void> {
  const pmUserId = will.wallet?.user?.userId;
  if (!pmUserId) return;
  const autoCancelNotifId = await createAppNotification(
    NotificationType.WILL_CANCELED_ALL_SM_LEFT,
    will.willId,
    pmUserId,
  );
  emitUserNotification(pmUserId, {
    ...buildUserNotif(
      NotificationType.WILL_CANCELED_ALL_SM_LEFT,
      will.willName,
      will.willId,
      NotificationRecipientRole.PM,
    ),
    id: autoCancelNotifId,
  });
  await sendEmailNotification(
    NotificationType.WILL_CANCELED_ALL_SM_LEFT,
    will.willName,
    pmUserId,
    NotificationRecipientRole.PM,
  );
}

/**
 * PM explicitly canceled the will → notify registered SMs in-app + email, and email unregistered SMs directly.
 */
async function notifyWillPmCanceled(
  will: { willId: string; willName: string },
  sms: SmWithWallet[],
): Promise<void> {
  const registeredIds = registeredUserIds(sms);
  for (const userId of registeredIds) {
    const cancelNotifId = await createAppNotification(
      NotificationType.WILL_CANCELED,
      will.willId,
      userId,
    );
    emitUserNotification(userId, {
      ...buildUserNotif(
        NotificationType.WILL_CANCELED,
        will.willName,
        will.willId,
        NotificationRecipientRole.SM,
      ),
      id: cancelNotifId,
    });
  }
  await sendEmailNotifications(
    NotificationType.WILL_CANCELED,
    will.willName,
    registeredIds,
    NotificationRecipientRole.SM,
  );

  const unregistered = sms.filter((sm) => sm.wallet === null);
  for (const sm of unregistered) {
    await sendWillCanceledToUnregisteredSm(
      will.willName,
      sm.firstName,
      sm.lastName,
      sm.email,
    );
  }
}

export async function notifyWillCanceled(
  smartContractAddress: string,
): Promise<void> {
  // Fetch all data BEFORE the sleep — will/SM records may be deleted during the wait.
  const will = await getWillWithRetry(smartContractAddress);
  if (!will) {
    warn("notifyWillCanceled", smartContractAddress);
    return;
  }
  // Fetch SMs before the sleep — will may be deleted during the wait.
  const sms = await getSecondaryMembersByWillId(will.willId);

  await sleep(AWAIT_DELAYS_MS[4]);
  const smListOnChain = await getSmListFromChain(smartContractAddress);

  if (smListOnChain.length === 0) {
    await notifyWillAutoCanceled(will);
  } else {
    await notifyWillPmCanceled(will, sms);
  }
}

export const notifyWillActivated = (smartContractAddress: string) =>
  notifyPmAndSms(smartContractAddress, NotificationType.WILL_ACTIVATED);

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

export const notifyExecuteWill = (smartContractAddress: string) =>
  notifySmsOnly(smartContractAddress, NotificationType.EXECUTE_WILL);
