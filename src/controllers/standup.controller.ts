import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Standup } from '../models/Standup';
import { StandupComment } from '../models/StandupComment';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const PRIVILEGED_ROLES = ['Admin', 'Project Manager'];

const createSchema = z.object({
  projectId: z.string(),
  yesterday: z.string().min(1),
  today: z.string().min(1),
  blockers: z.string().optional(),
});

export const getStandups = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, userId, date } = req.query;
    const filter: Record<string, unknown> = {};

    if (projectId) filter.projectId = projectId;
    if (date) {
      const d = new Date(date as string);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      filter.date = { $gte: start, $lte: end };
    }

    // Non-privileged roles can only see their own standups
    const isPrivileged = PRIVILEGED_ROLES.includes(req.user?.role ?? '');
    if (!isPrivileged) {
      filter.userId = req.user?.userId;
    } else if (userId) {
      filter.userId = userId;
    }

    const standups = await Standup.find(filter)
      .populate('userId', 'name email role department')
      .populate('projectId', 'name')
      .sort({ date: -1 });

    res.json({ success: true, data: { standups } });
  } catch (err) {
    next(err);
  }
};

export const getTodayStandup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));

    const standup = await Standup.findOne({
      userId: req.user?.userId,
      date: { $gte: start, $lte: end },
    });

    res.json({ success: true, data: { standup } });
  } catch (err) {
    next(err);
  }
};

export const createStandup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = createSchema.parse(req.body);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await Standup.findOne({
      userId: req.user?.userId,
      projectId: body.projectId,
      date: { $gte: today },
    });

    if (existing) {
      return next(new AppError('Standup already submitted for today', 409));
    }

    const standup = await Standup.create({
      ...body,
      userId: req.user?.userId,
      date: new Date(),
    });

    res.status(201).json({ success: true, data: { standup } });
  } catch (err) {
    next(err);
  }
};

export const updateStandup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const standup = await Standup.findById(req.params.id);
    if (!standup) return next(new AppError('Standup not found', 404));

    if (standup.userId.toString() !== req.user?.userId && req.user?.role !== 'Admin') {
      return next(new AppError('Cannot edit another user\'s standup', 403));
    }

    Object.assign(standup, req.body);
    await standup.save();

    res.json({ success: true, data: { standup } });
  } catch (err) {
    next(err);
  }
};

export const getStandupComments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const standup = await Standup.findById(req.params.id);
    if (!standup) return next(new AppError('Standup not found', 404));

    const comments = await StandupComment.find({ standupId: req.params.id })
      .populate('userId', 'name email role')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: { comments } });
  } catch (err) {
    next(err);
  }
};

export const addStandupComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { body } = req.body;
    if (!body || typeof body !== 'string' || !body.trim()) {
      return next(new AppError('Comment body is required', 400));
    }

    const standup = await Standup.findById(req.params.id);
    if (!standup) return next(new AppError('Standup not found', 404));

    const comment = await StandupComment.create({
      standupId: req.params.id,
      userId: req.user?.userId,
      body: body.trim(),
    });

    const populated = await comment.populate('userId', 'name email role');
    res.status(201).json({ success: true, data: { comment: populated } });
  } catch (err) {
    next(err);
  }
};
