import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Returns the userId linked to a wallet address, or null if not registered. */
export async function findUserIdByWalletAddress(
  address: string,
): Promise<string | null> {
  const wallet = await prisma.wallet.findUnique({ where: { address } });
  return wallet?.userId ?? null;
}

/** Returns the data needed to send an email to a user, or null if not found. */
export async function findUserById(userId: string) {
  return prisma.user.findUnique({
    where: { userId },
  });
}
