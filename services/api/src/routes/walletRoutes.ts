import { Router } from 'express';
import {
  handleGetWallets,
  handleAddWallet,
  handleRemoveWallet,
  handleUpdateWalletLabel,
} from '../controllers/walletController';
import { verifyToken } from '../middlewares/authMiddleware';
import { ROUTES } from '../utils/constants';

const router = Router();

/**
 * @route   GET /wallets
 * @desc    Get all wallets for current user
 * @access  Private
 */
router.get('/', verifyToken, handleGetWallets);

/**
 * @route   POST /wallets
 * @desc    Add new wallet to account
 * @access  Private
 */
router.post('/', verifyToken, handleAddWallet);

/**
 * @route   DELETE /wallets/:walletId
 * @desc    Remove wallet from account
 * @access  Private
 */
router.delete('/:walletId', verifyToken, handleRemoveWallet);

/**
 * @route   PATCH /wallets/:walletId/label
 * @desc    Update wallet label
 * @access  Private
 */
router.patch('/:walletId/label', verifyToken, handleUpdateWalletLabel);

export default router;
