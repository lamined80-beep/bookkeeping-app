import { Response, NextFunction } from 'express';
import { AuthRequest, JWTPayload } from '../types/index.js';
import { verifyToken } from '../utils/jwt.js';

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization token',
      });
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}

export function requireOwner(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'OWNER') {
    res.status(403).json({
      success: false,
      error: 'This action requires owner privileges',
    });
    return;
  }
  next();
}

export function requireAccountant(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'ACCOUNTANT' && req.user?.role !== 'OWNER') {
    res.status(403).json({
      success: false,
      error: 'This action requires accountant or owner privileges',
    });
    return;
  }
  next();
}
