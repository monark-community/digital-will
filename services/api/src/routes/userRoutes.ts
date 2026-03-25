import { Router } from "express";
import { verifyToken } from "../middlewares/authMiddleware";
import { checkDeleteEligibility, deleteAccount, updateEmailNotifications } from "../controllers/userController";
import { ROUTES } from "../utils/constants";

const router = Router();

// All routes require authentication
router.use(verifyToken);

/**
 * @route   PATCH /users/receive-emails
 * @desc    Update email notification preference
 * @access  Private
 */
router.patch(ROUTES.USERS.RECEIVE_EMAILS, updateEmailNotifications);

/**
 * @route   GET /api/users/delete-eligibility
 * @desc    Check if user can delete their account
 * @access  Private
 */
router.get(ROUTES.USERS.DELETE_ELIGIBILITY, checkDeleteEligibility);

/**
 * @route   DELETE /api/users/delete
 * @desc    Delete current user account
 * @access  Private
 */
router.delete(ROUTES.USERS.DELETE, deleteAccount);

export default router;