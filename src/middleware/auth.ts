import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload, UserRole } from '../types';
import { AppError } from './errorHandler';

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET ?? 'fallback-secret';
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
};
