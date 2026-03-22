import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';
import { prisma } from '../services/authService';

/**
 * GET /api/users/me/delete-eligibility
 * Check if current user can delete their account
 */
export const checkDeleteEligibility = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.userId;
    const result = await userService.checkDeleteEligibility(userId);
    
    res.json({
      success: true,
      data: result
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
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.userId;
    
    // First, verify again that user can be deleted
    const { canDelete, obstacles } = await userService.checkDeleteEligibility(userId);
    
    if (!canDelete) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete account. You have deployed wills or are a secondary member in active wills.',
        data: { obstacles }
      });
      return;
    }
    
    // Delete the user (cascade will handle everything else)
    await prisma.user.delete({
      where: { userId }
    });
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};