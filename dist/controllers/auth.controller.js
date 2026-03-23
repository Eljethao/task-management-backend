"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = exports.getMe = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const User_1 = require("../models/User");
const errorHandler_1 = require("../middleware/errorHandler");
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['Admin', 'Developer', 'Project Manager', 'Tester', 'UXUI', 'Lead Developer']).optional(),
    department: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
const signToken = (payload) => {
    const secret = process.env.JWT_SECRET ?? 'fallback-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn });
};
const register = async (req, res, next) => {
    try {
        const body = registerSchema.parse(req.body);
        const existing = await User_1.User.findOne({ email: body.email });
        if (existing) {
            return next(new errorHandler_1.AppError('Email already registered', 409));
        }
        const user = await User_1.User.create({
            name: body.name,
            email: body.email,
            passwordHash: body.password,
            role: body.role ?? 'Developer',
            department: body.department ?? '',
        });
        const token = signToken({ userId: user._id.toString(), role: user.role, email: user.email });
        res.status(201).json({ success: true, data: { user, token } });
    }
    catch (err) {
        next(err);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const body = loginSchema.parse(req.body);
        const user = await User_1.User.findOne({ email: body.email }).select('+passwordHash');
        if (!user || !(await user.comparePassword(body.password))) {
            return next(new errorHandler_1.AppError('Invalid email or password', 401));
        }
        if (!user.isActive) {
            return next(new errorHandler_1.AppError('Account is deactivated', 403));
        }
        const token = signToken({ userId: user._id.toString(), role: user.role, email: user.email });
        res.json({ success: true, data: { user, token } });
    }
    catch (err) {
        next(err);
    }
};
exports.login = login;
const getMe = async (req, res, next) => {
    try {
        const user = await User_1.User.findById(req.user?.userId);
        if (!user)
            return next(new errorHandler_1.AppError('User not found', 404));
        res.json({ success: true, data: { user } });
    }
    catch (err) {
        next(err);
    }
};
exports.getMe = getMe;
const refreshToken = async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token)
            return next(new errorHandler_1.AppError('No token provided', 400));
        const secret = process.env.JWT_SECRET ?? 'fallback-secret';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const user = await User_1.User.findById(decoded.userId);
        if (!user || !user.isActive)
            return next(new errorHandler_1.AppError('User not found or inactive', 401));
        const newToken = signToken({ userId: user._id.toString(), role: user.role, email: user.email });
        res.json({ success: true, data: { token: newToken } });
    }
    catch {
        next(new errorHandler_1.AppError('Invalid or expired token', 401));
    }
};
exports.refreshToken = refreshToken;
//# sourceMappingURL=auth.controller.js.map