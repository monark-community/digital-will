import { Router } from "express";
import { verifyToken } from "../middlewares/authMiddleware";
import { ROUTES } from "../utils/constants";
import {
  handleToggleRead,
  handleMarkAllRead,
  handleDeleteNotification,
  handleDeleteAllNotifications,
} from "../controllers/notificationController";

const router = Router();

router.use(verifyToken);

router.patch(ROUTES.NOTIFICATIONS.MARK_READ, handleToggleRead);
router.patch(ROUTES.NOTIFICATIONS.MARK_ALL_READ, handleMarkAllRead);
router.delete(ROUTES.NOTIFICATIONS.DELETE_ONE, handleDeleteNotification);
router.delete(ROUTES.NOTIFICATIONS.DELETE_ALL, handleDeleteAllNotifications);

export default router;
