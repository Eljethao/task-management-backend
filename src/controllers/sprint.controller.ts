import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Sprint, ISprint } from '../models/Sprint';
import { Task } from '../models/Task';
import { Team } from '../models/Team';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

const createSchema = z.object({
  name: z.string().min(1).max(120),
  weekNumber: z.number().int().min(1).max(53),
  year: z.number().int().min(2020).max(2100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  teamId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

export const getSprints = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { year, teamId, isActive } = req.query;
    const filter: Record<string, unknown> = {};
    if (year) filter.year = Number(year);
    if (teamId) filter.teamId = teamId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const sprints = await Sprint.find(filter)
      .populate('teamId', 'name')
      .sort({ year: -1, weekNumber: -1 });
    res.json({ success: true, data: { sprints } });
  } catch (err) {
    next(err);
  }
};

export const createSprint = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = createSchema.parse(req.body);
    const sprint = await Sprint.create(body);
    res.status(201).json({ success: true, data: { sprint } });
  } catch (err) {
    next(err);
  }
};

export const updateSprint = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = updateSchema.parse(req.body);
    const sprint = await Sprint.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!sprint) return next(new AppError('Sprint not found', 404));
    res.json({ success: true, data: { sprint } });
  } catch (err) {
    next(err);
  }
};

export const deleteSprint = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sprint = await Sprint.findByIdAndDelete(req.params.id);
    if (!sprint) return next(new AppError('Sprint not found', 404));
    res.json({ success: true, message: 'Sprint deleted' });
  } catch (err) {
    next(err);
  }
};

interface PopulatedAssignee { _id: { toString(): string }; name: string; role: string }
interface PopulatedProject { _id: { toString(): string }; name: string }

/**
 * Pivot a sprint's tasks into the Excel-style weekly report:
 *   rows = team members
 *   per row = projects -> tasks
 *   plus per-row totals (done/in-progress/blocked/to-do).
 */
export const getWeeklyReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sprintId, teamId, weekNumber, year } = req.query;
    let sprint: ISprint | null = null;

    if (sprintId) {
      sprint = await Sprint.findById(String(sprintId));
    } else if (weekNumber && year) {
      const filter: Record<string, unknown> = {
        weekNumber: Number(weekNumber),
        year: Number(year),
      };
      if (teamId) filter.teamId = teamId;
      sprint = await Sprint.findOne(filter);
    }

    if (!sprint) return next(new AppError('Sprint not found', 404));

    const team = sprint.teamId ? await Team.findById(sprint.teamId) : null;
    const taskFilter: Record<string, unknown> = { sprintId: sprint._id };
    if (sprint.teamId) taskFilter.teamId = sprint.teamId;

    const tasks = await Task.find(taskFilter)
      .populate('assigneeId', 'name role')
      .populate('projectId', 'name')
      .sort({ 'assigneeId.name': 1, order: 1 });

    const byUser = new Map<string, { user: { _id: string; name: string; role: string }; projects: Map<string, { project: { _id: string; name: string }; tasks: typeof tasks }> }>();
    for (const t of tasks) {
      const a = t.assigneeId as unknown as PopulatedAssignee | null;
      const p = t.projectId as unknown as PopulatedProject | null;
      if (!a || !p) continue;
      const userKey = a._id.toString();
      if (!byUser.has(userKey)) {
        byUser.set(userKey, {
          user: { _id: userKey, name: a.name, role: a.role },
          projects: new Map(),
        });
      }
      const u = byUser.get(userKey)!;
      const projKey = p._id.toString();
      if (!u.projects.has(projKey)) {
        u.projects.set(projKey, { project: { _id: projKey, name: p.name }, tasks: [] as typeof tasks });
      }
      u.projects.get(projKey)!.tasks.push(t);
    }

    const rows = Array.from(byUser.values()).map((u) => {
      const allTasks = Array.from(u.projects.values()).flatMap((p) => p.tasks);
      return {
        user: u.user,
        projects: Array.from(u.projects.values()),
        totals: {
          total: allTasks.length,
          done: allTasks.filter((t) => t.status === 'Done').length,
          inProgress: allTasks.filter((t) => t.status === 'In Progress').length,
          blocked: allTasks.filter((t) => !!t.blockedReason).length,
          toDo: allTasks.filter((t) => t.status === 'To Do').length,
        },
      };
    });

    res.json({ success: true, data: { sprint, team, rows } });
  } catch (err) {
    next(err);
  }
};
