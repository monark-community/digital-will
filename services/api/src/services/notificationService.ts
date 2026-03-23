import { PrismaClient } from "@prisma/client";
import { NotificationType } from "../substreams/interfaces/cleaned/model";

const prisma = new PrismaClient();

export async function createInAppNotification(
  notifType: NotificationType,
  willId: string | null,
  userId: string,
): Promise<void> {
  await prisma.notifications.create({
    data: { notifType, willId, userId, readStatus: false },
  });
  console.log(`[NotificationService] ${notifType} → user ${userId}`);
}

export async function getNotificationsForUser(userId: string) {
  return prisma.notifications.findMany({
    where: { userId },
    orderBy: { notifId: "desc" },
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
  return true;
}

export async function deleteAllNotifications(userId: string): Promise<void> {
  await prisma.notifications.deleteMany({ where: { userId } });
}
