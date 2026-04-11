import { Request, Response, NextFunction } from "express";
import { ForbiddenError, NotFoundError } from "../utils/errors";
import { asyncHandler } from "./errorMiddleware";
import prisma from "../lib/prisma";

// ─── Contacts ────────────────────────────────────────────────────────────────

/**
 * Verify that the contact identified by :contactId belongs to the authenticated user.
 */
export const authorizeContactOwner = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const userId = req.user!.userId;
    const { contactId } = req.params;

    const contact = await prisma.contact.findUnique({
      where: { contactId },
      select: { userId: true },
    });

    if (!contact) {
      throw new NotFoundError("Contact not found");
    }

    if (contact.userId !== userId) {
      throw new ForbiddenError("You are not authorized to access this contact");
    }

    next();
  },
);

// ─── Notifications ───────────────────────────────────────────────────────────

/**
 * Verify that the notification identified by :notifId belongs to the authenticated user.
 */
export const authorizeNotificationOwner = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const userId = req.user!.userId;
    const { notifId } = req.params;

    const notification = await prisma.notifications.findUnique({
      where: { notifId },
      select: { userId: true },
    });

    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError(
        "You are not authorized to access this notification",
      );
    }

    next();
  },
);

// ─── Wills (deployed) ────────────────────────────────────────────────────────

/**
 * Verify that the deployed will identified by :willId belongs to the authenticated user
 * (via Wallet ownership).
 */
export const authorizeWillOwner = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const userId = req.user!.userId;
    const { willId } = req.params;

    const will = await prisma.will.findUnique({
      where: { willId },
      select: { walletAddress: true },
    });

    if (!will) {
      throw new NotFoundError("Will not found");
    }

    const wallet = await prisma.wallet.findFirst({
      where: { address: will.walletAddress, userId },
      select: { walletId: true },
    });

    if (!wallet) {
      throw new ForbiddenError("You are not authorized to access this will");
    }

    next();
  },
);

// ─── Draft Wills ─────────────────────────────────────────────────────────────

/**
 * Verify that the draft will identified by :willId belongs to the authenticated user
 * (via Wallet ownership).
 */
export const authorizeDraftWillOwner = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const userId = req.user!.userId;
    const { willId } = req.params;

    const draft = await prisma.draftWill.findUnique({
      where: { draftWillId: willId },
      select: { walletAddress: true },
    });

    if (!draft) {
      throw new NotFoundError("Draft will not found");
    }

    const wallet = await prisma.wallet.findFirst({
      where: { address: draft.walletAddress, userId },
      select: { walletId: true },
    });

    if (!wallet) {
      throw new ForbiddenError(
        "You are not authorized to access this draft will",
      );
    }

    next();
  },
);

// ─── Wallet ownership ────────────────────────────────────────────────────────

/**
 * Verify that the wallet address in the request body belongs to the authenticated user.
 * Used for routes that accept { walletAddress } in the body (e.g. draft creation).
 */
export const authorizeWalletOwner = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const userId = req.user!.userId;
    const walletAddress = req.body.walletAddress || req.params.walletAddress;

    if (!walletAddress) {
      next();
      return;
    }

    const wallet = await prisma.wallet.findFirst({
      where: { address: walletAddress.toLowerCase(), userId },
      select: { walletId: true },
    });

    if (!wallet) {
      throw new ForbiddenError("You are not authorized to use this wallet");
    }

    next();
  },
);
