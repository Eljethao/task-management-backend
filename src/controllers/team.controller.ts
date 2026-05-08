import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Team } from '../models/Team';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  leadId: z.string().optional().nullable(),
  memberIds: z.array(z.string()).optional(),
});

const updateSchema = createSchema.partial();

export const getTeams = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teams = await Team.find()
      .populate('leadId', 'name email role')
      .populate('memberIds', 'name email role')
      .sort({ name: 1 });
    res.json({ success: true, data: { teams } });
  } catch (err) {
    next(err);
  }
};

export const getTeamById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('leadId', 'name email role')
      .populate('memberIds', 'name email role department');
    if (!team) return next(new AppError('Team not found', 404));
    res.json({ success: true, data: { team } });
  } catch (err) {
    next(err);
  }
};

export const createTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = createSchema.parse(req.body);
    const team = await Team.create(body);
    res.status(201).json({ success: true, data: { team } });
  } catch (err) {
    next(err);
  }
};

export const updateTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = updateSchema.parse(req.body);
    const team = await Team.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!team) return next(new AppError('Team not found', 404));
    res.json({ success: true, data: { team } });
  } catch (err) {
    next(err);
  }
};

export const deleteTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) return next(new AppError('Team not found', 404));
    res.json({ success: true, message: 'Team deleted' });
  } catch (err) {
    next(err);
  }
};
