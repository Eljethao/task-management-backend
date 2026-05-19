import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { Task } from '../models/Task';
import { Team } from '../models/Team';
import { exportWeeklyReport, exportMonthlyReport } from '../lib/excelExporter';
import { ReportPreset, VALID_PRESETS, resolvePresetRange } from '../lib/datePresets';

interface PopulatedAssignee { _id: { toString(): string }; name: string; role: string }
interface PopulatedProject { _id: { toString(): string }; name: string }

// ─── Weekly (sprint-based) ─────────────────────────────────────────────────────

export const downloadWeeklyReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sprintId = String(req.query.sprintId ?? '');
    if (!sprintId) return next(new AppError('sprintId is required', 400));
    const buf = await exportWeeklyReport(sprintId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="weekly-report-${sprintId}.xlsx"`);
    res.send(Buffer.from(buf as ArrayBuffer));
  } catch (err) {
    next(err);
  }
};

// ─── Monthly (date-range preset) ──────────────────────────────────────────────

export const getMonthlyReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const preset = String(req.query.preset ?? '') as ReportPreset;
    if (!VALID_PRESETS.includes(preset)) {
      return next(new AppError(`Invalid preset. Must be one of: ${VALID_PRESETS.join(', ')}`, 400));
    }
    const teamId    = req.query.teamId    ? String(req.query.teamId)    : undefined;
    const assigneeId = req.query.assigneeId ? String(req.query.assigneeId) : undefined;

    const { start, end } = resolvePresetRange(preset);

    const taskFilter: Record<string, unknown> = {
      createdAt: { $gte: start, $lte: end },
    };
    if (teamId)    taskFilter.teamId    = teamId;
    if (assigneeId) taskFilter.assigneeId = assigneeId;

    const tasks = await Task.find(taskFilter)
      .populate('assigneeId', 'name role')
      .populate('projectId', 'name')
      .sort({ assigneeId: 1, order: 1 });

    // Pivot: user → project → tasks (same structure as getWeeklyReport)
    const byUser = new Map<string, {
      user: { _id: string; name: string; role: string };
      projects: Map<string, { project: { _id: string; name: string }; tasks: typeof tasks }>;
    }>();

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

    const team = teamId ? await Team.findById(teamId).lean() : null;

    res.json({
      success: true,
      data: {
        preset,
        dateRange: { start: start.toISOString(), end: end.toISOString() },
        team,
        rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const downloadMonthlyReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const preset = String(req.query.preset ?? '') as ReportPreset;
    if (!VALID_PRESETS.includes(preset)) {
      return next(new AppError(`Invalid preset. Must be one of: ${VALID_PRESETS.join(', ')}`, 400));
    }
    const teamId     = req.query.teamId     ? String(req.query.teamId)     : undefined;
    const assigneeId = req.query.assigneeId ? String(req.query.assigneeId) : undefined;
    const buf = await exportMonthlyReport(preset, teamId, assigneeId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="monthly-report-${preset}.xlsx"`);
    res.send(Buffer.from(buf as ArrayBuffer));
  } catch (err) {
    next(err);
  }
};
