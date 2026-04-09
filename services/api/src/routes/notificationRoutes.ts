import { Router } from "express";
import { verifyToken } from "../middlewares/authMiddleware";
import { authorizeNotificationOwner } from "../middlewares/authorizationMiddleware";
import { ROUTES } from "../utils/constants";
import {
  handleToggleRead,
  handleMarkAllRead,
  handleDeleteNotification,
  handleDeleteAllNotifications,
} from "../controllers/notificationController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notification management
 */

router.use(verifyToken);

/**
 * @swagger
 * /notifications/{notifId}/read:
 *   patch:
 *     summary: Toggle the read status of a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notifId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Read status toggled
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
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Notification not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  ROUTES.NOTIFICATIONS.MARK_READ,
  authorizeNotificationOwner,
  handleToggleRead,
);

/**
 * @swagger
 * /notifications/read/all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
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
router.patch(ROUTES.NOTIFICATIONS.MARK_ALL_READ, handleMarkAllRead);

/**
 * @swagger
 * /notifications/{notifId}:
 *   delete:
 *     summary: Delete a single notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notifId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification deleted
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
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Notification not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  ROUTES.NOTIFICATIONS.DELETE_ONE,
  authorizeNotificationOwner,
  handleDeleteNotification,
);

/**
 * @swagger
 * /notifications/:
 *   delete:
 *     summary: Delete all notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications deleted
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
router.delete(ROUTES.NOTIFICATIONS.DELETE_ALL, handleDeleteAllNotifications);

export default router;
