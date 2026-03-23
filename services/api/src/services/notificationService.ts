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
