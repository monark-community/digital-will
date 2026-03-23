import { Router } from "express";
import authRoutes from "./authRoutes";
import walletRoutes from "./walletRoutes";
import contactsRoutes from "./contactRoutes";
import { ROUTES } from "../utils/constants";
import willRoutes from "./willRoutes";
import notificationRoutes from "./notificationRoutes";

const router = Router();

/**
 * Central route configuration
 * All route modules are registered here
 */

// Authentication routes
router.use(ROUTES.AUTH.BASE, authRoutes);

// Wallet routes
router.use(ROUTES.WALLETS.BASE, walletRoutes);

// Contacts routes
router.use(ROUTES.CONTACTS.BASE, contactsRoutes);

// Will routes
router.use(ROUTES.WILLS.BASE, willRoutes);

// Notification routes
router.use(ROUTES.NOTIFICATIONS.BASE, notificationRoutes);

// Future routes
// router.use(ROUTES.USERS.BASE, userRoutes);

export default router;
