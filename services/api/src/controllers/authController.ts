import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  signUp,
  signIn,
  checkWalletExists,
  walletSignIn,
  createAccountWithWallet,
  refreshToken,
  getMe,
} from "../services/authService";
import { asyncHandler } from "../middlewares/errorMiddleware";

/**
 * Sign up controller
 */
export const handleSignUp = asyncHandler(
  async (req: Request, res: Response) => {
    const { firstName, lastName, email, phoneNo, password, confirmPassword } =
      req.body;

    const result = await signUp({
      firstName,
      lastName,
      email,
      phoneNo,
      password,
      confirmPassword,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "User created successfully",
      data: result,
    });
  },
);

/**
 * Sign in controller
 */
export const handleSignIn = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const result = await signIn({ email, password });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Sign in successful",
      data: result,
    });
  },
);

/**
 * Check if wallet exists
 */
export const handleCheckWallet = asyncHandler(
  async (req: Request, res: Response) => {
    const { walletAddress } = req.body;

    const result = await checkWalletExists(walletAddress);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },
);

/**
 * Wallet sign in controller
 */
export const handleWalletSignIn = asyncHandler(
  async (req: Request, res: Response) => {
    const { walletAddress, signature, message } = req.body;

    const result = await walletSignIn(walletAddress, signature, message);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Wallet authentication successful",
      data: result,
    });
  },
);

/**
 * Create account with wallet
 */
export const handleCreateAccountWithWallet = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      firstName,
      lastName,
      email,
      phoneNo,
      walletAddress,
      signature,
      message,
      wantToReceiveMails,
    } = req.body;

    const result = await createAccountWithWallet({
      firstName,
      lastName,
      email,
      phoneNo,
      wantToReceiveMails,
      walletAddress,
      signature,
      message,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Account created and wallet linked successfully",
      data: result,
    });
  },
);

/**
 * Refresh token controller — issues a new JWT with fresh expiry
 */
export const handleRefreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const result = await refreshToken(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },
);

/**
 * Get current user from DB (full profile)
 */
export const handleGetMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await getMe(req.user!.userId);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Authenticated user",
    data: { user },
  });
});
