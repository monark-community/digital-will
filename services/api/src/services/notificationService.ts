import {
  NotificationType,
  NotificationRecipientRole,
} from "../substreams/interfaces/cleaned/model";
import { NotificationRecipientRole as PrismaRole } from "@prisma/client";
import { cleanupCanceledWill } from "./willService";
import prisma from "../lib/prisma";

const roleToPrisma: Record<NotificationRecipientRole, PrismaRole> = {
  [NotificationRecipientRole.PM]: PrismaRole.PM,
  [NotificationRecipientRole.SM]: PrismaRole.SM,
  [NotificationRecipientRole.SM_TARGET]: PrismaRole.SM_TARGET,
};

export async function createInAppNotification(
  notifType: NotificationType,
  willId: string | null,
  userId: string,
  role: NotificationRecipientRole,
  smName?: string,
  amount?: number,
): Promise<string> {
  const notif = await prisma.notifications.create({
    data: {
      notifType,
      willId,
      userId,
      recipientRole: roleToPrisma[role],
      smName: smName ?? null,
      amount: amount ?? null,
      readStatus: false,
    },
  });
  console.log(`[NotificationService] ${notifType} → user ${userId}`);
  return notif.notifId;
}

export async function getNotificationsForUser(userId: string) {
  return prisma.notifications.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      will: {
        select: {
          willName: true,
          wallet: { select: { user: { select: { userId: true } } } },
        },
      },
    },
  });
}

export async function toggleReadStatus(
  notifId: string,
  userId: string,
): Promise<boolean> {
  const notif = await prisma.notifications.findFirst({
    where: { notifId, userId },
  });
  if (!notif) return false;
  await prisma.notifications.update({
    where: { notifId },
    data: { readStatus: !notif.readStatus },
  });
  return true;
}

export async function markAllRead(userId: string): Promise<void> {
  await prisma.notifications.updateMany({
    where: { userId, readStatus: false },
    data: { readStatus: true },
  });
}

export async function deleteNotification(
  notifId: string,
  userId: string,
): Promise<boolean> {
  const notif = await prisma.notifications.findFirst({
    where: { notifId, userId },
  });
  if (!notif) return false;
  await prisma.notifications.delete({ where: { notifId } });

  // If the notification was linked to a canceled will, clean up if no notifications remain
  if (notif.willId) {
    await cleanupCanceledWill(notif.willId);
  }

  return true;
}

export async function deleteAllNotifications(userId: string): Promise<void> {
  // Collect willIds of notifications before deleting them
  const notifs = await prisma.notifications.findMany({
    where: { userId },
    select: { willId: true },
  });
  const willIds = [
    ...new Set(notifs.map((n) => n.willId).filter(Boolean)),
  ] as string[];

  await prisma.notifications.deleteMany({ where: { userId } });

  // Clean up any canceled wills that no longer have notifications
  for (const willId of willIds) {
    await cleanupCanceledWill(willId);
  }
}
