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
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and account management
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignUpRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResult'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(ROUTES.AUTH.SIGNUP, asyncHandler(validateSignUp), handleSignUp);

/**
 * @swagger
 * /auth/signin:
 *   post:
 *     summary: Sign in with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignInRequest'
 *     responses:
 *       200:
 *         description: Sign in successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResult'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(ROUTES.AUTH.SIGNIN, asyncHandler(validateSignIn), handleSignIn);

/**
 * @swagger
 * /auth/wallet/check:
 *   post:
 *     summary: Check if a wallet address is already registered
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WalletCheckRequest'
 *     responses:
 *       200:
 *         description: Wallet existence check result
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         exists:
 *                           type: boolean
 */
router.post(ROUTES.AUTH.WALLET_CHECK, handleCheckWallet);

/**
 * @swagger
 * /auth/wallet/signin:
 *   post:
 *     summary: Sign in using a wallet signature
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WalletSignInRequest'
 *     responses:
 *       200:
 *         description: Wallet authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResult'
 *       401:
 *         description: Invalid signature or wallet not registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(ROUTES.AUTH.WALLET_SIGNIN, handleWalletSignIn);

/**
 * @swagger
 * /auth/wallet/create:
 *   post:
 *     summary: Create a new account linked to a wallet
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WalletCreateAccountRequest'
 *     responses:
 *       201:
 *         description: Account created and wallet linked successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResult'
 *       400:
 *         description: Invalid signature or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email or wallet already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(ROUTES.AUTH.WALLET_CREATE, handleCreateAccountWithWallet);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user profile
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(ROUTES.AUTH.ME, verifyToken, handleGetMe);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout (invalidates the session client-side)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(ROUTES.AUTH.LOGOUT, verifyToken, (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Logged out successfully",
  });
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh JWT token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: New token issued
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         token:
 *                           type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(ROUTES.AUTH.REFRESH, verifyToken, handleRefreshToken);

export default router;
