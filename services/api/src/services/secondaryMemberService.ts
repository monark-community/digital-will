import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

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
 * Links all SecondaryMember records that have the given tempWalletAddress to the
 * newly created wallet, by setting their walletAddress to the same value.
 * Called after a new account is created so existing SM records get the FK link.
 */
export async function linkSecondaryMembersByTempAddress(
  address: string,
): Promise<void> {
  await prisma.secondaryMember.updateMany({
    where: { tempWalletAddress: address.toLowerCase() },
    data: { walletAddress: address.toLowerCase() },
  });
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
