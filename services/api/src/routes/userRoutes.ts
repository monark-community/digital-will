import { Router } from "express";
import { verifyToken } from "../middlewares/authMiddleware";
import { checkDeleteEligibility, deleteAccount, updateEmailNotifications } from "../controllers/userController";
import { ROUTES } from "../utils/constants";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User account management
 */

// All routes require authentication
router.use(verifyToken);

/**
 * @swagger
 * /users/receive-emails:
 *   patch:
 *     summary: Update email notification preference
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wantToReceiveMails
 *             properties:
 *               wantToReceiveMails:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Email notification preference updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: wantToReceiveMails must be a boolean
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(ROUTES.USERS.RECEIVE_EMAILS, updateEmailNotifications);

/**
 * @swagger
 * /users/delete-eligibility:
 *   get:
 *     summary: Check if the current user can delete their account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Eligibility result
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
 *                         canDelete:
 *                           type: boolean
 *                         obstacles:
 *                           type: array
 *                           items:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(ROUTES.USERS.DELETE_ELIGIBILITY, checkDeleteEligibility);

/**
 * @swagger
 * /users/delete:
 *   delete:
 *     summary: Delete the current user's account
 *     description: Permanently deletes the account. The user must not have deployed wills or be a secondary member in active wills.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Cannot delete account due to active wills
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         obstacles:
 *                           type: array
 *                           items:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(ROUTES.USERS.DELETE, deleteAccount);

export default router;