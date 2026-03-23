import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest, JwtPayload } from '../types';

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['Admin', 'Developer', 'Project Manager', 'Tester', 'UXUI', 'Lead Developer']).optional(),
  department: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET ?? 'fallback-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = registerSchema.parse(req.body);

    const existing = await User.findOne({ email: body.email });
    if (existing) {
      return next(new AppError('Email already registered', 409));
    }

    const user = await User.create({
      name: body.name,
      email: body.email,
      passwordHash: body.password,
      role: body.role ?? 'Developer',
      department: body.department ?? '',
    });

    const token = signToken({ userId: user._id.toString(), role: user.role, email: user.email });

    res.status(201).json({ success: true, data: { user, token } });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await User.findOne({ email: body.email }).select('+passwordHash');
    if (!user || !(await user.comparePassword(body.password))) {
      return next(new AppError('Invalid email or password', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Account is deactivated', 403));
    }

    const token = signToken({ userId: user._id.toString(), role: user.role, email: user.email });
    res.json({ success: true, data: { user, token } });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) return next(new AppError('User not found', 404));
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body as { token?: string };
    if (!token) return next(new AppError('No token provided', 400));

    const secret = process.env.JWT_SECRET ?? 'fallback-secret';
    const decoded = jwt.verify(token, secret) as JwtPayload;

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) return next(new AppError('User not found or inactive', 401));

    const newToken = signToken({ userId: user._id.toString(), role: user.role, email: user.email });
    res.json({ success: true, data: { token: newToken } });
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
};
