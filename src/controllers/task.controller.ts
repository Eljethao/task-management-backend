import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Task } from '../models/Task';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const createSchema = z.object({
  projectId: z.string().min(1, 'projectId is required'),
  epicId: z.string().optional(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  status: z.enum(['To Do', 'In Progress', 'Code Review', 'Testing', 'Done']).optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  assigneeId: z.string().optional(),
  storyPoints: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  githubPrLink: z.string().url().optional(),
});

const updateSchema = createSchema.partial();

const statusSchema = z.object({
  status: z.enum(['To Do', 'In Progress', 'Code Review', 'Testing', 'Done']),
  order: z.number().optional(),
});

const reorderSchema = z.object({
  tasks: z.array(z.object({ id: z.string(), order: z.number(), status: z.string() })),
});

const PRIVILEGED_ROLES = ['Admin', 'Project Manager'];

export const getTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, status, assigneeId } = req.query;
    const filter: Record<string, unknown> = {};

    if (projectId) filter.projectId = projectId;
    if (status) filter.status = status;

    const isPrivileged = PRIVILEGED_ROLES.includes(req.user?.role ?? '');

    if (isPrivileged) {
      // Admin / Project Manager: can filter by any member or see all
      if (assigneeId) filter.assigneeId = assigneeId;
    } else {
      // All other roles: see only their own assigned tasks
      filter.assigneeId = req.user?.userId;
    }

    const tasks = await Task.find(filter)
      .populate('assigneeId', 'name email')
      .populate('reporterId', 'name email')
      .sort({ status: 1, order: 1 });

    res.json({ success: true, data: { tasks } });
  } catch (err) {
    next(err);
  }
};

export const getTaskById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assigneeId', 'name email')
      .populate('reporterId', 'name email')
      .populate('projectId', 'name');

    if (!task) return next(new AppError('Task not found', 404));
    res.json({ success: true, data: { task } });
  } catch (err) {
    next(err);
  }
};

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = createSchema.parse(req.body);
    const task = await Task.create({ ...body, reporterId: req.user?.userId });
    res.status(201).json({ success: true, data: { task } });
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = updateSchema.parse(req.body);
    const task = await Task.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    })
      .populate('assigneeId', 'name email')
      .populate('reporterId', 'name email');

    if (!task) return next(new AppError('Task not found', 404));
    res.json({ success: true, data: { task } });
  } catch (err) {
    next(err);
  }
};

export const updateTaskStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = statusSchema.parse(req.body);
    const task = await Task.findByIdAndUpdate(req.params.id, body, { new: true });
    if (!task) return next(new AppError('Task not found', 404));
    res.json({ success: true, data: { task } });
  } catch (err) {
    next(err);
  }
};

export const reorderTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tasks } = reorderSchema.parse(req.body);
    await Promise.all(
      tasks.map(({ id, order, status }) =>
        Task.findByIdAndUpdate(id, { order, status }, { new: true })
      )
    );
    res.json({ success: true, message: 'Tasks reordered successfully' });
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return next(new AppError('Task not found', 404));
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
};
