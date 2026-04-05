import { PrismaClient } from '@prisma/client';
import { ConflictError, NotFoundError, BadRequestError } from '../utils/errors';
import { verifyWalletSignature, validateMessageTimestamp, validateWalletAddress } from '../utils/crypto';

const prisma = new PrismaClient();

interface WalletResponse {
  walletId: string;
  address: string;
  label?: string | null;
  createdAt: Date;
}

interface WalletRemovalEligibilityResponse {
  canRemove: boolean;
  obstacles: {
    ownedDeployedWills: string[];
    secondaryMemberWills: string[];
  };
}

/**
 * Get all wallets for a user
 */
export async function getUserWallets(userId: string): Promise<WalletResponse[]> {
  const wallets = await prisma.wallet.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' }
  });

  return wallets.map(wallet => ({
    walletId: wallet.walletId,
    address: wallet.address,
    label: wallet.label,
    createdAt: wallet.createdAt,
  }));
}

/**
 * Add a new wallet to user account
 */
export async function addWallet(data: {
  userId: string;
  walletAddress: string;
  signature: string;
  message: string;
  label?: string;
}): Promise<WalletResponse> {
  const { userId, walletAddress, signature, message, label } = data;

  validateWalletAddress(walletAddress);

  verifyWalletSignature(message, signature, walletAddress);

  validateMessageTimestamp(message);

  const existingWallet = await prisma.wallet.findUnique({
    where: { address: walletAddress.toLowerCase() },
  });

  if (existingWallet) {
    if (existingWallet.userId === userId) {
      throw new ConflictError('This wallet is already linked to your account');
    }
    throw new ConflictError('This wallet is already linked to another account');
  }

  const wallet = await prisma.wallet.create({
    data: {
      address: walletAddress.toLowerCase(),
      label,
      userId,
    },
  });

  return {
    walletId: wallet.walletId,
    address: wallet.address,
    label: wallet.label,
    createdAt: wallet.createdAt,
  };
}

/**
 * Check if a wallet can be removed from user account
 * A wallet can be removed only if:
 * - It is not associated with any deployed wills (as owner)
 * - It is not associated with any deployed wills (as secondary member)
 */
export async function checkWalletRemovalEligibility(
  userId: string,
  walletId: string,
): Promise<WalletRemovalEligibilityResponse> {
  const wallet = await prisma.wallet.findUnique({
    where: { walletId },
  });

  if (!wallet) {
    throw new NotFoundError('Wallet not found');
  }

  if (wallet.userId !== userId) {
    throw new NotFoundError('Wallet not found');
  }

  const walletAddress = wallet.address.toLowerCase();

  // 1. Find all deployed wills owned by this wallet
  const ownedDeployedWills = await prisma.will.findMany({
    where: {
      walletAddress: walletAddress,
      isDeletedByUser: false,
    },
    select: { willName: true },
  });

  // 2. Find all deployed wills where this wallet is a secondary member
  const secondaryMemberWills = await prisma.secondaryMember.findMany({
    where: {
      AND: [
        {
          OR: [
            { walletAddress: walletAddress },
            { tempWalletAddress: walletAddress },
          ],
        },
        {
          will: {
            isDeletedByUser: false,
          },
        },
      ],
    },
    include: {
      will: {
        select: { willName: true },
      },
    },
  });

  const canRemove = ownedDeployedWills.length === 0 && secondaryMemberWills.length === 0;

  return {
    canRemove,
    obstacles: {
      ownedDeployedWills: ownedDeployedWills.map((w) => w.willName),
      secondaryMemberWills: secondaryMemberWills.map((sm) => sm.will.willName),
    },
  };
}

/**
 * Remove wallet from user account
 */
export async function removeWallet(userId: string, walletId: string): Promise<void> {
  const wallet = await prisma.wallet.findUnique({
    where: { walletId },
  });

  if (!wallet) {
    throw new NotFoundError('Wallet not found');
  }

  if (wallet.userId !== userId) {
    throw new NotFoundError('Wallet not found');
  }

  // Don't allow removing the last wallet
  const userWallets = await prisma.wallet.findMany({
    where: { userId }
  });

  if (userWallets.length === 1) {
    throw new BadRequestError('Cannot remove the last wallet from your account');
  }

  await prisma.wallet.delete({
    where: { walletId },
  });
}

/**
 * Update wallet label
 */
export async function updateWalletLabel(
  userId: string,
  walletId: string,
  label: string
): Promise<WalletResponse> {
  const wallet = await prisma.wallet.findUnique({
    where: { walletId },
  });

  if (!wallet) {
    throw new NotFoundError('Wallet not found');
  }

  if (wallet.userId !== userId) {
    throw new NotFoundError('Wallet not found');
  }

  const updatedWallet = await prisma.wallet.update({
    where: { walletId },
    data: { label },
  });

  return {
    walletId: updatedWallet.walletId,
    address: updatedWallet.address,
    label: updatedWallet.label,
    createdAt: updatedWallet.createdAt,
  };
}

export { prisma };
