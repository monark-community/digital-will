import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { handleSignUp, handleSignIn } from "../controllers/authController";
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
 * @route   GET /auth/me
 * @desc    Get current user info (protected route example)
 * @access  Private
 */
router.get(ROUTES.AUTH.ME, verifyToken, (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Authenticated user",
    data: {
      user: req.user,
    },
  });
});

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

export default router;
