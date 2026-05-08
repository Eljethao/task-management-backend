import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Initiative } from '../models/Initiative';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  quarter: z.string().min(2).max(20),
  ownerId: z.string().min(1),
  externalLink: z.string().url().nullable().optional(),
  status: z.enum(['Planned', 'In Progress', 'Done', 'On Hold']).optional(),
});

const updateSchema = createSchema.partial();
const noteSchema = z.object({ body: z.string().min(1).max(2000) });

export const getInitiatives = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { quarter, ownerId, status } = req.query;
    const filter: Record<string, unknown> = {};
    if (quarter) filter.quarter = quarter;
    if (ownerId) filter.ownerId = ownerId;
    if (status) filter.status = status;
    const initiatives = await Initiative.find(filter)
      .populate('ownerId', 'name email role')
      .populate('progressNotes.userId', 'name')
      .sort({ quarter: -1, createdAt: -1 });
    res.json({ success: true, data: { initiatives } });
  } catch (err) {
    next(err);
  }
};

export const createInitiative = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = createSchema.parse(req.body);
    const init = await Initiative.create(body);
    res.status(201).json({ success: true, data: { initiative: init } });
  } catch (err) {
    next(err);
  }
};

export const updateInitiative = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = updateSchema.parse(req.body);
    const init = await Initiative.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!init) return next(new AppError('Initiative not found', 404));
    res.json({ success: true, data: { initiative: init } });
  } catch (err) {
    next(err);
  }
};

export const deleteInitiative = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const init = await Initiative.findByIdAndDelete(req.params.id);
    if (!init) return next(new AppError('Initiative not found', 404));
    res.json({ success: true, message: 'Initiative deleted' });
  } catch (err) {
    next(err);
  }
};

export const addNote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) return next(new AppError('Unauthorized', 401));
    const { body } = noteSchema.parse(req.body);
    const init = await Initiative.findByIdAndUpdate(
      req.params.id,
      { $push: { progressNotes: { body, userId: req.user.userId, createdAt: new Date() } } },
      { new: true }
    ).populate('progressNotes.userId', 'name');
    if (!init) return next(new AppError('Initiative not found', 404));
    res.json({ success: true, data: { initiative: init } });
  } catch (err) {
    next(err);
  }
};
