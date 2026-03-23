import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export type SmWithWallet = Prisma.SecondaryMemberGetPayload<{
  include: { wallet: true };
}>;

export async function getSecondaryMembersByWillId(
  willId: string,
): Promise<SmWithWallet[]> {
  return prisma.secondaryMember.findMany({
    where: { willId },
    include: { wallet: true },
  });
}

/**
 * Returns the secondary member of a specific will whose walletAddress or
 * tempWalletAddress matches the given address, or null if not found.
 */
export async function findSecondaryMemberByAddressAndWill(
  willId: string,
  address: string,
): Promise<SmWithWallet | null> {
  const sm = await prisma.secondaryMember.findFirst({
    where: {
      willId,
      OR: [{ walletAddress: address }, { tempWalletAddress: address }],
    },
    include: { wallet: true },
  });
  return sm ?? null;
}

/**
 * Returns all secondary members of a will excluding any member whose
 * walletAddress or tempWalletAddress matches excludeAddress.
 */
export async function getSecondaryMembersByWillIdExcluding(
  willId: string,
  excludeAddress: string,
): Promise<SmWithWallet[]> {
  const sms = await getSecondaryMembersByWillId(willId);
  return sms.filter(
    (sm) =>
      sm.walletAddress !== excludeAddress &&
      sm.tempWalletAddress !== excludeAddress,
  );
}
