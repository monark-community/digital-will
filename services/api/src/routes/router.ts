import { Router } from 'express';
import authRoutes from './authRoutes';
import { ROUTES } from '../utils/constants';

const router = Router();

/**
 * Central route configuration
 * All route modules are registered here
 */

// Authentication routes
router.use(ROUTES.AUTH.BASE, authRoutes);

// Future routes
// router.use(ROUTES.USERS.BASE, userRoutes);
// router.use(ROUTES.WILLS.BASE, willRoutes);

export default router;