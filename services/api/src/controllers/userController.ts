import { Request, Response, NextFunction } from "express";
import * as userService from "../services/userService";
import prisma from "../lib/prisma";

/**
 * PATCH /api/users/receive-emails
 * Update email notification preference
 */
export const updateEmailNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.userId;
    const { wantToReceiveMails } = req.body;

    if (typeof wantToReceiveMails !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "wantToReceiveMails must be a boolean",
      });
    }

    const updatedUser = await userService.updateEmailNotifications(
      userId,
      wantToReceiveMails,
    );

    res.json({
      success: true,
      data: updatedUser,
      message: "Email notification preference updated",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/me/delete-eligibility
 * Check if current user can delete their account
 */
export const checkDeleteEligibility = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.userId;
    const result = await userService.checkDeleteEligibility(userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/me
 * Delete current user account
 */
export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user.userId;

    // First, verify again that user can be deleted
    const { canDelete, obstacles } =
      await userService.checkDeleteEligibility(userId);

    if (!canDelete) {
      res.status(400).json({
        success: false,
        message:
          "Cannot delete account. You have deployed wills or are a secondary member in active wills.",
        data: { obstacles },
      });
      return;
    }

    // Delete the user (cascade will handle everything else)
    await prisma.user.delete({
      where: { userId },
    });

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
