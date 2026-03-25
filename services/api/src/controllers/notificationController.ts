import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../middlewares/errorMiddleware";
import { NotFoundError } from "../utils/errors";
import {
  toggleReadStatus,
  markAllRead,
  deleteNotification,
  deleteAllNotifications,
} from "../services/notificationService";

export const handleToggleRead = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { notifId } = req.params;
    const found = await toggleReadStatus(notifId, userId);
    if (!found) throw new NotFoundError("Notification not found");
    res.status(StatusCodes.OK).json({ success: true });
  },
);

export const handleMarkAllRead = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    await markAllRead(userId);
    res.status(StatusCodes.OK).json({ success: true });
  },
);

export const handleDeleteNotification = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { notifId } = req.params;
    const found = await deleteNotification(notifId, userId);
    if (!found) throw new NotFoundError("Notification not found");
    res.status(StatusCodes.OK).json({ success: true });
  },
);

export const handleDeleteAllNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    await deleteAllNotifications(userId);
    res.status(StatusCodes.OK).json({ success: true });
  },
);
