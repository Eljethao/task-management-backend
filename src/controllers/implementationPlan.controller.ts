import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { ImplementationPlan } from '../models/ImplementationPlan';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const PRIVILEGED_ROLES = ['Admin', 'Project Manager', 'Lead Team'];

const subTaskSchema = z.object({
  title:       z.string().min(1).max(500),
  description: z.string().optional(),
  assigned:    z.string().optional(),
  startMonth:  z.number().int().min(1).max(36).nullable().optional(),
  endMonth:    z.number().int().min(1).max(36).nullable().optional(),
});

const planTaskSchema = z.object({
  number:      z.string().max(20).optional(),
  title:       z.string().min(1).max(500),
  description: z.string().optional(),
  assigned:    z.string().optional(),
  startMonth:  z.number().int().min(1).max(36).nullable().optional(),
  endMonth:    z.number().int().min(1).max(36).nullable().optional(),
  subtasks:    z.array(subTaskSchema).optional(),
});

const phaseSchema = z.object({
  phaseName:  z.string().min(1).max(100),
  phaseLabel: z.string().max(200).optional(),
  tasks:      z.array(planTaskSchema).optional(),
});

const planSchema = z.object({
  projectId:   z.string().min(1),
  title:       z.string().min(1).max(500),
  totalMonths: z.number().int().min(1).max(36).optional(),
  phases:      z.array(phaseSchema).optional(),
});

export const getPlans = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.query;
    const filter: Record<string, unknown> = {};
    if (projectId) filter.projectId = projectId;
    const plans = await ImplementationPlan.find(filter).sort({ createdAt: 1 });
    res.json({ success: true, data: { plans } });
  } catch (err) {
    next(err);
  }
};

export const getPlanById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const plan = await ImplementationPlan.findById(req.params.id);
    if (!plan) return next(new AppError('Plan not found', 404));
    res.json({ success: true, data: { plan } });
  } catch (err) {
    next(err);
  }
};

export const createPlan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!PRIVILEGED_ROLES.includes(req.user?.role ?? '')) {
      return next(new AppError('Not authorized', 403));
    }
    const body = planSchema.parse(req.body);
    const plan = await ImplementationPlan.create(body);
    res.status(201).json({ success: true, data: { plan } });
  } catch (err) {
    next(err);
  }
};

export const updatePlan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!PRIVILEGED_ROLES.includes(req.user?.role ?? '')) {
      return next(new AppError('Not authorized', 403));
    }
    const body = planSchema.omit({ projectId: true }).partial().parse(req.body);
    const plan = await ImplementationPlan.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!plan) return next(new AppError('Plan not found', 404));
    res.json({ success: true, data: { plan } });
  } catch (err) {
    next(err);
  }
};

export const deletePlan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!PRIVILEGED_ROLES.includes(req.user?.role ?? '')) {
      return next(new AppError('Not authorized', 403));
    }
    const plan = await ImplementationPlan.findByIdAndDelete(req.params.id);
    if (!plan) return next(new AppError('Plan not found', 404));
    res.json({ success: true, message: 'Plan deleted' });
  } catch (err) {
    next(err);
  }
};
