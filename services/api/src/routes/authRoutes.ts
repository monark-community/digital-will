import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import {
  handleSignUp,
  handleSignIn,
  handleCheckWallet,
  handleWalletSignIn,
  handleCreateAccountWithWallet,
  handleRefreshToken,
  handleGetMe,
} from "../controllers/authController";
import { verifyToken } from "../middlewares/authMiddleware";
import {
  validateSignUp,
  validateSignIn,
} from "../middlewares/validationMiddleware";
import { asyncHandler } from "../middlewares/errorMiddleware";
import { ROUTES } from "../utils/constants";

const router = Router();

/**
 * @route   POST /auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post(ROUTES.AUTH.SIGNUP, asyncHandler(validateSignUp), handleSignUp);

/**
 * @route   POST /auth/signin
 * @desc    Sign in user and return JWT token
 * @access  Public
 */
router.post(ROUTES.AUTH.SIGNIN, asyncHandler(validateSignIn), handleSignIn);

/**
 * @route   POST /auth/wallet/check
 * @desc    Check if wallet address exists
 * @access  Public
 */
router.post(ROUTES.AUTH.WALLET_CHECK, handleCheckWallet);

/**
 * @route   POST /auth/wallet/signin
 * @desc    Sign in with wallet address
 * @access  Public
 */
router.post(ROUTES.AUTH.WALLET_SIGNIN, handleWalletSignIn);

/**
 * @route   POST /auth/wallet/create
 * @desc    Create account with wallet address
 * @access  Public
 */
router.post(ROUTES.AUTH.WALLET_CREATE, handleCreateAccountWithWallet);

/**
 * @route   GET /auth/me
 * @desc    Get current user info (protected route example)
 * @access  Private
 */
router.get(ROUTES.AUTH.ME, verifyToken, handleGetMe);

/**
 * @route   POST /auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post(ROUTES.AUTH.LOGOUT, verifyToken, (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Logged out successfully",
  });
});

/**
 * @route   POST /auth/refresh
 * @desc    Refresh JWT token (returns a new token with fresh expiry)
 * @access  Private
 */
router.post(ROUTES.AUTH.REFRESH, verifyToken, handleRefreshToken);

export default router;
