import { PrismaClient } from "@prisma/client";
import { NotFoundError } from '../utils/errors';

const prisma = new PrismaClient();

interface DeleteEligibilityResponse {
  canDelete: boolean;
  obstacles: {
    ownedDeployedWills: string[];
    secondaryMemberWills: string[];
  };
}

/**
 * Update user's email notification preference
 */
export async function updateEmailNotifications(userId: string, wantToReceiveMails: boolean) {
  const user = await prisma.user.update({
    where: { userId },
    data: { wantToReceiveMails },
    select: {
      userId: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNo: true,
      wantToReceiveMails: true
    }
  });
  return user;
}

/**
 * Check if a user can delete their account
 * A user can delete their account only if:
 * - They have no deployed wills (as owner)
 * - They are not a secondary member in any deployed will
 */
export async function checkDeleteEligibility(userId: string): Promise<DeleteEligibilityResponse> {
  
  // 1. Find all deployed wills owned by the user
  const userWallets = await prisma.wallet.findMany({
    where: { userId },
    select: { address: true }
  });

  const walletAddresses = userWallets.map(w => w.address);

  const ownedDeployedWills = await prisma.will.findMany({
    where: {
      walletAddress: { in: walletAddresses },
      isDeletedByUser: false
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
        { will: 
          { 
            isDeletedByUser: false 
          } 
        }
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
