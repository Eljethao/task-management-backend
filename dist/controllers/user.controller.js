"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactivateUser = exports.deleteUser = exports.updateUser = exports.getUserById = exports.createUser = exports.getUsers = void 0;
const zod_1 = require("zod");
const User_1 = require("../models/User");
const errorHandler_1 = require("../middleware/errorHandler");
const ROLES = ['Admin', 'Developer', 'Project Manager', 'Tester', 'UXUI', 'Lead Developer'];
const createSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    role: zod_1.z.enum(ROLES).default('Developer'),
    department: zod_1.z.string().optional(),
});
const updateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    department: zod_1.z.string().optional(),
    role: zod_1.z.enum(ROLES).optional(),
    isActive: zod_1.z.boolean().optional(),
});
const getUsers = async (req, res, next) => {
    try {
        const isAdmin = req.user?.role === 'Admin';
        // Admins can see all users (including inactive); managers/others see only active
        const filter = isAdmin && req.query.includeInactive === 'true' ? {} : { isActive: true };
        const users = await User_1.User.find(filter).sort({ name: 1 });
        res.json({ success: true, data: { users } });
    }
    catch (err) {
        next(err);
    }
};
exports.getUsers = getUsers;
const createUser = async (req, res, next) => {
    try {
        const body = createSchema.parse(req.body);
        const existing = await User_1.User.findOne({ email: body.email });
        if (existing)
            return next(new errorHandler_1.AppError('Email already registered', 409));
        const user = await User_1.User.create({
            name: body.name,
            email: body.email,
            passwordHash: body.password,
            role: body.role,
            department: body.department ?? '',
        });
        res.status(201).json({ success: true, data: { user } });
    }
    catch (err) {
        next(err);
    }
};
exports.createUser = createUser;
const getUserById = async (req, res, next) => {
    try {
        const user = await User_1.User.findById(req.params.id);
        if (!user)
            return next(new errorHandler_1.AppError('User not found', 404));
        res.json({ success: true, data: { user } });
    }
    catch (err) {
        next(err);
    }
};
exports.getUserById = getUserById;
const updateUser = async (req, res, next) => {
    try {
        // Only admin or the user themselves can update
        const isAdmin = req.user?.role === 'Admin';
        const isSelf = req.user?.userId === req.params.id;
        if (!isAdmin && !isSelf) {
            return next(new errorHandler_1.AppError('Insufficient permissions', 403));
        }
        const body = updateSchema.parse(req.body);
        // Only admins can change roles
        if (body.role && !isAdmin) {
            return next(new errorHandler_1.AppError('Only admins can change roles', 403));
        }
        const user = await User_1.User.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
        if (!user)
            return next(new errorHandler_1.AppError('User not found', 404));
        res.json({ success: true, data: { user } });
    }
    catch (err) {
        next(err);
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res, next) => {
    try {
        // Prevent admin from deactivating themselves
        if (req.user?.userId === req.params.id) {
            return next(new errorHandler_1.AppError('Cannot deactivate your own account', 400));
        }
        const user = await User_1.User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!user)
            return next(new errorHandler_1.AppError('User not found', 404));
        res.json({ success: true, message: 'User deactivated successfully' });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteUser = deleteUser;
const reactivateUser = async (req, res, next) => {
    try {
        const user = await User_1.User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
        if (!user)
            return next(new errorHandler_1.AppError('User not found', 404));
        res.json({ success: true, data: { user } });
    }
    catch (err) {
        next(err);
    }
};
exports.reactivateUser = reactivateUser;
//# sourceMappingURL=user.controller.js.map