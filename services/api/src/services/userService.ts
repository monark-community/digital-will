import { PrismaClient } from "@prisma/client";
import { NotFoundError } from '../utils/errors';
import { SMState } from "../substreams/interfaces/cleaned/model";

const prisma = new PrismaClient();

interface DeleteEligibilityResponse {
  canDelete: boolean;
  obstacles: {
    ownedDeployedWills: string[];
    secondaryMemberWills: string[];
  };
}
/**
 * Check if a user can delete their account
 * A user can delete their account only if:
 * - They have no deployed wills (as owner)
 * - They are not a secondary member in any deployed will
 */
export async function checkDeleteEligibility(userId: string): Promise<DeleteEligibilityResponse> {
  // 1. Find all deployed wills where the user is the owner
  // A user is owner of a will if they own the wallet that deployed it
  // We need to find wallets belonging to this user, then find wills from those wallets
  const userWallets = await prisma.wallet.findMany({
    where: { userId },
    select: { address: true }
  });

  const walletAddresses = userWallets.map(w => w.address);

  const ownedDeployedWills = await prisma.will.findMany({
    where: {
      walletAddress: { in: walletAddresses }
    },
    select: { willName: true }
  });

  // 2. Find all deployed wills where the user is a secondary member
  const user = await prisma.user.findUnique({
    where: { userId },
    select: { email: true }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const secondaryMemberWills = await prisma.secondaryMember.findMany({
    where: {
      AND: [
        { walletAddress: { in: walletAddresses } },
        { email: user.email },
      ]
    },
    include: {
      will: {
        select: { willName: true }
      }
    }
  });

  const canDelete = ownedDeployedWills.length === 0 && secondaryMemberWills.length === 0;

  return {
    canDelete,
    obstacles: {
      ownedDeployedWills: ownedDeployedWills.map(w => w.willName),
      secondaryMemberWills: secondaryMemberWills.map(sm => sm.will.willName)
    }
  };
}

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
