"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlockers = exports.getTeamWorkload = exports.getProjectOverview = exports.getDashboardMetrics = void 0;
const Task_1 = require("../models/Task");
const Project_1 = require("../models/Project");
const Standup_1 = require("../models/Standup");
const User_1 = require("../models/User");
// ─── Metrics ──────────────────────────────────────────────────────────────────
const getDashboardMetrics = async (req, res, next) => {
    try {
        const { projectId } = req.query;
        const filter = projectId ? { projectId } : {};
        const [tasksByStatus, totalTasks, totalUsers] = await Promise.all([
            Task_1.Task.aggregate([
                { $match: filter },
                { $group: { _id: '$status', count: { $sum: 1 }, storyPoints: { $sum: '$storyPoints' } } },
            ]),
            Task_1.Task.countDocuments(filter),
            User_1.User.countDocuments({ isActive: true }),
        ]);
        const done = tasksByStatus.find((s) => s._id === 'Done');
        const completionRate = totalTasks > 0 ? Math.round(((done?.count ?? 0) / totalTasks) * 100) : 0;
        res.json({
            success: true,
            data: { metrics: { totalTasks, completionRate, totalUsers, tasksByStatus } },
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getDashboardMetrics = getDashboardMetrics;
// ─── Project Portfolio Overview ───────────────────────────────────────────────
const getProjectOverview = async (_req, res, next) => {
    try {
        const projects = await Project_1.Project.find({}).lean();
        const projectIds = projects.map((p) => p._id);
        const taskStats = await Task_1.Task.aggregate([
            { $match: { projectId: { $in: projectIds } } },
            { $group: { _id: { projectId: '$projectId', status: '$status' }, count: { $sum: 1 } } },
        ]);
        const taskMap = {};
        for (const stat of taskStats) {
            const pid = stat._id.projectId.toString();
            if (!taskMap[pid])
                taskMap[pid] = {};
            taskMap[pid][stat._id.status] = stat.count;
        }
        const now = new Date();
        const overview = projects.map((project) => {
            const pid = project._id.toString();
            const byStatus = taskMap[pid] ?? {};
            const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
            const done = byStatus['Done'] ?? 0;
            const testing = (byStatus['Testing'] ?? 0) + (byStatus['Code Review'] ?? 0);
            const inProgress = byStatus['In Progress'] ?? 0;
            const toDo = byStatus['To Do'] ?? 0;
            let phase;
            if (project.status === 'Archived')
                phase = 'Archived';
            else if (project.status === 'Completed' || (total > 0 && done === total))
                phase = 'Completed';
            else if (project.status === 'On Hold')
                phase = 'On Hold';
            else if (project.status === 'Planning' || total === 0 || toDo === total)
                phase = 'Analysis';
            else if (testing > 0 && testing >= inProgress)
                phase = 'Testing';
            else
                phase = 'Development';
            const deadline = project.productionDate ?? project.targetDate;
            const daysUntil = deadline
                ? Math.ceil((new Date(deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                : null;
            let timelineStatus;
            if (['Completed', 'Archived'].includes(project.status))
                timelineStatus = 'Completed';
            else if (daysUntil === null)
                timelineStatus = 'On Track';
            else if (daysUntil < 0)
                timelineStatus = 'Delayed';
            else if (daysUntil <= 14)
                timelineStatus = 'At Risk';
            else
                timelineStatus = 'On Track';
            return {
                _id: project._id,
                name: project.name,
                status: project.status,
                phase,
                timelineStatus,
                daysUntilDeadline: daysUntil,
                targetDate: project.targetDate,
                internalTestDate: project.internalTestDate ?? null,
                uatDate: project.uatDate ?? null,
                productionDate: project.productionDate ?? null,
                memberCount: project.memberIds?.length ?? 0,
                taskStats: { total, done, inProgress, testing, toDo, byStatus },
                completionPct: total > 0 ? Math.round((done / total) * 100) : 0,
                logoUrl: project.logoUrl ?? null,
            };
        });
        res.json({ success: true, data: { projects: overview } });
    }
    catch (err) {
        next(err);
    }
};
exports.getProjectOverview = getProjectOverview;
// ─── Team Workload (with peak period) ────────────────────────────────────────
const getTeamWorkload = async (_req, res, next) => {
    try {
        const workload = await Task_1.Task.aggregate([
            { $match: { status: { $ne: 'Done' }, assigneeId: { $ne: null } } },
            {
                $group: {
                    _id: '$assigneeId',
                    taskCount: { $sum: 1 },
                    totalStoryPoints: { $sum: '$storyPoints' },
                },
            },
            {
                $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' },
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 1,
                    taskCount: 1,
                    totalStoryPoints: 1,
                    'user.name': 1,
                    'user.email': 1,
                    'user.role': 1,
                    'user.department': 1,
                },
            },
            { $sort: { taskCount: -1 } },
        ]);
        // Peak workload: week with the most task deadlines
        const upcomingTasks = await Task_1.Task.find({ status: { $ne: 'Done' }, endDate: { $ne: null, $gte: new Date() } }, { endDate: 1 }).lean();
        const weekMap = {};
        for (const task of upcomingTasks) {
            if (!task.endDate)
                continue;
            const d = new Date(task.endDate);
            const monday = new Date(d);
            const day = d.getDay();
            monday.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
            monday.setHours(0, 0, 0, 0);
            const key = monday.toISOString();
            weekMap[key] = (weekMap[key] ?? 0) + 1;
        }
        let peakPeriod = null;
        for (const [week, count] of Object.entries(weekMap)) {
            if (!peakPeriod || count > peakPeriod.taskCount) {
                peakPeriod = { weekStart: week, taskCount: count };
            }
        }
        res.json({ success: true, data: { workload, peakPeriod } });
    }
    catch (err) {
        next(err);
    }
};
exports.getTeamWorkload = getTeamWorkload;
// ─── Blockers ─────────────────────────────────────────────────────────────────
const getBlockers = async (_req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const blockers = await Standup_1.Standup.find({
            date: { $gte: today },
            blockers: { $ne: '' },
        })
            .populate('userId', 'name email department')
            .populate('projectId', 'name')
            .sort({ date: -1 });
        res.json({ success: true, data: { blockers } });
    }
    catch (err) {
        next(err);
    }
};
exports.getBlockers = getBlockers;
//# sourceMappingURL=dashboard.controller.js.map