import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { UnauthorizedError } from '../utils/errors';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

/**
 * Middleware to verify JWT token
 */
export function verifyToken(req: Request, res: Response, next: NextFunction) {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new UnauthorizedError('No token provided');
  }

  // Extract token (format: "Bearer <token>")
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  if (!token) {
    throw new UnauthorizedError('Invalid token format');
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      email: string;
    };

    // Attach user info to request
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expired');
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }

    throw error;
  }
}
