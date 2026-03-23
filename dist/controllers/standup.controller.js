"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addStandupComment = exports.getStandupComments = exports.updateStandup = exports.createStandup = exports.getTodayStandup = exports.getStandups = void 0;
const zod_1 = require("zod");
const Standup_1 = require("../models/Standup");
const StandupComment_1 = require("../models/StandupComment");
const errorHandler_1 = require("../middleware/errorHandler");
const PRIVILEGED_ROLES = ['Admin', 'Project Manager'];
const createSchema = zod_1.z.object({
    projectId: zod_1.z.string(),
    yesterday: zod_1.z.string().min(1),
    today: zod_1.z.string().min(1),
    blockers: zod_1.z.string().optional(),
});
const getStandups = async (req, res, next) => {
    try {
        const { projectId, userId, date } = req.query;
        const filter = {};
        if (projectId)
            filter.projectId = projectId;
        if (date) {
            const d = new Date(date);
            const start = new Date(d.setHours(0, 0, 0, 0));
            const end = new Date(d.setHours(23, 59, 59, 999));
            filter.date = { $gte: start, $lte: end };
        }
        // Non-privileged roles can only see their own standups
        const isPrivileged = PRIVILEGED_ROLES.includes(req.user?.role ?? '');
        if (!isPrivileged) {
            filter.userId = req.user?.userId;
        }
        else if (userId) {
            filter.userId = userId;
        }
        const standups = await Standup_1.Standup.find(filter)
            .populate('userId', 'name email role department')
            .populate('projectId', 'name')
            .sort({ date: -1 });
        res.json({ success: true, data: { standups } });
    }
    catch (err) {
        next(err);
    }
};
exports.getStandups = getStandups;
const getTodayStandup = async (req, res, next) => {
    try {
        const today = new Date();
        const start = new Date(today.setHours(0, 0, 0, 0));
        const end = new Date(today.setHours(23, 59, 59, 999));
        const standup = await Standup_1.Standup.findOne({
            userId: req.user?.userId,
            date: { $gte: start, $lte: end },
        });
        res.json({ success: true, data: { standup } });
    }
    catch (err) {
        next(err);
    }
};
exports.getTodayStandup = getTodayStandup;
const createStandup = async (req, res, next) => {
    try {
        const body = createSchema.parse(req.body);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existing = await Standup_1.Standup.findOne({
            userId: req.user?.userId,
            projectId: body.projectId,
            date: { $gte: today },
        });
        if (existing) {
            return next(new errorHandler_1.AppError('Standup already submitted for today', 409));
        }
        const standup = await Standup_1.Standup.create({
            ...body,
            userId: req.user?.userId,
            date: new Date(),
        });
        res.status(201).json({ success: true, data: { standup } });
    }
    catch (err) {
        next(err);
    }
};
exports.createStandup = createStandup;
const updateStandup = async (req, res, next) => {
    try {
        const standup = await Standup_1.Standup.findById(req.params.id);
        if (!standup)
            return next(new errorHandler_1.AppError('Standup not found', 404));
        if (standup.userId.toString() !== req.user?.userId && req.user?.role !== 'Admin') {
            return next(new errorHandler_1.AppError('Cannot edit another user\'s standup', 403));
        }
        Object.assign(standup, req.body);
        await standup.save();
        res.json({ success: true, data: { standup } });
    }
    catch (err) {
        next(err);
    }
};
exports.updateStandup = updateStandup;
const getStandupComments = async (req, res, next) => {
    try {
        const standup = await Standup_1.Standup.findById(req.params.id);
        if (!standup)
            return next(new errorHandler_1.AppError('Standup not found', 404));
        const comments = await StandupComment_1.StandupComment.find({ standupId: req.params.id })
            .populate('userId', 'name email role')
            .sort({ createdAt: 1 });
        res.json({ success: true, data: { comments } });
    }
    catch (err) {
        next(err);
    }
};
exports.getStandupComments = getStandupComments;
const addStandupComment = async (req, res, next) => {
    try {
        const { body } = req.body;
        if (!body || typeof body !== 'string' || !body.trim()) {
            return next(new errorHandler_1.AppError('Comment body is required', 400));
        }
        const standup = await Standup_1.Standup.findById(req.params.id);
        if (!standup)
            return next(new errorHandler_1.AppError('Standup not found', 404));
        const comment = await StandupComment_1.StandupComment.create({
            standupId: req.params.id,
            userId: req.user?.userId,
            body: body.trim(),
        });
        const populated = await comment.populate('userId', 'name email role');
        res.status(201).json({ success: true, data: { comment: populated } });
    }
    catch (err) {
        next(err);
    }
};
exports.addStandupComment = addStandupComment;
//# sourceMappingURL=standup.controller.js.map