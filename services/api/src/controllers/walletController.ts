import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  getUserWallets,
  addWallet,
  removeWallet,
  updateWalletLabel,
} from '../services/walletService';
import { asyncHandler } from '../middlewares/errorMiddleware';

/**
 * Get all wallets for current user
 */
export const handleGetWallets = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const wallets = await getUserWallets(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: { wallets },
    });
  }
);

/**
 * Add new wallet to account
 */
export const handleAddWallet = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { walletAddress, signature, message, label } = req.body;

    const wallet = await addWallet({
      userId,
      walletAddress,
      signature,
      message,
      label,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Wallet added successfully',
      data: { wallet },
    });
  }
);

/**
 * Remove wallet from account
 */
export const handleRemoveWallet = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { walletId } = req.params;

    await removeWallet(userId, walletId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Wallet removed successfully',
    });
  }
);

/**
 * Update wallet label
 */
export const handleUpdateWalletLabel = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { walletId } = req.params;
    const { label } = req.body;

    const wallet = await updateWalletLabel(userId, walletId, label);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Wallet label updated',
      data: { wallet },
    });
  }
);
