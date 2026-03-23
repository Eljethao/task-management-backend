import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const ROLES = ['Admin', 'Developer', 'Project Manager', 'Tester', 'UXUI', 'Lead Developer'] as const;

const createSchema = z.object({
  name:       z.string().min(2).max(100),
  email:      z.string().email(),
  password:   z.string().min(6, 'Password must be at least 6 characters'),
  role:       z.enum(ROLES).default('Developer'),
  department: z.string().optional(),
});

const updateSchema = z.object({
  name:       z.string().min(2).max(100).optional(),
  department: z.string().optional(),
  role:       z.enum(ROLES).optional(),
  isActive:   z.boolean().optional(),
});

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAdmin = req.user?.role === 'Admin';
    // Admins can see all users (including inactive); managers/others see only active
    const filter = isAdmin && req.query.includeInactive === 'true' ? {} : { isActive: true };
    const users = await User.find(filter).sort({ name: 1 });
    res.json({ success: true, data: { users } });
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = createSchema.parse(req.body);
    const existing = await User.findOne({ email: body.email });
    if (existing) return next(new AppError('Email already registered', 409));

    const user = await User.create({
      name: body.name,
      email: body.email,
      passwordHash: body.password,
      role: body.role,
      department: body.department ?? '',
    });

    res.status(201).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Only admin or the user themselves can update
    const isAdmin = req.user?.role === 'Admin';
    const isSelf = req.user?.userId === req.params.id;
    if (!isAdmin && !isSelf) {
      return next(new AppError('Insufficient permissions', 403));
    }

    const body = updateSchema.parse(req.body);

    // Only admins can change roles
    if (body.role && !isAdmin) {
      return next(new AppError('Only admins can change roles', 403));
    }

    const user = await User.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!user) return next(new AppError('User not found', 404));

    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Prevent admin from deactivating themselves
    if (req.user?.userId === req.params.id) {
      return next(new AppError('Cannot deactivate your own account', 400));
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return next(new AppError('User not found', 404));
    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (err) {
    next(err);
  }
};

export const reactivateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    if (!user) return next(new AppError('User not found', 404));
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};
