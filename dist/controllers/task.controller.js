"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.reorderTasks = exports.updateTaskStatus = exports.updateTask = exports.createTask = exports.getTaskById = exports.getTasks = void 0;
const zod_1 = require("zod");
const Task_1 = require("../models/Task");
const errorHandler_1 = require("../middleware/errorHandler");
const createSchema = zod_1.z.object({
    projectId: zod_1.z.string().min(1, 'projectId is required'),
    epicId: zod_1.z.string().optional(),
    title: zod_1.z.string().min(1).max(500),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(['To Do', 'In Progress', 'Code Review', 'Testing', 'Done']).optional(),
    priority: zod_1.z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
    assigneeId: zod_1.z.string().optional(),
    storyPoints: zod_1.z.number().min(0).max(100).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    githubPrLink: zod_1.z.string().url().optional(),
});
const updateSchema = createSchema.partial();
const statusSchema = zod_1.z.object({
    status: zod_1.z.enum(['To Do', 'In Progress', 'Code Review', 'Testing', 'Done']),
    order: zod_1.z.number().optional(),
});
const reorderSchema = zod_1.z.object({
    tasks: zod_1.z.array(zod_1.z.object({ id: zod_1.z.string(), order: zod_1.z.number(), status: zod_1.z.string() })),
});
const PRIVILEGED_ROLES = ['Admin', 'Project Manager'];
const getTasks = async (req, res, next) => {
    try {
        const { projectId, status, assigneeId } = req.query;
        const filter = {};
        if (projectId)
            filter.projectId = projectId;
        if (status)
            filter.status = status;
        const isPrivileged = PRIVILEGED_ROLES.includes(req.user?.role ?? '');
        if (isPrivileged) {
            // Admin / Project Manager: can filter by any member or see all
            if (assigneeId)
                filter.assigneeId = assigneeId;
        }
        else {
            // All other roles: see only their own assigned tasks
            filter.assigneeId = req.user?.userId;
        }
        const tasks = await Task_1.Task.find(filter)
            .populate('assigneeId', 'name email')
            .populate('reporterId', 'name email')
            .sort({ status: 1, order: 1 });
        res.json({ success: true, data: { tasks } });
    }
    catch (err) {
        next(err);
    }
};
exports.getTasks = getTasks;
const getTaskById = async (req, res, next) => {
    try {
        const task = await Task_1.Task.findById(req.params.id)
            .populate('assigneeId', 'name email')
            .populate('reporterId', 'name email')
            .populate('projectId', 'name');
        if (!task)
            return next(new errorHandler_1.AppError('Task not found', 404));
        res.json({ success: true, data: { task } });
    }
    catch (err) {
        next(err);
    }
};
exports.getTaskById = getTaskById;
const createTask = async (req, res, next) => {
    try {
        const body = createSchema.parse(req.body);
        const task = await Task_1.Task.create({ ...body, reporterId: req.user?.userId });
        res.status(201).json({ success: true, data: { task } });
    }
    catch (err) {
        next(err);
    }
};
exports.createTask = createTask;
const updateTask = async (req, res, next) => {
    try {
        const body = updateSchema.parse(req.body);
        const task = await Task_1.Task.findByIdAndUpdate(req.params.id, body, {
            new: true,
            runValidators: true,
        })
            .populate('assigneeId', 'name email')
            .populate('reporterId', 'name email');
        if (!task)
            return next(new errorHandler_1.AppError('Task not found', 404));
        res.json({ success: true, data: { task } });
    }
    catch (err) {
        next(err);
    }
};
exports.updateTask = updateTask;
const updateTaskStatus = async (req, res, next) => {
    try {
        const body = statusSchema.parse(req.body);
        const task = await Task_1.Task.findByIdAndUpdate(req.params.id, body, { new: true });
        if (!task)
            return next(new errorHandler_1.AppError('Task not found', 404));
        res.json({ success: true, data: { task } });
    }
    catch (err) {
        next(err);
    }
};
exports.updateTaskStatus = updateTaskStatus;
const reorderTasks = async (req, res, next) => {
    try {
        const { tasks } = reorderSchema.parse(req.body);
        await Promise.all(tasks.map(({ id, order, status }) => Task_1.Task.findByIdAndUpdate(id, { order, status }, { new: true })));
        res.json({ success: true, message: 'Tasks reordered successfully' });
    }
    catch (err) {
        next(err);
    }
};
exports.reorderTasks = reorderTasks;
const deleteTask = async (req, res, next) => {
    try {
        const task = await Task_1.Task.findByIdAndDelete(req.params.id);
        if (!task)
            return next(new errorHandler_1.AppError('Task not found', 404));
        res.json({ success: true, message: 'Task deleted successfully' });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteTask = deleteTask;
//# sourceMappingURL=task.controller.js.map