import { PrismaClient } from "@prisma/client";
import { NotificationType } from "../substreams/interfaces/cleaned/model";

const prisma = new PrismaClient();

export async function createInAppNotification(
  notifType: NotificationType,
  willId: string,
  userId: string,
): Promise<void> {
  const content = JSON.stringify({ type: notifType });
  await prisma.notifications.create({
    data: { content, willId, userId, readStatus: false },
  });
  console.log(`[NotificationService] ${notifType} → user ${userId}`);
}

export async function getNotificationsForUser(userId: string) {
  return prisma.notifications.findMany({
    where: { userId },
    orderBy: { notifId: "desc" },
    select: {
      notifId: true,
      content: true,
      willId: true,
      userId: true,
      readStatus: true,
      will: {
        select: {
          willName: true,
          wallet: { select: { user: { select: { userId: true } } } },
        },
      },
    },
  });
}
