import { Router } from 'express';
import authRoutes from './authRoutes';

const router = Router();

// NOT EVEN USED, router.ts IS USED INSTEAD, TO DELETE LATER I THINK

/**
 * Central route configuration
 * All route modules are registered here
 */

// Authentication routes
router.use('/auth', authRoutes);

// Future routes will be added here
// router.use('/users', userRoutes);
// router.use('/wills', willRoutes);
// router.use('/beneficiaries', beneficiaryRoutes);

export default router;